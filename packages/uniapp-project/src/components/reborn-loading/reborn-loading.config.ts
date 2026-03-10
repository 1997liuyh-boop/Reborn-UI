export type LoadingType = 'outline' | 'ring' | 'spinner' | 'bars-scale' | 'blocks-shuffle' | 'blocks-wave' | 'gooey-balls'
export type LoadingColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
const config = {
    slots: {
        root: 'inline-block align-middle rb-loading',
        body: 'w-full h-full flex items-center justify-center svg-spinners'
    },
    variants: {
        color: {
            primary: { body: 'text-primary' },
            secondary: { body: 'text-secondary' },
            success: { body: 'text-success' },
            info: { body: 'text-info' },
            warning: { body: 'text-warning' },
            error: { body: 'text-error' },
            neutral: { body: 'text-neutral' }
        }
    },
    defaultVariants: {
        color: 'primary'
    }
} as const

export type LoadingUI = {
    root?: string
    body?: string
}

export default config
