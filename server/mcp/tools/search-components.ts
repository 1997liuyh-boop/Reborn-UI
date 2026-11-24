import { z } from "zod";
import { searchComponents } from "~~/packages/mcp/src/search";

// 组件工具与 packages/mcp（stdio 版）同名同参；远程端额外返回文档链接 docUrl
export default defineMcpTool({
  name: "search_components",
  title: "检索组件",
  description:
    "按关键词检索 Reborn UI 组件（id 精确 > 名称 > 别名 > 标签 > 描述加权），返回按相关度排序的候选列表。别名含其它组件库的叫法与 UI 稿上的外观描述，按看到的样子搜即可（tag、badge、红点、胶囊标签）。",
  inputSchema: {
    query: z.string().min(1).describe("检索词，中英文均可，如「按钮」「switch 开关」「红点」「Element 的 Tag」"),
    limit: z.number().int().min(1).max(50).optional().describe("返回条数上限，默认 10"),
  },
  annotations: { readOnlyHint: true },
  handler: async ({ query, limit }) => {
    const hits = searchComponents(await loadKbIndex(), query).slice(0, limit ?? 10);
    return jsonResult({
      total: hits.length,
      components: hits.map(({ score, id, title, description, category, platforms, docPath }) => ({
        id,
        title,
        description,
        category,
        platforms,
        docUrl: toSiteUrl(docPath),
        score,
      })),
    });
  },
});
