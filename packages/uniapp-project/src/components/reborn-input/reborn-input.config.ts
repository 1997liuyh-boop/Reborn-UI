const sizes = ['sm', 'md', 'lg'] as const;
const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const;

const config = {
  slots: {
    wrapper:
      'relative flex w-full items-center transition-colors ring-1 ring-transparent bg-gray-2 dark:bg-gray-8 text-gray-8 dark:text-gray-1',
    input:
      'flex-1 h-full bg-transparent border-0 outline-none px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none transition-colors',
    leading: 'absolute left-3 top-0 bottom-0 flex items-center justify-center text-muted-foreground',
    iconBox: 'absolute bottom-0 right-3 top-0 z-20 flex items-center gap-[16rpx]',
    iconSection: 'self-stretch flex cursor-pointer items-center justify-center text-muted-foreground transition-all hover:opacity-80',
    icon: '',
    separator: 'w-px transition-colors bg-gray-4',
  },
  variants: {
    size: {
      sm: {
        wrapper: 'h-input-sm',
        input: 'text-26 leading-normal',
        icon: 'text-40',
        separator: 'h-[var(--text-size-32)]',
      },
      md: {
        wrapper: 'h-input-md',
        input: 'text-28 leading-normal',
        icon: 'text-40',
        separator: 'h-[var(--text-size-36)]',
      },
      lg: {
        wrapper: 'h-input-lg',
        input: 'text-28 leading-normal',
        icon: 'text-40',
        separator: 'h-[var(--text-size-40)]',
      },
    },
    rounded: {
      true: '',
      false: {
        wrapper: 'rounded-ui-base',
      },
    },
    border: {
      true: {
        wrapper: 'ring-gray-3 dark:ring-gray-7',
      },
      false: {
        wrapper: 'ring-transparent',
      },
    },
    error: {
      true: {
        wrapper: 'ring-error/50 bg-error/5 focus-within:ring-error',
        input: 'text-error placeholder:text-error/50',
      },
    },
    multiline: {
      true: {
        wrapper: 'h-auto py-4 items-start',
        input: 'min-h-[160rpx] resize-none',
      },
    },
    fieldGroup: {
      horizontal: {
        wrapper: 'first:rounded-r-none last:rounded-l-none',
      },
      vertical: {
        wrapper: 'first:rounded-b-none last:rounded-t-none',
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
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
    focus: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      color: 'primary',
      focus: true,
      border: true,
      class: { wrapper: 'bg-white dark:bg-gray-900 ring-primary/65', separator: 'bg-primary/65' },
    },
    {
      color: 'secondary',
      focus: true,
      border: true,
      class: { wrapper: 'bg-white dark:bg-gray-900 ring-secondary/65', separator: 'bg-secondary/65' },
    },
    {
      color: 'success',
      focus: true,
      border: true,
      class: { wrapper: 'bg-white dark:bg-gray-900 ring-success/65', separator: 'bg-success/65' },
    },
    {
      color: 'info',
      focus: true,
      border: true,
      class: { wrapper: 'bg-white dark:bg-gray-900 ring-info/65', separator: 'bg-info/65' },
    },
    {
      color: 'warning',
      focus: true,
      border: true,
      class: { wrapper: 'bg-white dark:bg-gray-900 ring-warning/65', separator: 'bg-warning/65' },
    },
    {
      color: 'error',
      focus: true,
      border: true,
      class: { wrapper: 'bg-white dark:bg-gray-900 ring-error/65', separator: 'bg-error/65' },
    },
    {
      color: 'neutral',
      focus: true,
      border: true,
      class: { wrapper: 'bg-white dark:bg-gray-900 ring-gray-400/65', separator: 'bg-gray-400/65' },
    },
    { size: 'sm', rounded: true, class: { wrapper: 'rounded-ui-sm' } },
    { size: 'md', rounded: true, class: { wrapper: 'rounded-ui-md' } },
    { size: 'lg', rounded: true, class: { wrapper: 'rounded-full' } },
  ] as any,
  defaultVariants: {
    size: 'sm',
    color: 'neutral',
    rounded: true,
    border: true,
    focus: false,
  },
} as const;

export { colors as inputColors, sizes as inputSizes };
export default config;
