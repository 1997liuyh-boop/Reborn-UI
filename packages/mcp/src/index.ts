import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { KnowledgeBase, resolveKbDir } from "./kb.js";
import type { KbComponent } from "./kb.js";
import { searchComponents } from "./search.js";

const kb = new KnowledgeBase(resolveKbDir());

const server = new McpServer({
  name: "reborn-ui",
  version: "0.1.0",
});

/** 统一的文本返回体（内容一律 JSON 序列化，方便调用方解析） */
function jsonResult(data: unknown) {
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(data, null, 2) },
    ],
  };
}

function errorResult(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

/** get_component 的字段裁剪：未指定 fields 时返回除示例代码外的全部信息（示例另有专用工具） */
function pickFields(component: KbComponent, fields?: string[]) {
  if (!fields?.length) {
    const { examples, ...rest } = component;
    return {
      ...rest,
      // 只保留示例标题清单，完整代码用 get_component_example 获取，控制返回体 token
      exampleTitles: (examples ?? []).map((e, i) => e.title ?? `示例 ${i + 1}`),
    };
  }
  const result: Record<string, unknown> = { id: component.id };
  for (const f of fields) {
    if (f in component) result[f] = component[f as keyof KbComponent];
  }
  return result;
}

server.tool(
  "list_components",
  "列出 Reborn-UI 组件（轻量索引），可按分类/平台/标签过滤。选型第一步。",
  {
    category: z.string().optional().describe("按分类过滤，如 form/basic/effect，全部分类见 list_categories"),
    platform: z.enum(["web", "uniapp"]).optional().describe("按支持平台过滤"),
    tag: z.string().optional().describe("按标签过滤，如 button/switch"),
  },
  async ({ category, platform, tag }) => {
    let entries = kb.list();
    if (category) entries = entries.filter((e) => e.category === category);
    if (platform) entries = entries.filter((e) => e.platforms?.includes(platform));
    if (tag) entries = entries.filter((e) => e.tags?.includes(tag));
    return jsonResult({
      total: entries.length,
      components: entries.map(({ id, title, description, category: c, platforms }) => ({
        id,
        title,
        description,
        category: c,
        platforms,
      })),
    });
  },
);

server.tool(
  "search_components",
  "按关键词检索组件（id 精确 > 名称 > 标签 > 描述加权），返回按相关度排序的候选列表。",
  {
    query: z.string().min(1).describe("检索词，中英文均可，如「按钮」「switch 开关」"),
    limit: z.number().int().min(1).max(50).optional().describe("返回条数上限，默认 10"),
  },
  async ({ query, limit }) => {
    const hits = searchComponents(kb.list(), query).slice(0, limit ?? 10);
    return jsonResult({
      total: hits.length,
      components: hits.map(({ score, id, title, description, category, platforms }) => ({
        id,
        title,
        description,
        category,
        platforms,
        score,
      })),
    });
  },
);

server.tool(
  "get_component",
  "获取组件完整知识条目：props/events/slots/使用边界（whenToUse/whenNotToUse/pitfalls）等。写代码前必读。",
  {
    id: z.string().describe("组件 id（kebab-case），如 reborn-button"),
    fields: z
      .array(z.string())
      .optional()
      .describe("只返回指定字段（如 [\"props\",\"pitfalls\"]），默认返回除示例代码外的全部"),
  },
  async ({ id, fields }) => {
    const component = kb.get(id);
    if (!component) {
      return errorResult(`组件不存在：${id}。请先用 search_components 或 list_components 确认 id。`);
    }
    return jsonResult(pickFields(component, fields));
  },
);

server.tool(
  "get_component_example",
  "获取组件用法示例代码。不传 title 时返回全部示例。",
  {
    id: z.string().describe("组件 id（kebab-case）"),
    title: z.string().optional().describe("示例标题（见 get_component 返回的 exampleTitles）"),
    platform: z.enum(["web", "uniapp"]).optional().describe("按平台过滤示例"),
  },
  async ({ id, title, platform }) => {
    const component = kb.get(id);
    if (!component) return errorResult(`组件不存在：${id}`);
    let examples = component.examples ?? [];
    if (platform) examples = examples.filter((e) => !e.platform || e.platform === platform);
    if (title) examples = examples.filter((e) => e.title === title);
    if (!examples.length) {
      return errorResult(`组件 ${id} 没有匹配的示例${title ? `（title=${title}）` : ""}`);
    }
    return jsonResult({ id, examples });
  },
);

server.tool(
  "get_install_command",
  "获取组件的 CLI 安装命令。",
  {
    id: z.string().describe("组件 id（kebab-case）"),
    packageManager: z.enum(["pnpm", "npm", "yarn", "bun"]).optional().describe("包管理器，默认 pnpm"),
  },
  async ({ id, packageManager }) => {
    const component = kb.get(id);
    if (!component) return errorResult(`组件不存在：${id}`);
    const pm = packageManager ?? "pnpm";
    // 各包管理器的 dlx 等价写法
    const runner: Record<string, string> = {
      pnpm: "pnpm dlx",
      npm: "npx",
      yarn: "yarn dlx",
      bun: "bunx",
    };
    return jsonResult({
      id,
      command: `${runner[pm]} reborn-ui@latest add ${id}`,
      dependencies: component.dependencies ?? [],
      note: "首次使用需先执行 init 生成 components.json：`" + `${runner[pm]} reborn-ui@latest init` + "`",
    });
  },
);

server.tool(
  "list_categories",
  "列出全部组件分类及各分类的组件数量。",
  {},
  async () => jsonResult({ categories: kb.categories() }),
);

// stdio 传输：MCP 客户端以子进程方式拉起本服务
const transport = new StdioServerTransport();
await server.connect(transport);
