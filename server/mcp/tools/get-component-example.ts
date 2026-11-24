import { z } from "zod";

export default defineMcpTool({
  name: "get_component_example",
  title: "获取组件示例",
  description: "获取组件用法示例代码。不传 title 时返回全部示例。",
  inputSchema: {
    id: z.string().describe("组件 id（kebab-case）"),
    title: z.string().optional().describe("示例标题（见 get_component 返回的 exampleTitles）"),
    platform: z.enum(["web", "uniapp"]).optional().describe("按平台过滤示例"),
  },
  annotations: { readOnlyHint: true },
  handler: async ({ id, title, platform }) => {
    const component = await loadKbComponent(id);
    if (!component) return errorResult(`组件不存在：${id}`);
    let examples = component.examples ?? [];
    if (platform) examples = examples.filter((e) => !e.platform || e.platform === platform);
    if (title) examples = examples.filter((e) => e.title === title);
    if (!examples.length) {
      return errorResult(`组件 ${id} 没有匹配的示例${title ? `（title=${title}）` : ""}`);
    }
    return jsonResult({ id, examples });
  },
});
