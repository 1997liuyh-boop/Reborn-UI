import type { InjectionKey, Ref } from 'vue'
import { inject, provide } from 'vue'

/**
 * 后代布局动画登记：祖先布局容器（如 RebornSticky）提供登记入口，
 * 展开 / 收起类组件（如 RebornCollapse）把自己的「动画中」状态登记上去，祖先据此决定何时重新测量。
 * 祖先只读取状态，不控制后代的动画。
 *
 * 放在 composables 而不是某个组件的配置文件里：CLI 按「../<组件名>/」解析组件间依赖，
 * 写在 Collapse 的配置里会让单独安装 Sticky 时连带装上 Collapse。
 */
export interface LayoutAnimationRegistry {
  /** 登记一个后代的动画中状态，返回注销函数 */
  register: (animating: Readonly<Ref<boolean>>) => () => void
}

export const LAYOUT_ANIMATION_KEY: InjectionKey<LayoutAnimationRegistry> = Symbol('RebornLayoutAnimation')

/** 祖先调用：提供登记入口 */
export function provideLayoutAnimation(registry: LayoutAnimationRegistry) {
  provide(LAYOUT_ANIMATION_KEY, registry)
}

/** 后代调用：没有祖先布局容器时返回 undefined（可选依赖）；有则登记并返回注销函数 */
export function useLayoutAnimationRegistration(animating: Readonly<Ref<boolean>>): (() => void) | undefined {
  return inject(LAYOUT_ANIMATION_KEY, undefined)?.register(animating)
}
