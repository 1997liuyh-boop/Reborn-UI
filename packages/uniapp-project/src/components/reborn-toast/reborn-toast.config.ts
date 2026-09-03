import type { CSSProperties } from 'vue'
import { reactive } from 'vue'
import { tv } from '@/lib/tv'

/** 消息类型（level），与 Web 端一致 */
export const messageTypes = ['info', 'success', 'warning', 'error', 'loading'] as const
export type MessageType = (typeof messageTypes)[number]

/** 视觉变体：base 为白底浮层，其余配色对齐 reborn-button 的同名变体 */
export const messageVariants = ['base', 'filled', 'outlined', 'soft', 'subtle'] as const
export type MessageVariant = (typeof messageVariants)[number]

/** 配色（与 reborn-button 同一套语义色） */
export const messageColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export type MessageColor = (typeof messageColors)[number]

/** 语义化结构键，供 classNames / styles 按节点覆盖 */
export type MessageSemanticDOM = 'root' | 'icon' | 'content'

/**
 * 自定义节点：本端仅支持字符串（content 为文本 / icon 为图标类名如 i-lucide-star）。
 * 与 Web 端差异：小程序无法在运行时渲染动态 VNode，故不支持 VNode 形态
 */
export type MessageNode = string

export interface MessageOptions {
  /** 提示内容 */
  content?: MessageNode
  /** 自动关闭的延时，单位秒；设为 0 时不自动关闭 */
  duration?: number
  /** 消息类型，决定默认图标与配色 */
  type?: MessageType
  /** 视觉变体，默认 base（白底浮层 + 圆形色底图标） */
  variant?: MessageVariant
  /** 配色覆盖；缺省时由 type 映射（loading → primary） */
  color?: MessageColor
  /** 自定义图标：iconify 图标类名（如 i-lucide-star） */
  icon?: MessageNode
  /** 按住（H5 为悬停）时是否暂停计时器 */
  pauseOnHover?: boolean
  /** 当前提示的唯一标志：同 key 再次调用会更新内容并重置计时 */
  key?: string | number
  /** 自定义根节点 class */
  className?: string
  /** 自定义根节点行内样式 */
  style?: CSSProperties
  /** 按语义化结构覆盖 class，支持对象或函数形式 */
  classNames?:
    | Partial<Record<MessageSemanticDOM, string>>
    | ((info: { props: MessageOptions }) => Partial<Record<MessageSemanticDOM, string>>)
  /** 按语义化结构覆盖行内样式，支持对象或函数形式 */
  styles?:
    | Partial<Record<MessageSemanticDOM, CSSProperties>>
    | ((info: { props: MessageOptions }) => Partial<Record<MessageSemanticDOM, CSSProperties>>)
  /** 点击消息时触发 */
  onClick?: (e: unknown) => void
  /** 关闭时触发 */
  onClose?: () => void
}

/** 全局配置项 */
export interface MessageGlobalConfig {
  /** 消息距离顶部的位置；数字按 rpx 处理（样式优先原则，Web 端为 px），字符串原样使用 */
  top?: string | number
  /** 默认自动关闭延时，单位秒 */
  duration?: number
  /** 最大显示数，超过限制时最早的消息会被自动关闭；0 表示不限制 */
  maxCount?: number
  /** 是否开启 RTL 模式 */
  rtl?: boolean
  /** 配置渲染节点的输出位置（仅 H5 生效，仍为全屏展示） */
  getContainer?: () => HTMLElement
}

/** 渲染队列里的消息实例 */
export interface MessageInstance extends MessageOptions {
  id: number
  type: MessageType
  variant: MessageVariant
  color: MessageColor
  duration: number
  pauseOnHover: boolean
  /** 关闭时依次调用的 promise resolver（同 key 更新会累积多个） */
  resolvers: Array<() => void>
  /** 离场标记：小程序端不支持 TransitionGroup，用该标记驱动 CSS 离场动画后再移出队列 */
  closing?: boolean
}

/** type → 默认配色（loading 视作品牌主色） */
export const MESSAGE_TYPE_COLOR: Record<MessageType, MessageColor> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
  loading: 'primary',
}

/** type → 默认图标类名（与 Web 端同一套 lucide 图标，本端走 tailwind 图标类） */
export const MESSAGE_TYPE_ICON: Record<MessageType, string> = {
  info: 'i-lucide-info',
  success: 'i-lucide-check',
  warning: 'i-lucide-triangle-alert',
  error: 'i-lucide-x',
  loading: 'i-lucide-loader-circle',
}

/**
 * 全局单例状态：容器组件与命令式 API 共用。
 * 放在 config 里是为了避免 index.ts 与容器组件互相引用
 */
export const messageState = reactive({
  list: [] as MessageInstance[],
  top: '16rpx' as string | number,
  duration: 3,
  maxCount: 0,
  rtl: false,
})

let seed = 0

/** 离场动画时长（毫秒），需与组件内 CSS 动画时长一致 */
const LEAVE_DURATION = 240

/**
 * 页面内已挂载的 <RebornToast /> 实例计数：
 * 小程序端组件必须写在页面里（RebornPage 已内置），H5 命令式调用据此判断是否还需动态挂载容器
 */
let mountedInstances = 0
export function markMessageMounted() {
  mountedInstances++
}
export function unmarkMessageMounted() {
  mountedInstances--
}
export function hasMessageInstance() {
  return mountedInstances > 0
}

/** 计时器状态：支持 pauseOnHover 的暂停/续走 */
interface TimerState {
  timer: ReturnType<typeof setTimeout> | null
  startAt: number
  remaining: number
}
const timers = new Map<number, TimerState>()

function startTimer(item: MessageInstance) {
  stopTimer(item.id)
  if (item.duration <= 0) {
    return
  }
  const state: TimerState = {
    remaining: item.duration * 1000,
    startAt: Date.now(),
    timer: null,
  }
  state.timer = setTimeout(() => closeMessage(item.id), state.remaining)
  timers.set(item.id, state)
}

function stopTimer(id: number) {
  const state = timers.get(id)
  if (state?.timer) {
    clearTimeout(state.timer)
  }
  timers.delete(id)
}

/** 尚未进入离场流程的消息 */
function activeList() {
  return messageState.list.filter(item => !item.closing)
}

/** 按住/悬停暂停：记录剩余时长 */
export function pauseMessage(id: number) {
  const state = timers.get(id)
  if (!state?.timer) {
    return
  }
  clearTimeout(state.timer)
  state.timer = null
  state.remaining -= Date.now() - state.startAt
}

/** 松开/移出恢复：按剩余时长续走 */
export function resumeMessage(id: number) {
  const state = timers.get(id)
  if (!state || state.timer) {
    return
  }
  if (state.remaining <= 0) {
    closeMessage(id)
    return
  }
  state.startAt = Date.now()
  state.timer = setTimeout(() => closeMessage(id), state.remaining)
}

/**
 * 关闭单条消息：立即触发 onClose 与 promise resolve（与 Web 端时机一致），
 * 实例先标记 closing 播放离场动画，动画结束后再移出队列
 */
export function closeMessage(id: number) {
  const item = messageState.list.find(it => it.id === id)
  if (!item || item.closing) {
    return
  }
  stopTimer(id)
  item.closing = true
  item.onClose?.()
  item.resolvers.forEach(resolve => resolve())
  item.resolvers = []
  setTimeout(() => {
    const index = messageState.list.findIndex(it => it.id === id)
    if (index >= 0) {
      messageState.list.splice(index, 1)
    }
  }, LEAVE_DURATION)
}

/** 全局销毁：不传 key 清空全部，传 key 关闭对应消息 */
export function destroyMessages(key?: string | number) {
  if (key === undefined) {
    activeList().forEach(item => closeMessage(item.id))
    return
  }
  const item = activeList().find(it => it.key === key)
  if (item) {
    closeMessage(item.id)
  }
}

/** 新增（或按 key 更新）一条消息，返回关闭时兑现的 Promise */
export function addMessage(options: MessageOptions): Promise<void> {
  const type = options.type ?? 'info'
  const merged: Omit<MessageInstance, 'id' | 'resolvers'> = {
    ...options,
    type,
    variant: options.variant ?? 'base',
    color: options.color ?? MESSAGE_TYPE_COLOR[type],
    duration: options.duration ?? messageState.duration,
    pauseOnHover: options.pauseOnHover ?? true,
  }

  return new Promise<void>((resolve) => {
    // 同 key 更新：替换内容并重置计时，原有 promise 与新 promise 都在最终关闭时兑现
    if (options.key !== undefined) {
      const existing = activeList().find(item => item.key === options.key)
      if (existing) {
        Object.assign(existing, merged)
        existing.resolvers.push(resolve)
        startTimer(existing)
        return
      }
    }

    if (messageState.maxCount > 0) {
      while (activeList().length >= messageState.maxCount) {
        closeMessage(activeList()[0]!.id)
      }
    }

    const item: MessageInstance = { ...merged, id: ++seed, resolvers: [resolve] }
    messageState.list.push(item)
    startTimer(item)
  })
}

/** 应用全局配置（getContainer 由 index.ts 处理） */
export function applyMessageConfig(config: Pick<MessageGlobalConfig, 'top' | 'duration' | 'maxCount' | 'rtl'>) {
  if (config.top !== undefined) {
    messageState.top = config.top
  }
  if (config.duration !== undefined) {
    messageState.duration = config.duration
  }
  if (config.maxCount !== undefined) {
    messageState.maxCount = config.maxCount
  }
  if (config.rtl !== undefined) {
    messageState.rtl = config.rtl
  }
}

/*
 * 视觉规格对齐 Web 端：单条消息 px 24rpx / 高 80rpx / 字号 28rpx / 圆角 ui-sm。
 * base 变体：gray-1 白底 + 投影，图标为语义色圆形底 + 白色符号。
 * filled / outlined / soft / subtle 配色对齐 reborn-button 的同名变体；
 * 消息是悬浮层，soft/subtle 用色相 1 阶实色打底（不透明，避免透出页面内容），outlined 垫 gray-1。
 * 与 Web 端的调色板差异：本端主色即 red 系（primary→red-1 打底）；没有独立的 secondary
 * 色阶，secondary/neutral 的浅底用 gray-2 顶替
 */
export const messageTheme = tv({
  slots: {
    wrapper: `
      pointer-events-none fixed left-0 right-0 z-[2100] flex flex-col
      items-center gap-[16rpx]
    `,
    // reborn-message 为外部定位用的标记类
    /* eslint-disable better-tailwindcss/no-unknown-classes */
    root: `
      reborn-message pointer-events-auto inline-flex h-[80rpx] max-w-[80vw]
      items-center gap-[16rpx] rounded-ui-sm px-[24rpx] text-28 leading-[1.5]
      shadow-[0_4rpx_24rpx_0_rgba(0,0,0,0.15)]
    `,
    /* eslint-enable better-tailwindcss/no-unknown-classes */
    iconWrapper: 'flex shrink-0 items-center justify-center',
    icon: 'shrink-0',
    content: 'truncate',
  },
  variants: {
    variant: {
      base: {
        root: 'bg-gray-1 text-gray-8',
        iconWrapper: 'size-[40rpx] rounded-full text-white',
        icon: 'size-[28rpx]',
      },
      filled: {
        root: 'text-white',
        icon: 'size-[32rpx]',
      },
      outlined: {
        root: 'border border-solid bg-gray-1',
        icon: 'size-[32rpx]',
      },
      soft: {
        icon: 'size-[32rpx]',
      },
      subtle: {
        root: 'border border-solid',
        icon: 'size-[32rpx]',
      },
    },
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
  },
  compoundVariants: [
    // base：图标圆底取语义色
    { variant: 'base', color: 'primary', class: { iconWrapper: 'bg-primary' } },
    { variant: 'base', color: 'secondary', class: { iconWrapper: `bg-secondary` } },
    { variant: 'base', color: 'success', class: { iconWrapper: 'bg-success' } },
    { variant: 'base', color: 'info', class: { iconWrapper: 'bg-info' } },
    { variant: 'base', color: 'warning', class: { iconWrapper: 'bg-warning' } },
    { variant: 'base', color: 'error', class: { iconWrapper: 'bg-error' } },
    { variant: 'base', color: 'neutral', class: { iconWrapper: 'bg-neutral' } },

    // filled：同 reborn-button 的 filled（语义色实底 + 白字）
    { variant: 'filled', color: 'primary', class: { root: 'bg-primary' } },
    { variant: 'filled', color: 'secondary', class: { root: 'bg-secondary' } },
    { variant: 'filled', color: 'success', class: { root: 'bg-success' } },
    { variant: 'filled', color: 'info', class: { root: 'bg-info' } },
    { variant: 'filled', color: 'warning', class: { root: 'bg-warning' } },
    { variant: 'filled', color: 'error', class: { root: 'bg-error' } },
    { variant: 'filled', color: 'neutral', class: { root: 'bg-neutral' } },

    // outlined：同 reborn-button 的 outlined（语义色边框 + 文字），底色垫 gray-1
    { variant: 'outlined', color: 'primary', class: { root: `
      border-primary text-primary
    ` } },
    { variant: 'outlined', color: 'secondary', class: { root: `
      border-secondary text-secondary
    ` } },
    { variant: 'outlined', color: 'success', class: { root: `
      border-success text-success
    ` } },
    { variant: 'outlined', color: 'info', class: { root: `border-info text-info` } },
    { variant: 'outlined', color: 'warning', class: { root: `
      border-warning text-warning
    ` } },
    { variant: 'outlined', color: 'error', class: { root: `
      border-error text-error
    ` } },
    { variant: 'outlined', color: 'neutral', class: { root: `
      border-neutral text-neutral
    ` } },

    // soft：同 reborn-button 的 soft，底色用色相 1 阶实色
    { variant: 'soft', color: 'primary', class: { root: `bg-red-1 text-primary` } },
    { variant: 'soft', color: 'secondary', class: { root: `
      bg-gray-2 text-secondary
    ` } },
    { variant: 'soft', color: 'success', class: { root: `
      bg-green-1 text-success
    ` } },
    { variant: 'soft', color: 'info', class: { root: 'bg-blue-1 text-info' } },
    { variant: 'soft', color: 'warning', class: { root: `
      bg-orange-1 text-warning
    ` } },
    { variant: 'soft', color: 'error', class: { root: 'bg-red-1 text-error' } },
    { variant: 'soft', color: 'neutral', class: { root: `bg-gray-2 text-neutral` } },

    // subtle：soft + 语义色边框
    { variant: 'subtle', color: 'primary', class: { root: `
      border-primary bg-red-1 text-primary
    ` } },
    { variant: 'subtle', color: 'secondary', class: { root: `
      border-secondary bg-gray-2 text-secondary
    ` } },
    { variant: 'subtle', color: 'success', class: { root: `
      border-success bg-green-1 text-success
    ` } },
    { variant: 'subtle', color: 'info', class: { root: `
      border-info bg-blue-1 text-info
    ` } },
    { variant: 'subtle', color: 'warning', class: { root: `
      border-warning bg-orange-1 text-warning
    ` } },
    { variant: 'subtle', color: 'error', class: { root: `
      border-error bg-red-1 text-error
    ` } },
    { variant: 'subtle', color: 'neutral', class: { root: `
      border-neutral bg-gray-2 text-neutral
    ` } },
  ],
  defaultVariants: {
    variant: 'base' as MessageVariant,
    color: 'info' as MessageColor,
  },
})
