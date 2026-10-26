/** 不带左侧栏、走整宽布局的根页面（各分区的总览页） */
const ROOT_PAGES = new Set(["/components", "/blocks", "/changelogs"]);

/**
 * 当前路由是否为分区总览页（/components、/blocks、/changelogs）
 *
 * 只比较 route.path：fullPath 还带着 query 与 hash，服务端拿不到 hash，
 * 带 `#series-xxx` 或 `?from=xxx` 打开总览页时两端会算出不同的布局，水合不一致；
 * 尾斜杠统一去掉，`/components/` 与 `/components` 视为同一页。
 * 内部调用 useRoute()，只能在 setup 中使用。
 */
export function useIsRootPage() {
  const route = useRoute();
  return computed(() => ROOT_PAGES.has(route.path.replace(/\/$/, "") || "/"));
}
