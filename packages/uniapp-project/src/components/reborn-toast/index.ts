import { inject, provide, ref, render, createVNode, getCurrentInstance } from 'vue'
import { deepMerge } from '@/lib/util'

export type ToastIconType = 'success' | 'error' | 'warning' | 'loading' | 'info'
export type ToastPositionType = 'top' | 'middle-top' | 'middle' | 'bottom'
export type ToastDirection = 'vertical' | 'horizontal'
export type ToastLoadingType = 'outline' | 'ring' | 'spinner'

export type ToastColorType = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export type ToastOptions = {
    msg?: string
    duration?: number
    direction?: ToastDirection
    iconName?: ToastIconType
    iconSize?: number
    loadingType?: ToastLoadingType
    loadingColor?: string
    loadingSize?: number
    position?: ToastPositionType
    show?: boolean
    zIndex?: number
    cover?: boolean
    iconClass?: string
    classPrefix?: string
    color?: ToastColorType
    opened?: () => void
    closed?: () => void
}

const toastDefaultOptionKey = '__REBORN_TOAST_OPTION__'
export const defaultOptions: ToastOptions = { duration: 2000, show: false }

export function getToastOptionKey(selector: string) {
    return selector ? `${toastDefaultOptionKey}${selector}` : toastDefaultOptionKey
}

import RebornToast from './RebornToast.vue'

// 全局唯一的组件挂载节点与实例状态
let toastContainer: HTMLElement | null = null
let globalTimer: ReturnType<typeof setTimeout> | null = null

// 全局唯一的配置，保证应用中同一时刻只有一个 Toast 实际在工作
export const globalOptionRef = ref<ToastOptions>({ ...defaultOptions })

export function useToast(selector = '') {
    const key = getToastOptionKey(selector)
    const instance = getCurrentInstance()

    // 尝试在当前上下文中挂载或获取，以兼容不同端
    let optionRef = inject(key, globalOptionRef)

    // #ifdef H5
    if (!toastContainer) {
        toastContainer = document.createElement('div')
        toastContainer.id = 'reborn-toast-container'
        document.body.appendChild(toastContainer)

        const vnode = createVNode(RebornToast)

        // 桥接当前上下文，以支持 router, pinia 等
        if (instance) {
            vnode.appContext = instance.appContext
        } else if (!vnode.appContext) {
            vnode.appContext = { provides: {} } as any
        }

        // 极重要：在这里 provide key 使得动态渲染的 RebornToast 能 inject 到这个 Ref
        if (vnode.appContext) {
            if (!vnode.appContext.provides) vnode.appContext.provides = {}
            vnode.appContext.provides[key] = optionRef
        }

        render(vnode, toastContainer)
    }
    // #endif

    // 向下提供引用给可能写在页面里的 <RebornToast />，保证内外使用的 optionRef 永远映射到同一个实例
    provide(key, optionRef)

    const close = () => {
        if (globalTimer) {
            clearTimeout(globalTimer)
            globalTimer = null
        }
        optionRef.value = { ...optionRef.value, show: false }
    }

    const show = (option: ToastOptions | string) => {
        const next = deepMerge(defaultOptions, typeof option === 'string' ? { msg: option } : option)

        // 保证每次 show 时都是立刻覆盖当前唯一的提示
        optionRef.value = deepMerge(next, { show: true })

        if (globalTimer) {
            clearTimeout(globalTimer)
            globalTimer = null
        }

        if (next.duration !== undefined && next.duration > 0) {
            globalTimer = setTimeout(close, next.duration)
        }
    }

    const build = (base: ToastOptions) => (options: ToastOptions | string) => show(deepMerge(base, typeof options === 'string' ? { msg: options } : options))
    return {
        show,
        close,
        loading: build({ iconName: 'loading', duration: 0, cover: true }),
        success: build({ iconName: 'success', duration: 1500 }),
        error: build({ iconName: 'error' }),
        warning: build({ iconName: 'warning' }),
        info: build({ iconName: 'info' }),
    }
}

export const toastIcon = {
    success() {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 44 44" width="48" height="48"><circle cx="24" cy="26" r="22" fill="#000" opacity=".1"/><circle cx="24" cy="24" r="20" fill="#34D19D" opacity=".4"/><circle cx="24" cy="24" r="16" fill="#34D19D"/><path d="M19 24l4 4 8-8" stroke="#FFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
    },
    warning() {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 44 44" width="48" height="48"><circle cx="24" cy="26" r="22" fill="#000" opacity=".1"/><circle cx="24" cy="24" r="20" fill="#F0883A" opacity=".4"/><circle cx="24" cy="24" r="16" fill="#F0883A"/><rect x="22.5" y="14" width="3" height="12" fill="#FFF" rx="1.5"/><circle cx="24" cy="30" r="2" fill="#FFF"/></svg>'
    },
    info() {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 44 44" width="48" height="48"><circle cx="24" cy="26" r="22" fill="#000" opacity=".1"/><circle cx="24" cy="24" r="20" fill="#909CB7" opacity=".4"/><circle cx="24" cy="24" r="16" fill="#909CB7"/><circle cx="24" cy="18" r="2" fill="#FFF"/><rect x="22.5" y="22" width="3" height="12" fill="#FFF" rx="1.5"/></svg>'
    },
    error() {
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 44 44" width="48" height="48"><circle cx="24" cy="26" r="22" fill="#000" opacity=".1"/><circle cx="24" cy="24" r="20" fill="#fa4350" opacity=".4"/><circle cx="24" cy="24" r="16" fill="#fa4350"/><path d="M18 18l12 12M30 18L18 30" stroke="#FFF" stroke-width="2.5" stroke-linecap="round"/></svg>'
    }
}
export { RebornToast }
