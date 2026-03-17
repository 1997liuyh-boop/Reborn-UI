const size = ['sm', 'md', 'lg'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export { color as selectTriggerColors, size as selectTriggerSizes }

export default {
  slots: {
    wrapper:
      'flex flex-row items-center w-full box-border rounded-lg bg-white dark:bg-gray-8 border border-solid border-gray-3 dark:border-gray-7 transition-[border-color] duration-200 px-2.5',
    content: 'flex-1 truncate text-gray-8 dark:text-gray-1',
    text: 'text-28',
    placeholder: 'text-28 text-gray-4',
    iconWrapper: 'flex flex-row items-center justify-center pl-2.5',
    clearIcon: 'text-gray-4 size-4',
    arrowIcon: 'text-gray-4 size-4 transition-transform duration-200 origin-center',
  },
  variants: {
    size: {
      sm: {
        wrapper: 'h-input-sm',
        text: 'text-24',
        placeholder: 'text-24',
      },
      md: {
        wrapper: 'h-input-md',
        text: 'text-28',
        placeholder: 'text-28',
      },
      lg: {
        wrapper: 'h-input-lg',
        text: 'text-32',
        placeholder: 'text-32',
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
    disabled: {
      true: {
        wrapper: 'opacity-70 bg-gray-1 dark:bg-gray-7 pointer-events-none',
        text: 'text-gray-4',
      },
    },
    focus: {
      true: {
        arrowIcon: 'rotate-180',
      },
    },
    error: {
      true: {
        wrapper: 'border-error dark:border-error',
      },
    },
  },
  compoundVariants: [
    { color: 'primary' as (typeof color)[number], focus: true as const, class: { wrapper: 'border-primary dark:border-primary' } },
    { color: 'secondary' as (typeof color)[number], focus: true as const, class: { wrapper: 'border-secondary dark:border-secondary' } },
    { color: 'success' as (typeof color)[number], focus: true as const, class: { wrapper: 'border-success dark:border-success' } },
    { color: 'info' as (typeof color)[number], focus: true as const, class: { wrapper: 'border-info dark:border-info' } },
    { color: 'warning' as (typeof color)[number], focus: true as const, class: { wrapper: 'border-warning dark:border-warning' } },
    { color: 'error' as (typeof color)[number], focus: true as const, class: { wrapper: 'border-error dark:border-error' } },
    { color: 'neutral' as (typeof color)[number], focus: true as const, class: { wrapper: 'border-neutral dark:border-neutral' } },
  ],
  defaultVariants: {
    size: 'md' as (typeof size)[number],
    color: 'primary' as (typeof color)[number],
  },
}
