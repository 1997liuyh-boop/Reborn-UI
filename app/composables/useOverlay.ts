import type { Component, VNode, Ref } from 'vue'
import { h, createApp, defineComponent, ref } from 'vue'

/**
 * 组件 Props 类型
 */
type ComponentProps<T> = T extends Component<infer P> ? P : Record<string, any>

/**
 * Overlay 配置选项
 */
export interface OverlayOptions<T extends Component> {
  /** 创建后立即打开 */
  defaultOpen?: boolean
  /** 传递给组件的 props */
  props?: ComponentProps<T>
  /** 关闭时销毁 */
  destroyOnClose?: boolean
  /** 内容插槽 */
  content?: VNode | (() => VNode)
  /** 头部插槽 */
  header?: VNode | (() => VNode)
  /** 底部插槽 */
  footer?: VNode | (() => VNode)
}

/**
 * Overlay 实例
 */
export interface OverlayInstance<T extends Component = Component> {
  open: (props?: ComponentProps<T>) => Promise<any>
  close: (value?: any) => void
  patch: (props: Partial<ComponentProps<T>>) => void
  id: symbol
}

/**
 * 内部 Overlay 状态
 */
interface OverlayState<T extends Component = Component> {
  id: symbol
  component: T
  props: Record<string, any>
  initialProps: Record<string, any>
  options: OverlayOptions<T>
  isOpen: boolean
  resolve?: (value: any) => void
  app?: ReturnType<typeof createApp>
  container?: HTMLDivElement
  reactiveProps: Ref<Record<string, any>>
}

// 全局 overlay 状态管理
const overlayStates = new Map<symbol, OverlayState>()

/**
 * 创建插槽映射
 */
function resolveSlots<T extends Component>(state: OverlayState<T>): Record<string, () => VNode> {
  const slots: Record<string, () => VNode> = {}
  if (state.options.content) {
    slots.content = typeof state.options.content === 'function'
      ? state.options.content
      : () => state.options.content as VNode
  }
  if (state.options.header) {
    slots.header = typeof state.options.header === 'function'
      ? state.options.header
      : () => state.options.header as VNode
  }
  if (state.options.footer) {
    slots.footer = typeof state.options.footer === 'function'
      ? state.options.footer
      : () => state.options.footer as VNode
  }
  return slots
}

/**
 * 创建并挂载 overlay 应用
 */
function createOverlayApp<T extends Component>(state: OverlayState<T>) {
  const WrapperComponent = defineComponent({
    setup() {
      return () => {
        const mergedProps = {
          ...state.reactiveProps.value,
          open: true,
          'onUpdate:open': (value: boolean) => {
            if (!value) closeOverlay(state.id)
          },
          onConfirm: () => {
            if (state.resolve) {
              state.resolve('confirm')
              state.resolve = undefined
            }
          },
          onCancel: () => {
            closeOverlay(state.id, 'cancel')
          },
          onClose: (value?: any) => {
            closeOverlay(state.id, value)
          },
        }
        return h(state.component, mergedProps, resolveSlots(state))
      }
    },
  })

  const app = createApp(WrapperComponent)
  app.mount(state.container!)
  return app
}

/**
 * 关闭指定 ID 的 overlay
 */
function closeOverlay(id: symbol, value?: any): void {
  const state = overlayStates.get(id)
  if (!state) return

  state.isOpen = false

  if (state.resolve) {
    state.resolve(value)
    state.resolve = undefined
  }

  if (state.app) {
    state.app.unmount()
    state.app = undefined
  }

  if (state.container?.parentNode) {
    state.container.parentNode.removeChild(state.container)
    state.container = undefined
  }

  state.props = { ...state.initialProps }
  state.reactiveProps.value = { ...state.initialProps }

  if (state.options.destroyOnClose) {
    overlayStates.delete(id)
  }
}

/**
 * useOverlay composable
 * 用于全局管理 reborn-dialog 和 reborn-popup 组件及其二次封装组件
 */
export const useOverlay = () => {
  /**
   * 创建一个 overlay 实例
   */
  const create = <T extends Component>(
    component: T,
    options?: OverlayOptions<T>
  ): OverlayInstance<T> => {
    const id = Symbol('overlay')
    const initialProps = (options?.props as Record<string, any>) || {}

    const state: OverlayState<T> = {
      id,
      component,
      props: initialProps,
      initialProps,
      options: (options as OverlayOptions<T>) || {},
      isOpen: false,
      reactiveProps: ref({ ...initialProps }),
    }

    overlayStates.set(id, state)

    const instance: OverlayInstance<T> = {
      id,
      open: (props?: ComponentProps<T>) => open(id, props),
      close: (value?: any) => closeOverlay(id, value),
      patch: (props: Partial<ComponentProps<T>>) => patch(id, props),
    }

    if (options?.defaultOpen) {
      instance.open()
    }

    return instance
  }

  /**
   * 打开指定 ID 的 overlay
   */
  const open = <T extends Component>(
    id: symbol,
    props?: ComponentProps<T>
  ): Promise<any> => {
    const state = overlayStates.get(id)
    if (!state) {
      return Promise.reject(new Error(`Overlay with id ${id.toString()} not found`))
    }

    // 合并 props
    if (props) {
      state.reactiveProps.value = { ...state.props, ...(props as Record<string, any>) }
    } else {
      state.reactiveProps.value = { ...state.props }
    }

    return new Promise((resolve) => {
      state.resolve = resolve
      state.isOpen = true

      // 创建容器
      if (!state.container) {
        state.container = document.createElement('div')
        document.body.appendChild(state.container)
      }

      // 创建并挂载应用
      if (!state.app) {
        state.app = createOverlayApp(state)
      }
    })
  }

  /**
   * 更新指定 ID 的 overlay props（无需重新挂载）
   */
  const patch = <T extends Component>(
    id: symbol,
    props: Partial<ComponentProps<T>>
  ): void => {
    const state = overlayStates.get(id)
    if (!state) return

    state.props = { ...state.props, ...(props as Record<string, any>) }
    Object.assign(state.reactiveProps.value, props)
  }

  /**
   * 关闭所有 overlay
   */
  const closeAll = (): void => {
    overlayStates.forEach((state, id) => {
      if (state.isOpen) {
        closeOverlay(id)
      }
    })
  }

  /**
   * 卸载指定 ID 的 overlay
   */
  const unmount = (id: symbol): void => {
    const state = overlayStates.get(id)
    if (!state) return

    if (state.isOpen) {
      closeOverlay(id)
    }

    if (state.app) {
      state.app.unmount()
      state.app = undefined
    }

    if (state.container?.parentNode) {
      state.container.parentNode.removeChild(state.container)
      state.container = undefined
    }

    overlayStates.delete(id)
  }

  /**
   * 检查指定 ID 的 overlay 是否打开
   */
  const isOpen = (id: symbol): boolean => {
    const state = overlayStates.get(id)
    return state?.isOpen ?? false
  }

  /**
   * 获取所有 overlays 的列表
   */
  const overlays = Array.from(overlayStates.entries())

  return {
    create,
    open,
    close: closeOverlay,
    closeAll,
    patch,
    unmount,
    isOpen,
    overlays,
  }
}

// 导出类型
export type OverlayReturn = ReturnType<typeof useOverlay>
