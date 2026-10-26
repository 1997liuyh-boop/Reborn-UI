/** 写入剪贴板；HTTP 或权限限制下退回浏览器的选区复制。 */
export async function writeClipboardText(text: string): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 浏览器可能拒绝异步剪贴板，继续尝试用户点击触发的传统复制。
  }

  const active = document.activeElement;
  const selection = window.getSelection();
  const ranges = Array.from({ length: selection?.rangeCount ?? 0 }, (_, i) => selection!.getRangeAt(i).cloneRange());
  const input = document.createElement('textarea');
  input.value = text;
  input.readOnly = true;
  input.tabIndex = -1;
  input.className = 'fixed top-0 left-0 -z-50 opacity-0';
  // 临时节点留在当前抽屉内，避免焦点限制把焦点移走，导致复制到空内容。
  const host = active?.closest('[role="dialog"], dialog') ?? document.body;
  host.append(input);
  try {
    input.focus({ preventScroll: true });
    input.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    input.remove();
    if (active instanceof HTMLElement) active.focus({ preventScroll: true });
    selection?.removeAllRanges();
    for (const range of ranges) selection?.addRange(range);
  }
}
