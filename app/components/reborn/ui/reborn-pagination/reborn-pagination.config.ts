/**
 * 分页组件基础常量定义
 */
export const paginationModes = ['multi', 'simple'] as const
export const paginationColors = ['primary', 'success', 'warning', 'error', 'info', 'neutral'] as const
export const paginationSizes = ['sm', 'md', 'lg'] as const

/**
 * 分页组件类型定义
 */
export type PaginationMode = typeof paginationModes[number]
export type PaginationColor = typeof paginationColors[number]
export type PaginationSize = typeof paginationSizes[number]

/**
 * 分页组件 UI Slots 接口定义
 * 用于支持通过 ui 属性进行深度样式定制
 */
export interface PaginationUI {
    /** 根容器 */
    root?: string
    /** 页码列表容器 */
    list?: string
    /** 页码项 (基础样式) */
    item?: string
    /** 页码文字 */
    itemLabel?: string
    /** 上一页按钮 */
    prev?: string
    /** 上一页图标 */
    prevIcon?: string
    /** 上一页文字 */
    prevLabel?: string
    /** 下一页按钮 */
    next?: string
    /** 下一页图标 */
    nextIcon?: string
    /** 下一页文字 */
    nextLabel?: string
    /** 省略号容器 */
    ellipsis?: string
    /** 省略号文字 */
    ellipsisText?: string
    /** 简易模式容器 */
    simpleContent?: string
    /** 简易模式当前页 */
    simpleCurrent?: string
    /** 简易模式分隔符 */
    simpleSeparator?: string
    /** 简易模式总页数 */
    simpleTotal?: string
    /** 动画列表项包裹层 */
    pageListItem?: string
    /** 列表项移动动画类 */
    pageListMove?: string
    /** 列表项进入动画激活状态 */
    pageListEnterActive?: string
    /** 列表项离开动画激活状态 */
    pageListLeaveActive?: string
    /** 列表项进入动画起始状态 */
    pageListEnterFrom?: string
    /** 列表项进入动画结束状态 */
    pageListEnterTo?: string
    /** 列表项离开动画起始状态 */
    pageListLeaveFrom?: string
    /** 列表项离开动画结束状态 */
    pageListLeaveTo?: string
}

/**
 * 分页组件样式配置
 */
export default {
    /**
     * 基础 Slot 样式定义
     */
    slots: {
        root: 'reborn-pagination flex flex-row items-center justify-center gap-2 w-full',
        list: 'reborn-pagination-list relative flex flex-row items-center gap-1 laptop:gap-1.5',
        // 页码项基础样式：包含圆角、过渡、交互效果等
        item: 'reborn-pagination-item flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer select-none border border-transparent outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed h-8 min-w-[2rem] px-3 whitespace-nowrap hover:bg-gray-1/80 dark:hover:bg-gray-8/80 active:bg-gray-2 dark:active:bg-gray-7',
        itemLabel: 'text-sm pointer-events-none',
        // 上下页按钮基础样式 (与 item 保持一致)
        prev: 'reborn-pagination-prev flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer select-none border border-transparent h-8 min-w-[2rem] px-3 whitespace-nowrap',
        prevIcon: 'text-lg pointer-events-none',
        prevLabel: 'text-sm font-medium pointer-events-none whitespace-nowrap',
        next: 'reborn-pagination-next flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer select-none border border-transparent h-8 min-w-[2rem] px-3 whitespace-nowrap',
        nextIcon: 'text-lg pointer-events-none',
        nextLabel: 'text-sm font-medium pointer-events-none whitespace-nowrap',
        ellipsis: 'reborn-pagination-ellipsis flex items-center justify-center pointer-events-none h-8 w-8',
        ellipsisText: 'text-gray-4 opacity-50 tracking-tighter',
        // 简易模式样式
        simpleContent: 'reborn-pagination-simple-content flex items-center gap-2 text-sm font-semibold dark:text-gray-2 text-gray-7 bg-gray-1/50 dark:bg-gray-8/50 px-3 py-1 rounded-full',
        simpleCurrent: 'text-current',
        simpleSeparator: 'opacity-30 mx-1',
        simpleTotal: 'opacity-60',
        /**
         * 动画相关配置 (TransitionGroup 优化 - 极致流畅)
         * 采用水平位移与透明度结合，通过 absolute 解决离开时的占位问题
         */
        pageListItem: 'relative overflow-hidden inline-block whitespace-nowrap',
        pageListMove: 'transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)',
        pageListEnterActive: 'transition-all duration-400 cubic-bezier(0.4, 0, 0.2, 1)',
        // 离开动画：通过强制清除高亮样式防止出现多个 active 状态，采用 z-0 确保不遮挡新项
        pageListLeaveActive: 'transition-all duration-300 cubic-bezier(0.4, 0, 0.2, 1) absolute z-0 [&_.reborn-pagination-item]:!bg-transparent [&_.reborn-pagination-item]:!shadow-none [&_.reborn-pagination-item]:!border-transparent [&_.reborn-pagination-item]:!text-gray-4 [&_.reborn-pagination-item]:!transform-none',
        pageListEnterFrom: 'opacity-0 -translate-x-4 max-w-0',
        pageListEnterTo: 'opacity-100 translate-x-0 max-w-[5rem]',
        pageListLeaveFrom: 'opacity-100 translate-x-0 max-w-[5rem]',
        pageListLeaveTo: 'opacity-0 translate-x-4 max-w-0'
    },
    /**
     * 样式变体定义
     */
    variants: {
        mode: {
            multi: {},
            simple: {}
        },
        // 尺寸变体：控制高度、最小宽度和文字大小
        size: {
            sm: {
                item: 'h-7 min-w-[1.75rem] text-xs',
                prev: 'h-7 min-w-[1.75rem]',
                next: 'h-7 min-w-[1.75rem]',
                ellipsis: 'h-7 w-7',
                simpleContent: 'text-xs px-2 py-0.5'
            },
            md: {
                item: 'h-8 min-w-[2rem] text-sm',
                prev: 'h-8 min-w-[2rem]',
                next: 'h-8 min-w-[2rem]',
                ellipsis: 'h-8 w-8'
            },
            lg: {
                item: 'h-10 min-w-[2.5rem] text-base',
                prev: 'h-10 min-w-[2.5rem]',
                next: 'h-10 min-w-[2.5rem]',
                ellipsis: 'h-10 w-10',
                simpleContent: 'text-base px-4 py-1.5'
            }
        },
        // 激活状态变体
        active: {
            true: {
                item: 'shadow-sm font-bold border-current z-10'
            },
            false: {
                item: 'text-gray-6 dark:text-gray-4 hover:text-gray-9 dark:hover:text-gray-1',
                prev: 'text-gray-6 dark:text-gray-4 hover:text-gray-9 dark:hover:text-gray-1',
                next: 'text-gray-6 dark:text-gray-4 hover:text-gray-9 dark:hover:text-gray-1'
            }
        },
        // 背景显示变体
        background: {
            true: {
                item: 'bg-gray-1/50 border-gray-3 dark:bg-gray-8/50 dark:border-gray-7/50 backdrop-blur-sm',
                prev: 'bg-gray-1/50 border-gray-3 dark:bg-gray-8/50 dark:border-gray-7/50 backdrop-blur-sm',
                next: 'bg-gray-1/50 border-gray-3 dark:bg-gray-8/50 dark:border-gray-7/50 backdrop-blur-sm'
            },
            false: {
                item: 'bg-transparent border-transparent shadow-none',
                prev: 'bg-transparent border-transparent shadow-none',
                next: 'bg-transparent border-transparent shadow-none'
            }
        },
        // 禁用状态变体
        disabled: {
            true: {
                item: 'opacity-40 bg-gray-1 text-gray-4 border-gray-3 dark:bg-gray-9 dark:text-gray-6 dark:border-gray-8 cursor-not-allowed pointer-events-none',
                prev: 'opacity-40 bg-gray-1 text-gray-4 border-gray-3 dark:bg-gray-9 dark:text-gray-6 dark:border-gray-8 cursor-not-allowed pointer-events-none',
                next: 'opacity-40 bg-gray-1 text-gray-4 border-gray-3 dark:bg-gray-9 dark:text-gray-6 dark:border-gray-8 cursor-not-allowed pointer-events-none'
            }
        },
        // 颜色变体
        color: {
            primary: { item: 'text-primary', simpleContent: 'text-primary' },
            success: { item: 'text-success', simpleContent: 'text-success' },
            warning: { item: 'text-warning', simpleContent: 'text-warning' },
            error: { item: 'text-error', simpleContent: 'text-error' },
            info: { item: 'text-info', simpleContent: 'text-info' },
            neutral: { item: 'text-gray-6', simpleContent: 'text-gray-6' }
        }
    },
    /**
     * 复合变体：处理多种状态叠加时的样式
     */
    compoundVariants: [
        // 激活状态且有背景时的高亮样式
        { active: true, background: true, color: 'primary', class: { item: 'bg-primary text-white border-primary shadow-md shadow-primary/20 hover:bg-primary' } },
        { active: true, background: true, color: 'success', class: { item: 'bg-success text-white border-success shadow-md shadow-success/20 hover:bg-success' } },
        { active: true, background: true, color: 'warning', class: { item: 'bg-warning text-white border-warning shadow-md shadow-warning/20 hover:bg-warning' } },
        { active: true, background: true, color: 'error', class: { item: 'bg-error text-white border-error shadow-md shadow-error/20 hover:bg-error' } },
        { active: true, background: true, color: 'info', class: { item: 'bg-info text-white border-info shadow-md shadow-info/20 hover:bg-info' } },
        { active: true, background: true, color: 'neutral', class: { item: 'bg-gray-6 text-white border-gray-6 shadow-md shadow-gray-6/20 hover:bg-gray-6' } },

        // 激活状态且无背景时的高亮样式 (仅文字加粗)
        { active: true, background: false, color: 'primary', class: { item: 'text-primary font-black' } },
        { active: true, background: false, color: 'success', class: { item: 'text-success font-black' } },
        { active: true, background: false, color: 'warning', class: { item: 'text-warning font-black' } },
        { active: true, background: false, color: 'error', class: { item: 'text-error font-black' } },
        { active: true, background: false, color: 'info', class: { item: 'text-info font-black' } },
        { active: true, background: false, color: 'neutral', class: { item: 'text-gray-9 dark:text-gray-1 font-black underline underline-offset-4 decoration-2' } }
    ],
    /**
     * 默认变体
     */
    defaultVariants: {
        mode: 'multi',
        color: 'primary',
        size: 'md',
        active: false,
        disabled: false
    }
}

