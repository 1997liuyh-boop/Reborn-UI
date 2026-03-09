export const tabbarColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const tabbarShapes = ['normal', 'round'] as const
export const tabbarAnimations = ['reveal', 'flip', 'creative', 'glass', 'fly-balls', 'drop', 'liquid-ball'] as const

export default {
    slots: {
        root: 'box-content',
        base: 'flex items-center flex-nowrap relative bg-white dark:bg-black h-[110rpx]',
    },
    variants: {
        shape: {
            normal: '',
            round: {
                base: 'mx-[32rpx] rounded-full shadow-[0_6px_30px_5px_rgba(0,0,0,0.05),0_16px_24px_2px_rgba(0,0,0,0.04),0_8px_10px_-5px_rgba(0,0,0,0.08)] dark:shadow-[0_6px_30px_5px_rgba(0,0,0,0.5),0_16px_24px_2px_rgba(0,0,0,0.4),0_8px_10px_-5px_rgba(0,0,0,0.6)]',
            },
        },
        fixed: {
            true: {
                base: 'fixed left-0 bottom-0 right-0 !z-[150]',
            },
            false: '',
        },
        bordered: {
            true: '',
            false: '',
        },
        safeAreaInsetBottom: {
            true: '',
            false: '',
        },
        animation: {
            reveal: '',
            flip: '',
            creative: '',
            glass: '',
            'fly-balls': '',
            drop: '',
            'liquid-ball': '',
        },
    },
    compoundVariants: [
        // 默认形状 + 边框
        {
            shape: 'normal' as const,
            bordered: true,
            class: {
                base: 'border-t border-t-gray-3 border-solid',
            },
        },
        // 固定在底部 + 安全区适配 (适应 normal 和 round 的基础逻辑)
        {
            fixed: true,
            safeAreaInsetBottom: true,
            class: {
                base: 'box-content bottom-[env(safe-area-inset-bottom)]',
            },
        },
        // round 形状特有的安全区 padding (用于撑起空间)
        {
            shape: 'round' as const,
            fixed: true,
            safeAreaInsetBottom: true,
            class: {
                root: 'pb-[env(safe-area-inset-bottom)]',
            },
        },
        // normal 形状下使用 glass 动画增加默认高度
        {
            shape: 'normal' as const,
            animation: 'glass' as const,
            class: {
                base: 'h-[130rpx]',
            },
        }
    ],
    defaultVariants: {
        shape: 'normal' as const,
        fixed: false,
        bordered: true,
        safeAreaInsetBottom: false,
    },
}
