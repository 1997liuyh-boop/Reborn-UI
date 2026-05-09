import type { ClassValue } from 'clsx'

export const slideVerifyColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const slideVerifySizes = ['sm', 'md', 'lg'] as const
export const slideVerifyShapes = ['pill', 'square'] as const

export type SlideVerifyColor = (typeof slideVerifyColors)[number]
export type SlideVerifySize = (typeof slideVerifySizes)[number]
export type SlideVerifyShape = (typeof slideVerifyShapes)[number]

export type SlideVerifyUI = Partial<{
    root: ClassValue
    /** 未完成态轨道样式 */
    track: ClassValue
    /** 未完成态左侧进度区域样式 */
    progress: ClassValue
    content: ClassValue
    /** 未完成态文案样式 */
    text: ClassValue
    /** 未完成态滑块样式 */
    thumb: ClassValue
    /** 未完成态滑块图标样式 */
    thumbIcon: ClassValue
    /** 完成态轨道样式，不传时使用默认成功态 */
    verifiedTrack: ClassValue
    /** 完成态左侧进度区域样式，不传时使用默认成功态 */
    verifiedProgress: ClassValue
    /** 完成态文案样式，不传时使用默认成功态 */
    verifiedText: ClassValue
    /** 完成态滑块样式，不传时使用默认成功态 */
    verifiedThumb: ClassValue
    /** 完成态滑块图标样式，不传时使用默认成功态 */
    verifiedThumbIcon: ClassValue
}>

export default {
    slots: {
        root: 'reborn-slide-verify relative w-full select-none overflow-visible rounded-[999rpx] touch-pan-y overscroll-x-contain',
        track: 'relative w-full touch-pan-y overflow-hidden rounded-[999rpx] border border-solid border-gray-2 bg-gray-1 dark:border-gray-7 dark:bg-gray-8',
        progress: 'absolute left-0 top-0 h-full rounded-[999rpx] transition-colors duration-200',
        content: 'absolute inset-0 z-0 flex flex-row items-center justify-center px-[112rpx] ',
        text: 'truncate font-medium text-gray-5 transition-colors duration-200 dark:text-gray-3',
        thumb: 'reborn-slide-verify__thumb absolute left-0 top-1/2 z-10 flex touch-none items-center justify-center rounded-full border border-solid border-white bg-white text-gray-5 shadow-[0_8rpx_24rpx_rgba(15,23,42,0.16)] transition-colors duration-200 active:scale-95 dark:border-gray-6 dark:bg-gray-7 dark:text-gray-2',
        thumbIcon: 'flex shrink-0 items-center justify-center leading-none',
    },
    variants: {
        size: {
            sm: {
                track: 'h-[72rpx]',
                text: 'text-[24rpx]',
                thumb: 'h-[68rpx] w-[68rpx]',
                thumbIcon: 'text-[30rpx]',
            },
            md: {
                track: 'h-[88rpx]',
                text: 'text-[28rpx]',
                thumb: 'h-[84rpx] w-[84rpx]',
                thumbIcon: 'text-[36rpx]',
            },
            lg: {
                track: 'h-[104rpx]',
                text: 'text-[30rpx]',
                thumb: 'h-[100rpx] w-[100rpx]',
                thumbIcon: 'text-[42rpx]',
            },
        },
        color: {
            primary: {
                progress: 'bg-primary/20',
                thumbIcon: 'text-primary',
            },
            secondary: {
                progress: 'bg-secondary/20',
                thumbIcon: 'text-secondary',
            },
            success: {
                progress: 'bg-success/20',
                thumbIcon: 'text-success',
            },
            info: {
                progress: 'bg-info/20',
                thumbIcon: 'text-info',
            },
            warning: {
                progress: 'bg-warning/20',
                thumbIcon: 'text-warning',
            },
            error: {
                progress: 'bg-error/20',
                thumbIcon: 'text-error',
            },
            neutral: {
                progress: 'bg-neutral/20',
                thumbIcon: 'text-neutral',
            },
        },
        shape: {
            pill: '',
            square: {
                track: 'rounded-[24rpx]',
                progress: 'rounded-[24rpx]',
                thumb: 'rounded-[12rpx]',
            },
        },
        verified: {
            true: {
                track: 'border-success/30 bg-success/10',
                progress: 'bg-success',
                text: 'text-white',
                thumb: 'border-success bg-success text-white shadow-[0_8rpx_24rpx_rgba(34,197,94,0.24)]',
                thumbIcon: 'text-white',
            },
            false: '',
        },
        loading: {
            true: {
                root: 'pointer-events-none',
                progress: 'opacity-80',
                thumb: 'opacity-90',
            },
            false: '',
        },
        disabled: {
            true: {
                root: 'pointer-events-none opacity-50',
            },
            false: '',
        },
    },
    defaultVariants: {
        size: 'md' as SlideVerifySize,
        color: 'primary' as SlideVerifyColor,
        shape: 'pill' as SlideVerifyShape,
        verified: false,
        loading: false,
        disabled: false,
    },
} as const
