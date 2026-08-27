const color = ['primary', 'secondary', 'success', 'info', 'warning', 'error', 'neutral'] as const
const sizes = ["sm", "md", "lg"] as const;
export { color as backTopColors, sizes as backTopSizes };

/**
 * 进度环在 viewBox 坐标系下的半径。
 * viewBox 固定为 0 0 100 100，取 45 是为了给最粗的 stroke-width 9 留出半宽余量
 * （45 + 4.5 = 49.5 < 50），避免描边被 SVG 边界裁掉。
 */
export const BACK_TOP_PROGRESS_RADIUS = 45

/** 进度环周长，用于 stroke-dasharray / stroke-dashoffset 计算 */
export const BACK_TOP_PROGRESS_CIRCUMFERENCE = 2 * Math.PI * BACK_TOP_PROGRESS_RADIUS

export default {
    slots: {
        wrapper: "fixed right-0 z-50 overflow-visible pointer-none transition-all duration-300 active:scale-95",
        /** relative 是进度环绝对定位的锚点 */
        base: "relative flex flex-row items-center justify-center text-white shadow-lg rounded-full pointer-events-auto cursor-pointer transition-transform duration-300",
        icon: "text-white",
        /** 进度环 SVG 根：-rotate-90 让起点从 12 点方向开始；不拦截点击，交给外层 wrapper */
        progress: "absolute inset-0 -rotate-90 pointer-events-none",
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
            sm: { base: 'size-8', icon: 'text-sm', progressTrack: '[stroke-width:9]', progressBar: '[stroke-width:9]' },
            md: { base: 'size-10', icon: 'text-base', progressTrack: '[stroke-width:8]', progressBar: '[stroke-width:8]' },
            lg: { base: 'size-12', icon: 'text-lg', progressTrack: '[stroke-width:7]', progressBar: '[stroke-width:7]' }
        },
    },
    defaultVariants: {
        color: 'primary' as const,
        size: 'md' as const
    }
}
