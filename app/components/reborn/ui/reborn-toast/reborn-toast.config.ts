import type { CSSProperties, VNode } from 'vue';
import type { Placement } from '~/lib/placement';
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

/**
 * 出现位置：与浮层组件的 placement 同一套连字符写法，只取顶部 / 底部两侧（居中、start、end），
 * 每个位置各自维护一条堆叠队列；start / end 是逻辑方向，开启 rtl 后左右互换
 */
export const messagePlacements = ['top', 'top-start', 'top-end', 'bottom', 'bottom-start', 'bottom-end'] as const satisfies readonly Placement[];
export type MessagePlacement = (typeof messagePlacements)[number];

/** 语义化结构键，供 classNames / styles 按节点覆盖 */
export type MessageSemanticDOM = 'root' | 'icon' | 'content' | 'close' | 'badge';

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
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 自定义关闭图标：图标名字符串或 VNode，缺省 lucide:x */
  closeIcon?: MessageNode;
  /** 是否将字符串 content 作为 HTML 片段渲染（务必只传可信内容，防止 XSS） */
  dangerouslyUseHTMLString?: boolean;
  /** 合并内容相同的消息：重复触发时不新增，改为在原消息右上角累加次数徽标并重置计时 */
  grouping?: boolean;
  /** 消息出现的位置 */
  placement?: MessagePlacement;
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
  showClose: boolean;
  placement: MessagePlacement;
  /** 重复次数：grouping 合并时累加，大于 1 时显示徽标 */
  repeatNum: number;
  /** 关闭时依次调用的 promise resolver（同 key 更新、grouping 合并都会累积多个） */
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

/**
 * 查找可合并的消息：双方都开启 grouping、位置相同且 content 为相同字符串。
 * VNode 内容无法可靠比较是否相同，不参与合并
 */
function findGroupTarget(options: MessageOptions, placement: MessagePlacement) {
  if (!options.grouping || typeof options.content !== 'string') return undefined;
  return messageState.list.find(
    item => item.grouping && item.placement === placement && item.content === options.content,
  );
}

/** 新增（或按 key 更新、按 grouping 合并）一条消息，返回关闭时兑现的 Promise */
export function addMessage(options: MessageOptions): Promise<void> {
  const type = options.type ?? 'info';
  const merged: Omit<MessageInstance, 'id' | 'resolvers' | 'repeatNum'> = {
    ...options,
    type,
    variant: options.variant ?? 'base',
    color: options.color ?? MESSAGE_TYPE_COLOR[type],
    duration: options.duration ?? messageState.duration,
    pauseOnHover: options.pauseOnHover ?? true,
    showClose: options.showClose ?? false,
    placement: options.placement ?? 'top',
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

    // grouping 合并：沿用原消息节点，次数 +1 并以最新一次调用的配置刷新（类型等可能变化）
    const group = findGroupTarget(options, merged.placement);
    if (group) {
      Object.assign(group, merged, { repeatNum: group.repeatNum + 1 });
      group.resolvers.push(resolve);
      startTimer(group);
      return;
    }

    if (messageState.maxCount > 0) {
      while (messageState.list.length >= messageState.maxCount) {
        closeMessage(messageState.list[0]!.id);
      }
    }

    const item: MessageInstance = { ...merged, id: ++seed, repeatNum: 1, resolvers: [resolve] };
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
 * 关闭图标 14px、透明度 65%，悬停恢复不透明，颜色继承当前文字色，五种变体通用；
 * 重复次数徽标 16px 高、12px 字号，压在消息右上角，底色取语义色并带 2px gray-1 描边与消息分隔。
 */
export const messageTheme = tv({
  slots: {
    /** 定位容器：纵向贴边距离由行内样式给出（见容器组件的 edgeStyle），横向位置随 placement 变化，贴边与对齐都用逻辑方向以便 rtl 镜像 */
    wrapper: 'fixed z-[2100] flex gap-2 pointer-events-none',
    root: 'reborn-message pointer-events-auto relative inline-flex max-w-[80vw] items-center gap-2 h-10 px-3 text-base rounded-lg shadow-[0_2px_12px_0_rgba(0,0,0,0.15)]',
    iconWrapper: 'flex items-center justify-center shrink-0',
    icon: 'shrink-0',
    content: 'truncate',
    close:
      'inline-flex size-3.5 shrink-0 cursor-pointer items-center justify-center opacity-65 transition-opacity hover:opacity-100',
    badge:
      'pointer-events-none absolute -top-2 -right-2 h-4 min-w-4 rounded-full px-1 text-center text-sm leading-4 font-medium text-white ring-2 ring-gray-1',
  },
  variants: {
    placement: {
      'top': { wrapper: 'inset-x-0 flex-col items-center' },
      'top-start': { wrapper: 'start-4 flex-col items-start' },
      'top-end': { wrapper: 'end-4 flex-col items-end' },
      // 底部方位倒序堆叠：最早的消息贴底，新消息依次往上长
      'bottom': { wrapper: 'inset-x-0 flex-col-reverse items-center' },
      'bottom-start': { wrapper: 'start-4 flex-col-reverse items-start' },
      'bottom-end': { wrapper: 'end-4 flex-col-reverse items-end' },
    },
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
    // 重复次数徽标统一取语义色实底
    color: {
      primary: { badge: 'bg-primary' },
      secondary: { badge: 'bg-secondary' },
      success: { badge: 'bg-success' },
      info: { badge: 'bg-info' },
      warning: { badge: 'bg-warning' },
      error: { badge: 'bg-error' },
      neutral: { badge: 'bg-neutral' },
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
    placement: 'top' as MessagePlacement,
    variant: 'base' as MessageVariant,
    color: 'info' as MessageColor,
  },
});
