const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

const config = {
  slots: {
    wrapper: 'relative flex w-full items-center',
    input:
      'flex w-full bg-gray-2 dark:bg-gray-8 px-3 text-sm text-gray-8 dark:text-gray-1  file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none transition-colors',
    inputItem: 'h-full',
    leading: 'absolute left-3 top-0 bottom-0 flex items-center justify-center text-muted-foreground',
    iconBox: 'absolute bottom-0 right-3 top-0 z-20 flex items-center gap-[16rpx]',
    iconSection: 'flex cursor-pointer items-center justify-center text-muted-foreground transition-all hover:opacity-80',
    separator: 'w-px transition-colors bg-gray-4',
  },
  variants: {
    size: {
      sm: {
        input: 'h-input-sm px-3',
        iconSection: '[--icon-size:var(--text-size-36)]',
        separator: 'h-[var(--text-size-32)]',
      },
      md: {
        input: 'h-input-md px-3',
        iconSection: '[--icon-size:var(--text-size-40)]',
        separator: 'h-[var(--text-size-36)]',
      },
      lg: {
        input: 'h-input-lg px-3',
        iconSection: '[--icon-size:var(--text-size-48)]',
        separator: 'h-[var(--text-size-40)]',
      },
    },
    border: {
      true: {
        input: 'ring-offset-background focus:ring-2 focus:ring-offset-2',
      },
      false: {
        input: 'border-0 focus:ring-0 focus-visible:ring-0',
      },
    },
    multiline: {
      true: {
        input: 'h-auto',
      },
    },
    fieldGroup: {
      horizontal: {
        wrapper: 'first:rounded-r-none last:rounded-l-none',
        input: 'first:rounded-r-none last:rounded-l-none focus:z-10',
      },
      vertical: {
        wrapper: 'first:rounded-b-none last:rounded-t-none',
        input: 'first:rounded-b-none last:rounded-t-none focus:z-10',
      },
    },
    hasLeading: {
      true: {
        input: 'pl-9',
      },
    },
    hasTrailing: {
      true: {
        input: 'pr-9',
      },
    },
    rounded: {
      true: {
        input: 'rounded-full',
      },
      false: {
        input: 'rounded-ui-base',
      },
    },
    error: {
      true: {
        input: 'border-error text-error placeholder:text-error/50 ring-error',
      },
    },
    password: {
      true: {
        inputItem: 'h-full w-[88%]',
      },
      false: {
        inputItem: 'h-full w-[100%]',
      },
    },
    focus: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    { border: true, focus: true, class: { input: 'ring-2 ring-offset-2' } },
    { color: 'primary', border: true, focus: true, class: { input: 'border-primary ring-primary', separator: 'bg-red-4', } },
    { color: 'secondary', border: true, focus: true, class: { input: 'border-secondary ring-secondary', separator: 'bg-gray-8', } },
    { color: 'success', border: true, focus: true, class: { input: 'border-success ring-success', separator: 'bg-green-4', } },
    { color: 'info', border: true, focus: true, class: { input: 'border-info ring-info', separator: 'bg-blue-4', } },
    { color: 'warning', border: true, focus: true, class: { input: 'border-warning ring-warning', separator: 'bg-orange-4', } },
    { color: 'error', border: true, focus: true, class: { input: 'border-error ring-error', separator: 'bg-red-4', } },
    { color: 'neutral', border: true, focus: true, class: { input: 'border-gray-4 ring-gray-4', separator: 'bg-gray-4', } },
  ] as any,
  defaultVariants: {
    size: 'sm',
    color: 'neutral',
    rounded: true,
    border: true,
    focus: false,
  },
} as const;

export { colors as inputColors, sizes as inputSizes }
export default config
