export const fabDirections = ['top', 'bottom', 'left', 'right'] as const
export const fabPositions = ['left-top', 'right-top', 'left-bottom', 'right-bottom'] as const
export const fabTriggers = ['click', 'hover'] as const
export const fabColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export default {
    slots: {
        root: 'fixed pointer-events-none transition-all duration-300 ease-out',
        trigger: 'pointer-events-auto flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 duration-200 cursor-pointer',
        icon: 'text-white text-3xl',
        actions: 'absolute pointer-events-none flex gap-3 transition-all duration-500 ease-[cubic-bezier(0.68,-0.55,0.27,1.55)]',
    },
    variants: {
        color: {
            primary: { trigger: 'bg-primary' },
            secondary: { trigger: 'bg-secondary' },
            success: { trigger: 'bg-success' },
            info: { trigger: 'bg-info' },
            warning: { trigger: 'bg-warning' },
            error: { trigger: 'bg-error' },
            neutral: { trigger: 'bg-neutral text-white' }
        },
        size: {
            sm: {
                trigger: 'size-10',
                icon: 'text-2xl'
            },
            md: {
                trigger: 'size-12',
                icon: 'text-3xl'
            },
            lg: {
                trigger: 'size-14',
                icon: 'text-4xl'
            }
        },
        active: {
            true: {
                trigger: 'rotate-45'
            },
            false: {
                trigger: 'rotate-0'
            }
        }
    },
    defaultVariants: {
        color: 'primary' as (typeof fabColors)[number],
        size: 'md' as any,
        active: false
    }
}
