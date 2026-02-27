const color = ['primary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const config = {
  slots: {
    wrapper: 'w-full h-full',
    header: 'flex flex-row items-center py-4',
    headerText: 'flex-1 text-center font-medium text-gray-8 dark:text-gray-2',
    pickerContainer: 'px-1',
    item: 'flex flex-row items-center justify-center  w-full',
    itemText: 'transition-colors duration-200',
    indicator: 'bg-primary/10',
  },
  variants: {
    color: {
      primary: {
        indicator: 'bg-primary/10',
      },
      success: {
        indicator: 'bg-success/10',
      },
      info: {
        indicator: 'bg-info/10',
      },
      warning: {
        indicator: 'bg-warning/10',
      },
      error: {
        indicator: 'bg-error/10',
      },
      neutral: {
        indicator: 'bg-neutral/10',
      },
    },
    active: {
      false: {
        itemText: 'text-gray-8 dark:text-gray-6',
      },
      true: {
        itemText: 'font-bold',
      },
    },
  },
  compoundVariants: [
    { color: 'primary' as (typeof color)[number], active: true as const, class: { itemText: 'text-primary dark:text-primary' } },
    { color: 'success' as (typeof color)[number], active: true as const, class: { itemText: 'text-success dark:text-success' } },
    { color: 'info' as (typeof color)[number], active: true as const, class: { itemText: 'text-info dark:text-info' } },
    { color: 'warning' as (typeof color)[number], active: true as const, class: { itemText: 'text-warning dark:text-warning' } },
    { color: 'error' as (typeof color)[number], active: true as const, class: { itemText: 'text-error dark:text-error' } },
    { color: 'neutral' as (typeof color)[number], active: true as const, class: { itemText: 'text-gray-9 dark:text-white' } },
  ],
  defaultVariants: {
    color: 'primary' as (typeof color)[number],
    active: false,
  },
}

export { color as pickerColors }

export default config
