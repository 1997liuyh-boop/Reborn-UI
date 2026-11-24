import { z } from "zod";

export default defineMcpTool({
  name: "list_components",
  title: "列出组件",
  description: "列出 Reborn UI 组件（轻量索引），可按分类/平台/标签过滤。选型第一步。",
  inputSchema: {
    category: z.string().optional().describe("按分类过滤，如 form/basic/effect，全部分类见 list_categories"),
    platform: z.enum(["web", "uniapp"]).optional().describe("按支持平台过滤"),
    tag: z.string().optional().describe("按标签过滤，如 button/switch"),
  },
  annotations: { readOnlyHint: true },
  handler: async ({ category, platform, tag }) => {
    let entries = await loadKbIndex();
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
});
