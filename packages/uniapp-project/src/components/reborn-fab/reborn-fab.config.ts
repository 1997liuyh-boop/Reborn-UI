export const fabPositions = [
    'left-top',
    'right-top',
    'left-bottom',
    'right-bottom',
    'left-center',
    'right-center',
    'top-center',
    'bottom-center'
] as const

export const fabDirections = ['top', 'bottom', 'left', 'right'] as const

export const fabColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export default {
    slots: {
        root: 'fixed pointer-events-none transition-all duration-300 ease-out',
        trigger: 'pointer-events-auto flex items-center justify-center rounded-full shadow-lg transition-transform active:scale-95 duration-200',
        icon: 'text-white text-40',
        actions: 'absolute pointer-events-none flex gap-3 transition-all duration-300',
        action: 'pointer-events-auto flex items-center justify-center rounded-full shadow-md scale-0 transition-transform duration-300'
    },
    variants: {
        color: {
            primary: { trigger: 'bg-primary' },
            secondary: { trigger: 'bg-secondary' },
            success: { trigger: 'bg-success' },
            info: { trigger: 'bg-info' },
            warning: { trigger: 'bg-warning' },
            error: { trigger: 'bg-error' },
            neutral: { trigger: 'bg-neutral' }
        },
        size: {
            sm: {
                trigger: 'w-10 h-10',
                icon: 'text-32'
            },
            md: {
                trigger: 'w-12 h-12',
                icon: 'text-40'
            },
            lg: {
                trigger: 'w-14 h-14',
                icon: 'text-48'
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
