/**
 * useDocsAside —— 文档页左侧栏的折叠状态
 *
 * 状态用 useState 共享：
 * - 布局层（layouts/docs.vue）据此把侧栏列收成 5.5rem 窄轨、正文吃满其余宽度，折叠按钮也在那里；
 * - 侧栏（DocsAsideLeftBody）把它直接传给 RebornMenu 的 collapse，菜单收成 64px 图标轨。
 * 布局与侧栏读取同一份状态，离开文档区再返回时仍保留用户选择。
 */
export function useDocsAside() {
  /** 侧栏是否已折叠 */
  const collapsed = useState<boolean>("docs-aside-collapsed", () => false);

  function toggle() {
    collapsed.value = !collapsed.value;
  }

  return { collapsed, toggle };
}
