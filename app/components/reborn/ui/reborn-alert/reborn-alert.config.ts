import { tv } from '~/lib/tv';

/** 警告提示的类型（决定默认图标与配色） */
export const alertTypes = ['info', 'success', 'warning', 'error', 'normal'] as const;
export type AlertType = (typeof alertTypes)[number];

/** 视觉变体：对齐 reborn-button 的同名变体（不含 circle） */
export const alertVariants = ['filled', 'outlined', 'soft', 'subtle', 'text', 'round'] as const;
export type AlertVariant = (typeof alertVariants)[number];

/** 配色（与 reborn-button 同一套语义色） */
export const alertColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const;
export type AlertColor = (typeof alertColors)[number];

/** 轮播方向：vertical 垂直切换（rows > 1 时多行逐行滚动），horizontal 水平跑马灯 */
export const alertDirections = ['vertical', 'horizontal'] as const;
export type AlertDirection = (typeof alertDirections)[number];

/** type → 默认配色（normal 视作中性色） */
export const ALERT_TYPE_COLOR: Record<AlertType, AlertColor> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
  normal: 'neutral',
};

/** type → 默认图标名（normal 用于公告/通知场景） */
export const ALERT_TYPE_ICON: Record<AlertType, string> = {
  info: 'lucide:info',
  success: 'lucide:circle-check',
  warning: 'lucide:circle-alert',
  error: 'lucide:circle-x',
  normal: 'lucide:megaphone',
};

export const alertTheme = tv({
  slots: {
    root: 'reborn-alert relative flex w-full items-start gap-2 px-3 py-2 text-sm font-normal leading-[1.5] rounded-ui-sm',
    icon: 'flex h-[1.5em] shrink-0 items-center',
    content: 'flex min-w-0 flex-1 flex-col gap-2',
    title: 'font-medium',
    description: 'min-w-0',
    action: 'flex min-h-[1.5em] shrink-0 items-center',
    closeButton: 'flex size-[1.5em] shrink-0 items-center justify-center rounded-full cursor-pointer transition-colors hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none',
    closeIcon: 'size-3.5 shrink-0',
    // 位于内容列中，不能带 flex-1：不定高列容器里 basis 0% 会退化为按内容计算，顶掉多行模式的显式高度
    carouselWrapper: 'relative min-w-0 overflow-hidden',
    carouselItem: 'truncate',
    // 多行垂直滚动的轨道：整体 translateY 逐行上移，回卷时由组件临时关闭过渡
    carouselList: 'flex flex-col transition-transform duration-300 ease-out',
    // 水平跑马灯：不换行的整行文本，由组件测宽后驱动 CSS 动画
    marqueeWrapper: 'relative min-w-0 overflow-hidden',
    marquee: 'inline-block whitespace-nowrap will-change-transform',
    marqueeItem: 'mr-6 last:mr-0',
  },
  variants: {
    variant: {
      filled: '',
      outlined: '',
      soft: '',
      subtle: '',
      // 文字提示：无背景/边框，仅保留语义色文字
      text: '',
      // 胶囊提示：形状类，着色规则与 filled 一致（见 compoundVariants）
      round: { root: '!rounded-full' },
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
    /** 顶部公告模式：去除边框和圆角，铺满容器宽度 */
    banner: {
      true: { root: '!rounded-none !border-none' },
    },
    /** 内容居中显示 */
    center: {
      true: {
        root: 'justify-center text-center',
        content: 'flex-none items-center',
      },
    },
  },
  compoundVariants: [
    // Filled：同 reborn-button 的 filled（语义色实底 + 白字）
    { variant: 'filled', color: 'primary', class: { root: 'bg-primary text-white' } },
    { variant: 'filled', color: 'secondary', class: { root: 'bg-secondary text-white' } },
    { variant: 'filled', color: 'success', class: { root: 'bg-success text-white' } },
    { variant: 'filled', color: 'info', class: { root: 'bg-info text-white' } },
    { variant: 'filled', color: 'warning', class: { root: 'bg-warning text-white' } },
    { variant: 'filled', color: 'error', class: { root: 'bg-error text-white' } },
    { variant: 'filled', color: 'neutral', class: { root: 'bg-neutral text-white' } },

    // Round：胶囊形状，着色规则与 filled 一致
    { variant: 'round', color: 'primary', class: { root: 'bg-primary text-white' } },
    { variant: 'round', color: 'secondary', class: { root: 'bg-secondary text-white' } },
    { variant: 'round', color: 'success', class: { root: 'bg-success text-white' } },
    { variant: 'round', color: 'info', class: { root: 'bg-info text-white' } },
    { variant: 'round', color: 'warning', class: { root: 'bg-warning text-white' } },
    { variant: 'round', color: 'error', class: { root: 'bg-error text-white' } },
    { variant: 'round', color: 'neutral', class: { root: 'bg-neutral text-white' } },

    // Outlined：同 reborn-button 的 outlined（语义色边框 + 文字，透明底）
    { variant: 'outlined', color: 'primary', class: { root: 'bg-transparent border border-primary text-primary' } },
    { variant: 'outlined', color: 'secondary', class: { root: 'bg-transparent border border-secondary text-secondary' } },
    { variant: 'outlined', color: 'success', class: { root: 'bg-transparent border border-success text-success' } },
    { variant: 'outlined', color: 'info', class: { root: 'bg-transparent border border-info text-info' } },
    { variant: 'outlined', color: 'warning', class: { root: 'bg-transparent border border-warning text-warning' } },
    { variant: 'outlined', color: 'error', class: { root: 'bg-transparent border border-error text-error' } },
    { variant: 'outlined', color: 'neutral', class: { root: 'bg-transparent border border-neutral text-neutral' } },

    // Soft：同 reborn-button 的 soft（语义色 10% 透明底 + 语义色文字）
    { variant: 'soft', color: 'primary', class: { root: 'bg-primary/10 text-primary' } },
    { variant: 'soft', color: 'secondary', class: { root: 'bg-secondary/10 text-secondary' } },
    { variant: 'soft', color: 'success', class: { root: 'bg-success/10 text-success' } },
    { variant: 'soft', color: 'info', class: { root: 'bg-info/10 text-info' } },
    { variant: 'soft', color: 'warning', class: { root: 'bg-warning/10 text-warning' } },
    { variant: 'soft', color: 'error', class: { root: 'bg-error/10 text-error' } },
    { variant: 'soft', color: 'neutral', class: { root: 'bg-neutral/10 text-neutral' } },

    // Subtle：soft + 语义色边框
    { variant: 'subtle', color: 'primary', class: { root: 'bg-primary/10 border border-primary text-primary' } },
    { variant: 'subtle', color: 'secondary', class: { root: 'bg-secondary/10 border border-secondary text-secondary' } },
    { variant: 'subtle', color: 'success', class: { root: 'bg-success/10 border border-success text-success' } },
    { variant: 'subtle', color: 'info', class: { root: 'bg-info/10 border border-info text-info' } },
    { variant: 'subtle', color: 'warning', class: { root: 'bg-warning/10 border border-warning text-warning' } },
    { variant: 'subtle', color: 'error', class: { root: 'bg-error/10 border border-error text-error' } },
    { variant: 'subtle', color: 'neutral', class: { root: 'bg-neutral/10 border border-neutral text-neutral' } },

    // Text：无背景/边框，仅语义色文字
    { variant: 'text', color: 'primary', class: { root: 'bg-transparent text-primary' } },
    { variant: 'text', color: 'secondary', class: { root: 'bg-transparent text-secondary' } },
    { variant: 'text', color: 'success', class: { root: 'bg-transparent text-success' } },
    { variant: 'text', color: 'info', class: { root: 'bg-transparent text-info' } },
    { variant: 'text', color: 'warning', class: { root: 'bg-transparent text-warning' } },
    { variant: 'text', color: 'error', class: { root: 'bg-transparent text-error' } },
    { variant: 'text', color: 'neutral', class: { root: 'bg-transparent text-neutral' } },
  ],
  defaultVariants: {
    variant: 'soft' as AlertVariant,
    color: 'info' as AlertColor,
  },
});

/** 语义化结构键，供 ui 属性按节点覆盖样式 */
export interface AlertUI {
  root?: string;
  icon?: string;
  content?: string;
  title?: string;
  description?: string;
  action?: string;
  closeButton?: string;
  closeIcon?: string;
  carouselWrapper?: string;
  carouselItem?: string;
  carouselList?: string;
  marqueeWrapper?: string;
  marquee?: string;
  marqueeItem?: string;
}
