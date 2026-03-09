import { inject, provide, ref } from 'vue'
import { deepMerge } from '@/lib/reborn-common/util'

export type ToastIconType = 'success' | 'error' | 'warning' | 'loading' | 'info'
export type ToastPositionType = 'top' | 'middle-top' | 'middle' | 'bottom'
export type ToastDirection = 'vertical' | 'horizontal'
export type ToastLoadingType = 'outline' | 'ring' | 'spinner'

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
  opened?: () => void
  closed?: () => void
}

const toastDefaultOptionKey = '__REBORN_TOAST_OPTION__'
export const defaultOptions: ToastOptions = { duration: 2000, show: false }
const none = Symbol('none')
const timerMap = new Map<string, ReturnType<typeof setTimeout>>()

export function getToastOptionKey(selector: string) {
  return selector ? `${toastDefaultOptionKey}${selector}` : toastDefaultOptionKey
}

export function useToast(selector = '') {
  const key = getToastOptionKey(selector)
  const optionRef = inject(key, ref<ToastOptions | typeof none>(none))
  if (optionRef.value === none) {
    optionRef.value = defaultOptions
    provide(key, optionRef)
  }

  const close = () => {
    const timer = timerMap.get(key)
    if (timer) clearTimeout(timer)
    timerMap.delete(key)
    optionRef.value = { show: false }
  }

  const show = (option: ToastOptions | string) => {
    const next = deepMerge(defaultOptions, typeof option === 'string' ? { msg: option } : option)
    optionRef.value = deepMerge(next, { show: true })
    const timer = timerMap.get(key)
    if (timer) clearTimeout(timer)
    if (next.duration && next.duration > 0) timerMap.set(key, setTimeout(close, next.duration))
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
  success: () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 44 44"><circle cx="24" cy="26" r="22" fill="#000" opacity=".1"/><circle cx="24" cy="24" r="20" fill="#34D19D" opacity=".4"/><circle cx="24" cy="24" r="16" fill="#34D19D"/><path d="M19 24l4 4 8-8" stroke="#FFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>',
  warning: () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 44 44"><circle cx="24" cy="26" r="22" fill="#000" opacity=".1"/><circle cx="24" cy="24" r="20" fill="#F0883A" opacity=".4"/><circle cx="24" cy="24" r="16" fill="#F0883A"/></svg>',
  info: () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 44 44"><circle cx="24" cy="26" r="22" fill="#000" opacity=".1"/><circle cx="24" cy="24" r="20" fill="#909CB7" opacity=".4"/><circle cx="24" cy="24" r="16" fill="#909CB7"/></svg>',
  error: () => '<svg xmlns="http://www.w3.org/2000/svg" viewBox="2 2 44 44"><circle cx="24" cy="26" r="22" fill="#000" opacity=".1"/><circle cx="24" cy="24" r="20" fill="#fa4350" opacity=".4"/><circle cx="24" cy="24" r="16" fill="#fa4350"/></svg>',
}
export { default as RebornToast } from './RebornToast.vue'
