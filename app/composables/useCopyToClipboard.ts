import { createSharedComposable } from "@vueuse/core";

/**
 * 将指定文本写入系统剪贴板，并通过 Toast 提示用户操作结果。
 *
 * @param text - 要复制到剪贴板的文本内容
 */
function _useCopyToClipboard(text: string) {
  const toast = useToast();

  navigator.clipboard.writeText(text).then(() => {
    toast.add({
      title: "Success!",
      description: "Successfully copied to clipboard.",
      color: "success",
    });
  });
}

/**
 * 剪贴板复制组合式函数（共享单例）。
 *
 * 使用 `createSharedComposable` 包装，确保多个组件调用时
 * 共享同一个 Toast 实例，避免重复弹出通知。
 *
 * @example
 * ```ts
 * const copy = useCopyToClipboard()
 * copy('Hello, World!')
 * ```
 */
export const useCopyToClipboard = createSharedComposable(_useCopyToClipboard);
