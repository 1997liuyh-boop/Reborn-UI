/** 组件总览导航的色调：首屏深色区为 dark，浅色区为 light */
export type OverviewNavTone = "dark" | "light";

/** 组件总览导航的色调状态，由页面首屏写入、导航读取 */
export function useOverviewNavTone() {
  return useState<OverviewNavTone>("overview-nav-tone", () => "dark");
}
