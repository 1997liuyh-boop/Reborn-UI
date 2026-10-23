import { hasInjectionContext } from "vue";

/**
 * 将指定文本写入系统剪贴板，写入成功后通过 Toast 提示用户。
 *
 * 每次调用都会执行一次写入，可以直接在点击回调里调用。
 *
 * ⚠️ 根因：此前用 `createSharedComposable` 包装，首次调用的结果被共享作用域缓存；
 * 在点击回调等 `setup` 之外调用时订阅计数无法归零，之后的调用直接返回缓存、不再写入剪贴板。
 * ✅ 修复：改为普通函数，不做任何缓存。
 *
 * @param text - 要复制到剪贴板的文本内容
 *
 * @example
 * ```ts
 * function handleCopy(code: string) {
 *   useCopyToClipboard(code)
 * }
 * ```
 */
export function useCopyToClipboard(text: string) {
  // 点击回调里没有组件实例，useToast 内部的 inject 会告警；此时借 Nuxt 应用上下文执行。
  // 在 setup 内调用时保持原样，才能读到 UApp 在组件层级提供的 Toast 配置。
  const toast = hasInjectionContext()
    ? useToast()
    : useNuxtApp().vueApp.runWithContext(() => useToast());

  navigator.clipboard.writeText(text).then(() => {
    toast.add({
      title: "Success!",
      description: "Successfully copied to clipboard.",
      color: "success",
    });
  });
}
