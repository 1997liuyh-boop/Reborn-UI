/**
 * DemoStage（demo 展示舞台）样式配置
 *
 * 文档 Preview 区的统一容器：只负责画布与设备视口，动作与源码都下放到各张分组卡片。
 * - full：内联渲染 demo（沿用原有链路，零回归）
 * - tablet / mobile：iframe 加载 /preview/<demo>?embed=1，获得真实媒体查询断点
 *
 * ── 背景层级铁律（全站示例统一遵守）────────────────────────────
 * 示例区只有一层底色：
 *   环境层 —— 页面底色，由 layouts/docs.vue 的 pattern-background 提供，全站唯一。
 * 分组卡片（DemoSection）与 surface 模式的 Playground 都是**描边不填充**，
 * 全宽档的 canvas 同样不铺底 —— 它退化为一个纵向排布容器，只负责卡片间距。
 * 设备档（tablet / mobile）是唯一例外：frame 必须铺底，否则模拟出的设备
 * 屏幕会透出页面底纹，不再像一块屏幕。
 * 完整规范见 components/common/demo/demo.config.ts 顶部注释与
 * 文档页 /getting-started/demo-guidelines。
 * ──────────────────────────────────────────────────────────────
 */
const config = {
    slots: {
        /** 根节点：只承载画布，动作与源码都下放到各张分组卡片 */
        root: 'flex w-full min-w-0 flex-col',
        /** 画布：不铺底色，具体样式由 viewport 变体给出 */
        canvas: '',
        /** iframe 外框：手机 / 平板宽度模拟（铁律的唯一例外，必须铺底当屏幕） */
        frame: 'mx-auto h-full overflow-hidden rounded-xl border border-default bg-default shadow-sm shadow-zinc-950/5 dark:shadow-none',
        /** iframe 本体 */
        iframe: 'h-full w-full border-0',
    },
    variants: {
        /** 视口档位：full 内联渲染；tablet / mobile 用 iframe 模拟真实断点 */
        viewport: {
            full: {
                // 全宽档：画布只是个透明容器，示例落在环境层上
                canvas: 'w-full min-w-0',
            },
            tablet: {
                // 设备档：画布退化为「透明的可调视口」，底色交给设备框，避免框中框
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
