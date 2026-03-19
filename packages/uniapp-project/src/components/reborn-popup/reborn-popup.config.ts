const PopupDirection = ['center', 'top', 'right', 'bottom', 'left'] as const
const PopupColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export type PopupPosition = (typeof PopupDirection)[number]
export type PopupColor = (typeof PopupColors)[number]

export default {
  slots: {
    base: 'fixed bg-white',
    inner: 'relative',
    draw: 'mx-auto mt-2 h-1 w-10 rounded-full bg-gray-3',
    header: 'flex items-center justify-between px-4 py-2',
    title: 'text-30 font-medium text-gray-9',
    closeIcon: 'text-gray-5 cursor-pointer',
  },
  variants: {
    position: {
      center: {
        base: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
      },
      top: {
        base: 'top-0 left-0 right-0',
      },
      bottom: {
        base: 'bottom-0 left-0 right-0',
      },
      left: {
        base: 'top-0 left-0 bottom-0',
      },
      right: {
        base: 'top-0 right-0 bottom-0',
      },
    },
    color: {
      primary: {
        draw: 'bg-primary/50',
      },
      secondary: {
        draw: 'bg-secondary/50',
      },
      success: {
        draw: 'bg-success/50',
      },
      info: {
        draw: 'bg-info/50',
      },
      warning: {
        draw: 'bg-warning/50',
      },
      error: {
        draw: 'bg-error/50',
      },
      neutral: {
        draw: 'bg-neutral/50',
      },
    },
    round: {
      true: {
        base: '',
      },
      false: {
        base: '',
      },
    },
  },
  compoundVariants: [
    {
      position: 'center' as const,
      round: true,
      class: { base: 'rounded-lg' },
    },
    {
      position: 'top' as const,
      round: true,
      class: { base: 'rounded-b-2xl' },
    },
    {
      position: 'bottom' as const,
      round: true,
      class: { base: 'rounded-t-2xl' },
    },
    {
      position: 'left' as const,
      round: true,
      class: { base: 'rounded-r-2xl' },
    },
    {
      position: 'right' as const,
      round: true,
      class: { base: 'rounded-l-2xl' },
    },
  ],
  defaultVariants: {
    position: 'center' as const,
    color: 'neutral' as const,
    round: true,
  },
}
