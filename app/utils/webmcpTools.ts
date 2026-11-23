import type { KbComponent, KbIndexEntry, KbProp } from "~~/packages/mcp/src/kb";
import { searchComponents } from "~~/packages/mcp/src/search";
import { buildPlaygroundUrl } from "./playgroundCode";

/** WebMCP 工具定义，字段与规范的 ModelContextTool 字典对应 */
export interface WebMcpTool {
  name: string;
  title?: string;
  description: string;
  inputSchema?: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean };
  /** 返回值会被浏览器 JSON 序列化后交给代理，不能是 undefined */
  execute: (input: Record<string, unknown>) => Promise<unknown>;
}

export interface WebMcpToolDeps {
  /** 站内跳转，由插件注入（navigateTo 需要 Nuxt 上下文） */
  navigate: (path: string) => Promise<unknown>;
}

/** 索引条目：knowledge/index.json 的字段加文档路由，由 modules/webmcp-kb.ts 生成 */
type IndexEntry = KbIndexEntry & { docPath: string | null };

/** run_in_playground 的源码长度上限：代码要编码进 URL 哈希 */
const MAX_PLAYGROUND_CODE = 100_000;

let indexPromise: Promise<IndexEntry[]> | null = null;

/** 工具首次被调用时才取索引，之后复用；失败不缓存，下次调用重试 */
function loadIndex(): Promise<IndexEntry[]> {
  indexPromise ??= $fetch<IndexEntry[]>("/webmcp/index.json").catch((error) => {
    indexPromise = null;
    throw error;
  });
  return indexPromise;
}

/**
 * 可预期的失败（参数不对、组件不存在）以返回值告知代理：
 * 规范规定 execute 抛错时原因不会转交给调用方，代理只能看到一个 OperationError。
 */
function fail(message: string): { error: string } {
  return { error: message };
}

/** 规范不保证入参符合 inputSchema，字符串参数自行校验 */
function readString(input: Record<string, unknown>, key: string): string {
  const value = input?.[key];
  return typeof value === "string" ? value.trim() : "";
}

/** 按 id 找索引条目；找不到时给出能让代理自行纠正的提示 */
async function findEntry(id: string): Promise<IndexEntry | { error: string }> {
  if (!id) return fail("id 不能为空");
  const entry = (await loadIndex()).find((item) => item.id === id);
  return entry ?? fail(`组件不存在：${id}。请先用 search_components 确认 id。`);
}

const ID_PARAM = { type: "string", description: "组件 id（kebab-case），如 reborn-button；不确定时先用 search_components 检索" };

/** 文档站向浏览器内 AI 代理暴露的工具，名称与 packages/mcp 的同名工具保持一致 */
export function createWebMcpTools({ navigate }: WebMcpToolDeps): WebMcpTool[] {
  return [
    {
      name: "search_components",
      title: "检索组件",
      description:
        "按关键词检索 Reborn UI 组件（id 精确 > 名称 > 别名 > 标签 > 描述加权），返回按相关度排序的候选：id、标题、描述、分类、适用端（web / uniapp）与文档路径。别名含其它组件库的叫法与界面上的样子，按看到的样子搜即可（tag、badge、红点、胶囊标签）。",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string", description: "检索词，中英文均可，如「按钮」「switch 开关」「红点」" },
          limit: { type: "integer", minimum: 1, maximum: 50, description: "返回条数上限，默认 10" },
        },
        required: ["query"],
      },
      annotations: { readOnlyHint: true },
      async execute(input) {
        const query = readString(input, "query");
        if (!query) return fail("query 不能为空");
        const limit = Math.min(50, Math.max(1, Math.trunc(Number(input.limit)) || 10));
        const hits = searchComponents(await loadIndex(), query).slice(0, limit);
        return {
          total: hits.length,
          components: hits.map(({ id, title, description, category, platforms, docPath, score }) => ({
            id,
            title,
            description,
            category,
            platforms,
            docPath,
            score,
          })),
        };
      },
    },
    {
      name: "get_component",
      title: "获取组件 API",
      description:
        "按 id 获取组件的 API 摘要：props、events（emits）、slots、exposes 与使用边界（whenToUse / whenNotToUse / pitfalls）。写代码前先读它，不要凭印象写属性名。",
      inputSchema: {
        type: "object",
        properties: {
          id: ID_PARAM,
          platform: {
            type: "string",
            enum: ["web", "uniapp"],
            description: "只保留该端通用或专属的 props；两端签名不同的 prop 按端并存两条，不传则都返回",
          },
        },
        required: ["id"],
      },
      annotations: { readOnlyHint: true },
      async execute(input) {
        const id = readString(input, "id");
        const entry = await findEntry(id);
        if ("error" in entry) return entry;
        const platform = readString(input, "platform");
        try {
          const component = await $fetch<KbComponent>(`/webmcp/components/${id}.json`);
          if (platform && Array.isArray(component.props)) {
            component.props = component.props.filter((prop: KbProp) => !prop.platform || prop.platform === platform);
          }
          return component;
        } catch {
          // 组件摘要是构建生成物，站点没带上时退回索引里已有的字段
          return { ...entry, note: "当前站点没有该组件的 props / events / slots 摘要，以上只是索引信息；完整 API 见 docPath 对应的文档页" };
        }
      },
    },
    {
      name: "open_component_doc",
      title: "打开组件文档",
      description: "在当前标签页打开指定组件的文档页，让用户看到演示与完整说明。会切换用户正在看的页面，仅在用户想查看该组件时调用。",
      inputSchema: {
        type: "object",
        properties: { id: ID_PARAM },
        required: ["id"],
      },
      async execute(input) {
        const id = readString(input, "id");
        const entry = await findEntry(id);
        if ("error" in entry) return entry;
        if (!entry.docPath) return fail(`组件 ${id} 没有文档页`);
        await navigate(entry.docPath);
        return { opened: entry.docPath };
      },
    },
    {
      name: "run_in_playground",
      title: "在演练场运行",
      description:
        "把一段 Vue 单文件组件源码放进站内演练场（/playground）运行并展示给用户。源码写 <template> 加可选的 <script setup>；Reborn 组件已全局注册、Vue 与常用 VueUse API 已注入，import 语句会被忽略。会切换用户正在看的页面。",
      inputSchema: {
        type: "object",
        properties: {
          code: { type: "string", description: "完整的 Vue SFC 源码，或只有模板标签的片段" },
        },
        required: ["code"],
      },
      async execute(input) {
        const code = readString(input, "code");
        if (!code) return fail("code 不能为空");
        if (code.length > MAX_PLAYGROUND_CODE) return fail(`code 过长：上限 ${MAX_PLAYGROUND_CODE} 个字符`);
        const url = buildPlaygroundUrl(code);
        // 演练场只在 hashchange 时重新读代码，路由跳转不触发该事件：已在演练场时直接改哈希
        if (window.location.pathname.replace(/\/$/, "") === "/playground") window.location.hash = url.slice(url.indexOf("#"));
        else await navigate(url);
        return { opened: url };
      },
    },
  ];
}
