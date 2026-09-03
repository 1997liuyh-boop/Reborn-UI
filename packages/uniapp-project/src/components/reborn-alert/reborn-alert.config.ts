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
 * 视觉规格对齐 Web 端：字号 28rpx / 常规字重 / 水平内边距 24rpx / 最小高度 80rpx。
 * 垂直内边距挂在 content 上（py 16rpx），单行时由 min-h + items-center 撑到 80rpx，
 * 多行内容自然增高且不会贴边。
 * filled / outlined / soft / subtle / text / round 配色对齐 reborn-button 的
 * 同名变体（不含 circle），提示是静态容器，无 hover 反馈
 */
export const alertTheme = tv({
  slots: {
    /* eslint-disable better-tailwindcss/no-unknown-classes */
    root: `
      reborn-alert relative flex min-h-[80rpx] w-full items-center gap-[16rpx]
      rounded-ui-sm px-[24rpx] text-28 font-normal leading-[1.5]
    `,
    /* eslint-enable better-tailwindcss/no-unknown-classes */
    icon: 'size-[32rpx] shrink-0',
    content: 'flex min-w-0 flex-1 flex-col gap-[4rpx] py-[16rpx]',
    title: 'font-medium',
    description: 'min-w-0',
    action: 'shrink-0',
    closeButton: 'inline-flex shrink-0 items-center justify-center rounded-full',
    closeIcon: 'size-[28rpx] shrink-0',
    carouselWrapper: 'h-[42rpx] min-w-0 flex-1',
    carouselItem: 'truncate',
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
}
