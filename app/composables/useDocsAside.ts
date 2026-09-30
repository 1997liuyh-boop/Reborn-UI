/**
 * useDocsAside —— 文档页左侧栏的折叠状态
 *
 * 状态用 useState 共享：
 * - 布局层（layouts/docs.vue）据此把侧栏列收成 5.5rem 窄轨、正文吃满其余宽度，折叠按钮也在那里；
 * - 侧栏（DocsAsideLeftBody）把它直接传给 RebornMenu 的 collapse，菜单收成 64px 图标轨。
 * 之所以不放组件内的 ref：布局层的 UPage 以 route.path 为 key，切页整体重挂载，组件内状态会丢。
 */
export function useDocsAside() {
  /** 侧栏是否已折叠 */
  const collapsed = useState<boolean>("docs-aside-collapsed", () => false);

  function toggle() {
    collapsed.value = !collapsed.value;
  }

  return { collapsed, toggle };
}
