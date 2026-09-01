/** 徽章尺寸选项 */
export const badgeSizes = ['sm', 'md', 'lg'] as const
/** 徽章颜色选项 */
export const badgeColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
/** 徽章变体选项 */
export const badgeVariants = ['filled', 'outlined', 'soft', 'subtle'] as const

const config = {
  /** 徽章插槽样式配置 */
  slots: {
    root: 'reborn-badge inline',
    base: 'inline-flex items-center justify-center font-medium whitespace-nowrap shrink-0 overflow-hidden transition-[color,box-shadow,background-color,border-color]',
    label: 'truncate',
    leadingIcon: 'shrink-0',
    trailingIcon: 'shrink-0',
    closeButton: 'inline-flex items-center justify-center rounded-full transition-colors hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer focus:outline-none',
    closeIcon: 'shrink-0'
  },
  /** 徽章变体配置 */
  variants: {
    /** 字段组（组合使用）时的样式 */
    fieldGroup: {
      horizontal: 'not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]',
      vertical: 'not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]'
    },
    /** 样式变体 */
    variant: {
      filled: '',
      outlined: 'bg-transparent border border-solid',
      soft: 'border-transparent',
      subtle: 'border border-solid'
    },
    /** 颜色配置 */
    color: {
      primary: '',
      secondary: '',
      success: '',
      info: '',
      warning: '',
      error: '',
      neutral: ''
    },
    /** 尺寸配置：高度、内边距、字体等 */
    size: {
      sm: {
        base: 'h-badge-sm px-2 rounded-ui-xs gap-1',
        label: 'text-20 leading-none',
        leadingIcon: 'size-2',
        trailingIcon: 'size-2',
        closeButton: 'text-22'
      },
      md: {
        base: 'h-badge-md px-2 rounded-ui-sm gap-1',
        label: 'text-22 leading-normal',
        leadingIcon: 'size-3',
        trailingIcon: 'size-3',
        closeButton: 'text-24'
      },
      lg: {
        base: 'h-badge-lg px-2 rounded-ui-md gap-1',
        label: 'text-24 leading-normal',
        leadingIcon: 'size-4',
        trailingIcon: 'size-4',
        closeButton: 'text-24'
      }
    },
    /** 是否为正方形（等宽高） */
    square: {
      true: 'p-0 aspect-square'
    },
    /** 是否有间距 */
    gap: {
      true: {
        root: '[.reborn-badge+_&]:ml-2'
      }
    }
  },
  /** 复合变体：根据颜色和样式变体组合生成的样式 */
  compoundVariants: [
    // Filled
    { color: 'primary' as any, variant: 'filled' as any, class: 'bg-primary border-primary text-white' },
    { color: 'secondary' as any, variant: 'filled' as any, class: 'bg-secondary border-secondary text-white' },
    { color: 'success' as any, variant: 'filled' as any, class: 'bg-success border-success text-white' },
    { color: 'info' as any, variant: 'filled' as any, class: 'bg-info border-info text-white' },
    { color: 'warning' as any, variant: 'filled' as any, class: 'bg-warning border-warning text-white' },
    { color: 'error' as any, variant: 'filled' as any, class: 'bg-error border-error text-white' },
    { color: 'neutral' as any, variant: 'filled' as any, class: 'bg-neutral border-neutral text-white' },

    // Outlined
    { color: 'primary' as any, variant: 'outlined' as any, class: 'border-primary text-primary' },
    { color: 'secondary' as any, variant: 'outlined' as any, class: 'border-secondary text-secondary' },
    { color: 'success' as any, variant: 'outlined' as any, class: 'border-success text-success' },
    { color: 'info' as any, variant: 'outlined' as any, class: 'border-info text-info' },
    { color: 'warning' as any, variant: 'outlined' as any, class: 'border-warning text-warning' },
    { color: 'error' as any, variant: 'outlined' as any, class: 'border-error text-error' },
    { color: 'neutral' as any, variant: 'outlined' as any, class: 'border-neutral text-neutral' },

    // Soft
    { color: 'primary' as any, variant: 'soft' as any, class: 'bg-primary/10 text-primary' },
    { color: 'secondary' as any, variant: 'soft' as any, class: 'bg-secondary/10 text-secondary' },
    { color: 'success' as any, variant: 'soft' as any, class: 'bg-success/10 text-success' },
    { color: 'info' as any, variant: 'soft' as any, class: 'bg-info/10 text-info' },
    { color: 'warning' as any, variant: 'soft' as any, class: 'bg-warning/10 text-warning' },
    { color: 'error' as any, variant: 'soft' as any, class: 'bg-error/10 text-error' },
    { color: 'neutral' as any, variant: 'soft' as any, class: 'bg-neutral/10 text-neutral' },

    // Subtle
    { color: 'primary' as any, variant: 'subtle' as any, class: 'bg-primary/10 border-primary/20 text-primary' },
    { color: 'secondary' as any, variant: 'subtle' as any, class: 'bg-secondary/10 border-secondary/20 text-secondary' },
    { color: 'success' as any, variant: 'subtle' as any, class: 'bg-success/10 border-success/20 text-success' },
    { color: 'info' as any, variant: 'subtle' as any, class: 'bg-info/10 border-info/20 text-info' },
    { color: 'warning' as any, variant: 'subtle' as any, class: 'bg-warning/10 border-warning/20 text-warning' },
    { color: 'error' as any, variant: 'subtle' as any, class: 'bg-error/10 border-error/20 text-error' },
    { color: 'neutral' as any, variant: 'subtle' as any, class: 'bg-neutral/10 border-neutral/20 text-neutral' }
  ],
  /** 默认变体值 */
  defaultVariants: {
    color: 'primary' as (typeof badgeColors)[number],
    variant: 'filled' as (typeof badgeVariants)[number],
    size: 'md' as (typeof badgeSizes)[number]
  }
}

/** 徽章 UI 样式覆盖接口 */
export type BadgeUI = {
  base?: string
  label?: string
  leadingIcon?: string
  trailingIcon?: string
  closeButton?: string
}

export default config
