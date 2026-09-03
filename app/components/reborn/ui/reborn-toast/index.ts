import type {MessageGlobalConfig, MessageNode, MessageOptions, MessageType} from './reborn-toast.config';
import { RebornToast } from '#components'
import { useNuxtApp } from '#imports'
import { createVNode, getCurrentInstance, render } from 'vue'
import {
  addMessage,
  applyMessageConfig,
  destroyMessages
  
  
  
  
} from './reborn-toast.config'

export type { MessageGlobalConfig, MessageOptions, MessageType } from './reborn-toast.config'

let containerEl: HTMLElement | null = null
let getContainer: (() => HTMLElement) | undefined

/**
 * 确保消息容器已挂载（命令式调用时自动初始化）；
 * getContainer 变更时把容器节点移动到新的父级（仍为全屏展示）
 */
function mountContainer() {
  if (typeof document === 'undefined') return

  const parent = (() => {
    try {
      return getContainer?.() ?? document.body
    } catch {
      return document.body
    }
  })()

  if (!containerEl) {
    containerEl = document.createElement('div')
    const vnode = createVNode(RebornToast)
    // 命令式调用大多发生在事件回调里（无组件实例），必须兜底拿应用上下文，
    // 否则容器内的 NuxtIcon 等依赖 app provide 的组件会在 setup 中崩溃
    const instance = getCurrentInstance()
    if (instance) {
      vnode.appContext = instance.appContext
    } else {
      try {
        vnode.appContext = (useNuxtApp().vueApp as any)._context
      } catch {
        // 拿不到应用上下文时仍渲染，仅自定义组件类内容可能受限
      }
    }
    render(vnode, containerEl)
  }

  if (containerEl.parentElement !== parent) {
    parent.appendChild(containerEl)
  }
}

/** 打开一条消息，返回关闭时兑现的 Promise */
function open(options: MessageOptions): Promise<void> {
  mountContainer()
  return addMessage(options)
}

/**
 * 归一化 (content, duration, onClose) 与 (config) 两种调用形态：
 * content 为对象时视作 config，其余参数忽略
 */
function normalize(
  content: MessageNode | MessageOptions,
  duration?: number,
  onClose?: () => void,
): MessageOptions {
  if (content !== null && typeof content === 'object') {
    // VNode 也是对象：按提示内容处理而非 config
    if ('__v_isVNode' in content) {
      return { content: content as MessageNode, duration, onClose }
    }
    return { ...(content as MessageOptions) }
  }
  return { content: content as MessageNode, duration, onClose }
}

/** 生成某个 level 的静态方法 */
function levelMethod(type: MessageType) {
  return (content: MessageNode | MessageOptions, duration?: number, onClose?: () => void) =>
    open({ ...normalize(content, duration, onClose), type })
}

/**
 * 命令式消息提示 API：
 * message.success('已保存')、message.error(config)、message[level](content, duration, onClose).then(afterClose)
 */
export const message = {
  /** 以完整 config 打开一条消息 */
  open,
  info: levelMethod('info'),
  success: levelMethod('success'),
  warning: levelMethod('warning'),
  error: levelMethod('error'),
  loading: levelMethod('loading'),
  /** 全局配置：top / duration / maxCount / rtl / getContainer */
  config(options: MessageGlobalConfig) {
    if (options.getContainer !== undefined) {
      getContainer = options.getContainer
      if (containerEl) mountContainer()
    }
    applyMessageConfig(options)
  },
  /** 全局销毁：不传 key 关闭全部，传 key 关闭对应消息 */
  destroy(key?: string | number) {
    destroyMessages(key)
  },
}
