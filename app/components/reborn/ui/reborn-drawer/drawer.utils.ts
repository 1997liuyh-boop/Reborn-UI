/** 尺寸仅百分比保留单位，其他字符串按像素数值解释；非法值回退到默认比例。 */
export function normalizeDrawerSize(size: number | string): string {
  const value = String(size).trim();
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number) || number < 0) return '30%';
  return /^(?:\d+(?:\.\d+)?|\.\d+)%$/.test(value) ? `${number}%` : `${number}px`;
}

// 根因：嵌套实例同时监听 ESC 会一起关闭；共享栈只允许最上层响应，并确保后开层级更高。
const drawerStack: { id: symbol; zIndex: number }[] = [];
export function registerDrawer(id: symbol, zIndex: number): number {
  unregisterDrawer(id);
  const next = Math.max(zIndex, ...drawerStack.map(item => item.zIndex + 2));
  drawerStack.push({ id, zIndex: next });
  return next;
}
export function isTopDrawer(id: symbol): boolean {
  return drawerStack.at(-1)?.id === id;
}
export function unregisterDrawer(id: symbol) {
  const index = drawerStack.findIndex(item => item.id === id);
  if (index >= 0) drawerStack.splice(index, 1);
}
