import { tv } from '@/lib/tv';

export type NoticeBarUI = {
    root?: string;
    content?: string;
    textWrapper?: string;
    text?: string;
    icon?: string;
    verticalWrapper?: string;
    verticalItem?: string;
};

const config = {
    slots: {
        root: 'relative flex items-center w-full overflow-hidden px-[16rpx] gap-[16rpx] h-[80rpx]',
        content: 'flex items-center gap-[16rpx] whitespace-nowrap',
        textWrapper: 'flex-1 overflow-hidden h-full flex items-center min-w-0',
        text: 'inline-block whitespace-nowrap text-[28rpx]',
        icon: 'shrink-0 size-[36rpx] flex items-center justify-center',
        verticalWrapper: 'relative h-full w-full overflow-hidden',
        verticalItem: 'h-full w-full flex items-center truncate text-[28rpx] min-w-0',
    },
    variants: {
        wrapable: {
            true: {
                root: 'h-auto py-[16rpx]',
                textWrapper: 'flex-1 overflow-visible',
                text: 'whitespace-normal',
            },
            false: {
                root: 'h-[80rpx]',
            },
        },
        disabled: {
            true: {
                root: 'opacity-50 pointer-events-none',
            },
        },
    },
    defaultVariants: {
        wrapable: false,
        disabled: false,
    },
} as const;

export default config;
