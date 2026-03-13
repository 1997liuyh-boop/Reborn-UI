export const toastColors = ['default', 'primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const toastPositions = ['top', 'middle-top', 'middle', 'bottom'] as const
export const toastDirections = ['horizontal', 'vertical'] as const

const config = {
    slots: {
        root: 'rb-toast inline-block max-w-[70%] rounded-xl px-4 py-3 shadow-lg transition-all duration-300',
        msg: 'text-left text-24 break-all',
    },
    variants: {
        position: {
            top: { root: '-translate-y-[40vh]' },
            'middle-top': { root: '-translate-y-[18.8vh]' },
            middle: { root: '' },
            bottom: { root: 'translate-y-[40vh]' },
        },
        direction: {
            horizontal: { root: '' },
            vertical: { root: 'flex-col' },
        },
        withIcon: {
            true: { root: 'inline-flex items-center' },
            false: { root: '' },
        },
        color: {
            default: { root: 'bg-black/80 text-white' },
            primary: { root: 'bg-primary text-primary-foreground' },
            secondary: { root: 'bg-secondary text-secondary-foreground' },
            success: { root: 'bg-success text-success-foreground' },
            info: { root: 'bg-info text-info-foreground' },
            warning: { root: 'bg-warning text-warning-foreground' },
            error: { root: 'bg-error text-error-foreground' },
            neutral: { root: 'bg-neutral text-neutral-foreground' },
        },
    },
    defaultVariants: {
        color: 'default',
        position: 'middle-top',
        direction: 'horizontal',
        withIcon: false,
    },
} as const

export default config
