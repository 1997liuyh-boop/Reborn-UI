const badgeSizes = ['sm', 'md', 'lg'] as const
const badgeColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const badgeVariants = ['solid', 'outline', 'soft', 'subtle'] as const

export { badgeColors, badgeSizes, badgeVariants }

export type BadgeColor = (typeof badgeColors)[number]
export type BadgeSize = (typeof badgeSizes)[number]
export type BadgeVariant = (typeof badgeVariants)[number]

const config = {
  slots: {
    base: 'font-medium inline-flex items-center justify-center p-1 gap-1 transition-all duration-200',
    label: 'truncate',
    leadingIcon: 'shrink-0',
    trailingIcon: 'shrink-0',
    closeButton: 'ml-1 inline-flex items-center justify-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer',
    closeIcon: 'shrink-0',
  },
  variants: {
    color: {
      primary: '',
      secondary: '',
      success: '',
      info: '',
      warning: '',
      error: '',
      neutral: '',
    },
    variant: {
      solid: '',
      outline: '',
      soft: '',
      subtle: '',
    },
    size: {
      sm: {
        base: 'h-[28rpx] min-w-[28rpx] text-20 rounded-[6rpx] px-[8rpx]',
        leadingIcon: 'size-2',
        trailingIcon: 'size-2',
        closeIcon: 'size-2',
      },
      md: {
        base: 'h-[36rpx] min-w-[36rpx] leading-1.5 text-22 rounded-[8rpx] px-[12rpx]',
        leadingIcon: 'size-3',
        trailingIcon: 'size-3',
        closeIcon: 'size-3',
      },
      lg: {
        base: 'h-[44rpx] min-w-[44rpx] leading-1.5 text-24 rounded-[12rpx] px-[16rpx]',
        leadingIcon: 'size-4',
        trailingIcon: 'size-4',
        closeIcon: 'size-4',
      },
    },
    square: {
      true: {
        base: 'px-0 aspect-square',
      },
    },
  },
  compoundVariants: [
    // solid
    { color: 'primary' as BadgeColor, variant: 'solid' as BadgeVariant, class: 'bg-primary text-white' },
    { color: 'secondary' as BadgeColor, variant: 'solid' as BadgeVariant, class: 'bg-secondary text-secondary-foreground' },
    { color: 'success' as BadgeColor, variant: 'solid' as BadgeVariant, class: 'bg-success text-white' },
    { color: 'info' as BadgeColor, variant: 'solid' as BadgeVariant, class: 'bg-info text-white' },
    { color: 'warning' as BadgeColor, variant: 'solid' as BadgeVariant, class: 'bg-warning text-white' },
    { color: 'error' as BadgeColor, variant: 'solid' as BadgeVariant, class: 'bg-error text-white' },
    { color: 'neutral' as BadgeColor, variant: 'solid' as BadgeVariant, class: 'bg-neutral text-white' },
    // outline
    { color: 'primary' as BadgeColor, variant: 'outline' as BadgeVariant, class: 'text-primary border border-primary/50' },
    { color: 'secondary' as BadgeColor, variant: 'outline' as BadgeVariant, class: 'text-secondary border border-secondary/50' },
    { color: 'success' as BadgeColor, variant: 'outline' as BadgeVariant, class: 'text-success border border-success/50' },
    { color: 'info' as BadgeColor, variant: 'outline' as BadgeVariant, class: 'text-info border border-info/50' },
    { color: 'warning' as BadgeColor, variant: 'outline' as BadgeVariant, class: 'text-warning border border-warning/50' },
    { color: 'error' as BadgeColor, variant: 'outline' as BadgeVariant, class: 'text-error border border-error/50' },
    { color: 'neutral' as BadgeColor, variant: 'outline' as BadgeVariant, class: 'text-neutral border border-neutral/50' },
    // soft
    { color: 'primary' as BadgeColor, variant: 'soft' as BadgeVariant, class: 'bg-primary/10 text-primary' },
    { color: 'secondary' as BadgeColor, variant: 'soft' as BadgeVariant, class: 'bg-secondary/10 text-secondary' },
    { color: 'success' as BadgeColor, variant: 'soft' as BadgeVariant, class: 'bg-success/10 text-success' },
    { color: 'info' as BadgeColor, variant: 'soft' as BadgeVariant, class: 'bg-info/10 text-info' },
    { color: 'warning' as BadgeColor, variant: 'soft' as BadgeVariant, class: 'bg-warning/10 text-warning' },
    { color: 'error' as BadgeColor, variant: 'soft' as BadgeVariant, class: 'bg-error/10 text-error' },
    { color: 'neutral' as BadgeColor, variant: 'soft' as BadgeVariant, class: 'bg-neutral/10 text-neutral' },
    // subtle
    { color: 'primary' as BadgeColor, variant: 'subtle' as BadgeVariant, class: 'bg-primary/10 border border-primary/50 text-primary' },
    { color: 'secondary' as BadgeColor, variant: 'subtle' as BadgeVariant, class: 'bg-secondary/10 border border-secondary/50 text-secondary' },
    { color: 'success' as BadgeColor, variant: 'subtle' as BadgeVariant, class: 'bg-success/10 border border-success/50 text-success' },
    { color: 'info' as BadgeColor, variant: 'subtle' as BadgeVariant, class: 'bg-info/10 border border-info/50 text-info' },
    { color: 'warning' as BadgeColor, variant: 'subtle' as BadgeVariant, class: 'bg-warning/10 border border-warning/50 text-warning' },
    { color: 'error' as BadgeColor, variant: 'subtle' as BadgeVariant, class: 'bg-error/10 border border-error/50 text-error' },
    { color: 'neutral' as BadgeColor, variant: 'subtle' as BadgeVariant, class: 'bg-neutral/10 border border-neutral/50 text-neutral' },
  ],
  defaultVariants: {
    color: 'primary' as BadgeColor,
    variant: 'solid' as BadgeVariant,
    size: 'md' as BadgeSize,
  },
}

export default config
