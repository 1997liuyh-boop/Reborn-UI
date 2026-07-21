/**
 * DemoStage（demo 展示舞台）样式配置
 *
 * 文档 Preview 区的统一容器：工具条（视口切换 / 全屏入口）+ 画布。
 * - full：内联渲染 demo（沿用原有链路，零回归）
 * - tablet / mobile：iframe 加载 /preview/<demo>?embed=1，获得真实媒体查询断点
 */
const config = {
    slots: {
        /** 根节点：工具条在上、画布在下 */
        root: 'flex w-full flex-col gap-3',
        /** 工具条：左侧视口切换，右侧全屏入口 */
        toolbar: 'flex flex-wrap items-center justify-between gap-2',
        /** 工具条左侧按钮组 */
        toolbarGroup: 'flex items-center gap-1.5',
        /** 当前画布尺寸提示文字 */
        sizeHint: 'ml-1 font-mono text-[11px] text-gray-400 dark:text-gray-500',
        /** 画布：承载内联 demo 或 iframe */
        canvas: '',
        /** iframe 外框：手机 / 平板宽度模拟（居中 + 描边圆角） */
        frame: 'mx-auto h-full overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200 dark:bg-gray-950 dark:ring-white/10',
        /** iframe 本体 */
        iframe: 'h-full w-full border-0',
    },
    variants: {
        /** 视口档位：full 内联渲染；tablet / mobile 用 iframe 模拟真实断点 */
        viewport: {
            full: {
                canvas: 'w-full',
            },
            tablet: {
                // resize-y 原生手柄可调画布高度（min/max 约束防止拖没）
                canvas: 'h-[680px] max-h-[85vh] min-h-[400px] w-full resize-y overflow-auto rounded-3xl bg-gray-50/60 p-4 dark:bg-white/5',
                frame: 'w-[768px] max-w-full',
            },
            mobile: {
                canvas: 'h-[720px] max-h-[85vh] min-h-[400px] w-full resize-y overflow-auto rounded-3xl bg-gray-50/60 p-4 dark:bg-white/5',
                frame: 'w-[375px] max-w-full',
            },
        },
    },
    defaultVariants: {
        viewport: 'full' as const,
    },
} as const

export default config
