import type { ClassValue } from 'clsx'

export const slideVerifyColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const slideVerifySizes = ['sm', 'md', 'lg'] as const

export type SlideVerifyColor = (typeof slideVerifyColors)[number]
export type SlideVerifySize = (typeof slideVerifySizes)[number]

export type SlideVerifyUI = Partial<{
    root: ClassValue
    track: ClassValue
    progress: ClassValue
    content: ClassValue
    text: ClassValue
    thumb: ClassValue
    thumbIcon: ClassValue
}>

export default {
    slots: {
        root: 'reborn-slide-verify relative w-full select-none overflow-hidden rounded-[999rpx]',
        track: 'relative w-full overflow-hidden rounded-[999rpx] border border-solid border-gray-2 bg-gray-1 dark:border-gray-7 dark:bg-gray-8',
        progress: 'absolute left-0 top-0 h-full rounded-[999rpx] transition-colors duration-200',
        content: 'absolute inset-0 z-0 flex flex-row items-center justify-center px-[112rpx] ',
        text: 'truncate font-medium text-gray-5 transition-colors duration-200 dark:text-gray-3',
        thumb: 'reborn-slide-verify__thumb absolute left-0 top-0 z-10 flex items-center justify-center rounded-full border border-solid border-white bg-white text-gray-5 shadow-[0_8rpx_24rpx_rgba(15,23,42,0.16)] transition-colors duration-200 active:scale-95 dark:border-gray-6 dark:bg-gray-7 dark:text-gray-2',
        thumbIcon: 'leading-none',
    },
    variants: {
        size: {
            sm: {
                track: 'h-[72rpx]',
                text: 'text-[24rpx]',
                thumb: 'h-[72rpx] w-[72rpx]',
                thumbIcon: 'text-[30rpx]',
            },
            md: {
                track: 'h-[88rpx]',
                text: 'text-[28rpx]',
                thumb: 'h-[88rpx] w-[88rpx]',
                thumbIcon: 'text-[36rpx]',
            },
            lg: {
                track: 'h-[104rpx]',
                text: 'text-[30rpx]',
                thumb: 'h-[104rpx] w-[104rpx]',
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
        verified: {
            true: {
                track: 'border-success/30 bg-success/10',
                progress: 'bg-success',
                text: 'text-success',
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
        verified: false,
        loading: false,
        disabled: false,
    },
} as const
