export const buttonColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const buttonVariants = ['solid', 'outline', 'soft', 'subtle'] as const

export const buttonSizes = [
  'xs',
  'sm',
  'default', // Mapped to md
  'md',
  'lg',
  'xl',
  '2xl',
] as const

export default {
  slots: {
    base: 'reborn-button flex flex-row items-center justify-center relative box-border border-transparent border border-solid transition-[background-color,border-color,opacity] duration-300 overflow-visible',
    label: 'truncate',
    loading: 'border-2 border-current border-t-transparent rounded-full animate-spin',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    trailingIcon: 'shrink-0',
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
    disabled: {
      true: {
        base: '!bg-opacity-60 !border-opacity-60 !text-opacity-60',
      },
      false: '',
    },
    size: {
      'xs': {
        base: 'h-[var(--button-xs-height)] px-3 text-24 gap-1.5 rounded-[6px]',
        loading: 'size-3',
      },
      'sm': {
        base: 'h-[var(--button-sm-height)] px-3 text-24 gap-1.5 rounded-[6px]',
        loading: 'size-3.5',
      },
      'default': {
        base: 'h-[var(--button-base-height)] px-4 text-26 gap-1.5 rounded-[8px]',
        loading: 'size-4',
      },
      'md': {
        base: 'h-[var(--button-base-height)] px-4 text-26 gap-1.5 rounded-[8px]',
        loading: 'size-4',
      },
      'lg': {
        base: 'h-[var(--button-lg-height)] px-6 text-28 gap-1.5 rounded-[10px]',
        loading: 'size-5',
      },
      'xl': {
        base: 'h-[var(--button-xl-height)] px-6 text-30 gap-2 rounded-[12px]',
        loading: 'size-6',
      },
      '2xl': {
        base: 'h-[var(--button-2xl-height)] px-6 text-32 gap-2 rounded-[14px]',
        loading: 'size-7',
      },
    },
    gap: {
      true: {
        base: '[.reborn-button_+_&]:ml-2',
      },
      false: '',
    },
  },
  compoundVariants: [
    // Solid Variants
    {
      color: 'primary' as (typeof buttonColors)[number],
      variant: 'solid' as (typeof buttonVariants)[number],
      class: 'bg-primary border-primary text-white hover:bg-primary/90',
    },
    {
      color: 'secondary' as (typeof buttonColors)[number],
      variant: 'solid' as (typeof buttonVariants)[number],
      class: 'bg-secondary border-secondary text-secondary-foreground hover:bg-secondary/90',
    },
    {
      color: 'success' as (typeof buttonColors)[number],
      variant: 'solid' as (typeof buttonVariants)[number],
      class: 'bg-success border-success text-white hover:bg-success/90',
    },
    {
      color: 'info' as (typeof buttonColors)[number],
      variant: 'solid' as (typeof buttonVariants)[number],
      class: 'bg-info border-info text-white hover:bg-info/90',
    },
    {
      color: 'warning' as (typeof buttonColors)[number],
      variant: 'solid' as (typeof buttonVariants)[number],
      class: 'bg-warning border-warning text-white hover:bg-warning/90',
    },
    {
      color: 'error' as (typeof buttonColors)[number],
      variant: 'solid' as (typeof buttonVariants)[number],
      class: 'bg-error border-error text-white hover:bg-error/90',
    },
    {
      color: 'neutral' as (typeof buttonColors)[number],
      variant: 'solid' as (typeof buttonVariants)[number],
      class: 'bg-neutral border-neutral text-white hover:bg-neutral/90',
    },

    // Outline Variants
    {
      color: 'primary' as (typeof buttonColors)[number],
      variant: 'outline' as (typeof buttonVariants)[number],
      class:
        'bg-transparent text-primary border-primary hover:bg-primary-50',
    },
    {
      color: 'secondary' as (typeof buttonColors)[number],
      variant: 'outline' as (typeof buttonVariants)[number],
      class:
        'bg-transparent text-secondary border-secondary hover:bg-secondary-50',
    },
    {
      color: 'success' as (typeof buttonColors)[number],
      variant: 'outline' as (typeof buttonVariants)[number],
      class:
        'bg-transparent text-success border-success hover:bg-success-50',
    },
    {
      color: 'info' as (typeof buttonColors)[number],
      variant: 'outline' as (typeof buttonVariants)[number],
      class:
        'bg-transparent text-info border-info hover:bg-info-50',
    },
    {
      color: 'warning' as (typeof buttonColors)[number],
      variant: 'outline' as (typeof buttonVariants)[number],
      class:
        'bg-transparent text-warning border-warning hover:bg-warning-50',
    },
    {
      color: 'error' as (typeof buttonColors)[number],
      variant: 'outline' as (typeof buttonVariants)[number],
      class:
        'bg-transparent text-error border-error hover:bg-error-50',
    },
    {
      color: 'neutral' as (typeof buttonColors)[number],
      variant: 'outline' as (typeof buttonVariants)[number],
      class:
        'bg-transparent text-neutral border-neutral hover:bg-neutral-50',
    },

    // Soft Variants
    {
      color: 'primary' as (typeof buttonColors)[number],
      variant: 'soft' as (typeof buttonVariants)[number],
      class: 'bg-primary/10 border-transparent text-primary hover:bg-primary/20',
    },
    {
      color: 'secondary' as (typeof buttonColors)[number],
      variant: 'soft' as (typeof buttonVariants)[number],
      class: 'bg-secondary/10 border-transparent text-secondary hover:bg-secondary/20',
    },
    {
      color: 'success' as (typeof buttonColors)[number],
      variant: 'soft' as (typeof buttonVariants)[number],
      class: 'bg-success/10 border-transparent text-success hover:bg-success/20',
    },
    {
      color: 'info' as (typeof buttonColors)[number],
      variant: 'soft' as (typeof buttonVariants)[number],
      class: 'bg-info/10 border-transparent text-info hover:bg-info/20',
    },
    {
      color: 'warning' as (typeof buttonColors)[number],
      variant: 'soft' as (typeof buttonVariants)[number],
      class: 'bg-warning/10 border-transparent text-warning hover:bg-warning/20',
    },
    {
      color: 'error' as (typeof buttonColors)[number],
      variant: 'soft' as (typeof buttonVariants)[number],
      class: 'bg-error/10 border-transparent text-error hover:bg-error/20',
    },
    {
      color: 'neutral' as (typeof buttonColors)[number],
      variant: 'soft' as (typeof buttonVariants)[number],
      class: 'bg-neutral/10 border-transparent text-neutral hover:bg-neutral/20',
    },

    // Subtle Variants
    {
      color: 'primary' as (typeof buttonColors)[number],
      variant: 'subtle' as (typeof buttonVariants)[number],
      class: 'bg-primary/10 border-primary text-primary hover:bg-primary/20',
    },
    {
      color: 'secondary' as (typeof buttonColors)[number],
      variant: 'subtle' as (typeof buttonVariants)[number],
      class:
        'bg-secondary/10 border-secondary text-secondary hover:bg-secondary/20',
    },
    {
      color: 'success' as (typeof buttonColors)[number],
      variant: 'subtle' as (typeof buttonVariants)[number],
      class: 'bg-success/10 border-success text-success hover:bg-success/20',
    },
    {
      color: 'info' as (typeof buttonColors)[number],
      variant: 'subtle' as (typeof buttonVariants)[number],
      class: 'bg-info/10 border-info text-info hover:bg-info/20',
    },
    {
      color: 'warning' as (typeof buttonColors)[number],
      variant: 'subtle' as (typeof buttonVariants)[number],
      class: 'bg-warning/10 border-warning text-warning hover:bg-warning/20',
    },
    {
      color: 'error' as (typeof buttonColors)[number],
      variant: 'subtle' as (typeof buttonVariants)[number],
      class: 'bg-error/10 border-error text-error hover:bg-error/20',
    },
    {
      color: 'neutral' as (typeof buttonColors)[number],
      variant: 'subtle' as (typeof buttonVariants)[number],
      class: 'bg-neutral/10 border-neutral text-neutral hover:bg-neutral/20',
    },
  ],
  defaultVariants: {
    color: 'primary' as (typeof buttonColors)[number],
    variant: 'solid' as (typeof buttonVariants)[number],
    size: 'md' as (typeof buttonSizes)[number],
  },
}
