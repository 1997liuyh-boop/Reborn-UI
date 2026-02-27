const size = ['sm', 'md', 'lg'] as const
const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export { color as switchColors, size as switchSizes }

export default {
  slots: {
    wrapper: 'inline-flex items-center gap-3 cursor-pointer select-none',
    input: 'sr-only',
    track:
      'relative inline-flex items-center rounded-full bg-gray-2 transition-colors ring-1 ring-transparent data-[loading=true]:cursor-wait data-[loading=true]:opacity-80',
    thumb:
      'absolute left-0.5 top-0.5 flex items-center justify-center rounded-full bg-white shadow transition-transform duration-200',
    activeLabel: 'text-gray-5 dark:text-gray-4 text-sm font-medium transition-colors',
    inactiveLabel: 'text-gray-5 dark:text-gray-4 text-sm font-medium transition-colors',
    loading: 'border-2 border-gray-2 border-t-current rounded-full animate-spin w-full h-full',
  },
  variants: {
    checked: {
      true: {
        track: 'bg-primary-500', // Default, will be overridden by color variants
        thumb: 'translate-x-5', // Default, will be overridden by size variants
      },
      false: {
        track: 'bg-gray-2 dark:bg-gray-7',
        thumb: 'translate-x-0',
      },
    },
    size: {
      sm: {
        track: 'h-5 w-9',
        thumb: 'h-4 w-4',
        activeLabel: 'text-xs',
        inactiveLabel: 'text-xs',
      },
      md: {
        track: 'h-6 w-11',
        thumb: 'h-5 w-5',
        activeLabel: 'text-sm',
        inactiveLabel: 'text-sm',
      },
      lg: {
        track: 'h-7 w-14',
        thumb: 'h-6 w-6',
        activeLabel: 'text-base',
        inactiveLabel: 'text-base',
      },
    },
    color: {
      primary: { track: '' },
      secondary: { track: '' },
      success: { track: '' },
      info: { track: '' },
      warning: { track: '' },
      error: { track: '' },
      neutral: { track: '' },
    },
    error: {
      true: {
        track: 'ring-error',
      },
    },
  },
  compoundVariants: [
    // Size + Checked translations
    { size: 'sm', checked: true, class: { thumb: 'translate-x-4' } },
    { size: 'md', checked: true, class: { thumb: 'translate-x-5' } },
    { size: 'lg', checked: true, class: { thumb: 'translate-x-7' } },

    // Color + Checked backgrounds
    { color: 'primary', checked: true, class: { track: 'bg-primary', loading: 'border-t-primary' } },
    { color: 'secondary', checked: true, class: { track: 'bg-secondary', loading: 'border-t-secondary' } },
    { color: 'success', checked: true, class: { track: 'bg-success', loading: 'border-t-success' } },
    { color: 'info', checked: true, class: { track: 'bg-info', loading: 'border-t-info' } },
    { color: 'warning', checked: true, class: { track: 'bg-warning', loading: 'border-t-warning' } },
    { color: 'error', checked: true, class: { track: 'bg-error', loading: 'border-t-error' } },
    { color: 'neutral', checked: true, class: { track: 'bg-neutral', loading: 'border-t-neutral' } },

    // Color + Checked activeLabel text colors
    { color: 'primary', checked: true, class: { activeLabel: 'text-primary dark:text-primary' } },
    { color: 'secondary', checked: true, class: { activeLabel: 'text-secondary dark:text-secondary' } },
    { color: 'success', checked: true, class: { activeLabel: 'text-success dark:text-success' } },
    { color: 'info', checked: true, class: { activeLabel: 'text-info dark:text-info' } },
    { color: 'warning', checked: true, class: { activeLabel: 'text-warning dark:text-warning' } },
    { color: 'error', checked: true, class: { activeLabel: 'text-error dark:text-error' } },
    { color: 'neutral', checked: true, class: { activeLabel: 'text-neutral dark:text-neutral' } },

    // Color + Unchecked inactiveLabel text colors
    { color: 'primary', checked: false, class: { inactiveLabel: 'text-primary dark:text-primary' } },
    { color: 'secondary', checked: false, class: { inactiveLabel: 'text-secondary dark:text-secondary' } },
    { color: 'success', checked: false, class: { inactiveLabel: 'text-success dark:text-success' } },
    { color: 'info', checked: false, class: { inactiveLabel: 'text-info dark:text-info' } },
    { color: 'warning', checked: false, class: { inactiveLabel: 'text-warning dark:text-warning' } },
    { color: 'error', checked: false, class: { inactiveLabel: 'text-error dark:text-error' } },
    { color: 'neutral', checked: false, class: { inactiveLabel: 'text-neutral dark:text-neutral' } },
  ],
  defaultVariants: {
    size: 'md',
    color: 'primary',
    checked: false,
  },
}
