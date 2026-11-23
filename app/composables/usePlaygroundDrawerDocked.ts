/**
 * usePlaygroundDrawerDocked —— 演练场的参数抽屉是否正占着文档页右栏目录的位置
 *
 * Playground 打开 / 关闭抽屉时写入，app.vue 读它把右下角的回顶按钮让到抽屉左边，
 * 免得按钮压在抽屉的表单上。
 */
export function usePlaygroundDrawerDocked() {
  return useState<boolean>("playground-drawer-docked", () => false);
}
