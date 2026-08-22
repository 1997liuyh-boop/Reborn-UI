/**
 * 遮罩淡入淡出过渡时长（毫秒）
 * ⚠️ 修改此值时必须同步调整下方 maskTransition 中的 duration-* 类，二者需保持一致，
 * 否则 useLoading 的兜底销毁定时器与真实过渡不同步，可能出现提前卸载截断动画
 */
export const LOADING_MASK_DURATION = 200

/**
 * 遮罩过渡类（供 <Transition> 使用）
 * 使用纯 opacity 过渡：GPU 合成、不触发布局
 */
export const maskTransition = {
    /** 进场过渡 */
    enterActive: 'transition-opacity duration-200 ease-out',
    /** 退场过渡 */
    leaveActive: 'transition-opacity duration-200 ease-in',
    /** 隐藏态（进场起点 / 退场终点） */
    hidden: 'opacity-0',
} as const

const config = {
    slots: {
        /**
         * 遮罩根节点：覆盖宿主。
         * 背景对齐设计令牌：浅色用白色 80%、深色用 gray-9(#111111) 80% 半透明
         */
        root: 'bg-white/80 dark:bg-gray-9/80',
        /**
         * 可视区容器：图标 / 文字的居中定位层。
         * 局部模式下为 sticky，滚动时由合成器同步钉在宿主可视区域（尺寸由 useLoading 内联注入）
         */
        viewport: 'flex items-center justify-center',
        /** 内容容器：图标在上、文字在下，垂直居中排列 */
        content: 'flex flex-col items-center justify-center gap-2',
        /** 加载文字：正文小号 */
        text: 'text-sm',
    },
    variants: {
        /**
         * fixed=true：全屏遮罩 / body 挂载模式（fixed 定位覆盖视口或目标矩形）
         * fixed=false：局部遮罩（absolute 定位铺满宿主的整个滚动内容，宿主需为非 static 定位，
         * 由 useLoading 自动修正；⚠️ 根节点不可加 overflow-hidden——overflow 非 visible 的祖先
         * 会成为 viewport sticky 的粘附基准，导致图标区无法钉在宿主可视区域）
         */
        fixed: {
            true: { root: 'fixed inset-0 overflow-hidden', viewport: 'size-full' },
            false: { root: 'absolute top-0 left-0 min-h-full min-w-full', viewport: 'sticky top-0 left-0' },
        },
        /** 预设色：加载文字颜色跟随图标颜色；自定义颜色由组件内联样式处理 */
        color: {
            primary: { text: 'text-primary' },
            secondary: { text: 'text-secondary' },
            success: { text: 'text-success' },
            info: { text: 'text-info' },
            warning: { text: 'text-warning' },
            error: { text: 'text-error' },
            neutral: { text: 'text-neutral' },
        },
    },
    defaultVariants: {
        fixed: false,
        color: 'primary',
    },
} as const

/** 遮罩 Slots 覆盖类型 */
export type LoadingMaskUI = {
    root?: string
    viewport?: string
    content?: string
    text?: string
}

export default config
