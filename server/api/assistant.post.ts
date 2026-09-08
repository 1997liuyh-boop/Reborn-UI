import type { ToolCallPart, ToolSet, UIMessage, UIMessageStreamWriter } from "ai";
import type { H3Event } from "h3";
import { queryCollection } from "@nuxt/content/server";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  streamText,
  tool,
} from "ai";
import { z } from "zod";

/**
 * AI 助手对话端点(接管 Docus 内置 /__docus__/assistant)。
 *
 * 接管原因(上游实现的三处硬伤,均表现为「问几轮之后就没有回复」):
 * 1. createUIMessageStream 未传 onError,网关报错被 AI SDK 屏蔽,前端只拿到空流;
 * 2. 步数预算固定 10 步且与工具调用共用,读几篇文档就耗尽,流结束时一个字都没输出;
 * 3. 历史不裁剪,每轮把历次 get-page 返回的整页 markdown 全量重发,轮次一多就撑爆上下文。
 *
 * 另外把「未登录」「限流」从 HTTP 错误改为流式助手消息:面板的 onError 会把 error.message
 * 当 JSON 解析,Nitro 错误体不是那个形状,原先超限只会弹一条读不懂的 toast(或什么都没有)。
 *
 * 客户端指向本路由的方式见 nuxt.config.ts 的 `modules:done` 钩子(改写 public.assistant.apiPath)。
 */

/** 站点名,用于系统提示中的自称 */
const SITE_NAME = "Reborn UI";

/** 单轮对话最多允许的模型步数(含工具调用步);上游为 10,读文档时极易耗尽 */
const MAX_STEPS = 16;

/** 最多向模型重发的历史消息条数 */
const MAX_HISTORY_MESSAGES = 14;

/** 仅最近这些条消息保留工具调用与其返回结果,更早的只留文本(整页 markdown 是上下文杀手) */
const TOOL_PAYLOAD_KEEP_MESSAGES = 2;

/** 单用户限流:10 分钟 30 次 */
const USER_RULE = { limit: 30, windowMs: 10 * 60 * 1000 };

/** 全站兜底限流:1 小时 300 次,防止批量注册绕过单用户限额 */
const GLOBAL_RULE = { limit: 300, windowMs: 60 * 60 * 1000 };

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig(event);

  // 1) 登录校验:以助手消息形式告知,而非 401(见文件头注释)
  const user = await getAuthUser(event);
  if (!user) {
    return replyAsAssistant("AI 助手需要登录后使用。请点击面板右上角的登录入口完成登录，再回来提问。");
  }

  // 2) 限流:先查全站兜底(未超时不计入个人额度),再查单用户额度
  const global = checkRateLimit("assistant:__global__", GLOBAL_RULE.limit, GLOBAL_RULE.windowMs);
  if (!global.allowed) {
    return replyAsAssistant(
      `当前使用人数较多，AI 助手已达全站限额，请约 ${formatWait(global.retryAfterSec)}后再试。`,
    );
  }
  const perUser = checkRateLimit(`assistant:${user.id}`, USER_RULE.limit, USER_RULE.windowMs);
  if (!perUser.allowed) {
    return replyAsAssistant(
      `提问过于频繁：每 ${USER_RULE.windowMs / 60000} 分钟最多 ${USER_RULE.limit} 次。`
        + `请约 ${formatWait(perUser.retryAfterSec)}后继续，期间可以先翻看左侧文档。`,
    );
  }

  // 请求体解析失败(客户端异常、代理截断)不能让它抛 400 栈:面板拿到的会是一坨错误 JSON
  let body: { messages?: UIMessage[] } | undefined;
  try {
    body = await readBody<{ messages?: UIMessage[] }>(event);
  }
  catch (error) {
    console.error("[assistant] 请求体解析失败:", error);
    return replyAsAssistant("这条消息没能正确送达服务器，请重新发送一次。");
  }

  const messages = trimHistory(body?.messages ?? []);
  if (messages.length === 0) {
    return replyAsAssistant("没有收到问题内容，请重新输入。");
  }

  // 3) 文档工具:自建,不走 Docus 的 /mcp
  //    换掉 MCP 的两个原因(都实测过):
  //    a. 上游 get-page 声明了 cache: '1h',而它把 isError 结果也一并缓存。一次偶发失败
  //       (dev 端口不是 3000、worker 重启)会被冻结一小时,之后每次问同一个组件都拿到
  //       "Failed to get page",模型只能凭记忆写代码——这就是「示例完成率极低」的直接原因;
  //    b. 上游取原始 markdown 时在 dev 分支硬编码 http://localhost:3000,端口一变就全线失败。
  const docTools = createDocTools(event);

  const stream = createUIMessageStream({
    execute: async ({ writer }: { writer: UIMessageStreamWriter }) => {
      const modelMessages = await convertToModelMessages(messages);
      const result = streamText({
        model: config.assistant.model,
        maxOutputTokens: 4000,
        maxRetries: 2,
        stopWhen: stopWhenResponseComplete,
        system: getSystemPrompt(SITE_NAME),
        messages: modelMessages,
        tools: docTools,
        onStepFinish: ({ toolCalls }: { toolCalls: ToolCallPart[] }) => {
          if (toolCalls.length === 0) return;
          writer.write({
            id: toolCalls[0]?.toolCallId,
            type: "data-tool-calls",
            data: {
              tools: toolCalls.map((tc: ToolCallPart) => {
                const args = "args" in tc ? tc.args : "input" in tc ? tc.input : {};
                return { toolName: tc.toolName, toolCallId: tc.toolCallId, args };
              }),
            },
          });
        },
      });

      writer.merge(result.toUIMessageStream());

      // 兜底:步数耗尽或模型只调工具不落文本时,上游会静默结束。这里补一条可读回复,
      // 保证「提问必有回应」——这正是用户反馈的「多次询问后 AI 没有回复」的表层症状。
      let finalText = "";
      try {
        finalText = await result.text;
      }
      catch {
        // 出错路径由 onError 负责透出,这里只需要知道「没拿到文本」
      }
      if (!finalText.trim()) {
        writeText(
          writer,
          "这次没能整理出答案（可能是查文档的步骤用尽或上游模型返回为空）。"
          + "请把问题再具体一点重发一次，例如指明组件名和想要的效果。",
        );
      }
    },
    onError: (error: unknown) => {
      // 上游未传 onError,错误内容被 AI SDK 默认屏蔽。这里透出可读原因并留服务端日志。
      console.error("[assistant] 对话流出错:", error);
      const detail = error instanceof Error ? error.message : String(error);
      return `AI 助手出错了：${detail}`;
    },
  });

  return createUIMessageStreamResponse({ stream });
});

/**
 * 文档检索工具:直接查 @nuxt/content 集合 + 取 /raw 原始 markdown。
 *
 * 与 Docus MCP 版本的差异:
 * - 不缓存,失败不会被冻结一小时;
 * - 站点地址取自当前请求,不硬编码端口;
 * - 路径容错:模型经常猜 `/zh/...`、`/en/...`、`/docs/...` 这类不存在的前缀
 *   (本站没有配 i18n,只有一个 docs 集合)。这里做后缀兜底匹配,一次命中,
 *   不再靠反复试错烧掉步数预算。
 */
function createDocTools(event: H3Event): ToolSet {
  return {
    "list-pages": tool({
      description:
        "列出文档站所有页面的 path / title / description。可传 keyword 过滤(匹配 path、title、description),"
        + "组件页路径形如 /components/<分类>/<组件 id>。",
      inputSchema: z.object({
        keyword: z.string().optional().describe("可选关键词,用于收窄结果,例如 button、select、安装"),
      }),
      execute: async ({ keyword }) => {
        const pages = await listDocPages(event);
        const filtered = keyword
          ? pages.filter((page) => {
              const haystack = `${page.path} ${page.title} ${page.description}`.toLowerCase();
              return haystack.includes(keyword.toLowerCase());
            })
          : pages;

        return { total: filtered.length, pages: filtered.slice(0, 200) };
      },
    }),

    "get-page": tool({
      description:
        "读取指定文档页的完整 markdown(含 Props / Slots / ui 键位表)。写任何组件代码前必须先读对应组件页。",
      inputSchema: z.object({
        path: z.string().describe("页面路径,例如 /components/button/reborn-button"),
      }),
      execute: async ({ path }) => {
        const page = await resolveDocPage(event, path);
        if (!page) {
          const pages = await listDocPages(event);
          const guess = pages
            .filter(p => p.path.includes(lastSegment(path)))
            .slice(0, 5)
            .map(p => p.path);
          return {
            error: `未找到页面 ${path}`,
            hint: guess.length > 0 ? `可能是这些:${guess.join("、")}` : "请先用 list-pages 查看可用路径",
          };
        }

        try {
          const content = await $fetch<string>(`/raw${page.path}.md`, {
            baseURL: getRequestURL(event).origin,
          });
          return { title: page.title, path: page.path, description: page.description, content };
        }
        catch (error) {
          console.error(`[assistant] 读取 /raw${page.path}.md 失败:`, error);
          return { error: `页面 ${page.path} 的正文读取失败,请改用 list-pages 找同类页面或据实说明无法确认 API` };
        }
      },
    }),
  };
}

interface DocPageMeta {
  path: string;
  title: string;
  description: string;
}

/** 取文档集合的页面清单(本站未配 i18n,只有一个 docs 集合) */
async function listDocPages(event: H3Event): Promise<DocPageMeta[]> {
  const rows = await queryCollection(event, "docs")
    .select("path", "title", "description")
    .all();

  return rows.map(row => ({
    path: row.path ?? "",
    title: row.title ?? "",
    description: row.description ?? "",
  }));
}

/** 精确匹配优先;失败时按末段做后缀兜底(容忍模型臆造的 /zh、/en、/docs 前缀) */
async function resolveDocPage(event: H3Event, path: string): Promise<DocPageMeta | undefined> {
  const normalized = `/${path.replace(/^\/+|\/+$/g, "")}`;

  const exact = await queryCollection(event, "docs")
    .where("path", "=", normalized)
    .select("path", "title", "description")
    .first();
  if (exact) {
    return {
      path: exact.path ?? normalized,
      title: exact.title ?? "",
      description: exact.description ?? "",
    };
  }

  const slug = lastSegment(normalized);
  if (!slug) return undefined;

  const pages = await listDocPages(event);
  return pages.find(page => page.path === `/${slug}` || page.path.endsWith(`/${slug}`));
}

function lastSegment(path: string): string {
  return path.split("/").filter(Boolean).at(-1) ?? "";
}

/**
 * 收尾判据:某一步产出了文本且没有再发起工具调用即视为答完;否则最多跑 MAX_STEPS 步。
 * 与上游同构,仅放宽步数预算。
 */
function stopWhenResponseComplete({ steps }: { steps: { text?: string; toolCalls?: unknown[] }[] }): boolean {
  const lastStep = steps.at(-1);
  if (!lastStep) return false;

  const hasText = Boolean(lastStep.text && lastStep.text.trim().length > 0);
  const hasNoToolCalls = !lastStep.toolCalls || lastStep.toolCalls.length === 0;
  if (hasText && hasNoToolCalls) return true;

  return steps.length >= MAX_STEPS;
}

/**
 * 历史裁剪:只保留最近 MAX_HISTORY_MESSAGES 条,且只有最近 TOOL_PAYLOAD_KEEP_MESSAGES 条
 * 保留工具调用相关分片(整页文档内容)。更早的消息只留文本类分片。
 *
 * 同一条消息内的工具调用与其结果成对丢弃,避免出现「有调用无结果」的畸形消息;
 * 裁剪后没有任何分片的消息整条丢掉(纯工具调用步)。
 */
function trimHistory(messages: UIMessage[]): UIMessage[] {
  const recent = messages.slice(-MAX_HISTORY_MESSAGES);
  const keepFrom = Math.max(0, recent.length - TOOL_PAYLOAD_KEEP_MESSAGES);

  return recent
    .map((message, index) => {
      if (index >= keepFrom) return message;
      const parts = (message.parts ?? []).filter(
        part => part.type === "text" || part.type === "reasoning",
      );
      return { ...message, parts };
    })
    .filter(message => (message.parts?.length ?? 0) > 0);
}

/** 把纯文本作为一条助手消息写入流(用于登录提示、限流提示与兜底回复) */
function writeText(writer: UIMessageStreamWriter, text: string) {
  const id = `text-${Date.now().toString(36)}`;
  writer.write({ type: "text-start", id });
  writer.write({ type: "text-delta", id, delta: text });
  writer.write({ type: "text-end", id });
}

/**
 * 以正常助手回复的形式返回一段固定文本。
 * 前置校验(未登录/限流)走这里而不抛 HTTP 错误,用户才能在对话里看到原因。
 */
function replyAsAssistant(text: string) {
  const stream = createUIMessageStream({
    execute: ({ writer }: { writer: UIMessageStreamWriter }) => {
      writeText(writer, text);
    },
  });
  return createUIMessageStreamResponse({ stream });
}

function formatWait(seconds: number): string {
  if (seconds < 60) return `${seconds} 秒`;
  return `${Math.ceil(seconds / 60)} 分钟`;
}

/**
 * 系统提示。在 Docus 原版基础上补齐四块本仓库特有的约束:
 * - 工具用法:说明本站没有 locale 前缀、组件页路径形状与失败后的兜底方式;
 * - 调色板:本项目未定义 Tailwind 默认数字色阶,写了不生效(这是「示例效果欠佳」的主因之一);
 * - ui 键位纪律:Web 与 UniApp 键位不同,必须逐字取自文档对应端那一列;
 * - 枚举值与令牌优先级:变体/尺寸取值必须来自文档 Props 表,且自定义令牌类需 `!` 才盖得住。
 */
function getSystemPrompt(siteName: string) {
  return `You are the documentation assistant for ${siteName}. Help users navigate and understand the project documentation.

**Your identity:**
- You are an assistant helping users with ${siteName} documentation
- NEVER use first person ("I", "me", "my") - always refer to the project by name: "${siteName} provides...", "${siteName} supports...", "The project offers..."
- Be confident and knowledgeable about the project
- Speak as a helpful guide, not as the documentation itself
- Always answer in the same language the user wrote in
- NEVER emit your internal deliberation. Do not output <thinking> blocks, "let me try...", or narration of failed tool attempts - the user only sees the final answer

**Tool usage (CRITICAL):**
- You have tools: list-pages (discover pages, supports a keyword filter) and get-page (read a page's full markdown)
- Component pages live at /components/<category>/<component-id>, e.g. /components/button/reborn-button. This site has NO locale prefixes - never prepend /zh, /en or /docs
- If get-page cannot find a path it returns candidate paths; use one of those instead of guessing again
- Read at most 3 pages per answer - the step budget is shared with writing the answer
- ALWAYS respond with text after using tools - never end with just tool calls
- If a page genuinely cannot be read, say so plainly and state that the API could not be verified this time, instead of writing code from memory

**Guidelines:**
- If you can't find something, say "There is no documentation on that yet" or "${siteName} doesn't cover that topic yet"
- Be concise, helpful, and direct
- Guide users like a friendly expert would

**FORMATTING RULES (CRITICAL):**
- NEVER use markdown headings (#, ##, ###, etc.)
- Use **bold text** for emphasis and section labels
- Start responses with content directly, never with a heading
- Use bullet points for lists
- Keep code examples focused and minimal

**Runnable demos (CRITICAL):**
- When you provide ${siteName} component demo code, ALWAYS output ONE complete self-contained snippet in a \`\`\`vue fence: a <template> block plus an optional <script setup> block
- Components are globally registered - do NOT write import statements for them; Vue APIs like ref/computed/watch are also available without imports
- Users can execute your \`\`\`vue snippet instantly via the "Run in Playground" button under the code block, so it must render as-is

**Component API first (CRITICAL):**
- BEFORE writing any ${siteName} component code, read that component's documentation page with get-page. Never write component code from memory - the props, slots and \`ui\` keys must come from the page you just read
- Every prop VALUE you write must appear in that page's Props table. Never invent enum values. Example: RebornButton's \`variant\` only accepts filled / outlined / soft / subtle / text / round / circle - there is no "dashed" variant, a dashed border comes from \`border-style="dashed"\`
- Express the requirement through the component's OWN props first. Example: pass text via the \`label\` prop instead of hand-writing a child element for it
- If a shape / size / color requirement is already a documented prop value, USE THAT PROP - never re-implement it with utility classes. Example: a pill-shaped button is \`variant="round"\`, NOT \`:ui="{ base: 'rounded-full' }"\`
- This project defines custom design-token utilities (\`rounded-ui-*\`, \`h-button-*\`, \`text-*\` overrides). tailwind-merge does not treat them as conflicting with plain utilities, and they are emitted later in the stylesheet, so a plain class often LOSES to them. If you must override one from \`ui\`, prefix it with \`!\` (e.g. \`'!rounded-full'\`) - or better, use the prop that already does it
- Customize appearance through the component's \`ui\` override object - \`:ui="{ <slotKey>: 'classes' }"\`, where the available slot keys are listed in that component's docs. Put the classes on the slot they belong to
- \`ui\` slot keys DIFFER between Web and UniApp. The docs list them in separate columns - copy the keys verbatim from the column for the platform the user is on (default: Web). A key that is not in that column silently does nothing
- Do NOT wrap component content in an extra <span>/<div> just to attach utility classes, and do NOT push slot-level styling onto the root element via \`class\`. Those are workarounds for a missing prop, and the component almost always already has one
- Only fall back to slots plus raw utility classes when the docs show no prop and no \`ui\` slot key that can express the requirement
- When a state-dependent style is needed (hover/focus/active), put the trigger on the root via \`ui.base\` (e.g. \`'group'\`) and the reaction on the target slot (e.g. \`'group-hover:...'\`)
- A \`ui\` slot key only styles the element the component itself renders for that slot. Filling that slot with your own content REPLACES that element, silently dropping the classes. So whenever you style \`ui.<slotKey>\`, the content for it must come from the matching prop - e.g. style \`ui.label\` together with \`label="..."\`, never with text in the default slot

**Color and utility classes (CRITICAL - this project does NOT use the default Tailwind palette):**
- Available semantic colors: primary, secondary, success, info, warning, error, neutral - use them as \`bg-primary\`, \`text-error\`, \`border-warning\`, \`hover:bg-primary/75\`
- Available palettes use an Arco-style 1-10 scale, NOT Tailwind's 50-950 scale: gray-1 ... gray-10, red-1 ... red-10, orange-1 ... orange-10, green-1 ... green-10, blue-1 ... blue-10, brand-1 ... brand-10, secondary-1 ... secondary-10
- NEVER write Tailwind's default numeric color steps (purple-500, violet-600, emerald-400, slate-700, gray-500, ...). Those colors are NOT defined in this project - the class produces no CSS and the user sees nothing
- For a one-off color that has no token (a gradient, a brand hex, a custom border color), prefer an inline \`style\` binding on the component root, which never depends on generated CSS: \`<RebornButton label="渐变" :style="{ backgroundImage: 'linear-gradient(to right, #7c3aed, #34d399)', border: '1px solid #000', color: '#fff' }" />\`
- If you do use utility classes for a custom color, use arbitrary-value syntax with an explicit hex - \`bg-[#7c3aed]\`, \`border-[#000]\`, \`bg-linear-to-r from-[#7c3aed] to-[#34d399]\` - and note that gradients need all three parts: the direction utility, \`from-*\` AND \`to-*\`. Omitting \`to-*\` fades to transparent
- Gradient direction utilities in this project are Tailwind v4 names: \`bg-linear-to-r\` (v3's \`bg-gradient-to-r\` still works but prefer the v4 name)

**Response style:**
- Conversational but professional
- "Here's how you can do that:" instead of "The documentation shows:"
- "${siteName} supports TypeScript out of the box" instead of "I support TypeScript"
- Provide actionable guidance, not just information dumps`;
}
