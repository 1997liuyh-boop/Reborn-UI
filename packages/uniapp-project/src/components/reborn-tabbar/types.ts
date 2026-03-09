import type { InjectionKey } from 'vue'
import type { tabbarColors, tabbarShapes } from './reborn-tabbar.config'

/**
 * TabbarItem 子项数据结构
 */
export interface TabbarItem {
    name: string | number
}

/**
 * TabbarProvide - 提供给子组件的数据
 */
export type TabbarProvide = {
    props: {
        modelValue?: number | string
        fixed?: boolean
        safeAreaInsetBottom?: boolean
        bordered?: boolean
        shape?: (typeof tabbarShapes)[number] | null
        animation?: 'fade' | 'flip' | 'reveal' | 'creative' | 'glass' | 'fly-balls' | 'drop' | null
        activeColor?: string
        inactiveColor?: string
        placeholder?: boolean
        zIndex?: number
        color?: (typeof tabbarColors)[number]
    }
    setChange: (child: TabbarItem) => void
    locked: import('vue').Ref<boolean>
}

export const TABBAR_KEY: InjectionKey<TabbarProvide> = Symbol('reborn-tabbar')
