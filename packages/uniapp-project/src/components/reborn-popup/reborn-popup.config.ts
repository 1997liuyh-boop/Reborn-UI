const PopupDirection = ['center', 'top', 'right', 'bottom', 'left'] as const
export type PopupPosition = (typeof PopupDirection)[number]

export default {
  slots: {
    base: 'fixed bg-white',
    inner: 'relative',
    draw: 'mx-auto mt-2 h-1 w-10 rounded-full bg-gray-3',
    header: 'flex items-center justify-between px-4 py-3 border-b border-gray-2',
    title: 'text-28 font-medium text-gray-9',
    closeIcon: 'text-gray-5 cursor-pointer',
  },
  variants: {
    position: {
      center: {
        base: 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-lg',
      },
      top: {
        base: 'top-0 left-0 right-0',
      },
      bottom: {
        base: 'bottom-0 left-0 right-0 rounded-t-2xl',
      },
      left: {
        base: 'top-0 left-0 bottom-0',
      },
      right: {
        base: 'top-0 right-0 bottom-0',
      },
    },
  },
  defaultVariants: {
    position: 'center' as const,
  },
}
