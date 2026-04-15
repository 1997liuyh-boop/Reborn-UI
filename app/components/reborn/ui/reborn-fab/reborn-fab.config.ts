// 悬浮按钮方向定义
export const fabDirections = ['top', 'bottom', 'left', 'right'] as const
// 悬浮按钮预设位置
export const fabPositions = ['left-top', 'right-top', 'left-bottom', 'right-bottom'] as const
// 悬浮按钮触发方式
export const fabTriggers = ['click', 'hover'] as const
// 悬浮按钮可选颜色
export const fabColors = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
// 悬浮按钮 UI 变体类型
export const fabVariants = ['float', 'capsule', 'circle'] as const

// 环形模式下的默认布局配置
export const fabRadialLayouts = {
    top: { radius: 80, startAngle: -180, totalAngle: 180 },    // 上方半圆
    bottom: { radius: 80, startAngle: 180, totalAngle: -180 }, // 下方半圆
    left: { radius: 80, startAngle: 90, totalAngle: 180 },     // 左侧半圆
    right: { radius: 80, startAngle: -90, totalAngle: 180 },    // 右侧半圆
    circle: { radius: 100, startAngle: -90, totalAngle: 360 }  // 全圆
} as const

export default {
    /** 基础插槽样式定义 */
    slots: {
        root: 'fixed pointer-events-none flex',
        // 胶囊背景外层容器
        capsuleWrapper: 'absolute pointer-events-auto flex items-center justify-between rounded-full transition-colors duration-300 ease-[cubic-bezier(0.18,0.89,0.32,1.28)]',
        // 胶囊内部操作项容器（处理伸缩动画）
        capsuleActions: 'overflow-hidden transition-[grid-template-columns,grid-template-rows,opacity] duration-400 ease-out',
        // 胶囊内部具体项目容器
        capsuleInner: 'min-h-0 min-w-0 overflow-hidden flex items-center gap-2 transition-[padding] duration-400 ease-[cubic-bezier(0.18,0.89,0.32,1.28)]',
        // 普通模式操作项容器
        actions: 'absolute pointer-events-none flex gap-3 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] origin-center',
        // 触发按钮基础样式
        trigger: 'pointer-events-auto flex items-center justify-center rounded-full transition-transform active:scale-95 duration-200 cursor-pointer shrink-0',
        // 触发按钮内图标样式
        icon: 'text-white text-3xl',
        // 分割线样式
        divider: ''
    },
    variants: {
        /** 变体类型定义 */
        variant: {
            float: {
                trigger: 'shadow-lg',
                capsuleWrapper: 'shadow-lg'
            },
            capsule: {
                trigger: 'shadow-none bg-transparent',
                capsuleWrapper: 'shadow-[0px_0px_15px_#cfcece]'
            },
            circle: {
                trigger: 'shadow-lg',
                actions: 'absolute left-1/2 top-1/2 size-0 pointer-events-none opacity-0 transition-opacity duration-300'
            }
        },
        /** 颜色定义 */
        color: {
            primary: { trigger: 'bg-primary', capsuleWrapper: 'bg-primary' },
            secondary: { trigger: 'bg-secondary', capsuleWrapper: 'bg-secondary' },
            success: { trigger: 'bg-success', capsuleWrapper: 'bg-success' },
            info: { trigger: 'bg-info', capsuleWrapper: 'bg-info' },
            warning: { trigger: 'bg-warning', capsuleWrapper: 'bg-warning' },
            error: { trigger: 'bg-error', capsuleWrapper: 'bg-error' },
            neutral: { trigger: 'bg-neutral text-white', capsuleWrapper: 'bg-neutral text-white' },
        },
        /** 尺寸定义 */
        size: {
            sm: {
                trigger: 'size-10',
                icon: 'text-2xl',
                capsuleWrapper: 'min-h-10 min-w-10'
            },
            md: {
                trigger: 'size-12',
                icon: 'text-3xl',
                capsuleWrapper: 'min-h-12 min-w-12'
            },
            lg: {
                trigger: 'size-14',
                icon: 'text-4xl',
                capsuleWrapper: 'min-h-14 min-w-14'
            }
        },
        /** 激活状态（展开）样式 */
        active: {
            true: {
                trigger: 'rotate-45'
            },
            false: {
                trigger: 'rotate-0'
            }
        },
        /** 方向相关的分割线预设样式 */
        direction: {
            top: {
                divider: 'w-auto self-stretch h-px bg-gray-2 mt-3 mx-2'
            },
            bottom: {
                divider: 'w-auto self-stretch h-px bg-gray-2 mb-3 mx-2'
            },
            left: {
                divider: 'w-px self-stretch h-auto bg-gray-2 my-2 ml-3'
            },
            right: {
                divider: 'w-px self-stretch h-auto bg-gray-2 my-2 mr-3'
            }
        }
    },
    /** 复合变体：处理复杂的交互动画与布局组合 */
    compoundVariants: [
        // --- 普通浮动变体 (Float) 的位置与动画逻辑 ---
        { variant: 'float', active: true, direction: 'top', class: { actions: 'bottom-[calc(100%+12px)] left-1/2 -translate-x-1/2 scale-100 opacity-100 flex-col-reverse pointer-events-auto' } },
        { variant: 'float', active: false, direction: 'top', class: { actions: 'bottom-0 left-1/2 -translate-x-1/2 scale-30 opacity-0 flex-col-reverse delay-200' } },
        { variant: 'float', active: true, direction: 'bottom', class: { actions: 'top-[calc(100%+12px)] left-1/2 -translate-x-1/2 scale-100 opacity-100 flex-col pointer-events-auto' } },
        { variant: 'float', active: false, direction: 'bottom', class: { actions: 'top-0 left-1/2 -translate-x-1/2 scale-30 opacity-0 flex-col delay-200' } },
        { variant: 'float', active: true, direction: 'left', class: { actions: 'right-[calc(100%+12px)] top-1/2 -translate-y-1/2 scale-100 opacity-100 flex-row-reverse pointer-events-auto' } },
        { variant: 'float', active: false, direction: 'left', class: { actions: 'right-0 top-1/2 -translate-y-1/2 scale-30 opacity-0 flex-row-reverse delay-200' } },
        { variant: 'float', active: true, direction: 'right', class: { actions: 'left-[calc(100%+12px)] top-1/2 -translate-y-1/2 scale-100 opacity-100 flex-row pointer-events-auto' } },
        { variant: 'float', active: false, direction: 'right', class: { actions: 'left-0 top-1/2 -translate-y-1/2 scale-30 opacity-0 flex-row delay-200' } },

        // --- 环形变体 (Circle) 状态逻辑 ---
        { variant: 'circle', active: true, class: { actions: 'opacity-100 pointer-events-auto' } },

        // --- 胶囊变体 (Capsule) 布局容器逻辑 ---
        { variant: 'capsule', direction: 'top', class: { capsuleWrapper: 'bottom-0 left-0 flex-col', capsuleInner: 'flex-col' } },
        { variant: 'capsule', direction: 'bottom', class: { capsuleWrapper: 'top-0 left-0 flex-col-reverse', capsuleInner: 'flex-col' } },
        { variant: 'capsule', direction: 'left', class: { capsuleWrapper: 'right-0 top-0 flex-row', capsuleInner: 'flex-row w-max pl-3' } },
        { variant: 'capsule', direction: 'right', class: { capsuleWrapper: 'left-0 top-0 flex-row-reverse', capsuleInner: 'flex-row w-max pr-3' } },

        // --- 胶囊变体扩展逻辑 (垂直方向使用 Grid，水平方向使用 JS 驱动 width) ---
        { variant: 'capsule', direction: ['top', 'bottom'], class: { capsuleActions: 'grid' } },
        { variant: 'capsule', direction: ['left', 'right'], class: { capsuleActions: 'transition-[width,opacity]' } },
        { variant: 'capsule', direction: ['top', 'bottom'], active: true, class: { capsuleActions: 'grid-rows-[1fr] opacity-100' } },
        { variant: 'capsule', direction: ['top', 'bottom'], active: false, class: { capsuleActions: 'grid-rows-[0fr] opacity-0' } },
        { variant: 'capsule', direction: ['left', 'right'], active: true, class: { capsuleActions: 'opacity-100' } },
        { variant: 'capsule', direction: ['left', 'right'], active: false, class: { capsuleActions: 'opacity-0' } },

        // --- 胶囊变体内边距处理 (仅垂直方向需要额外 padding，水平方向已由 w-max 驱动) ---
        { variant: 'capsule', direction: 'top', active: true, class: { capsuleInner: 'pt-3' } },
        { variant: 'capsule', direction: 'bottom', active: true, class: { capsuleInner: 'pb-3' } },
    ] as any,
    /** 默认属性配置 */
    defaultVariants: {
        color: 'primary' as (typeof fabColors)[number],
        size: 'md' as any,
        variant: 'float' as any,
        direction: 'top' as any,
        active: false
    }
}
