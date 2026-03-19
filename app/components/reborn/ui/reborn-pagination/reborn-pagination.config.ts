export const paginationModes = ['multi', 'simple'] as const
export const paginationColors = ['primary', 'success', 'warning', 'error', 'info', 'neutral'] as const

export type PaginationColor = typeof paginationColors[number]

export default {
    slots: {
        root: 'reborn-pagination flex flex-row items-center justify-center gap-2 w-full',
        item: 'reborn-pagination-item flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer select-none border border-transparent active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-8 min-w-[2rem] px-1 active:bg-gray-1 dark:active:bg-gray-8',
        prev: 'reborn-pagination-prev',
        next: 'reborn-pagination-next',
        ellipsis: 'reborn-pagination-ellipsis flex items-center justify-center pointer-events-none h-8 w-8',
        simpleContent: 'reborn-pagination-simple-content flex items-center gap-2 text-sm font-medium dark:text-gray-2 text-gray-6'
    },
    variants: {
        mode: {
            multi: {},
            simple: {}
        },
        size: {
            sm: {
                item: 'h-7 min-w-[1.75rem] text-xs',
                ellipsis: 'h-7 w-7'
            },
            md: {
                item: 'h-8 min-w-[2rem] text-sm',
                ellipsis: 'h-8 w-8'
            },
            lg: {
                item: 'h-10 min-w-[2.5rem] text-base',
                ellipsis: 'h-10 w-10'
            }
        },
        active: {
            true: {
                item: 'shadow-sm font-bold border-current'
            },
            false: {
                item: 'text-gray-6 dark:text-gray-4'
            }
        },
        background: {
            true: {
                item: 'bg-gray-1/50 border-gray-2 dark:bg-gray-8/50 dark:border-gray-7'
            },
            false: {
                item: 'bg-transparent border-transparent shadow-none'
            }
        },
        disabled: {
            true: {
                item: 'opacity-40 bg-gray-1 text-gray-3 border-gray-1 dark:bg-gray-9 dark:text-gray-6 dark:border-gray-8 cursor-not-allowed pointer-events-none'
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
        { active: true, background: true, color: 'primary', class: { item: 'bg-primary text-white border-primary shadow-md transform scale-105' } },
        { active: true, background: true, color: 'success', class: { item: 'bg-success text-white border-success shadow-md transform scale-105' } },
        { active: true, background: true, color: 'warning', class: { item: 'bg-warning text-white border-warning shadow-md transform scale-105' } },
        { active: true, background: true, color: 'error', class: { item: 'bg-error text-white border-error shadow-md transform scale-105' } },
        { active: true, background: true, color: 'info', class: { item: 'bg-info text-white border-info shadow-md transform scale-105' } },
        { active: true, background: true, color: 'neutral', class: { item: 'bg-gray-6 text-white border-gray-6 shadow-md transform scale-105' } },

        // Active states WITHOUT background (only text color)
        { active: true, background: false, color: 'primary', class: { item: 'text-primary scale-110 font-black' } },
        { active: true, background: false, color: 'success', class: { item: 'text-success scale-110 font-black' } },
        { active: true, background: false, color: 'warning', class: { item: 'text-warning scale-110 font-black' } },
        { active: true, background: false, color: 'error', class: { item: 'text-error scale-110 font-black' } },
        { active: true, background: false, color: 'info', class: { item: 'text-info scale-110 font-black' } },
        { active: true, background: false, color: 'neutral', class: { item: 'text-gray-8 dark:text-gray-1 scale-110 font-black underline underline-offset-4 decoration-2' } }
    ],
    defaultVariants: {
        mode: 'multi',
        color: 'primary',
        active: false,
        disabled: false
    }
}
