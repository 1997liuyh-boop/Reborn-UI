const size = ['sm', 'md', 'lg'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const variant = ['solid', 'outline', 'soft', 'subtle'] as const

export { color as badgeColors, size as badgeSizes, variant as badgeVariants }

const config = {
  slots: {
    base: 'font-medium inline-flex items-center justify-center p-1 gap-1', // Added justify-center
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
        base: 'h-[28rpx]  text-20 rounded-[6rpx]',
        leadingIcon: 'size-2',
        trailingIcon: 'size-2',
        closeIcon: 'size-2',
      },
      md: {
        base: 'h-[36rpx] leading-1.5 text-22 rounded-[8rpx]',
        leadingIcon: 'size-3',
        trailingIcon: 'size-3',
        closeIcon: 'size-3',
      },
      lg: {
        base: 'h-[38rpx] leading-1.5 text-24 rounded-[12rpx]',
        leadingIcon: 'size-4',
        trailingIcon: 'size-4',
        closeIcon: 'size-4',
      },
    },
    square: {
      true: {
        base: 'px-1', // Override padding for square aspect
      },
    },
  },
  compoundVariants: [
    {
      color: 'primary',
      variant: 'solid',
      class: { base: 'bg-primary text-primary-foreground' },
    },
    {
      color: 'secondary',
      variant: 'solid',
      class: { base: 'bg-secondary text-secondary-foreground' },
    },
    {
      color: 'success',
      variant: 'solid',
      class: { base: 'bg-success text-success-foreground' },
    },
    {
      color: 'info',
      variant: 'solid',
      class: { base: 'bg-info text-info-foreground' },
    },
    {
      color: 'warning',
      variant: 'solid',
      class: { base: 'bg-warning text-warning-foreground' },
    },
    {
      color: 'error',
      variant: 'solid',
      class: { base: 'bg-error text-error-foreground' },
    },
    {
      color: 'neutral',
      variant: 'solid',
      class: { base: 'bg-neutral text-neutral-foreground' },
    },
    // outline
    {
      color: 'primary',
      variant: 'outline',
      class: { base: 'text-primary border border-primary/50' },
    },
    {
      color: 'secondary',
      variant: 'outline',
      class: { base: 'text-secondary border border-secondary/50' },
    },
    {
      color: 'error',
      variant: 'outline',
      class: { base: 'text-error border border-error/50' },
    },
    {
      color: 'success',
      variant: 'outline',
      class: { base: 'text-success border border-success/50' },
    },
    {
      color: 'warning',
      variant: 'outline',
      class: { base: 'text-warning border border-warning/50' },
    },
    {
      color: 'info',
      variant: 'outline',
      class: { base: 'text-info border border-info/50' },
    },
    {
      color: 'neutral',
      variant: 'outline',
      class: { base: 'text-neutral border border-neutral/50' },
    },
    // soft
    {
      color: 'primary',
      variant: 'soft',
      class: { base: 'bg-primary/10 text-primary' },
    },
    {
      color: 'secondary',
      variant: 'soft',
      class: { base: 'bg-secondary/10 text-secondary' },
    },
    {
      color: 'error',
      variant: 'soft',
      class: { base: 'bg-error/10 text-error' },
    },
    {
      color: 'success',
      variant: 'soft',
      class: { base: 'bg-success/10 text-success' },
    },
    {
      color: 'warning',
      variant: 'soft',
      class: { base: 'bg-warning/10 text-warning' },
    },
    {
      color: 'info',
      variant: 'soft',
      class: { base: 'bg-info/10 text-info' },
    },
    {
      color: 'neutral',
      variant: 'soft',
      class: { base: 'bg-neutral/10 text-neutral' },
    },
    // subtle
    {
      color: 'primary',
      variant: 'subtle',
      class: { base: 'bg-primary/10 border border-primary/50 text-primary' },
    },
    {
      color: 'secondary',
      variant: 'subtle',
      class: { base: 'bg-secondary/10 border border-secondary/50 text-secondary' },
    },
    {
      color: 'error',
      variant: 'subtle',
      class: { base: 'bg-error/10 border border-error/50 text-error' },
    },
    {
      color: 'success',
      variant: 'subtle',
      class: { base: 'bg-success/10 border border-success/50 text-success' },
    },
    {
      color: 'warning',
      variant: 'subtle',
      class: { base: 'bg-warning/10 border border-warning/50 text-warning' },
    },
    {
      color: 'info',
      variant: 'subtle',
      class: { base: 'bg-info/10 border border-info/50 text-info' },
    },
    {
      color: 'neutral',
      variant: 'subtle',
      class: { base: 'bg-neutral/10 border border-neutral/50 text-neutral' },
    },
  ],
  defaultVariants: {
    color: 'primary',
    variant: 'solid',
    size: 'md',
  },
}

export default config
