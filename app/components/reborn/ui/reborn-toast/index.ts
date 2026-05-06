import type { Ref } from 'vue'
import { createVNode, getCurrentInstance, inject, provide, ref, render } from 'vue'
import { RebornToast } from '#components'
import { type ToastOptions, defaultOptions, getToastOptionKey, globalOptionRef } from './reborn-toast.config'

let toastContainer: HTMLElement | null = null
let globalTimer: ReturnType<typeof setTimeout> | null = null
let isMounted = false

/**
 * 确保 toast 容器已挂载到 DOM（命令式调用时自动初始化）
 */
function mountToastContainer() {
  if (typeof document === 'undefined' || isMounted) return

  toastContainer = document.createElement('div')
  document.body.appendChild(toastContainer)

  const vnode = createVNode(RebornToast)
  const instance = getCurrentInstance()
  if (instance) {
    vnode.appContext = instance.appContext
  }
  // 注入全局状态（作为兜底，即便没有 appContext，RebornToast 内部也会从 config 导入）
  if (vnode.appContext) {
    vnode.appContext.provides[getToastOptionKey()] = globalOptionRef
  }
  render(vnode, toastContainer)
  isMounted = true
}

/**
 * 统一的状态更新与计时器管理
 */
function applyOptions(targetRef: Ref<ToastOptions>, options: ToastOptions) {
  // 合并默认配置、传入配置，并强制显示
  const finalOptions = { ...defaultOptions, ...options, show: true }

  // 处理 duration 为空的情况
  if (finalOptions.duration === undefined || finalOptions.duration === null) {
    finalOptions.duration = defaultOptions.duration
  }

  targetRef.value = finalOptions

  // 处理计时器
  if (globalTimer) clearTimeout(globalTimer)
  if (targetRef.value.duration! > 0) {
    globalTimer = setTimeout(() => {
      targetRef.value.show = false
    }, targetRef.value.duration)
  }
}

/**
 * 显示 toast（全局单例）
 */
function invoke(options: ToastOptions) {
  mountToastContainer()
  applyOptions(globalOptionRef, options)
}

/**
 * 规范化参数，支持 (msg: string, ...) 和 (options: ToastOptions, ...)
 */
function normalizeOptions(msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>, defaultDuration = 2000): ToastOptions {
  if (typeof msg === 'string') {
    return { msg, duration: duration ?? defaultDuration, ...opts }
  }
  return { ...msg, ...opts }
}

/**
 * 命令式 Toast API，类似 Element Plus 的 ElMessage
 */
export const showToast = {
  show: invoke,
  hide: () => { globalOptionRef.value.show = false },
  success: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
    invoke({ color: 'success', iconName: 'success', ...normalizeOptions(msg, duration, opts, 1500) }),
  error: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
    invoke({ color: 'error', iconName: 'error', ...normalizeOptions(msg, duration, opts, 2000) }),
  warning: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
    invoke({ color: 'warning', iconName: 'warning', ...normalizeOptions(msg, duration, opts, 2000) }),
  info: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
    invoke({ color: 'info', iconName: 'info', ...normalizeOptions(msg, duration, opts, 2000) }),
  loading: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
    invoke({ cover: false, iconName: 'loading', ...normalizeOptions(msg, duration, opts, duration ?? 0) }),
}

/**
 * Composable 式 Toast API，支持多实例（通过 selector 区分）
 */
export function useToast(selector = '') {
  const key = getToastOptionKey(selector)
  const instance = getCurrentInstance()

  // 如果是默认 selector，复用全局单例
  if (!selector) {
    mountToastContainer()
    const optionRef = inject<Ref<ToastOptions>>(key, globalOptionRef)
    if (instance) {
      provide(key, optionRef)
    }

    return {
      show: (options: ToastOptions) => { invoke(options) },
      hide: () => { globalOptionRef.value.show = false },
      close: () => { globalOptionRef.value.show = false },
      success: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
        invoke({ color: 'success', iconName: 'success', ...normalizeOptions(msg, duration, opts, 1500) }),
      error: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
        invoke({ color: 'error', iconName: 'error', ...normalizeOptions(msg, duration, opts, 2000) }),
      warning: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
        invoke({ color: 'warning', iconName: 'warning', ...normalizeOptions(msg, duration, opts, 2000) }),
      info: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
        invoke({ color: 'info', iconName: 'info', ...normalizeOptions(msg, duration, opts, 2000) }),
      loading: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
        invoke({ cover: false, iconName: 'loading', ...normalizeOptions(msg, duration, opts, duration ?? 0) }),
    }
  }

  // selector 非空时：独立 optionRef，支持多 toast 实例共存
  const optionRef = inject<Ref<ToastOptions>>(key, ref<ToastOptions>({ ...defaultOptions }))

  if (typeof document !== 'undefined' && !toastContainer) {
    toastContainer = document.createElement('div')
    document.body.appendChild(toastContainer)

    const vnode = createVNode(RebornToast)
    if (instance) {
      vnode.appContext = instance.appContext
    }
    if (vnode.appContext) {
      vnode.appContext.provides[key] = optionRef
    }
    render(vnode, toastContainer)
  }

  provide(key, optionRef)

  const show = (options: ToastOptions) => {
    applyOptions(optionRef, options)
  }

  return {
    show,
    hide: () => { optionRef.value.show = false },
    close: () => { optionRef.value.show = false },
    success: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
      show({ color: 'success', iconName: 'success', ...normalizeOptions(msg, duration, opts, 1500) }),
    error: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
      show({ color: 'error', iconName: 'error', ...normalizeOptions(msg, duration, opts, 2000) }),
    warning: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
      show({ color: 'warning', iconName: 'warning', ...normalizeOptions(msg, duration, opts, 2000) }),
    info: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
      show({ color: 'info', iconName: 'info', ...normalizeOptions(msg, duration, opts, 2000) }),
    loading: (msg: string | ToastOptions, duration?: number, opts?: Partial<ToastOptions>) =>
      show({ cover: false, iconName: 'loading', ...normalizeOptions(msg, duration, opts, duration ?? 0) }),
  }
}
