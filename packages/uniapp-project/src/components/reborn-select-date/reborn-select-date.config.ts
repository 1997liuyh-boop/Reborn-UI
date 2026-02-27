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
    separator: 'text-gray-5 mx-3 text-sm',
  },
  variants: {
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
  ],
  defaultVariants: {
    color: 'primary' as const,
  },
}
