export const selectDateSizes = ['sm', 'md', 'lg'] as const
export const selectDateColors = ['primary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export default {
  slots: {
    wrapper: 'w-full',
    popupOp: 'flex flex-row items-center justify-center gap-2 p-3',
    rangeBox: 'px-3 pb-5 pt-2',
    rangeValues: 'flex flex-row items-center justify-center',
    rangeStart: 'flex-1 rounded-xl border border-solid p-2 text-center transition-colors',
    rangeEnd: 'flex-1 rounded-xl border border-solid p-2 text-center transition-colors',
    shortcuts: 'mb-4 flex flex-row flex-wrap items-center gap-2',
    shortcutItem: 'flex cursor-pointer items-center gap-1 rounded-md border border-solid px-2 py-1 text-xs transition-colors',
    separator: 'text-gray-5 mx-3 text-sm',
    rangeValueText: 'text-center block w-full',
    rangePlaceholder: 'text-surface-400 block w-full text-center',
    footer: 'flex flex-row items-center justify-center gap-2 px-3 pt-3 pb-[calc(0.75rem+var(--window-bottom))]',
    cancel: 'flex-1 ',
    cancelButton: 'w-full',
    confirm: 'flex-1 ',
    confirmButton: 'w-full',
    popup: 'bg-white',
    draw: 'bg-gray-4',
    header: 'bg-white',
    title: 'text-gray-9',
  },
  variants: {
    shortcutActive: {
      true: {},
      false: {
        shortcutItem: `
          border-gray-2
          dark:border-gray-7
          text-gray-6
          dark:text-gray-4
          bg-transparent
        `,
      },
    },
    color: {
      primary: {
        rangeStart: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
        rangeEnd: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
      },
      success: {
        rangeStart: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
        rangeEnd: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
      },
      info: {
        rangeStart: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
        rangeEnd: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
      },
      warning: {
        rangeStart: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
        rangeEnd: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
      },
      error: {
        rangeStart: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
        rangeEnd: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
      },
      neutral: {
        rangeStart: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
        rangeEnd: `
          border-gray-2
          dark:border-gray-6
          bg-gray-1
          dark:bg-gray-8
        `,
      },
    },
    rangeActive: {
      start: {
        rangeStart: `
          border-primary bg-transparent
          dark:border-primary dark:bg-transparent
        `,
      },
      end: {
        rangeEnd: `
          border-primary bg-transparent
          dark:border-primary dark:bg-transparent
        `,
      },
    },
  },
  compoundVariants: [
    {
      color: 'success' as const,
      rangeActive: 'start' as const,
      class: {
        rangeStart: `
          border-success bg-transparent
          dark:border-success dark:bg-transparent
        `,
      },
    },
    {
      color: 'success' as const,
      rangeActive: 'end' as const,
      class: {
        rangeEnd: `
          border-success bg-transparent
          dark:border-success dark:bg-transparent
        `,
      },
    },
    {
      color: 'info' as const,
      rangeActive: 'start' as const,
      class: {
        rangeStart: `
          border-info bg-transparent
          dark:border-info dark:bg-transparent
        `,
      },
    },
    {
      color: 'info' as const,
      rangeActive: 'end' as const,
      class: {
        rangeEnd: `
          border-info bg-transparent
          dark:border-info dark:bg-transparent
        `,
      },
    },
    {
      color: 'warning' as const,
      rangeActive: 'start' as const,
      class: {
        rangeStart: `
          border-warning bg-transparent
          dark:border-warning dark:bg-transparent
        `,
      },
    },
    {
      color: 'warning' as const,
      rangeActive: 'end' as const,
      class: {
        rangeEnd: `
          border-warning bg-transparent
          dark:border-warning dark:bg-transparent
        `,
      },
    },
    {
      color: 'error' as const,
      rangeActive: 'start' as const,
      class: {
        rangeStart: `
          border-error bg-transparent
          dark:border-error dark:bg-transparent
        `,
      },
    },
    {
      color: 'error' as const,
      rangeActive: 'end' as const,
      class: {
        rangeEnd: `
          border-error bg-transparent
          dark:border-error dark:bg-transparent
        `,
      },
    },
    {
      color: 'neutral' as const,
      rangeActive: 'start' as const,
      class: {
        rangeStart: `
          border-neutral bg-transparent
          dark:border-neutral dark:bg-transparent
        `,
      },
    },
    {
      color: 'neutral' as const,
      rangeActive: 'end' as const,
      class: {
        rangeEnd: `
          border-neutral bg-transparent
          dark:border-neutral dark:bg-transparent
        `,
      },
    },
    // 快捷选项选中态（按 color）
    { shortcutActive: true as const, color: 'primary' as const, class: { shortcutItem: 'border-primary text-primary bg-primary-50 dark:bg-primary-900/20' } },
    { shortcutActive: true as const, color: 'success' as const, class: { shortcutItem: 'border-success text-success bg-success-50 dark:bg-success-900/20' } },
    { shortcutActive: true as const, color: 'info' as const, class: { shortcutItem: 'border-info text-info bg-info-50 dark:bg-info-900/20' } },
    { shortcutActive: true as const, color: 'warning' as const, class: { shortcutItem: 'border-warning text-warning bg-warning-50 dark:bg-warning-900/20' } },
    { shortcutActive: true as const, color: 'error' as const, class: { shortcutItem: 'border-error text-error bg-error-50 dark:bg-error-900/20' } },
    { shortcutActive: true as const, color: 'neutral' as const, class: { shortcutItem: 'border-neutral text-neutral bg-neutral-50 dark:bg-neutral-900/20' } },
  ],
  defaultVariants: {
    color: 'primary' as const,
    shortcutActive: false as const,
  },
}
