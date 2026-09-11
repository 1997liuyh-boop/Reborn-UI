import type { CSSProperties, VNode } from 'vue';
import { reactive } from 'vue';
import { tv } from '~/lib/tv';

/** 通知类型：决定默认图标与语义配色；空串表示不显示图标、不着色 */
export const notificationTypes = ['success', 'warning', 'info', 'error'] as const;
export type NotificationType = (typeof notificationTypes)[number];

/** 弹出位置：屏幕四角 */
export const notificationPositions = ['top-right', 'top-left', 'bottom-right', 'bottom-left'] as const;
export type NotificationPosition = (typeof notificationPositions)[number];

/** 飘带位置：贴面板左侧或右侧内边的竖条；true 等价于 'left' */
export type NotificationRibbon = boolean | 'left' | 'right';

/** 自定义节点：字符串（文本 / 图标名）、VNode 或返回 VNode 的函数 */
export type NotificationNode = string | VNode | (() => VNode);

/**
 * 四角贴边留白（px）：纵向（top / bottom）与横向（left / right）共用同一个值，
 * 保证两个方向的视觉间距永远一致
 */
export const NOTIFICATION_EDGE_GAP = 16;

/** 语义化结构键，供 ui 按节点覆盖 class */
export type NotificationSemanticDOM =
  | 'wrapper'
  | 'root'
  | 'ribbon'
  | 'header'
  | 'iconWrapper'
  | 'icon'
  | 'headerContent'
  | 'title'
  | 'message'
  | 'close'
  | 'body'
  | 'footer'
  | 'progressTrack'
  | 'progressFill'
  | 'progressStripes';

/**
 * 倒计时进度条选项：字段名对齐 RebornProgress，
 * percentage / type / duration / indeterminate / width 由通知自身接管，故不开放
 */
export interface NotificationProgressOptions {
  /** 进度条填充色，缺省跟随通知类型的语义色（无类型时为品牌主色） */
  strokeColor?: string;
  /** 轨道高度，数字视为 px */
  size?: number | string;
  /** 条纹装饰层 */
  striped?: boolean;
  /** 条纹流动，需同时开启 striped */
  stripedFlow?: boolean;
  /** 追加到填充层的自定义 class */
  class?: string;
}

export interface NotificationOptions {
  /** 标题 */
  title?: string;
  /** 通知栏正文内容 */
  message?: NotificationNode;
  /** 是否将 message 属性作为 HTML 片段处理 */
  dangerouslyUseHTMLString?: boolean;
  /** 通知的类型 */
  type?: NotificationType | '';
  /** 自定义图标。若设置了 type，则 icon 会被覆盖 */
  icon?: NotificationNode;
  /** 自定义类名（挂在通知面板根节点） */
  customClass?: string;
  /** 显示时间，单位为毫秒。值为 0 则不会自动关闭 */
  duration?: number;
  /** 自定义弹出位置 */
  position?: NotificationPosition;
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 关闭时的回调函数 */
  onClose?: () => void;
  /** 点击 Notification 时的回调函数 */
  onClick?: (e: MouseEvent) => void;
  /** 相对屏幕锚定边（顶部或底部）的偏移量；同一时刻所有实例共用同一偏移 */
  offset?: number;
  /** 设置 notification 的根元素，默认为 document.body；同一时刻所有实例共用同一容器 */
  appendTo?: string | HTMLElement;
  /** 初始 zIndex，0 表示使用内置层级 */
  zIndex?: number;
  /** 自定义关闭图标 */
  closeIcon?: NotificationNode;
  /** 进度条指示自动关闭倒计时，传对象可自定义样式 */
  progress?: boolean | NotificationProgressOptions;
  /** 悬停于通知上时是否暂停计时器 */
  pauseOnHover?: boolean;
  /** 侧边飘带：3px 竖条贴左（true / 'left'）或贴右（'right'），颜色取 type 的语义色 */
  ribbon?: NotificationRibbon;
  /** 底部操作区内容（本库扩展，与正文间隔 20px） */
  footer?: NotificationNode;
  /** 唯一标志：同 key 再次调用会原位更新内容并重置计时 */
  key?: string | number;
  /** 面板根节点行内样式 */
  style?: CSSProperties;
  /** 按语义化结构覆盖 class */
  ui?: Partial<Record<NotificationSemanticDOM, string>>;
}

/** 渲染队列里的通知实例 */
export interface NotificationInstance extends NotificationOptions {
  id: number;
  type: NotificationType | '';
  position: NotificationPosition;
  duration: number;
  showClose: boolean;
  pauseOnHover: boolean;
  /** 计时器是否处于暂停态（进度条动画据此暂停） */
  paused: boolean;
}

/** 命令式调用返回的实例句柄 */
export interface NotificationHandle {
  /** 关闭当前的 Notification */
  close: () => void;
}

/** type → 默认图标名 */
export const NOTIFICATION_TYPE_ICON: Record<NotificationType, string> = {
  success: 'lucide:circle-check',
  warning: 'lucide:circle-alert',
  info: 'lucide:info',
  error: 'lucide:circle-x',
};

/**
 * 全局单例状态：容器组件与命令式 API 共用。
 * 放在 config 里是为了避免 index.ts（createVNode 容器）与容器组件互相引用。
 */
export const notificationState = reactive({
  list: [] as NotificationInstance[],
  /** 相对锚定边的额外偏移（px），由最近一次带 offset 的调用写入 */
  offset: 0,
  /** 起始层级，0 表示走主题里的内置层级 */
  zIndex: 0,
  /**
   * 容器是否直接挂在 body 上（即贴的是视口四边）。
   * 只有这种情况才需要扣除滚动条宽度；appendTo 指到自定义容器时贴的是该容器的边，不做补偿。
   */
  viewportAnchored: true,
});

let seed = 0;

/** 计时器状态：支持 pauseOnHover 的暂停 / 续走 */
interface TimerState {
  timer: ReturnType<typeof setTimeout> | null;
  startAt: number;
  remaining: number;
}
const timers = new Map<number, TimerState>();

function startTimer(item: NotificationInstance) {
  stopTimer(item.id);
  item.paused = false;
  // duration 单位为毫秒，0 或负值表示常驻不自动关闭
  if (item.duration <= 0) return;
  const state: TimerState = {
    remaining: item.duration,
    startAt: Date.now(),
    timer: null,
  };
  state.timer = setTimeout(() => closeNotification(item.id), state.remaining);
  timers.set(item.id, state);
}

function stopTimer(id: number) {
  const state = timers.get(id);
  if (state?.timer) clearTimeout(state.timer);
  timers.delete(id);
}

/** 悬停暂停：记录剩余时长并冻结进度条动画 */
export function pauseNotification(id: number) {
  const item = notificationState.list.find(it => it.id === id);
  const state = timers.get(id);
  if (!item || !state?.timer) return;
  clearTimeout(state.timer);
  state.timer = null;
  state.remaining -= Date.now() - state.startAt;
  item.paused = true;
}

/** 移出恢复：按剩余时长续走 */
export function resumeNotification(id: number) {
  const item = notificationState.list.find(it => it.id === id);
  const state = timers.get(id);
  if (!item || !state || state.timer) return;
  item.paused = false;
  if (state.remaining <= 0) {
    closeNotification(id);
    return;
  }
  state.startAt = Date.now();
  state.timer = setTimeout(() => closeNotification(id), state.remaining);
}

/** 关闭单条通知：触发 onClose 回调 */
export function closeNotification(id: number) {
  const index = notificationState.list.findIndex(item => item.id === id);
  if (index < 0) return;
  const [item] = notificationState.list.splice(index, 1);
  stopTimer(id);
  item!.onClose?.();
}

/** 全局销毁：不传 key 清空全部，传 key 关闭对应通知 */
export function destroyNotifications(key?: string | number) {
  if (key === undefined) {
    [...notificationState.list].forEach(item => closeNotification(item.id));
    return;
  }
  const item = notificationState.list.find(it => it.key === key);
  if (item) closeNotification(item.id);
}

/** 新增（或按 key 原位更新）一条通知，返回可手动关闭的实例句柄 */
export function addNotification(options: NotificationOptions): NotificationHandle {
  // offset / zIndex 是容器级设置，由最近一次显式传值的调用统一写入
  if (options.offset !== undefined) notificationState.offset = options.offset;
  if (options.zIndex !== undefined) notificationState.zIndex = options.zIndex;

  const merged: Omit<NotificationInstance, 'id' | 'paused'> = {
    ...options,
    type: options.type ?? '',
    position: options.position ?? 'top-right',
    duration: options.duration ?? 4500,
    showClose: options.showClose ?? true,
    pauseOnHover: options.pauseOnHover ?? true,
  };

  // 同 key 更新：替换内容并重置计时，句柄仍指向同一条通知
  if (options.key !== undefined) {
    const existing = notificationState.list.find(item => item.key === options.key);
    if (existing) {
      Object.assign(existing, merged);
      startTimer(existing);
      return { close: () => closeNotification(existing.id) };
    }
  }

  const item: NotificationInstance = { ...merged, id: ++seed, paused: false };
  notificationState.list.push(item);
  startTimer(item);
  return { close: () => closeNotification(item.id) };
}

/*
 * 视觉规格：面板内边距 py-20px / px-24px，header / default / footer 三段间隔 20px，
 * 标题与正文间隔 8px——与 RebornDialog 面板令牌完全一致。
 * 文字走 typography.css 的字号阶梯（行高 = 字号 + 8px）：
 * 标题 text-lg（16px/24px）/ 500 / gray-10，正文 text-base（14px/22px）/ gray-8；
 * 提示图标 24px，关闭图标 18px。
 * 通知是悬浮层，底色必须用不透明的 gray-1，否则会透出页面内容。
 */
export const notificationTheme = tv({
  slots: {
    /**
     * 定位容器：贴屏幕四角之一，纵向排列；容器不拦截指针事件，交由面板接管。
     * 四个方向的贴边值都由行内样式给出（见容器组件的 wrapperStyle），这里不写 left / right / top / bottom
     */
    wrapper: 'fixed flex w-[360px] max-w-[calc(100vw-32px)] flex-col gap-[16px] pointer-events-none',
    /** 通知面板：三段结构由 gap-[20px] 分隔 */
    root:
      'reborn-notification pointer-events-auto relative flex w-full flex-col gap-[20px] overflow-hidden rounded-ui-sm border border-black/5 bg-gray-1 py-[20px] px-[24px] text-gray-9 shadow-[0_12px_32px_rgba(15,23,42,0.16)]',
    /** 侧边飘带：3px 竖条通栏，压在面板内边距上，不挤占内容宽度 */
    ribbon: 'pointer-events-none absolute inset-y-0 w-[3px]',
    /** 头部：图标 / 文字区 / 关闭图标三列，顶部对齐，图标与文字间距 12px */
    header: 'flex items-start gap-[12px]',
    iconWrapper: 'flex shrink-0 items-center justify-center',
    /** 提示图标：固定 24px */
    icon: 'size-[24px]',
    /** 头部文字区：标题与正文之间间隔 8px */
    headerContent: 'flex min-w-0 flex-1 flex-col gap-[8px]',
    /** 标题：text-lg 令牌（16px/24px）/ 500 字重 / gray-10（令牌语义为「title 标题」） */
    title: 'text-lg font-medium text-gray-10',
    /** 正文：text-base 令牌（14px/22px）/ gray-8（令牌语义为「secondary 辅助文字」），长单词强制换行 */
    message: 'text-base break-words text-gray-8',
    /** 关闭图标：固定 18px，不随父级字号浮动 */
    close:
      'inline-flex size-[18px] shrink-0 cursor-pointer items-center justify-center text-gray-5 transition-colors hover:text-gray-7',
    /** 独立正文段（message 为 VNode 时启用）：与 message 同为 text-base 令牌 */
    body: 'text-base text-gray-8',
    /** 底部操作区：按钮靠右对齐 */
    footer: 'flex items-center justify-end gap-3',
    /** 倒计时进度条轨道：贴面板底边，不占据内容高度 */
    progressTrack: 'pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden bg-gray-2',
    /**
     * 填充层：靠 scaleX 从 1 收到 0，动画时长即 duration。
     * 必须是块级盒（行内元素不接受宽高与 transform，会导致进度条看不见）
     */
    progressFill: 'block h-full w-full origin-left',
    /** 条纹装饰层 */
    progressStripes:
      'pointer-events-none absolute inset-0 bg-[length:1.25em_1.25em] bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)]',
  },
  variants: {
    /** 弹出位置：左右决定对齐与入场方向，上下决定堆叠生长方向（贴边值走行内样式） */
    position: {
      'top-right': { wrapper: 'items-end' },
      'top-left': { wrapper: 'items-start' },
      // 底部两角改为倒序排列，新通知始终贴着底边、旧通知向上顶
      'bottom-right': { wrapper: 'flex-col-reverse items-end' },
      'bottom-left': { wrapper: 'flex-col-reverse items-start' },
    },
    /** 类型：只给图标、飘带与进度条着色（语义色即各色阶的 -6），面板底色保持中性 */
    type: {
      '': { progressFill: 'bg-primary', ribbon: 'bg-primary' },
      success: { icon: 'text-success', progressFill: 'bg-success', ribbon: 'bg-success' },
      warning: { icon: 'text-warning', progressFill: 'bg-warning', ribbon: 'bg-warning' },
      info: { icon: 'text-info', progressFill: 'bg-info', ribbon: 'bg-info' },
      error: { icon: 'text-error', progressFill: 'bg-error', ribbon: 'bg-error' },
    },
    /** 侧边飘带：默认不显示，开启后贴左或贴右内边 */
    ribbon: {
      none: { ribbon: 'hidden' },
      left: { ribbon: 'left-0' },
      right: { ribbon: 'right-0' },
    },
    /** 绑定了 onClick 时整块面板可点击 */
    clickable: {
      true: { root: 'cursor-pointer' },
      false: {},
    },
    /** 有进度条时给面板底部留出轨道高度，避免压住内容 */
    withProgress: {
      true: { root: 'pb-[20px]' },
      false: {},
    },
    /** 条纹流动 */
    stripedFlow: {
      true: {
        progressStripes:
          'animate-[reborn-notification-stripes_1s_linear_infinite] motion-reduce:animate-none',
      },
      false: {},
    },
  },
  defaultVariants: {
    position: 'top-right' as NotificationPosition,
    type: '' as NotificationType | '',
    ribbon: 'none' as 'none' | 'left' | 'right',
    clickable: false,
    withProgress: false,
    stripedFlow: false,
  },
});
