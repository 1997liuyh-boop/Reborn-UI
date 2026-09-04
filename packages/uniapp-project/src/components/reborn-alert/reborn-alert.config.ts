import { tv } from '@/lib/tv'

/** 警告提示的类型（决定默认图标与配色），与 Web 端一致 */
export const alertTypes = ['info', 'success', 'warning', 'error', 'normal'] as const
export type AlertType = (typeof alertTypes)[number]

/** 视觉变体：对齐 reborn-button 的同名变体（不含 circle） */
export const alertVariants = ['filled', 'outlined', 'soft', 'subtle', 'text', 'round'] as const
export type AlertVariant = (typeof alertVariants)[number]

/** 配色（与 reborn-button 同一套语义色） */
export const alertColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export type AlertColor = (typeof alertColors)[number]

/** 轮播方向：vertical 垂直切换（rows > 1 时多行逐行滚动），horizontal 水平跑马灯 */
export const alertDirections = ['vertical', 'horizontal'] as const
export type AlertDirection = (typeof alertDirections)[number]

/** type → 默认配色（normal 视作中性色） */
export const ALERT_TYPE_COLOR: Record<AlertType, AlertColor> = {
  info: 'info',
  success: 'success',
  warning: 'warning',
  error: 'error',
  normal: 'neutral',
}

/** type → 默认图标类名（与 Web 端同一套 lucide 图标，本端走 tailwind 图标类） */
export const ALERT_TYPE_ICON: Record<AlertType, string> = {
  info: 'i-lucide-info',
  success: 'i-lucide-circle-check',
  warning: 'i-lucide-circle-alert',
  error: 'i-lucide-circle-x',
  normal: 'i-lucide-megaphone',
}

/*
 * 视觉规格对齐 Web 端：字号 28rpx / 常规字重 / 内边距 24rpx 16rpx / 高度自适应（无最小高度）。
 * 根节点 items-start，图标、关闭按钮是高度等于文字首行行高（1.5em = 42rpx）的 flex
 * 容器并在其中垂直居中：有标题时以标题首行为中心，无标题时以提示内容首行为中心。
 * 按钮插槽用 min-h 而非固定高度：不高于一行的内容同样以首行为中心，超过一行高的内容
 * （如竖排多个按钮）与标题顶部对齐并把盒子撑高，避免溢出。
 * 间距统一 16rpx（8px）：图标 / 内容 / 按钮插槽 / 关闭按钮之间为 root gap，
 * 标题与提示内容之间为 content gap。
 * filled / outlined / soft / subtle / text / round 配色对齐 reborn-button 的
 * 同名变体（不含 circle），提示是静态容器，无 hover 反馈
 */
export const alertTheme = tv({
  slots: {
    /* eslint-disable better-tailwindcss/no-unknown-classes */
    root: `
      reborn-alert relative flex w-full items-start gap-[16rpx] rounded-ui-sm
      px-[24rpx] py-[16rpx] text-28 font-normal leading-[1.5]
    `,
    // reborn-alert__* 是 createSelectorQuery 测宽用的选择器类名，跟随样式一起挂到节点上
    marqueeWrapper: `
      reborn-alert__marquee-wrapper h-[42rpx] min-w-0 overflow-hidden
    `,
    // 水平跑马灯：不换行的整行文本，由组件测宽后驱动 CSS 动画
    marquee: `
      reborn-alert__marquee inline-block whitespace-nowrap will-change-transform
    `,
    /* eslint-enable better-tailwindcss/no-unknown-classes */
    icon: 'flex h-[1.5em] shrink-0 items-center',
    content: 'flex min-w-0 flex-1 flex-col gap-[16rpx]',
    title: 'font-medium',
    description: 'min-w-0',
    action: 'flex min-h-[1.5em] shrink-0 items-center',
    closeButton: `
      flex size-[1.5em] shrink-0 items-center justify-center rounded-full
    `,
    closeIcon: 'size-[28rpx] shrink-0',
    // 单行高度 42rpx（28rpx × 1.5）；多行模式由组件按 rows 用内联样式覆盖高度。
    // 位于内容列中，不能带 flex-1：不定高列容器里 basis 0% 会退化为按内容计算，顶掉显式高度
    carouselWrapper: 'h-[42rpx] min-w-0 overflow-hidden',
    carouselItem: 'truncate',
    marqueeItem: `
      mr-[48rpx] inline-block
      last:mr-0
    `,
  },
  variants: {
    variant: {
      filled: {},
      outlined: {},
      soft: {},
      subtle: {},
      // 文字提示：无背景/边框，仅保留语义色文字
      text: {},
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
    { variant: 'filled', color: 'primary', class: { root: `
      bg-primary text-white
    ` } },
    { variant: 'filled', color: 'secondary', class: { root: `
      bg-secondary text-white
    ` } },
    { variant: 'filled', color: 'success', class: { root: `
      bg-success text-white
    ` } },
    { variant: 'filled', color: 'info', class: { root: 'bg-info text-white' } },
    { variant: 'filled', color: 'warning', class: { root: `
      bg-warning text-white
    ` } },
    { variant: 'filled', color: 'error', class: { root: 'bg-error text-white' } },
    { variant: 'filled', color: 'neutral', class: { root: `
      bg-neutral text-white
    ` } },

    // Round：胶囊形状，着色规则与 filled 一致
    { variant: 'round', color: 'primary', class: { root: 'bg-primary text-white' } },
    { variant: 'round', color: 'secondary', class: { root: `
      bg-secondary text-white
    ` } },
    { variant: 'round', color: 'success', class: { root: 'bg-success text-white' } },
    { variant: 'round', color: 'info', class: { root: 'bg-info text-white' } },
    { variant: 'round', color: 'warning', class: { root: 'bg-warning text-white' } },
    { variant: 'round', color: 'error', class: { root: 'bg-error text-white' } },
    { variant: 'round', color: 'neutral', class: { root: 'bg-neutral text-white' } },

    // Outlined：同 reborn-button 的 outlined（语义色边框 + 文字，透明底）
    { variant: 'outlined', color: 'primary', class: { root: `
      border border-solid border-primary bg-transparent text-primary
    ` } },
    { variant: 'outlined', color: 'secondary', class: { root: `
      border border-solid border-secondary bg-transparent text-secondary
    ` } },
    { variant: 'outlined', color: 'success', class: { root: `
      border border-solid border-success bg-transparent text-success
    ` } },
    { variant: 'outlined', color: 'info', class: { root: `
      border border-solid border-info bg-transparent text-info
    ` } },
    { variant: 'outlined', color: 'warning', class: { root: `
      border border-solid border-warning bg-transparent text-warning
    ` } },
    { variant: 'outlined', color: 'error', class: { root: `
      border border-solid border-error bg-transparent text-error
    ` } },
    { variant: 'outlined', color: 'neutral', class: { root: `
      border border-solid border-neutral bg-transparent text-neutral
    ` } },

    // Soft：同 reborn-button 的 soft（语义色 10% 透明底 + 语义色文字）
    { variant: 'soft', color: 'primary', class: { root: `
      bg-primary/10 text-primary
    ` } },
    { variant: 'soft', color: 'secondary', class: { root: `
      bg-secondary/10 text-secondary
    ` } },
    { variant: 'soft', color: 'success', class: { root: `
      bg-success/10 text-success
    ` } },
    { variant: 'soft', color: 'info', class: { root: 'bg-info/10 text-info' } },
    { variant: 'soft', color: 'warning', class: { root: `
      bg-warning/10 text-warning
    ` } },
    { variant: 'soft', color: 'error', class: { root: 'bg-error/10 text-error' } },
    { variant: 'soft', color: 'neutral', class: { root: `
      bg-neutral/10 text-neutral
    ` } },

    // Subtle：soft + 语义色边框
    { variant: 'subtle', color: 'primary', class: { root: `
      border border-solid border-primary bg-primary/10 text-primary
    ` } },
    { variant: 'subtle', color: 'secondary', class: { root: `
      border border-solid border-secondary bg-secondary/10 text-secondary
    ` } },
    { variant: 'subtle', color: 'success', class: { root: `
      border border-solid border-success bg-success/10 text-success
    ` } },
    { variant: 'subtle', color: 'info', class: { root: `
      border border-solid border-info bg-info/10 text-info
    ` } },
    { variant: 'subtle', color: 'warning', class: { root: `
      border border-solid border-warning bg-warning/10 text-warning
    ` } },
    { variant: 'subtle', color: 'error', class: { root: `
      border border-solid border-error bg-error/10 text-error
    ` } },
    { variant: 'subtle', color: 'neutral', class: { root: `
      border border-solid border-neutral bg-neutral/10 text-neutral
    ` } },

    // Text：无背景/边框，仅语义色文字
    { variant: 'text', color: 'primary', class: { root: `
      bg-transparent text-primary
    ` } },
    { variant: 'text', color: 'secondary', class: { root: `
      bg-transparent text-secondary
    ` } },
    { variant: 'text', color: 'success', class: { root: `
      bg-transparent text-success
    ` } },
    { variant: 'text', color: 'info', class: { root: 'bg-transparent text-info' } },
    { variant: 'text', color: 'warning', class: { root: `
      bg-transparent text-warning
    ` } },
    { variant: 'text', color: 'error', class: { root: `
      bg-transparent text-error
    ` } },
    { variant: 'text', color: 'neutral', class: { root: `
      bg-transparent text-neutral
    ` } },
  ],
  defaultVariants: {
    variant: 'soft' as AlertVariant,
    color: 'info' as AlertColor,
  },
})

/** 警告提示 UI 样式覆盖接口 */
export interface AlertUI {
  root?: string
  icon?: string
  content?: string
  title?: string
  description?: string
  action?: string
  closeButton?: string
  closeIcon?: string
  carouselWrapper?: string
  carouselItem?: string
  marqueeWrapper?: string
  marquee?: string
  marqueeItem?: string
}
