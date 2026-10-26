import { hasInjectionContext } from "vue";

/**
 * 将指定文本写入系统剪贴板，并通过 Toast 提示结果。
 *
 * 这是一个命令式动作，不是组合式函数：每次调用都会执行一次写入，直接在点击回调里调用即可，
 * 不要在 setup 顶层调用（那样会在组件创建时就复制一次）。
 *
 * - 写入成功：弹出成功提示，Promise 解析为 `true`
 * - 写入失败（非安全上下文没有 `navigator.clipboard`、用户拒绝权限、页面未聚焦等）：
 *   弹出失败提示，Promise 解析为 `false`，不会产生未捕获的拒绝
 *
 * @param text - 要复制到剪贴板的文本内容
 * @returns 是否写入成功
 *
 * @example
 * ```ts
 * async function handleCopy(code: string) {
 *   const ok = await copyToClipboard(code)
 *   if (!ok) console.warn('复制失败')
 * }
 * ```
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 点击回调里没有组件实例，useToast 内部的 inject 会告警；此时借 Nuxt 应用上下文执行。
  // 在 setup 内调用时保持原样，才能读到 UApp 在组件层级提供的 Toast 配置。
  const toast = hasInjectionContext()
    ? useToast()
    : useNuxtApp().vueApp.runWithContext(() => useToast());

  try {
    // 非安全上下文（http 访问）下 navigator.clipboard 为 undefined，按失败处理
    if (typeof navigator === "undefined" || !navigator.clipboard?.writeText) {
      throw new Error("当前环境不支持剪贴板写入");
    }
    await navigator.clipboard.writeText(text);
    toast.add({
      title: "Success!",
      description: "Successfully copied to clipboard.",
      color: "success",
    });
    return true;
  }
  catch {
    toast.add({
      title: "复制失败",
      description: "无法写入剪贴板，请检查浏览器权限或手动复制。",
      color: "error",
    });
    return false;
  }
}
