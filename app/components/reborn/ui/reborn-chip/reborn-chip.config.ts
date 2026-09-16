const size = ['xs', 'sm', 'md', 'lg', 'xl'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const position = ['top-right', 'bottom-right', 'top-left', 'bottom-left'] as const

export { size as chipSizes, color as chipColors, position as chipPositions }

export default {
  slots: {
    root: 'relative inline-flex items-center justify-center shrink-0 h-fit leading-none',
    base: 'absolute rounded-full flex items-center justify-center font-medium whitespace-nowrap ring-1',
    label: 'text-white'
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
    /**
     * 角标高度 10~18px，字号必须小于高度才塞得进圆点。
     * xs(10px) / sm(12px) 装不下最小字号令牌（--text-sm 12px），这两档按纯圆点处理：
     * 组件不渲染 label，传了 text 也不显示，只留圆点本身做提示，故此处不给 label 类。
     * md/lg 的 8/10px 仍低于令牌下限，无对应档位，只能写字面量；xl 的 12px 落在令牌内，用 text-sm。
     * 行高：md/lg 的字面量字号不带行高，继承 root 的 leading-none；xl 的 text-sm 自带 20px 行高，
     * 且 --tw-leading 注册为 inherits:false，root 的 leading-none 压不到它——但 12px 字形在 20px
     * 行盒里居中，实际仍落在 18px 圆点内，溢出的只是不可见的行盒。
     */
    size: {
      xs: { base: 'h-[10px] min-w-[10px]' },
      sm: { base: 'h-[12px] min-w-[12px]' },
      md: { base: 'h-[14px] min-w-[14px]', label: 'text-[8px]' },
      lg: { base: 'h-[16px] min-w-[16px]', label: 'text-[10px]' },
      xl: { base: 'h-[18px] min-w-[18px]', label: 'text-sm' }
    },
    position: {
      'top-right': { base: 'top-0 right-0' },
      'bottom-right': { base: 'bottom-0 right-0' },
      'top-left': { base: 'top-0 left-0' },
      'bottom-left': { base: 'bottom-0 left-0' }
    },
    inset: {
      true: { base: '' },
      false: { base: '' }
    },
    standalone: {
      true: { base: 'absolute' },
      false: { base: '' }
    }
  },
  compoundVariants: [
    {
      inset: false,
      position: 'top-right' as const,
      class: { base: '-translate-y-1/2 translate-x-1/2 transform' }
    },
    {
      inset: false,
      position: 'bottom-right' as const,
      class: { base: 'translate-y-1/2 translate-x-1/2 transform' }
    },
    {
      inset: false,
      position: 'top-left' as const,
      class: { base: '-translate-y-1/2 -translate-x-1/2 transform' }
    },
    {
      inset: false,
      position: 'bottom-left' as const,
      class: { base: 'translate-y-1/2 -translate-x-1/2 transform' }
    }
  ],
  defaultVariants: {
    size: 'md' as const,
    color: 'primary' as const,
    position: 'top-right' as const,
    inset: false,
    standalone: false
  }
}
