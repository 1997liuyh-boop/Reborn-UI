const size = ['sm', 'md', 'lg'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export { color as sliderColors, size as sliderSizes }

export default {
  slots: {
    wrapper: 'flex flex-row items-center w-full overflow-visible',
    inner: 'flex-1 relative h-full flex flex-row items-center overflow-visible',
    picker: 'absolute left-0 w-full',
    track: 'relative w-full rounded-full overflow-visible bg-gray-3',
    progress: 'absolute top-0 h-full rounded-full',
    thumb:
            'absolute rounded-full border-2 border-solid border-white pointer-events-none z-[1] shadow-[0_0_1px_1px_rgba(100,100,100,0.1)]',
    thumbActive: 'z-[2]',
    value: 'text-center w-[50px] dark:text-gray-1',
  },
  variants: {
    size: {
      sm: {
        track: 'h-1',
        value: 'text-[length:var(--text-size-24)]',
      },
      md: {
        track: 'h-1.5',
        value: 'text-[length:var(--text-size-28)]',
      },
      lg: {
        track: 'h-2',
        value: 'text-[length:var(--text-size-32)]',
      },
    },
    color: {
      primary: {
        progress: 'bg-primary',
        thumb: 'bg-primary',
      },
      secondary: {
        progress: 'bg-secondary',
        thumb: 'bg-secondary',
      },
      success: {
        progress: 'bg-success',
        thumb: 'bg-success',
      },
      info: {
        progress: 'bg-info',
        thumb: 'bg-info',
      },
      warning: {
        progress: 'bg-warning',
        thumb: 'bg-warning',
      },
      error: {
        progress: 'bg-error',
        thumb: 'bg-error',
      },
      neutral: {
        progress: 'bg-neutral',
        thumb: 'bg-neutral',
      },
    },
    disabled: {
      true: {
        wrapper: 'opacity-50',
      },
    },
  },
  defaultVariants: {
    size: 'md' as (typeof size)[number],
    color: 'primary' as (typeof color)[number],
  },
}
