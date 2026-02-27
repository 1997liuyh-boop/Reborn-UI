const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

const config = {
  slots: {
    root: 'relative box-border shrink-0 grow-0 basis-auto min-h-0 min-w-0 flex flex-row items-center bg-white rounded-lg p-2 transition-all duration-200',
    inner: 'h-full min-h-0 flex-1 text-28 text-gray-7 bg-transparent disabled:cursor-not-allowed disabled:opacity-50 w-full',
    text: 'absolute right-2 bottom-2 text-xs text-gray-5 pointer-events-none',
  },
  variants: {
    size: {
      sm: {
        inner: 'text-26',
      },
      md: {
        inner: 'text-28',
      },
      lg: {
        inner: 'text-32',
      },
    },
    border: {
      true: {
        root: 'ring-1 ring-gray-4 dark:ring-gray-1',
      },
    },
    focused: {
      true: {},
    },
    disabled: {
      true: {
        root: 'bg-gray-3 text-gray-5',
        inner: 'cursor-not-allowed',
      },
    },
    error: {
      true: {
        root: 'ring-error text-error',
        inner: 'placeholder:text-error/50',
      },
    },
    hasCount: {
      true: {
        inner: 'pb-6',
      },
    },
    color: {
      primary: {
        root: '',
      },
      secondary: {
        root: '',
      },
      success: {
        root: '',
      },
      info: {
        root: '',
      },
      warning: {
        root: '',
      },
      error: {
        root: '',
      },
      neutral: {
        root: '',
      },
    },
  },
  compoundVariants: [
    {
      focused: true,
      color: 'primary' as (typeof colors)[number],
      class: {
        root: 'ring-2 ring-primary',
      },
    },
    {
      focused: true,
      color: 'secondary' as (typeof colors)[number],
      class: {
        root: 'ring-2 ring-secondary',
      },
    },
    {
      focused: true,
      color: 'success' as (typeof colors)[number],
      class: {
        root: 'ring-2 ring-success',
      },
    },
    {
      focused: true,
      color: 'info' as (typeof colors)[number],
      class: {
        root: 'ring-2 ring-info',
      },
    },
    {
      focused: true,
      color: 'warning' as (typeof colors)[number],
      class: {
        root: 'ring-2 ring-warning',
      },
    },
    {
      focused: true,
      color: 'error' as (typeof colors)[number],
      class: {
        root: 'ring-2 ring-error',
      },
    },
    {
      focused: true,
      color: 'neutral' as (typeof colors)[number],
      class: {
        root: 'ring-2 ring-neutral',
      },
    },
  ],
  defaultVariants: {
    size: 'md' as (typeof sizes)[number],
    border: true,
    color: 'primary' as (typeof colors)[number],
  },
}

export { colors as textareaColors, sizes as textareaSizes }
export default config
