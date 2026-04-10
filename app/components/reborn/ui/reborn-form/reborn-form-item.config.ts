const size = ['sm', 'md', 'lg'] as const
const labelPositions = ['left', 'top', 'right'] as const

export default {
    slots: {
        root: 'flex gap-4 mb-4 items-start',
        wrapper: 'flex-1 min-w-0',
        label: 'text-gray-8 dark:text-gray-1 font-semibold flex items-center shrink-0 min-h-[40px]',
        content: 'relative w-full flex-1',
        error: 'text-caption-lg text-red-5 mt-1.5 animate-in slide-in-from-top-1 fade-in duration-300',
    },
    variants: {
        size: {
            sm: {
                label: 'text-sm',
            },
            md: {
                label: 'text-base',
            },
            lg: {
                label: 'text-lg',
            },
        },
        error: {
            true: {
                root: 're-form-item--error',
            },
        },
        labelPosition: {
            left: {
                root: 'flex-row',
                label: 'justify-start text-left',
            },
            right: {
                root: 'flex-row',
                label: 'justify-end text-right',
            },
            top: {
                root: 'flex-col items-stretch',
                label: 'justify-start text-left w-full min-h-0 mb-2',
            },
        },
    },
    defaultVariants: {
        size: 'sm',
        error: false,
        labelPosition: 'left',
    },
} as const

export { size as formItemLabelSize, labelPositions as formItemLabelPositions }
