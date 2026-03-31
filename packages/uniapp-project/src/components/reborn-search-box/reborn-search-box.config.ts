const sizes = ['sm', 'md', 'lg'] as const
const colors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export type SearchBoxSize = (typeof sizes)[number]
export type SearchBoxColor = (typeof colors)[number]

export { colors as searchBoxColors, sizes as searchBoxSizes }

interface SearchBoxInputUi {
    wrapper: string
    icon: string
    iconBox: string
}

export const searchBoxInputUi: Record<SearchBoxSize, SearchBoxInputUi> = {
    sm: { wrapper: 'rounded-full!', icon: '!text-36', iconBox: 'gap-8!' },
    md: { wrapper: 'rounded-full!', icon: '!text-48', iconBox: 'gap-12!' },
    lg: { wrapper: 'rounded-full!', icon: '!text-48', iconBox: 'gap-12!' },
}

export default {
    slots: {
        wrapper: 'flex gap-2',
        translateWrapper: 'relative h-[64rpx] w-[64rpx] flex items-center justify-center pointer-events-auto',
        translateCardBase:
            'absolute flex h-[32rpx] w-[32rpx] items-center justify-center rounded-ui-sm border-2 text-[18rpx] font-bold transition-all duration-300 pointer-events-none leading-none',
        translateCardActive: 'z-10 bg-white shadow-sm border-primary text-primary',
        translateCardInactive: 'z-0 border-gray-200 bg-[#f8f9fa] text-gray-4',
        trailing: 'flex h-full flex-row items-center gap-2',
        separator: 'h-1/2 w-[1px] bg-gray-4',
        cameraIcon: 'flex items-center justify-center',
        siteSelector: 'flex items-center gap-1 rounded-ui-base bg-gray-3/80 px-2.5 py-1 pointer-events-auto active:scale-95 transition-all',
    },
    variants: {
        size: {
            sm: {},
            md: {},
            lg: {},
        },
        color: {
            primary: {
                translateCardActive: 'z-10 bg-white shadow-sm border-primary text-primary',
            },
            secondary: {
                translateCardActive: 'z-10 bg-white shadow-sm border-secondary text-secondary',
            },
            success: {
                translateCardActive: 'z-10 bg-white shadow-sm border-success text-success',
            },
            info: {
                translateCardActive: 'z-10 bg-white shadow-sm border-info text-info',
            },
            warning: {
                translateCardActive: 'z-10 bg-white shadow-sm border-warning text-warning',
            },
            error: {
                translateCardActive: 'z-10 bg-white shadow-sm border-error text-error',
            },
            neutral: {
                translateCardActive: 'z-10 bg-white shadow-sm border-neutral text-neutral',
            },
        },
    },
    defaultVariants: {
        size: 'sm',
        color: 'primary',
    },
} as const

