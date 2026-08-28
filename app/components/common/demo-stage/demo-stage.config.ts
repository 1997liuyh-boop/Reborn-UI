/**
 * DemoStage（demo 展示舞台）样式配置
 *
 * 文档 Preview 区的统一容器：只负责画布与设备视口，动作与源码都下放到各张分组卡片。
 * - full：内联渲染 demo（沿用原有链路，零回归）
 * - tablet / mobile：iframe 加载 /preview/<demo>?embed=1，获得真实媒体查询断点
 *
 * ── 背景层级铁律（全站示例统一遵守）────────────────────────────
 * 示例区最多只允许两层背景：
 *   ① 环境层 —— 页面底色，由 layouts/docs.vue 的 pattern-background 提供，全站唯一；
 *   ② 表面层 —— 每张 DemoSection 卡片（以及 surface 模式的 Playground）。
 * 全宽档的 canvas **不再自带表面层**：分组已各自成卡，画布若再铺一层底
 * 就成了「卡中卡」的三层背景；它退化为一个纵向排布容器，只负责卡片间距。
 * 设备档（tablet / mobile）例外：表面层由 frame 承担，避免框中框。
 * 完整规范见 components/common/demo/demo.config.ts 顶部注释与
 * 文档页 /getting-started/demo-guidelines。
 * ──────────────────────────────────────────────────────────────
 */
const config = {
    slots: {
        /** 根节点：只承载画布，动作与源码都下放到各张分组卡片 */
        root: 'flex w-full min-w-0 flex-col',
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
                // 全宽档：画布让出表面层给各张 DemoSection 卡片，自身只是个透明容器
                canvas: 'w-full min-w-0',
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
