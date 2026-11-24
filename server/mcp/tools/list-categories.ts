export default defineMcpTool({
  name: "list_categories",
  title: "列出分类",
  description: "列出全部组件分类及各分类的组件数量。",
  annotations: { readOnlyHint: true },
  handler: async () => {
    const counter = new Map<string, number>();
    for (const entry of await loadKbIndex()) {
      const category = entry.category ?? "uncategorized";
      counter.set(category, (counter.get(category) ?? 0) + 1);
    }
    return jsonResult({
      categories: [...counter].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count),
    });
  },
});
