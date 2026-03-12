export const loadMoreColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const LoadMoreState = ['loading', 'error', 'finished'] as const

export type LoadMoreUI = {
    root?: string
    divider?: string
    line?: string
    text?: string
    errorText?: string
    refresh?: string
}

const config = {
    slots: {
        root: 'w-full h-[48px] leading-[48px] text-center text-[#999999] bg-transparent',
        divider: 'flex items-center justify-center w-[80%] mx-auto',
        line: 'h-[1px] bg-[#e8e8e8] flex-1',
        text: 'inline-block text-[14px] align-middle',
        errorText: 'inline-block text-[14px] align-middle px-[6px] cursor-pointer',
        refresh: 'inline-block align-middle text-[16px] cursor-pointer ml-1',
    },
    variants: {
        color: {
            primary: { text: 'text-primary', errorText: 'text-primary', refresh: 'text-primary' },
            secondary: { text: 'text-secondary', errorText: 'text-secondary', refresh: 'text-secondary' },
            success: { text: 'text-success', errorText: 'text-success', refresh: 'text-success' },
            info: { text: 'text-info', errorText: 'text-info', refresh: 'text-info' },
            warning: { text: 'text-warning', errorText: 'text-warning', refresh: 'text-warning' },
            error: { text: 'text-error', errorText: 'text-error', refresh: 'text-error' },
            neutral: { text: 'text-neutral', errorText: 'text-neutral', refresh: 'text-neutral' },
        },
        state: {
            finished: { text: 'px-2', },
            error: {},
            loading: {},
        }
    },
    defaultVariants: {
        color: 'neutral',
    },
} as const

export default config
