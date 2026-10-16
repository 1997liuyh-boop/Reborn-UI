const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const sizes = ["xs", "sm", "md", "lg"] as const;
/** 滚动方向：top 回到顶部 / bottom 去底部 */
const directions = ["top", "bottom"] as const;
/** 按钮形状：circle 圆形 / square 圆角方形 */
const shapes = ["circle", "square"] as const;
export { color as backTopColors, directions as backTopDirections, shapes as backTopShapes, sizes as backTopSizes };

/**
 * 进度环在 viewBox 坐标系下的半径。
 * viewBox 固定为 0 0 100 100，取 45 是为了给最粗的 stroke-width 10 留出半宽余量
 * （45 + 5 = 50），避免描边被 SVG 边界裁掉。
 */
export const BACK_TOP_PROGRESS_RADIUS = 45

/**
 * 方形按钮的外圆角，占边长的百分比。base 用 rounded-[25%] 与它对齐：
 * 按百分比算，任何尺寸下进度框的圆角都与按钮边缘同心。
 */
export const BACK_TOP_SQUARE_RADIUS = 25

/** 进度路径距 viewBox 边缘的内缩量，与圆形的半径余量一致 */
const inset = 50 - BACK_TOP_PROGRESS_RADIUS
/** 方形进度框的圆角：外圆角减去内缩量，描边最粗时外沿正好贴住按钮圆角 */
const r = BACK_TOP_SQUARE_RADIUS - inset
const near = inset
const far = 100 - inset

/**
 * 进度路径：两种形状都从 12 点方向出发、顺时针绕一圈。
 * 统一用 path + pathLength="100"，进度直接按 0~100 计算虚线偏移，不必再分别算周长；
 * 起点已在 12 点，SVG 无需旋转。
 */
export const BACK_TOP_PROGRESS_PATHS = {
    circle: `M 50 ${near} A ${BACK_TOP_PROGRESS_RADIUS} ${BACK_TOP_PROGRESS_RADIUS} 0 1 1 50 ${far} A ${BACK_TOP_PROGRESS_RADIUS} ${BACK_TOP_PROGRESS_RADIUS} 0 1 1 50 ${near} Z`,
    square: [
        `M 50 ${near}`,
        `H ${far - r} A ${r} ${r} 0 0 1 ${far} ${near + r}`,
        `V ${far - r} A ${r} ${r} 0 0 1 ${far - r} ${far}`,
        `H ${near + r} A ${r} ${r} 0 0 1 ${near} ${far - r}`,
        `V ${near + r} A ${r} ${r} 0 0 1 ${near + r} ${near}`,
        'Z',
    ].join(' '),
} as const

export default {
    slots: {
        /** group 供按钮主体响应键盘焦点；焦点样式画在按钮主体上，外层只负责定位 */
        wrapper: "group fixed right-0 z-50 overflow-visible pointer-none outline-none transition-all duration-300 active:scale-95",
        /** relative 是进度环绝对定位的锚点 */
        base: "relative flex flex-row items-center justify-center text-white shadow-lg pointer-events-auto cursor-pointer transition-transform duration-300 group-focus-visible:outline-2 group-focus-visible:outline-offset-2 group-focus-visible:outline-gray-10",
        icon: "text-white",
        /** 进度环 SVG 根：不拦截点击，交给外层 wrapper */
        progress: "absolute inset-0 pointer-events-none",
        /** 底环 */
        progressTrack: "fill-none stroke-white/25",
        /** 进度环本体，长度由 stroke-dashoffset 驱动 */
        progressBar: "fill-none stroke-white transition-[stroke-dashoffset] duration-150 ease-out [stroke-linecap:round]",
    },
    variants: {
        color: {
            primary: { base: 'bg-primary' },
            secondary: { base: 'bg-secondary' },
            success: { base: 'bg-success' },
            info: { base: 'bg-info' },
            warning: { base: 'bg-warning' },
            error: { base: 'bg-error' },
            neutral: { base: 'bg-neutral' }
        },
        size: {
            /** 按钮越小，环在 viewBox 里就要越粗，实际像素宽度才不至于细到看不见 */
            xs: { base: 'size-6', icon: 'text-xs', progressTrack: '[stroke-width:10]', progressBar: '[stroke-width:10]' },
            sm: { base: 'size-8', icon: 'text-sm', progressTrack: '[stroke-width:9]', progressBar: '[stroke-width:9]' },
            md: { base: 'size-10', icon: 'text-base', progressTrack: '[stroke-width:8]', progressBar: '[stroke-width:8]' },
            lg: { base: 'size-12', icon: 'text-lg', progressTrack: '[stroke-width:7]', progressBar: '[stroke-width:7]' }
        },
        shape: {
            circle: { base: 'rounded-full' },
            /** 圆角按边长百分比给，与 BACK_TOP_SQUARE_RADIUS 保持一致 */
            square: { base: 'rounded-[25%]' },
        },
    },
    defaultVariants: {
        color: 'primary' as const,
        size: 'md' as const,
        shape: 'circle' as const,
    }
}
