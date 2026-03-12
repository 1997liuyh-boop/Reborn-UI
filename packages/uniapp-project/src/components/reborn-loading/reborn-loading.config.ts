export const LoadingTypes = ['outline', 'ring', 'spinner', 'bars-scale', 'blocks-shuffle', 'blocks-wave', 'gooey-balls'] as const
export const LoadingColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const config = {
    slots: {
        root: 'inline-block align-middle rb-loading',
        container: 'w-full h-full relative',
        indicator: 'w-full h-full',
        outlineTrack: 'absolute inset-0 rounded-full border-[3px] opacity-20',
        spinnerItem: 'absolute top-0 left-[46%] w-[8%] h-[25%] bg-current rounded-sm origin-[50%_200%]',
        barItem: 'w-[15%] h-[60%] bg-current rounded-sm',
        blockItem: 'absolute w-[40%] h-[40%] bg-current rounded-sm',
        waveItem: 'bg-current rounded-[1px]',
        gooeyItem: 'absolute w-[40%] h-[40%] bg-current rounded-full',
    },
    variants: {
        type: {
            ring: {
                container: 'flex items-center justify-center',
                indicator: 'rounded-full border-[3px]'
            },
            outline: {
                container: 'flex items-center justify-center',
                indicator: 'absolute inset-0 rounded-full border-[3px]'
            },
            spinner: {
                container: 'flex items-center justify-center'
            },
            'bars-scale': {
                container: 'flex justify-between items-center'
            },
            'blocks-shuffle': {
                container: 'block'
            },
            'blocks-wave': {
                container: 'grid grid-cols-3 grid-rows-3 gap-[10%]'
            },
            'gooey-balls': {
                container: 'flex items-center justify-center'
            }
        },
        color: {
            primary: { container: 'text-primary' },
            secondary: { container: 'text-secondary' },
            success: { container: 'text-success' },
            info: { container: 'text-info' },
            warning: { container: 'text-warning' },
            error: { container: 'text-error' },
            neutral: { container: 'text-neutral' }
        }
    },
    defaultVariants: {
        color: 'primary',
        type: 'ring'
    }
} as const

export type LoadingUI = {
    root?: string
    container?: string
    indicator?: string
    outlineTrack?: string
    spinnerItem?: string
    barItem?: string
    blockItem?: string
    waveItem?: string
    gooeyItem?: string
}

export default config
