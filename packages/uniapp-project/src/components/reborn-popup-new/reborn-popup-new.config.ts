export default {
  slots: {
    base: 'fixed',
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
  },
  defaultVariants: {
    position: 'center' as const,
  },
}
