/**
 * DemoStage（demo 展示舞台）样式配置
 *
 * 文档 Preview 区的统一容器：工具条（视口切换 / 全屏入口）+ 画布。
 * - full：内联渲染 demo（沿用原有链路，零回归）
 * - tablet / mobile：iframe 加载 /preview/<demo>?embed=1，获得真实媒体查询断点
 *
 * ── 背景层级铁律（全站示例统一遵守）────────────────────────────
 * 示例区最多只允许两层背景：
 *   ① 环境层 —— 页面底色，由 layouts/docs.vue 的 pattern-background 提供，全站唯一；
 *   ② 表面层 —— 本文件的 canvas（full 档）或 frame（设备档），示例区唯一。
 * 画布内部禁止再出现「圆角 + 填充 + 描边/投影」的盒子，分组一律靠
 * 分隔线（divide-default）、留白与小标题完成。
 * 完整规范见文档页 /getting-started/demo-guidelines。
 * ──────────────────────────────────────────────────────────────
 */
const config = {
    slots: {
        /** 根节点：工具条在上、画布在下 */
        root: 'flex w-full flex-col gap-3',
        /** 工具条：左侧视口切换，右侧全屏入口 */
        toolbar: 'flex flex-wrap items-center justify-between gap-2',
        /** 工具条左侧按钮组：分段控件（属于工具条 chrome，不计入示例背景层级） */
        toolbarGroup: 'flex items-center gap-0.5 rounded-ui-xs border border-default bg-elevated p-0.5',
        /** 当前画布尺寸提示文字 */
        sizeHint: 'mx-1.5 font-mono text-[11px] tabular-nums text-dimmed',
        /** 画布：示例区的唯一表面层，具体样式由 viewport 变体给出 */
        canvas: '',
        /** iframe 外框：手机 / 平板宽度模拟（设备档下由它承担表面层） */
        frame: 'mx-auto h-full overflow-hidden rounded-ui-md border border-default bg-default shadow-sm shadow-zinc-950/5 dark:shadow-none',
        /** iframe 本体 */
        iframe: 'h-full w-full border-0',
    },
    variants: {
        /** 视口档位：full 内联渲染；tablet / mobile 用 iframe 模拟真实断点 */
        viewport: {
            full: {
                // 全宽档：画布自身即表面层（唯一背景 + 描边），内部 demo 不得再套卡片
                canvas: 'w-full rounded-ui-md border border-default bg-default p-6 sm:p-8',
            },
            tablet: {
                // 设备档：画布退化为「透明的可调视口」，表面层交给设备框，避免框中框
                canvas: 'h-[680px] max-h-[85vh] min-h-[400px] w-full resize-y overflow-auto py-2',
                frame: 'w-[768px] max-w-full',
            },
            mobile: {
                canvas: 'h-[720px] max-h-[85vh] min-h-[400px] w-full resize-y overflow-auto py-2',
                frame: 'w-[375px] max-w-full',
            },
        },
    },
    defaultVariants: {
        viewport: 'full' as const,
    },
} as const

export default config
