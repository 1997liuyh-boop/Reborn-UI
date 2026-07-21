export default {
    slots: {
        root: '',
        /** 外层：grid 0fr↔1fr 高度动画。contain:layout style 隔离栅格内部重排，消除抖动 */
        trigger: 'grid transition-[grid-template-rows] duration-300 ease-out',
        /**
         * 内层：overflow-hidden + min-h-0 确保内容随栅格轨道裁切。
         * position="top"：flex-col justify-end 将面板底部锚定在触发条边缘，收起时从顶部朝触发条裁切。
         */
        content: 'overflow-hidden min-h-0',
    },
    variants: {
        open: {
            true: { trigger: 'grid-rows-[1fr]' },
            false: { trigger: 'grid-rows-[0fr]' }
        },
        position: {
            top: {
                content: 'flex flex-col justify-end'
            },
            bottom: {}
        },
        absolute: {
            /**
             * 浮层模式：改用 transform 平移动画，替代 grid 高度动画。
             * 根因：position:absolute + bottom/top:100% 的盒子在高度动画期间无法保持锚定边——
             * 实测收起过程中底边会朝中心漂移，表现为「两端同时收起」（justify-end 无效）。
             * 方案：裁切窗口(trigger) 固定高度且 overflow-hidden，内层(content) 用 transform 平移进出。
             * 平移由 GPU 合成、不触发布局重算，底边恒定贴合触发条，实现「单方向朝触发条收起」。
             * pointer-events：收起态裁切窗口透明区不拦截点击，仅可见面板(content)可交互。
             */
            true: {
                root: 'relative',
                trigger: 'block overflow-hidden pointer-events-none transition-none',
                content: 'transition-transform duration-300 ease-out pointer-events-auto'
            },
            false: {}
        },
        animating: {
            true: { trigger: 'reborn-collapse__animating [contain:layout_style]' },
            false: {}
        }
    },
    compoundVariants: [
        {
            position: 'top' as const,
            absolute: true,
            class: { trigger: 'absolute bottom-full left-0 z-50 w-full' }
        },
        {
            position: 'bottom' as const,
            absolute: true,
            class: { trigger: 'absolute left-0 top-full z-50 w-full' }
        },
        // 浮层展开：面板归位
        {
            absolute: true,
            open: true,
            class: { content: '[transform:translateY(0)]' }
        },
        // 浮层收起 + 面板在触发条上方(top)：向下滑入触发条方向隐藏
        {
            absolute: true,
            open: false,
            position: 'top' as const,
            class: { content: '[transform:translateY(100%)]' }
        },
        // 浮层收起 + 面板在触发条下方(bottom)：向上滑入触发条方向隐藏
        {
            absolute: true,
            open: false,
            position: 'bottom' as const,
            class: { content: '[transform:translateY(-100%)]' }
        }
    ],
    defaultVariants: {
        open: false,
        position: 'bottom' as const,
        absolute: false,
        animating: false
    }
}
