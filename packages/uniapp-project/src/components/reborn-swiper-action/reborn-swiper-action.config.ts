export const swiperActionColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const swiperActionSides = ['left', 'right'] as const

export type SwiperActionColor = (typeof swiperActionColors)[number]
export type SwiperActionSide = (typeof swiperActionSides)[number]

export type SwiperActionUI = {
  root?: string
  actions?: string
  leftActions?: string
  rightActions?: string
  content?: string
  action?: string
  icon?: string
  text?: string
}

export const swiperActionColorClasses: Record<SwiperActionColor, string> = {
  primary: 'bg-primary text-white',
  secondary: 'bg-secondary text-secondary-foreground',
  success: 'bg-success text-white',
  info: 'bg-info text-white',
  warning: 'bg-warning text-white',
  error: 'bg-error text-white',
  neutral: 'bg-neutral text-white',
}

export default {
  slots: {
    root: 'reborn-swiper-action relative w-full overflow-hidden rounded-[16rpx] bg-white dark:bg-gray-8',
    actions: 'absolute bottom-[1px] top-[1px] z-0 flex flex-row overflow-hidden',
    leftActions: 'left-[1px] justify-start',
    rightActions: 'right-[1px] justify-end',
    content: 'relative z-10 w-full overflow-hidden rounded-[16rpx] bg-white shadow-[0_0_0_2px_rgba(255,255,255,1)] transition-transform [backface-visibility:hidden] dark:bg-gray-8 dark:shadow-[0_0_0_2px_rgba(51,51,51,1)]',
    action: 'flex h-full min-h-[112rpx] flex-col items-center justify-center gap-[8rpx] px-[28rpx] text-[26rpx] font-medium',
    icon: 'text-[34rpx] leading-none',
    text: 'whitespace-nowrap leading-none',
  },
  variants: {
    disabled: {
      true: {
        root: 'opacity-60',
        content: 'pointer-events-none',
      },
      false: '',
    },
  },
  defaultVariants: {
    disabled: false,
  },
} as const
