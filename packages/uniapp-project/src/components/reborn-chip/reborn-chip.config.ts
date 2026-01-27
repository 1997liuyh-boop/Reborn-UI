const size = ['3xs', '2xs', 'xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const position = ['top-right', 'bottom-right', 'top-left', 'bottom-left'] as const

export { size as chipSizes, color as chipColors, position as chipPositions }

export default {
  slots: {
    root: 'relative inline-flex items-center justify-center shrink-0 h-fit leading-none',
    base: 'absolute rounded-full flex items-center justify-center font-medium whitespace-nowrap text-white ring-2'
  },
  variants: {
    color: {
      primary: { base: 'bg-primary ring-primary' },
      secondary: { base: 'bg-secondary ring-secondary' },
      success: { base: 'bg-success ring-success' },
      info: { base: 'bg-info ring-info' },
      warning: { base: 'bg-warning ring-warning' },
      error: { base: 'bg-error ring-error' },
      neutral: { base: 'bg-neutral ring-neutral' }
    },
    size: {
      '3xs': { base: 'h-[8rpx] min-w-[8rpx] text-[8rpx]' },
      '2xs': { base: 'h-[10rpx] min-w-[10rpx] text-[10rpx]' },
      xs: { base: 'h-[12rpx] min-w-[12rpx] text-[12rpx]' },
      sm: { base: 'h-[14rpx] min-w-[14rpx] text-[14rpx]' },
      md: { base: 'h-[16rpx] min-w-[16rpx] text-[16rpx]' },
      lg: { base: 'h-[18rpx] min-w-[18rpx] text-[18rpx]' },
      xl: { base: 'h-[20rpx] min-w-[20rpx] text-[20rpx]' },
      '2xl': { base: 'h-[22rpx] min-w-[22rpx] text-[22rpx]' },
      '3xl': { base: 'h-[24rpx] min-w-[24rpx] text-[24rpx]' }
    },
    position: {
      'top-right': { base: 'top-0 right-0' },
      'bottom-right': { base: 'bottom-0 right-0' },
      'top-left': { base: 'top-0 left-0' },
      'bottom-left': { base: 'bottom-0 left-0' }
    }
  },
  compoundVariants: [
    {
      position: 'top-right' as const,
      class: { base: '-translate-y-1/2 translate-x-1/2 transform' }
    },
    {
      position: 'bottom-right' as const,
      class: { base: 'translate-y-1/2 translate-x-1/2 transform' }
    },
    {
      position: 'top-left' as const,
      class: { base: '-translate-y-1/2 -translate-x-1/2 transform' }
    },
    {
      position: 'bottom-left' as const,
      class: { base: 'translate-y-1/2 -translate-x-1/2 transform' }
    }
  ],
  defaultVariants: {
    size: 'md' as const,
    color: 'primary' as const,
    position: 'top-right' as const,
    standalone: false
  }
}
