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
    size: {
      xs: { base: 'h-[10px] min-w-[10px]', label: 'text-[4px]' },
      sm: { base: 'h-[12px] min-w-[12px]', label: 'text-[6px]' },
      md: { base: 'h-[14px] min-w-[14px]', label: 'text-[8px]' },
      lg: { base: 'h-[16px] min-w-[16px]', label: 'text-[10px]' },
      xl: { base: 'h-[18px] min-w-[18px]', label: 'text-[12px]' }
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
