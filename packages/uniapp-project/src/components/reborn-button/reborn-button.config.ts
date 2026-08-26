export const buttonColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const buttonVariants = ['solid', 'outline', 'soft', 'subtle', 'text', 'round', 'circle'] as const

export const buttonSizes = [
  'xs',
  'sm',
  'default',
  'md',
  'lg',
  'xl',
  '2xl',
] as const

export default {
  slots: {
    base: 'reborn-button flex flex-row items-center justify-center relative box-border border-transparent border border-solid transition-[background-color,border-color,opacity] duration-300 overflow-visible',
    inner: 'reborn-button-clicker absolute inset-0 z-10 m-0 size-full p-0 opacity-0',
    label: 'truncate',
    loading: 'flex items-center justify-center',
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
    block: {
      true: {
        // 小程序列布局下 inline-flex 常无法像 H5 一样被 align-items: stretch 拉满宽，显式占满一行
        base: 'flex w-full min-w-0',
      },
      false: {
        base: 'inline-flex',
      }
    },
    /**
     * 七档尺寸：高度用 rpx 随屏宽缩放。
     * 直角圆角随尺寸取设计令牌：xs/sm → rounded-ui-2xs(4rpx) / default/md → rounded-ui-xs(6rpx) / lg+ → rounded-ui-sm(8rpx)；
     * round / circle / text 变体在 variant 轴覆盖此圆角（本轴刻意置于 variant 之前，保证后者在 tailwind-merge 中胜出）。
     */
    size: {
      'xs': {
        base: 'h-button-xs px-3 text-22 gap-1.5 rounded-ui-2xs',
        loading: 'size-3',
      },
      'sm': {
        base: 'h-button-sm px-3 text-24 gap-1.5 rounded-ui-2xs',
        loading: 'size-3.5',
      },
      'default': {
        base: 'h-button-md px-4 text-26 gap-1.5 rounded-ui-xs',
        loading: 'size-4',
      },
      'md': {
        base: 'h-button-md px-4 text-26 gap-1.5 rounded-ui-xs',
        loading: 'size-4',
      },
      'lg': {
        base: 'h-button-lg px-6 text-28 gap-1.5 rounded-ui-sm',
        loading: 'size-5',
      },
      'xl': {
        base: 'h-button-xl px-6 text-30 gap-2 rounded-ui-sm',
        loading: 'size-6',
      },
      '2xl': {
        base: 'h-button-2xl px-6 text-32 gap-2 rounded-ui-sm',
        loading: 'size-7',
      },
    },
    variant: {
      solid: '',
      outline: '',
      soft: '',
      subtle: '',
      // 文字按钮：无背景/边框，高度跟随文字（见 compoundVariants 覆盖 size 的固定高度）
      text: '',
      // 胶囊按钮：形状类，着色复合规则与 solid 一致（见 compoundVariants）
      // 圆角带 ! 强制：size 轴的 rounded-ui-* 是自定义令牌，tailwind-merge 不会将其与
      // rounded-full 判为冲突组而合并掉，且生成 CSS 顺序靠后，不加 ! 会反向覆盖形状圆角
      round: '!rounded-full',
      // 圆形纯图标按钮：内边距归零 + 胶囊圆角；等宽由下方 size 复合规则的 w-button-* 保证（小程序对 aspect-square 支持不稳）
      circle: '!p-0 !rounded-full',
    },
    disabled: {
      true: '',
      false: '',
    },
    loading: {
      true: 'pointer-events-none opacity-80',
      false: '',
    },
    gap: {
      true: {
        base: '[.reborn-button_+_&]:ml-2',
      },
      false: '',
    },
  },
  compoundVariants: [
    { variant: 'circle' as (typeof buttonVariants)[number], size: 'xs' as (typeof buttonSizes)[number], class: { base: 'w-button-xs' } },
    { variant: 'circle' as (typeof buttonVariants)[number], size: 'sm' as (typeof buttonSizes)[number], class: { base: 'w-button-sm' } },
    { variant: 'circle' as (typeof buttonVariants)[number], size: 'md' as (typeof buttonSizes)[number], class: { base: 'w-button-md' } },
    { variant: 'circle' as (typeof buttonVariants)[number], size: 'default' as (typeof buttonSizes)[number], class: { base: 'w-button-md' } },
    { variant: 'circle' as (typeof buttonVariants)[number], size: 'lg' as (typeof buttonSizes)[number], class: { base: 'w-button-lg' } },
    { variant: 'circle' as (typeof buttonVariants)[number], size: 'xl' as (typeof buttonSizes)[number], class: { base: 'w-button-xl' } },
    { variant: 'circle' as (typeof buttonVariants)[number], size: '2xl' as (typeof buttonSizes)[number], class: { base: 'w-button-2xl' } },
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

    // Round Variants：胶囊形状，着色规则与 solid 一致
    {
      color: 'primary' as (typeof buttonColors)[number],
      variant: 'round' as (typeof buttonVariants)[number],
      class: 'bg-primary border-primary text-white hover:bg-primary/90',
    },
    {
      color: 'secondary' as (typeof buttonColors)[number],
      variant: 'round' as (typeof buttonVariants)[number],
      class: 'bg-secondary border-secondary text-secondary-foreground hover:bg-secondary/90',
    },
    {
      color: 'success' as (typeof buttonColors)[number],
      variant: 'round' as (typeof buttonVariants)[number],
      class: 'bg-success border-success text-white hover:bg-success/90',
    },
    {
      color: 'info' as (typeof buttonColors)[number],
      variant: 'round' as (typeof buttonVariants)[number],
      class: 'bg-info border-info text-white hover:bg-info/90',
    },
    {
      color: 'warning' as (typeof buttonColors)[number],
      variant: 'round' as (typeof buttonVariants)[number],
      class: 'bg-warning border-warning text-white hover:bg-warning/90',
    },
    {
      color: 'error' as (typeof buttonColors)[number],
      variant: 'round' as (typeof buttonVariants)[number],
      class: 'bg-error border-error text-white hover:bg-error/90',
    },
    {
      color: 'neutral' as (typeof buttonColors)[number],
      variant: 'round' as (typeof buttonVariants)[number],
      class: 'bg-neutral border-neutral text-white hover:bg-neutral/90',
    },

    // Circle Variants：圆形纯图标按钮，着色规则与 solid 一致
    {
      color: 'primary' as (typeof buttonColors)[number],
      variant: 'circle' as (typeof buttonVariants)[number],
      class: 'bg-primary border-primary text-white hover:bg-primary/90',
    },
    {
      color: 'secondary' as (typeof buttonColors)[number],
      variant: 'circle' as (typeof buttonVariants)[number],
      class: 'bg-secondary border-secondary text-secondary-foreground hover:bg-secondary/90',
    },
    {
      color: 'success' as (typeof buttonColors)[number],
      variant: 'circle' as (typeof buttonVariants)[number],
      class: 'bg-success border-success text-white hover:bg-success/90',
    },
    {
      color: 'info' as (typeof buttonColors)[number],
      variant: 'circle' as (typeof buttonVariants)[number],
      class: 'bg-info border-info text-white hover:bg-info/90',
    },
    {
      color: 'warning' as (typeof buttonColors)[number],
      variant: 'circle' as (typeof buttonVariants)[number],
      class: 'bg-warning border-warning text-white hover:bg-warning/90',
    },
    {
      color: 'error' as (typeof buttonColors)[number],
      variant: 'circle' as (typeof buttonVariants)[number],
      class: 'bg-error border-error text-white hover:bg-error/90',
    },
    {
      color: 'neutral' as (typeof buttonColors)[number],
      variant: 'circle' as (typeof buttonVariants)[number],
      class: 'bg-neutral border-neutral text-white hover:bg-neutral/90',
    },

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

    {
      variant: 'solid' as (typeof buttonVariants)[number],
      disabled: true,
      class: '!bg-gray-4 !border-gray-4 !text-white hover:!bg-gray-4 hover:!border-gray-4',
    },
    {
      variant: 'round' as (typeof buttonVariants)[number],
      disabled: true,
      class: '!bg-gray-4 !border-gray-4 !text-white hover:!bg-gray-4 hover:!border-gray-4',
    },
    {
      variant: 'circle' as (typeof buttonVariants)[number],
      disabled: true,
      class: '!bg-gray-4 !border-gray-4 !text-white hover:!bg-gray-4 hover:!border-gray-4',
    },
    {
      variant: 'outline' as (typeof buttonVariants)[number],
      disabled: true,
      class: '!bg-gray-2 !border-gray-4 !text-gray-6 hover:!bg-gray-2 hover:!border-gray-4',
    },
    {
      variant: 'soft' as (typeof buttonVariants)[number],
      disabled: true,
      class: '!bg-gray-2 !border-transparent !text-gray-6 hover:!bg-gray-2',
    },
    {
      variant: 'subtle' as (typeof buttonVariants)[number],
      disabled: true,
      class: '!bg-gray-2 !border-gray-4 !text-gray-6 hover:!bg-gray-2 hover:!border-gray-4',
    },

    // Text Variants：无背景/边框，高度与水平内边距跟随文字
    {
      // text 无背景，不参与尺寸圆角令牌：显式归零，避免继承 size 的 rounded-ui-*
      variant: 'text' as (typeof buttonVariants)[number],
      class: 'rounded-none',
    },
    {
      color: 'primary' as (typeof buttonColors)[number],
      variant: 'text' as (typeof buttonVariants)[number],
      class: 'bg-transparent border-transparent text-primary hover:text-primary/75 !h-auto !px-0',
    },
    {
      color: 'secondary' as (typeof buttonColors)[number],
      variant: 'text' as (typeof buttonVariants)[number],
      class: 'bg-transparent border-transparent text-secondary hover:text-secondary/75 !h-auto !px-0',
    },
    {
      color: 'success' as (typeof buttonColors)[number],
      variant: 'text' as (typeof buttonVariants)[number],
      class: 'bg-transparent border-transparent text-success hover:text-success/75 !h-auto !px-0',
    },
    {
      color: 'info' as (typeof buttonColors)[number],
      variant: 'text' as (typeof buttonVariants)[number],
      class: 'bg-transparent border-transparent text-info hover:text-info/75 !h-auto !px-0',
    },
    {
      color: 'warning' as (typeof buttonColors)[number],
      variant: 'text' as (typeof buttonVariants)[number],
      class: 'bg-transparent border-transparent text-warning hover:text-warning/75 !h-auto !px-0',
    },
    {
      color: 'error' as (typeof buttonColors)[number],
      variant: 'text' as (typeof buttonVariants)[number],
      class: 'bg-transparent border-transparent text-error hover:text-error/75 !h-auto !px-0',
    },
    {
      color: 'neutral' as (typeof buttonColors)[number],
      variant: 'text' as (typeof buttonVariants)[number],
      class: 'bg-transparent border-transparent text-neutral hover:text-neutral/75 !h-auto !px-0',
    },
    {
      variant: 'text' as (typeof buttonVariants)[number],
      disabled: true,
      class: '!bg-transparent !border-transparent !text-gray-6 hover:!bg-transparent',
    },
  ],
  defaultVariants: {
    color: 'primary' as (typeof buttonColors)[number],
    variant: 'solid' as (typeof buttonVariants)[number],
    size: 'md' as (typeof buttonSizes)[number],
    block: false,
    loading: false
  },
}
