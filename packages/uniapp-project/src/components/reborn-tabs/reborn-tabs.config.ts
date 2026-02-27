const size = ['xs', 'sm', 'md', 'lg', 'xl'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const variant = ['line', 'card'] as const

export { color as TabsColors, size as TabsSizes, variant as TabsVariants }

export default {
  slots: {
    tabs: '',
    scrollbar: 'flex flex-row w-full h-full',
    inner: 'flex flex-row relative',
    item: 'flex flex-row items-center justify-center relative z-10 transition-colors group',
    text: 'font-light whitespace-nowrap',
    line: 'absolute left-0 bottom-0 h-[4px] rounded-full bg-[length:200%] transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform',
    slider: 'absolute top-0 left-0 h-full w-full bg-primary text-white rounded-md transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] will-change-transform z-0',
    active: 'font-medium whitespace-nowrap',
  },
  variants: {
    variant: {
      line: {
        inner: '',
        item: 'hover:text-gray-900 dark:hover:text-gray-100', // Removed static border-b-2
        text: 'text-gray-7',
        active: 'font-semibold text-gray-8',
      },
      card: {
        inner: '',
        item: 'rounded-md',
        text: 'text-gray-7',
        active: 'text-white',
      },
    },
    color: {
      primary: {
        // item: "data-[state=active]:text-primary",
        line: 'bg-[linear-gradient(90deg,var(--color-red-4),var(--color-red-2),var(--color-orange-3),var(--color-orange-1))]',
        slider: 'bg-primary',
      },
      secondary: {
        // item: "data-[state=active]:text-secondary",
        line: 'bg-[linear-gradient(90deg,var(--color-gray-4),var(--color-gray-2),var(--color-orange-3),var(--color-orange-1))]',
        slider: 'bg-secondary',
      },
      success: {
        // item: "data-[state=active]:text-success",
        line: 'bg-[linear-gradient(90deg,var(--color-green-4),var(--color-green-2),var(--color-orange-3),var(--color-orange-1))]',
        slider: 'bg-success',
      },
      info: {
        // item: "data-[state=active]:text-info",
        line: 'bg-[linear-gradient(90deg,var(--color-blue-4),var(--color-blue-2),var(--color-orange-3),var(--color-orange-1))]',
        slider: 'bg-info',
      },
      warning: {
        // item: "data-[state=active]:text-warning",
        line: 'bg-[linear-gradient(90deg,var(--color-orange-4),var(--color-orange-2),var(--color-red-3),var(--color-red-1))]',
        slider: 'bg-warning',
      },
      error: {
        // item: "data-[state=active]:text-error",
        line: 'bg-[linear-gradient(90deg,var(--color-red-4),var(--color-red-2),var(--color-orange-3),var(--color-orange-1))]',
        slider: 'bg-error',
      },
      neutral: {
        // item: "data-[state=active]:text-neutral",
        line: 'bg-[linear-gradient(90deg,var(--color-gray-4),var(--color-gray-2),var(--color-orange-3),var(--color-orange-1))]',
        slider: 'bg-neutral',
      },
    },
    size: {
      xs: {
        scrollbar: 'py-1.5',
        item: 'px-2 text-xs',
        text: 'text-xs',
      },
      sm: {
        scrollbar: 'py-2',
        item: 'px-3 text-sm',
        text: 'text-sm',
      },
      md: {
        scrollbar: 'py-2.5',
        item: 'px-4 text-base',
        text: 'text-base',
      },
      lg: {
        scrollbar: 'py-3',
        item: 'px-5 text-lg',
        text: 'text-lg',
      },
      xl: {
        scrollbar: 'py-3.5',
        item: 'px-6 text-xl',
        text: 'text-xl',
      },
    },
    fill: {
      true: {
        inner: 'w-full',
        item: 'flex-1',
      },
    },
    justify: {
      start: {
        inner: 'justify-start',
      },
      center: {
        inner: 'justify-center',
      },
      end: {
        inner: 'justify-end',
      },
    },
  },
  defaultVariants: {
    variant: 'line' as (typeof variant)[number],
    color: 'primary' as (typeof color)[number],
    size: 'xs' as (typeof size)[number],
    fill: false,
    justify: 'start' as 'start' | 'center' | 'end',
  },
}
