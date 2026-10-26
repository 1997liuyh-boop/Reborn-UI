/** 尺寸仅百分比保留单位，其他字符串按像素数值解释；非法值回退到默认比例。 */
export function normalizeDrawerSize(size: number | string): string {
  const value = String(size).trim();
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number) || number < 0) return '30%';
  return /^(?:\d+(?:\.\d+)?|\.\d+)%$/.test(value) ? `${number}%` : `${number}px`;
}

// 根因：嵌套实例同时监听 ESC 会一起关闭；共享栈只允许最上层响应，并确保后开层级更高。
// 抽屉与对话框共用同一个栈，对话框里套抽屉（或反过来）时同样只关最上层。
const overlayStack: { id: symbol; zIndex: number }[] = [];
/** 弹层打开时入栈，返回实际层级：不低于传入的基础层级，且高于栈内已有弹层。 */
export function registerOverlay(id: symbol, zIndex: number): number {
  // 服务端只执行 setup，不执行过渡回调和卸载钩子，入栈后永远不会出栈：
  // 栈会随请求数增长，后续请求算出的层级也会逐次抬高，与客户端从空栈算出的值对不上。
  // 服务端直接返回基础层级，与客户端水合时的首个弹层一致。
  if (typeof document === 'undefined') return zIndex;
  unregisterOverlay(id);
  const next = Math.max(zIndex, ...overlayStack.map(item => item.zIndex + 2));
  overlayStack.push({ id, zIndex: next });
  return next;
}
/** 是否为当前最上层弹层，只有最上层响应 ESC、遮罩点击等关闭操作。 */
export function isTopOverlay(id: symbol): boolean {
  return overlayStack.at(-1)?.id === id;
}
/** 弹层关闭动画结束或卸载时出栈。 */
export function unregisterOverlay(id: symbol) {
  const index = overlayStack.findIndex(item => item.id === id);
  if (index >= 0) overlayStack.splice(index, 1);
}
