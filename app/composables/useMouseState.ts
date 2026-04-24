import { readonly, ref } from "vue";

/**
 * 鼠标悬停状态管理组合式函数。
 *
 * 提供响应式的 `isMouseEntered` 状态，可以在组件外部监听鼠标在特定元素上的
 * enter/leave 事件，并据此控制 UI 行为（如悬停状态的样式、过渡效果等）。
 *
 * @returns 包含 `isMouseEntered` 响应式状态和 `setMouseEntered` 控制函数的对象
 *
 * @example
 * ```ts
 * const { isMouseEntered, setMouseEntered } = useMouseState()
 *
 * // 在组件模板中监听鼠标事件
 * <div @mouseenter="setMouseEntered(true)" @mouseleave="setMouseEntered(false)">
 *   <slot />
 * </div>
 *
 * // 结合条件样式或过渡
 * <div :class="{ 'hovered': isMouseEntered }">
 *   <!-- 根据鼠标是否进入显示不同内容或应用不同样式 -->
 * </div>
 * ```
 */
export function useMouseState() {
  const isMouseEntered = ref(false);

  function setMouseEntered(value: boolean) {
    isMouseEntered.value = value;
  }

  return {
    isMouseEntered: readonly(isMouseEntered),
    setMouseEntered,
  };
}
