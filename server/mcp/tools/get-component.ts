import type { KbComponent, KbProp } from "~~/packages/mcp/src/kb";
import { z } from "zod";

/** 未指定 fields 时返回除示例代码外的全部信息，示例只留标题清单（完整代码用 get_component_example） */
function pickFields(component: KbComponent, fields?: string[]): Record<string, unknown> {
  if (!fields?.length) {
    const { examples, ...rest } = component;
    return { ...rest, exampleTitles: (examples ?? []).map((e, i) => e.title ?? `示例 ${i + 1}`) };
  }
  const result: Record<string, unknown> = { id: component.id };
  for (const field of fields) {
    if (field in component) result[field] = component[field as keyof KbComponent];
  }
  return result;
}

export default defineMcpTool({
  name: "get_component",
  title: "获取组件知识条目",
  description: "获取组件完整知识条目：props/events/slots/使用边界（whenToUse/whenNotToUse/pitfalls）等。写代码前必读。",
  inputSchema: {
    id: z.string().describe("组件 id（kebab-case），如 reborn-button"),
    fields: z
      .array(z.string())
      .optional()
      .describe("只返回指定字段（如 [\"props\",\"pitfalls\"]），默认返回除示例代码外的全部"),
    platform: z
      .enum(["web", "uniapp"])
      .optional()
      .describe("只保留该平台通用或专属的 props：两端取值不同的 prop（如 size、ui）按平台并存两条并带 platform 字段，不传则两条都返回"),
  },
  annotations: { readOnlyHint: true },
  handler: async ({ id, fields, platform }) => {
    const component = await loadKbComponent(id);
    if (!component) {
      return errorResult(`组件不存在：${id}。请先用 search_components 或 list_components 确认 id。`);
    }
    const result = pickFields(component, fields);
    if (platform && Array.isArray(result.props)) {
      result.props = (result.props as KbProp[]).filter((p) => !p.platform || p.platform === platform);
      result.platform = platform;
    }
    result.docUrl = toSiteUrl(component.docPath);
    return jsonResult(result);
  },
});
