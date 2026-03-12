export type LoadingType = 'outline' | 'ring' | 'spinner' | 'bars-scale' | 'blocks-shuffle' | 'blocks-wave' | 'gooey-balls'
export type LoadingColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
const config = {
    slots: {
        root: 'inline-block align-middle rb-loading',
        container: 'w-full h-full relative',
        indicator: 'w-full h-full',
        spinnerItem: 'absolute top-0 left-[46%] w-[8%] h-[25%] bg-current rounded-sm origin-[50%_200%] animate-[rb-spinner_1s_linear_infinite]',
        barItem: 'w-[15%] h-[60%] bg-current rounded-sm animate-[rb-bars-scale_1s_ease-in-out_infinite]',
        blockItem: 'absolute w-[40%] h-[40%] bg-current rounded-sm',
        waveItem: 'bg-current rounded-[1px] animate-[rb-blocks-wave_1s_ease-in-out_infinite]',
        gooeyItem: 'absolute w-[40%] h-[40%] bg-current rounded-full',
    },
    variants: {
        type: {
            ring: {
                container: 'flex items-center justify-center',
                indicator: 'rounded-full border-[3px] border-current border-t-transparent animate-[rb-rotate_0.8s_linear_infinite]'
            },
            outline: {
                container: 'flex items-center justify-center',
                indicator: 'relative before:content-[\'\'] before:absolute before:inset-0 before:border-[3px] before:border-current before:opacity-20 before:rounded-full after:content-[\'\'] after:absolute after:inset-0 after:border-[3px] after:border-current after:border-t-transparent after:rounded-full after:animate-[rb-rotate_0.8s_linear_infinite]'
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
    spinnerItem?: string
    barItem?: string
    blockItem?: string
    waveItem?: string
    gooeyItem?: string
}

export default config
