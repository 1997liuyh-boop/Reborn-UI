export const tabbarColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
export const tabbarShapes = ['normal', 'round'] as const
export const tabbarAnimations = ['reveal', 'flip', 'creative', 'glass', 'fly-balls', 'drop'] as const

export default {
    slots: {
        root: 'box-content',
        base: 'flex items-center flex-nowrap relative bg-white dark:bg-black h-[110rpx] box-border overflow-visible',
        dropBall: 'absolute z-1 top-[-16px] w-[44px] h-[44px] rounded-full pointer-events-none transform-gpu will-change-transform [backface-visibility:hidden] shadow-none',
        flyBallsContainer: 'absolute left-0 top-0 w-full h-full pointer-events-none z-10',
        flyBallItem: 'absolute pointer-events-none z-10',
    },
    variants: {
        shape: {
            normal: '',
            round: {
                base: 'mx-[32rpx] rounded-full shadow-[0_6px_30px_5px_rgba(0,0,0,0.05),0_16px_24px_2px_rgba(0,0,0,0.04),0_8px_10px_-5px_rgba(0,0,0,0.08)] dark:shadow-[0_6px_30px_5px_rgba(0,0,0,0.5),0_16px_24px_2px_rgba(0,0,0,0.4),0_8px_10px_-5px_rgba(0,0,0,0.6)]',
            },
        },
        pureIcon: {
            true: '',
            false: '',
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
        },
        color: {
            primary: '',
            secondary: '',
            success: '',
            info: '',
            warning: '',
            error: '',
            neutral: '',
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
        },
        {
            pureIcon: true,
            class: {
                base: 'h-[90rpx]',
            },
        },

        // Drop 动画: 球体背景色跟随 color
        { animation: 'drop' as const, color: 'primary' as const, class: { dropBall: 'bg-primary/30' } },
        { animation: 'drop' as const, color: 'secondary' as const, class: { dropBall: 'bg-secondary/30' } },
        { animation: 'drop' as const, color: 'success' as const, class: { dropBall: 'bg-success/30' } },
        { animation: 'drop' as const, color: 'info' as const, class: { dropBall: 'bg-info/30' } },
        { animation: 'drop' as const, color: 'warning' as const, class: { dropBall: 'bg-warning/30' } },
        { animation: 'drop' as const, color: 'error' as const, class: { dropBall: 'bg-error/30' } },
        { animation: 'drop' as const, color: 'neutral' as const, class: { dropBall: 'bg-neutral/30' } },

        // round 模式下使用更小的共享指示球，避免顶部白层闪烁
        { shape: 'round' as const, animation: 'drop' as const, class: { dropBall: '!w-8 !h-8 !top-[-10px] shadow-none' } },
    ],
    defaultVariants: {
        shape: 'normal' as const,
        fixed: false,
        bordered: true,
        safeAreaInsetBottom: false,
        color: 'primary' as const,
    },
}
