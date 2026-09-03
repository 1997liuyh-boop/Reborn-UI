import type { CSSProperties, VNode } from 'vue';
import { reactive } from 'vue';
import { tv } from '~/lib/tv';

/** 消息类型（level） */
export const messageTypes = ['info', 'success', 'warning', 'error', 'loading'] as const;
export type MessageType = (typeof messageTypes)[number];

/** 视觉变体：base 为白底浮层，其余配色对齐 reborn-button 的同名变体 */
export const messageVariants = ['base', 'filled', 'outlined', 'soft', 'subtle'] as const;
export type MessageVariant = (typeof messageVariants)[number];

/** 配色（与 reborn-button 同一套语义色） */
export const messageColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const;
export type MessageColor = (typeof messageColors)[number];

/** 语义化结构键，供 classNames / styles 按节点覆盖 */
export type MessageSemanticDOM = 'root' | 'icon' | 'content';

/** 自定义节点：支持字符串（content 为文本 / icon 为图标名）、VNode 或返回 VNode 的函数 */
export type MessageNode = string | VNode | (() => VNode);

export interface MessageOptions {
  /** 提示内容 */
  content?: MessageNode;
  /** 自动关闭的延时，单位秒；设为 0 时不自动关闭 */
  duration?: number;
  /** 消息类型，决定默认图标与配色 */
  type?: MessageType;
  /** 视觉变体，默认 base（白底浮层 + 圆形色底图标） */
  variant?: MessageVariant;
  /** 配色覆盖；缺省时由 type 映射（loading → primary） */
  color?: MessageColor;
  /** 自定义图标：图标名字符串或 VNode */
  icon?: MessageNode;
  /** 悬停时是否暂停计时器 */
  pauseOnHover?: boolean;
  /** 当前提示的唯一标志：同 key 再次调用会更新内容并重置计时 */
  key?: string | number;
  /** 自定义根节点 class */
  className?: string;
  /** 自定义根节点行内样式 */
  style?: CSSProperties;
  /** 按语义化结构覆盖 class，支持对象或函数形式 */
  classNames?:
    | Partial<Record<MessageSemanticDOM, string>>
    | ((info: { props: MessageOptions }) => Partial<Record<MessageSemanticDOM, string>>);
  /** 按语义化结构覆盖行内样式，支持对象或函数形式 */
  styles?:
    | Partial<Record<MessageSemanticDOM, CSSProperties>>
    | ((info: { props: MessageOptions }) => Partial<Record<MessageSemanticDOM, CSSProperties>>);
  /** 点击消息时触发 */
  onClick?: (e: MouseEvent) => void;
  /** 关闭时触发 */
  onClose?: () => void;
}

/** 全局配置项 */
export interface MessageGlobalConfig {
  /** 消息距离顶部的位置 */
  top?: string | number;
  /** 默认自动关闭延时，单位秒 */
  duration?: number;
  /** 最大显示数，超过限制时最早的消息会被自动关闭；0 表示不限制 */
  maxCount?: number;
  /** 是否开启 RTL 模式 */
  rtl?: boolean;
  /** 配置渲染节点的输出位置（仍为全屏展示） */
  getContainer?: () => HTMLElement;
}

/** 渲染队列里的消息实例 */
export interface MessageInstance extends MessageOptions {
  id: number;
  type: MessageType;
  variant: MessageVariant;
  color: MessageColor;
  duration: number;
  pauseOnHover: boolean;
  /** 关闭时依次调用的 promise resolver（同 key 更新会累积多个） */
  resolvers: Array<() => void>;
}

/** type → 默认配色（loading 视作品牌主色） */
export const MESSAGE_TYPE_COLOR: Record<MessageType, MessageColor> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
  loading: 'primary',
};

/** type → 默认图标名 */
export const MESSAGE_TYPE_ICON: Record<MessageType, string> = {
  info: 'lucide:info',
  success: 'lucide:check',
  warning: 'lucide:triangle-alert',
  error: 'lucide:x',
  loading: 'lucide:loader-2',
};

/**
 * 全局单例状态：容器组件与命令式 API 共用。
 * 放在 config 里是为了避免 index.ts（createVNode 容器）与容器组件互相引用。
 */
export const messageState = reactive({
  list: [] as MessageInstance[],
  top: 8 as string | number,
  duration: 3,
  maxCount: 0,
  rtl: false,
});

let seed = 0;

/** 计时器状态：支持 pauseOnHover 的暂停/续走 */
interface TimerState {
  timer: ReturnType<typeof setTimeout> | null;
  startAt: number;
  remaining: number;
}
const timers = new Map<number, TimerState>();

function startTimer(item: MessageInstance) {
  stopTimer(item.id);
  if (item.duration <= 0) return;
  const state: TimerState = {
    remaining: item.duration * 1000,
    startAt: Date.now(),
    timer: null,
  };
  state.timer = setTimeout(() => closeMessage(item.id), state.remaining);
  timers.set(item.id, state);
}

function stopTimer(id: number) {
  const state = timers.get(id);
  if (state?.timer) clearTimeout(state.timer);
  timers.delete(id);
}

/** 悬停暂停：记录剩余时长 */
export function pauseMessage(id: number) {
  const state = timers.get(id);
  if (!state?.timer) return;
  clearTimeout(state.timer);
  state.timer = null;
  state.remaining -= Date.now() - state.startAt;
}

/** 移出恢复：按剩余时长续走 */
export function resumeMessage(id: number) {
  const state = timers.get(id);
  if (!state || state.timer) return;
  if (state.remaining <= 0) {
    closeMessage(id);
    return;
  }
  state.startAt = Date.now();
  state.timer = setTimeout(() => closeMessage(id), state.remaining);
}

/** 关闭单条消息：触发 onClose 与 promise resolve */
export function closeMessage(id: number) {
  const index = messageState.list.findIndex((item) => item.id === id);
  if (index < 0) return;
  const [item] = messageState.list.splice(index, 1);
  stopTimer(id);
  item!.onClose?.();
  item!.resolvers.forEach((resolve) => resolve());
}

/** 全局销毁：不传 key 清空全部，传 key 关闭对应消息 */
export function destroyMessages(key?: string | number) {
  if (key === undefined) {
    [...messageState.list].forEach((item) => closeMessage(item.id));
    return;
  }
  const item = messageState.list.find(it => it.key === key);
  if (item) closeMessage(item.id);
}

/** 新增（或按 key 更新）一条消息，返回关闭时兑现的 Promise */
export function addMessage(options: MessageOptions): Promise<void> {
  const type = options.type ?? 'info';
  const merged: Omit<MessageInstance, 'id' | 'resolvers'> = {
    ...options,
    type,
    variant: options.variant ?? 'base',
    color: options.color ?? MESSAGE_TYPE_COLOR[type],
    duration: options.duration ?? messageState.duration,
    pauseOnHover: options.pauseOnHover ?? true,
  };

  return new Promise<void>((resolve) => {
    // 同 key 更新：替换内容并重置计时，原有 promise 与新 promise 都在最终关闭时兑现
    if (options.key !== undefined) {
      const existing = messageState.list.find(item => item.key === options.key);
      if (existing) {
        Object.assign(existing, merged);
        existing.resolvers.push(resolve);
        startTimer(existing);
        return;
      }
    }

    if (messageState.maxCount > 0) {
      while (messageState.list.length >= messageState.maxCount) {
        closeMessage(messageState.list[0]!.id);
      }
    }

    const item: MessageInstance = { ...merged, id: ++seed, resolvers: [resolve] };
    messageState.list.push(item);
    startTimer(item);
  });
}

/** 应用全局配置（getContainer 由 index.ts 处理） */
export function applyMessageConfig(config: Pick<MessageGlobalConfig, 'top' | 'duration' | 'maxCount' | 'rtl'>) {
  if (config.top !== undefined) messageState.top = config.top;
  if (config.duration !== undefined) messageState.duration = config.duration;
  if (config.maxCount !== undefined) messageState.maxCount = config.maxCount;
  if (config.rtl !== undefined) messageState.rtl = config.rtl;
}

/*
 * 视觉规格：单条消息 px-12px / 高 40px / 字号 14px / 圆角 8px。
 * base 变体：gray-1 白底 + 0 2px 12px rgba(0,0,0,.15) 投影，图标为语义色圆形底 + 白色符号。
 * filled / outlined / soft / subtle 配色对齐 reborn-button 的同名变体（不含 circle）；
 * 消息是悬浮层，soft/subtle 的半透明底（bg-{c}/10）会透出页面内容，
 * 故用同色相的 1 阶实色填充令牌（tag 填充色）等效替代，outlined 的透明底同理垫 gray-1。
 */
export const messageTheme = tv({
  slots: {
    wrapper: 'fixed inset-x-0 z-[2100] flex flex-col items-center gap-2 pointer-events-none',
    root: 'reborn-message pointer-events-auto inline-flex max-w-[80vw] items-center gap-2 h-10 px-3 text-base leading-[1.5] rounded-ui-sm shadow-[0_2px_12px_0_rgba(0,0,0,0.15)]',
    iconWrapper: 'flex items-center justify-center shrink-0',
    icon: 'shrink-0',
    content: 'truncate',
  },
  variants: {
    variant: {
      base: {
        root: 'bg-gray-1 text-gray-9',
        iconWrapper: 'size-5 rounded-full text-white',
        icon: 'size-3.5',
      },
      filled: {
        root: 'text-white',
        icon: 'size-4',
      },
      outlined: {
        root: 'bg-gray-1 border border-solid',
        icon: 'size-4',
      },
      soft: {
        icon: 'size-4',
      },
      subtle: {
        root: 'border border-solid',
        icon: 'size-4',
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
    // base：图标圆底取语义色（即各色相的 6 阶默认色）
    { variant: 'base', color: 'primary', class: { iconWrapper: 'bg-primary' } },
    { variant: 'base', color: 'secondary', class: { iconWrapper: 'bg-secondary' } },
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
    { variant: 'outlined', color: 'primary', class: { root: 'border-primary text-primary' } },
    { variant: 'outlined', color: 'secondary', class: { root: 'border-secondary text-secondary' } },
    { variant: 'outlined', color: 'success', class: { root: 'border-success text-success' } },
    { variant: 'outlined', color: 'info', class: { root: 'border-info text-info' } },
    { variant: 'outlined', color: 'warning', class: { root: 'border-warning text-warning' } },
    { variant: 'outlined', color: 'error', class: { root: 'border-error text-error' } },
    { variant: 'outlined', color: 'neutral', class: { root: 'border-neutral text-neutral' } },

    // soft：同 reborn-button 的 soft，底色用 1 阶实色填充令牌
    { variant: 'soft', color: 'primary', class: { root: 'bg-brand-1 text-primary' } },
    { variant: 'soft', color: 'secondary', class: { root: 'bg-secondary-1 text-secondary' } },
    { variant: 'soft', color: 'success', class: { root: 'bg-green-1 text-success' } },
    { variant: 'soft', color: 'info', class: { root: 'bg-blue-1 text-info' } },
    { variant: 'soft', color: 'warning', class: { root: 'bg-orange-1 text-warning' } },
    { variant: 'soft', color: 'error', class: { root: 'bg-red-1 text-error' } },
    { variant: 'soft', color: 'neutral', class: { root: 'bg-gray-2 text-neutral' } },

    // subtle：soft + 语义色边框
    { variant: 'subtle', color: 'primary', class: { root: 'bg-brand-1 border-primary text-primary' } },
    { variant: 'subtle', color: 'secondary', class: { root: 'bg-secondary-1 border-secondary text-secondary' } },
    { variant: 'subtle', color: 'success', class: { root: 'bg-green-1 border-success text-success' } },
    { variant: 'subtle', color: 'info', class: { root: 'bg-blue-1 border-info text-info' } },
    { variant: 'subtle', color: 'warning', class: { root: 'bg-orange-1 border-warning text-warning' } },
    { variant: 'subtle', color: 'error', class: { root: 'bg-red-1 border-error text-error' } },
    { variant: 'subtle', color: 'neutral', class: { root: 'bg-gray-2 border-neutral text-neutral' } },
  ],
  defaultVariants: {
    variant: 'base' as MessageVariant,
    color: 'info' as MessageColor,
  },
});
