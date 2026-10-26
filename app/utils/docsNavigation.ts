import type { ContentNavigationItem } from '@nuxt/content'
import type { InjectionKey, Ref } from 'vue'

/** 导航由应用根节点维护，消费方只读取当前数据。 */
export type DocsNavigation = Readonly<Ref<ContentNavigationItem[] | undefined>>
export const navigationKey: InjectionKey<DocsNavigation> = Symbol('docs-navigation')
