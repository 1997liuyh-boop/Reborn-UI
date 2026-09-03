import type { MessageGlobalConfig, MessageNode, MessageOptions, MessageType } from './reborn-toast.config'
// #ifdef H5
// 仅 H5 有 DOM 渲染 API，小程序端的 vue 运行时不导出 render，必须条件编译
import { createVNode, getCurrentInstance, render } from 'vue'
// #endif
import {
  addMessage,
  applyMessageConfig,
  destroyMessages,
  hasMessageInstance,
} from './reborn-toast.config'
import RebornToast from './RebornToast.vue'

export type {
  MessageColor,
  MessageGlobalConfig,
  MessageInstance,
  MessageNode,
  MessageOptions,
  MessageSemanticDOM,
  MessageType,
  MessageVariant,
} from './reborn-toast.config'
export { messageColors, messageTypes, messageVariants } from './reborn-toast.config'
export { RebornToast }

let containerEl: HTMLElement | null = null
let getContainer: (() => HTMLElement) | undefined

/**
 * H5 端确保消息容器已挂载（命令式调用时自动初始化）；
 * getContainer 变更时把容器节点移动到新的父级（仍为全屏展示）。
 * 小程序端无 DOM（typeof document 守卫直接返回），页面里必须写有 <RebornToast />（RebornPage 已内置）
 */
function mountContainer() {
  // #ifdef H5
  if (typeof document === 'undefined') {
    return
  }

  // 页面内已渲染 <RebornToast />（RebornPage 内置）时无需再挂容器，避免消息重复展示
  if (!containerEl && hasMessageInstance()) {
    return
  }

  const parent = (() => {
    try {
      return getContainer?.() ?? document.body
    }
    catch {
      return document.body
    }
  })()

  if (!containerEl) {
    containerEl = document.createElement('div')
    const vnode = createVNode(RebornToast)
    // 命令式调用大多发生在事件回调里，桥接当前应用上下文以支持全局注入
    const instance = getCurrentInstance()
    if (instance) {
      vnode.appContext = instance.appContext
    }
    render(vnode, containerEl)
  }

  if (containerEl.parentElement !== parent) {
    parent.appendChild(containerEl)
  }
  // #endif
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
 * 命令式消息提示 API（与 Web 端同名同形）：
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
  /** 全局配置：top / duration / maxCount / rtl / getContainer（getContainer 仅 H5 生效） */
  config(options: MessageGlobalConfig) {
    if (options.getContainer !== undefined) {
      getContainer = options.getContainer
      if (containerEl) {
        mountContainer()
      }
    }
    applyMessageConfig(options)
  },
  /** 全局销毁：不传 key 关闭全部，传 key 关闭对应消息 */
  destroy(key?: string | number) {
    destroyMessages(key)
  },
}
