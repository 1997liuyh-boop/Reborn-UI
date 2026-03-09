export const triggerColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const

export default {
    slots: {
        root: 'flex-1 text-center no-underline h-full flex justify-center items-center cursor-pointer',
        body: 'flex items-center flex-col gap-y-1 leading-none p-0 relative',
        icon: 'relative grid place-items-center overflow-y-hidden',
        activeIcon: 'transition-all duration-300 ease-in-out col-start-1 row-start-1 flex items-center justify-center',
        inactiveIcon: 'transition-all duration-300 ease-in-out col-start-1 row-start-1 flex items-center justify-center',
        iconInner: 'text-40',
        title: 'text-24 transition-all duration-300 ease-in-out',
        glowLayer: 'absolute z-[1] w-full h-full rounded-[14rpx] transition-all duration-400 ease-in-out opacity-0',
        bodyGlowLayer: '[display:contents]',
    },
    variants: {
        active: {
            true: {
                title: 'opacity-100',
            },
            false: {
                title: 'opacity-100',
            },
        },
        shape: {
            normal: {
                body: 'flex-col',
                title: 'leading-[34rpx] mt-[4rpx]',
            },
            round: {
                root: 'transition-all duration-300 ease-in-out',
                body: 'flex-row rounded-full transition-all duration-300 ease-in-out px-[24rpx] h-[64rpx] flex items-center justify-center',
                title: 'transition-all duration-300 overflow-hidden whitespace-nowrap',
            }
        },
        animation: {
            fade: {},
            flip: {
                icon: '[perspective:1000px]',
            },
            reveal: {
                inactiveIcon: 'z-0',
                activeIcon: 'z-10',
            },
            creative: {},
            glass: {
                icon: 'w-[64rpx] h-[64rpx] grid !overflow-visible',
                activeIcon: 'absolute overflow-hidden z-[2] bottom-0 left-0 w-full h-full rounded-[12rpx] transition-all duration-400 ease-in-out box-border border border-solid border-transparent',
                inactiveIcon: 'absolute overflow-hidden z-[2] bottom-0 left-0 w-full h-full rounded-[12rpx] transition-all duration-400 ease-in-out bg-[#f5f3f7] box-border border border-solid border-transparent',
            },
            drop: {
                icon: '!overflow-visible',
            },
            'fly-balls': {},
        },
        disabled: {
            true: {
                root: 'opacity-50 pointer-events-none',
            },
            false: '',
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
        // 基础动画 (Animations)
        { animation: 'fade' as const, active: true, class: { activeIcon: 'opacity-100 scale-110', inactiveIcon: 'opacity-0 scale-90' } },
        { animation: 'fade' as const, active: false, class: { activeIcon: 'opacity-0 scale-90', inactiveIcon: 'opacity-100 scale-100' } },

        { animation: 'flip' as const, active: true, class: { activeIcon: 'opacity-100 [transform:perspective(1000px)_rotateY(0deg)]', inactiveIcon: 'opacity-0 [transform:perspective(1000px)_rotateY(-180deg)]' } },
        { animation: 'flip' as const, active: false, class: { activeIcon: 'opacity-0 [transform:perspective(1000px)_rotateY(180deg)]', inactiveIcon: 'opacity-100 [transform:perspective(1000px)_rotateY(0deg)]' } },

        { animation: 'reveal' as const, active: true, class: { inactiveIcon: 'opacity-0 z-10 [clip-path:inset(0_0_0_100%)] duration-1000', activeIcon: 'opacity-100 z-0 ' } },
        { animation: 'reveal' as const, active: false, class: { inactiveIcon: 'opacity-100 z-10 [clip-path:inset(0_0_0_0)]', activeIcon: 'opacity-0 z-0 duration-1000' } },

        { animation: 'creative' as const, active: true, class: { activeIcon: 'opacity-100 translate-y-0 scale-100', inactiveIcon: 'opacity-0 translate-y-full scale-50' } },
        { animation: 'creative' as const, active: false, class: { activeIcon: 'opacity-0 -translate-y-full scale-50', inactiveIcon: 'opacity-100 translate-y-0 scale-100' } },

        // fly-balls 动画: 激活时延迟 500ms 执行渐变，未激活时立刻执行渐变复原
        { animation: 'fly-balls' as const, active: true, class: { activeIcon: 'opacity-100 transition-all duration-300 delay-500', inactiveIcon: 'opacity-0 transition-all duration-300 delay-500' } },
        { animation: 'fly-balls' as const, active: false, class: { activeIcon: 'opacity-0 transition-all duration-300', inactiveIcon: 'opacity-100 transition-all duration-300' } },

        // Drop 动画: 激活/未激活状态的过渡和位移
        // normal 形状下，选中时图标上浮
        { animation: 'drop' as const, shape: 'normal' as const, active: true, class: { activeIcon: 'opacity-100 -translate-y-[10px] transition-all duration-300', inactiveIcon: 'opacity-0 translate-y-[10px] transition-all duration-300' } },
        { animation: 'drop' as const, shape: 'normal' as const, active: false, class: { activeIcon: 'opacity-0 translate-y-[10px] transition-all duration-300', inactiveIcon: 'opacity-100 translate-y-0 transition-all duration-300' } },
        // round 形状下，选中时图标不上浮（保持原位）
        { animation: 'drop' as const, shape: 'round' as const, active: true, class: { activeIcon: 'opacity-100 translate-y-0 transition-all duration-300', inactiveIcon: 'opacity-0 translate-y-[10px] transition-all duration-300' } },
        { animation: 'drop' as const, shape: 'round' as const, active: false, class: { activeIcon: 'opacity-0 translate-y-[10px] transition-all duration-300', inactiveIcon: 'opacity-100 translate-y-0 transition-all duration-300' } },

        // Glass 动画: 激活状态 — 前景层向左下方偏移，背景产生毛玻璃效果
        {
            animation: 'glass' as const,
            active: true,
            class: {
                activeIcon: 'opacity-100 !bottom-[-2px] !left-[-2px] bg-white/20 [backdrop-filter:blur(3px)]',
                inactiveIcon: 'opacity-0 !bottom-[-2px] !left-[-2px] bg-white/20 [backdrop-filter:blur(3px)]',
                glowLayer: 'opacity-100 relative [transform:scale(0.96)] [transform-origin:right_top] !top-[-2px] !right-[-2px] duration-1000',
            },
        },
        // Glass 动画: 未激活状态
        {
            animation: 'glass' as const,
            active: false,
            class: {
                activeIcon: 'opacity-0',
                inactiveIcon: 'opacity-100 bg-[#f5f3f7]',
                glowLayer: 'opacity-0',
            },
        },

        // Glass 动画 + 激活颜色特定样式: 特定颜色边框和渐变发光层 (使用 theme.css 中的 color-4 → color-1 渐变)
        {
            animation: 'glass' as const, active: true, color: 'primary' as const, class: {
                activeIcon: 'border-b-primary/10 border-l-primary/10 border-t-white/20 border-r-white/20',
                glowLayer: '[background-image:linear-gradient(100deg,var(--color-red-8),var(--color-red-4))]',
            }
        },
        {
            animation: 'glass' as const, active: true, color: 'secondary' as const, class: {
                activeIcon: 'border-b-secondary/10 border-l-secondary/10 border-t-white/20 border-r-white/20',
                glowLayer: '[background-image:linear-gradient(100deg,var(--color-gray-8),var(--color-gray-4))]',
            }
        },
        {
            animation: 'glass' as const, active: true, color: 'success' as const, class: {
                activeIcon: 'border-b-success/60 border-l-success/10 border-t-white/20 border-r-white/20',
                glowLayer: '[background-image:linear-gradient(100deg,var(--color-green-8),var(--color-green-4))]',
            }
        },
        {
            animation: 'glass' as const, active: true, color: 'info' as const, class: {
                activeIcon: 'border-b-info/30 border-l-info/10 border-t-white/20 border-r-white/20',
                glowLayer: '[background-image:linear-gradient(100deg,var(--color-blue-8),var(--color-blue-4))]',
            }
        },
        {
            animation: 'glass' as const, active: true, color: 'warning' as const, class: {
                activeIcon: 'border-b-warning/10 border-l-warning/10 border-t-white/20 border-r-white/20',
                glowLayer: '[background-image:linear-gradient(100deg,var(--color-orange-8),var(--color-orange-4))]',
            }
        },
        {
            animation: 'glass' as const, active: true, color: 'error' as const, class: {
                activeIcon: 'border-b-error/30 border-l-error/10 border-t-white/20 border-r-white/20',
                glowLayer: '[background-image:linear-gradient(100deg,var(--color-red-8),var(--color-red-4))]',
            }
        },
        {
            animation: 'glass' as const, active: true, color: 'neutral' as const, class: {
                activeIcon: 'border-b-neutral/30 border-l-neutral/10 border-t-white/20 border-r-white/20',
                glowLayer: '[background-image:linear-gradient(100deg,var(--color-gray-6),var(--color-gray-3))]',
            }
        },

        // Round 形状: 基础布局 (展开与收缩表现)
        { shape: 'round' as const, active: true, class: { root: 'flex-[1.5]', title: 'ml-[8rpx] max-w-[200rpx] opacity-100 w-auto' } },
        { shape: 'round' as const, active: false, class: { root: 'flex-1', title: 'ml-0 max-w-0 opacity-0 !mx-0 w-0' } },

        // Round 形状: 激活状态背景颜色 (非 Glass 动画)
        { shape: 'round' as const, active: true, color: 'primary' as const, class: { body: 'bg-primary/10' } },
        { shape: 'round' as const, active: true, color: 'secondary' as const, class: { body: 'bg-secondary/10' } },
        { shape: 'round' as const, active: true, color: 'success' as const, class: { body: 'bg-success/10' } },
        { shape: 'round' as const, active: true, color: 'info' as const, class: { body: 'bg-info/10' } },
        { shape: 'round' as const, active: true, color: 'warning' as const, class: { body: 'bg-warning/10' } },
        { shape: 'round' as const, active: true, color: 'error' as const, class: { body: 'bg-error/10' } },
        { shape: 'round' as const, active: true, color: 'neutral' as const, class: { body: 'bg-neutral/40' } },

        // Round + Drop 动画: 激活时 body 显示颜色背景（球体没入效果）
        // 增加 600ms 余量等待 dropBall 落脚后再通过动画渐现背景
        { shape: 'round' as const, animation: 'drop' as const, active: true, class: { body: 'overflow-hidden transition-all duration-300 ease-out delay-[600ms]' } },
        { shape: 'round' as const, animation: 'drop' as const, active: false, class: { body: 'overflow-hidden transition-all duration-200 ease-in' } },
        { shape: 'round' as const, animation: 'drop' as const, active: true, color: 'primary' as const, class: { body: '!bg-primary/20' } },
        { shape: 'round' as const, animation: 'drop' as const, active: true, color: 'secondary' as const, class: { body: '!bg-secondary/20' } },
        { shape: 'round' as const, animation: 'drop' as const, active: true, color: 'success' as const, class: { body: '!bg-success/20' } },
        { shape: 'round' as const, animation: 'drop' as const, active: true, color: 'info' as const, class: { body: '!bg-info/20' } },
        { shape: 'round' as const, animation: 'drop' as const, active: true, color: 'warning' as const, class: { body: '!bg-warning/20' } },
        { shape: 'round' as const, animation: 'drop' as const, active: true, color: 'error' as const, class: { body: '!bg-error/20' } },
        { shape: 'round' as const, animation: 'drop' as const, active: true, color: 'neutral' as const, class: { body: '!bg-neutral/20' } },

        // Round 形状 + Glass 动画: bodyGlowLayer 作为外层彩色背景，body 本身产生毛玻璃和悬浮效果
        {
            shape: 'round' as const, animation: 'glass' as const, active: true, class: {
                bodyGlowLayer: '![display:block] rounded-full transition-all duration-400 ease-in-out',
                body: 'relative z-[2] bg-white/45 [backdrop-filter:blur(3px)] border border-solid border-transparent rounded-full transition-all duration-400 ease-in-out [transform:translate(-4rpx,4rpx)]',
                icon: 'w-auto h-auto grid overflow-y-hidden',
                activeIcon: 'relative overflow-visible z-auto bottom-auto left-auto w-auto h-auto rounded-none transition-all duration-300 ease-in-out border-none bg-transparent opacity-100 scale-110 [backdrop-filter:none]',
                inactiveIcon: 'relative overflow-visible z-auto bottom-auto left-auto w-auto h-auto rounded-none transition-all duration-300 ease-in-out border-none bg-transparent opacity-0 scale-90 [backdrop-filter:none]',
                glowLayer: '!hidden',
            },
        },
        {
            shape: 'round' as const, animation: 'glass' as const, active: false, class: {
                bodyGlowLayer: '![display:block] rounded-full transition-all duration-400 ease-in-out bg-transparent',
                body: 'relative z-[2] bg-transparent [backdrop-filter:none] border border-solid border-transparent rounded-full transition-all duration-400 ease-in-out [transform:translate(0,0)]',
                icon: 'w-auto h-auto grid overflow-y-hidden',
                activeIcon: 'relative overflow-visible z-auto bottom-auto left-auto w-auto h-auto rounded-none transition-all duration-300 ease-in-out border-none bg-transparent opacity-0 scale-90 [backdrop-filter:none]',
                inactiveIcon: 'relative overflow-visible z-auto bottom-auto left-auto w-auto h-auto rounded-none transition-all duration-300 ease-in-out border-none !bg-transparent opacity-100 scale-100 [backdrop-filter:none]',
                glowLayer: '!hidden',
            },
        },

        // Round 形状 + Glass 动画 + 激活颜色特定样式: bodyGlowLayer 应用相同的渐变背景，body 应用同色系边框
        { shape: 'round' as const, animation: 'glass' as const, active: true, color: 'primary' as const, class: { bodyGlowLayer: '[background-image:linear-gradient(100deg,var(--color-red-8),var(--color-red-4))]', body: 'border-b-primary/10 border-l-primary/10 border-t-white/20 border-r-white/20' } },
        { shape: 'round' as const, animation: 'glass' as const, active: true, color: 'secondary' as const, class: { bodyGlowLayer: '[background-image:linear-gradient(100deg,var(--color-gray-8),var(--color-gray-4))]', body: 'border-b-secondary/10 border-l-secondary/10 border-t-white/20 border-r-white/20' } },
        { shape: 'round' as const, animation: 'glass' as const, active: true, color: 'success' as const, class: { bodyGlowLayer: '[background-image:linear-gradient(100deg,var(--color-green-8),var(--color-green-4))]', body: 'border-b-success/10 border-l-success/10 border-t-white/20 border-r-white/20' } },
        { shape: 'round' as const, animation: 'glass' as const, active: true, color: 'info' as const, class: { bodyGlowLayer: '[background-image:linear-gradient(100deg,var(--color-blue-8),var(--color-blue-4))]', body: 'border-b-info/10 border-l-info/10 border-t-white/20 border-r-white/20' } },
        { shape: 'round' as const, animation: 'glass' as const, active: true, color: 'warning' as const, class: { bodyGlowLayer: '[background-image:linear-gradient(100deg,var(--color-orange-8),var(--color-orange-4))]', body: 'border-b-warning/10 border-l-warning/10 border-t-white/20 border-r-white/20' } },
        { shape: 'round' as const, animation: 'glass' as const, active: true, color: 'error' as const, class: { bodyGlowLayer: '[background-image:linear-gradient(100deg,var(--color-red-8),var(--color-red-4))]', body: 'border-b-error/10 border-l-error/10 border-t-white/20 border-r-white/20' } },
        { shape: 'round' as const, animation: 'glass' as const, active: true, color: 'neutral' as const, class: { bodyGlowLayer: '[background-image:linear-gradient(100deg,var(--color-gray-6),var(--color-gray-4))]', body: 'border-b-neutral/10 border-l-neutral/10 border-t-white/20 border-r-white/20' } },

        // 激活状态文字与图标颜色
        { active: true, color: 'primary' as const, class: { title: 'text-primary', activeIcon: 'text-primary' } },
        { active: true, color: 'secondary' as const, class: { title: 'text-secondary', activeIcon: 'text-secondary' } },
        { active: true, color: 'success' as const, class: { title: 'text-success', activeIcon: 'text-success' } },
        { active: true, color: 'info' as const, class: { title: 'text-info', activeIcon: 'text-info' } },
        { active: true, color: 'warning' as const, class: { title: 'text-warning', activeIcon: 'text-warning' } },
        { active: true, color: 'error' as const, class: { title: 'text-error', activeIcon: 'text-error' } },
        { active: true, color: 'neutral' as const, class: { title: 'text-neutral', activeIcon: 'text-neutral' } },

        // 未激活状态文字与图标颜色
        { active: false, class: { title: 'text-gray-5', inactiveIcon: 'text-gray-5' } },
    ],
    defaultVariants: {
        active: false,
        disabled: false,
        color: 'primary' as const,
        shape: 'normal' as const,
        animation: 'fade' as const,
    },
}
