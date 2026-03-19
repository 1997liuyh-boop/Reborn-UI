export const paginationModes = ['multi', 'simple'] as const
export const paginationColors = ['primary', 'success', 'warning', 'error', 'info', 'neutral'] as const

export default {
    slots: {
        root: 'reborn-pagination flex flex-row items-center justify-center gap-2 w-full mt-4',
        item: 'reborn-pagination-item flex items-center justify-center rounded-md transition-all duration-200 select-none border border-transparent active:scale-95 size-7 min-w-7',
        prev: 'reborn-pagination-prev',
        next: 'reborn-pagination-next',
        ellipsis: 'reborn-pagination-ellipsis flex items-center justify-center h-7 w-7',
        simpleContent: 'reborn-pagination-simple-content flex items-center gap-2 text-28 font-medium text-gray-6 dark:text-gray-2'
    },
    variants: {
        mode: {
            multi: {},
            simple: {
                root: 'justify-between'
            }
        },
        active: {
            true: {
                item: 'font-bold transform scale-105 shadow-sm'
            },
            false: {
                item: 'text-gray-6 dark:text-gray-4'
            }
        },
        background: {
            true: {
                item: 'bg-gray-2 dark:bg-gray-8 border border-gray-3 dark:border-gray-8 shadow-sm'
            },
            false: {
                item: 'bg-transparent border-transparent shadow-none'
            }
        },
        disabled: {
            true: {
                item: 'opacity-40 bg-gray-2/50 text-gray-4 border-gray-4 dark:bg-gray-8 dark:text-gray-4 dark:border-gray-7 cursor-not-allowed pointer-events-none'
            }
        },
        color: {
            primary: { item: 'text-primary' },
            success: { item: 'text-success' },
            warning: { item: 'text-warning' },
            error: { item: 'text-error' },
            info: { item: 'text-info' },
            neutral: { item: 'text-gray-6' }
        }
    },
    compoundVariants: [
        // Active states WITH background
        { active: true, background: true, color: 'primary', class: { item: 'bg-primary text-white border-primary shadow-md transform scale-110' } },
        { active: true, background: true, color: 'success', class: { item: 'bg-success text-white border-success shadow-md transform scale-110' } },
        { active: true, background: true, color: 'warning', class: { item: 'bg-warning text-white border-warning shadow-md transform scale-110' } },
        { active: true, background: true, color: 'error', class: { item: 'bg-error text-white border-error shadow-md transform scale-110' } },
        { active: true, background: true, color: 'info', class: { item: 'bg-info text-white border-info shadow-md transform scale-110' } },
        { active: true, background: true, color: 'neutral', class: { item: 'bg-gray-6 text-white border-gray-6 shadow-md transform scale-110' } },

        // Active states WITHOUT background (only text color)
        { active: true, background: false, color: 'primary', class: { item: 'text-primary scale-110 font-black' } },
        { active: true, background: false, color: 'success', class: { item: 'text-success scale-110 font-black' } },
        { active: true, background: false, color: 'warning', class: { item: 'text-warning scale-110 font-black' } },
        { active: true, background: false, color: 'error', class: { item: 'text-error scale-110 font-black' } },
        { active: true, background: false, color: 'info', class: { item: 'text-info scale-110 font-black' } },
        { active: true, background: false, color: 'neutral', class: { item: 'text-gray-8 dark:text-gray-1 scale-110 font-black' } }
    ],
    defaultVariants: {
        mode: 'multi',
        color: 'primary',
        active: false,
        disabled: false
    }
}
