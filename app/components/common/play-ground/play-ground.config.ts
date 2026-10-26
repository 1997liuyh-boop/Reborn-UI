/**
 * Playground（交互演练场）样式配置
 *
 * ── 背景层级铁律 ────────────────────────────────────────────────
 * 演练场默认 `surface=true`，自己就是一张卡片 —— 与相邻的分组卡片（DemoSection）
 * 同级，因此形态必须与它完全一致：**描边不填充**（border-gray-3 + rounded-sm，不铺底色）。
 * 卡片内部控制区与预览区靠分隔线（divide-default）切分，同样不铺底色。
 * 若要嵌进别的表面里（例如已有卡片内部），传 `:surface="false"` 连描边一起去掉。
 * 完整规范见 components/common/demo/demo.config.ts 顶部注释与
 * 文档页 /getting-started/demo-guidelines。
 * ────────────────────────────────────────────────────────────────
 *
 * 布局：上方控制区、下方预览区。分组用细分隔线组织，字段统一使用中号控件；
 * 按控制区自身宽度切换列数，避免文档侧栏挤窄后仍强行排四列。
 */
export default {
    slots: {
        wrapper: "space-y-4",
        header: "flex items-start justify-between gap-4",
        headerTitleWrapper: "min-w-0",
        /** 小节标题：不再使用页面级 3xl 字号，避免与文档页大标题抢层级 */
        headerTitle: "text-highlighted text-base font-semibold tracking-tight",
        headerDesc: "text-muted mt-1 text-sm",
        headerTag: "text-muted border-default shrink-0 rounded-md border px-2 py-0.5 text-sm font-medium",

        /**
         * 主体容器：上下排布，无背景、无投影，仅靠分隔线切分控制区与预览区。
         * 容器只留圆角不裁剪，把裁剪下移到 previewPanel：
         * 容器裁剪会切掉控件的 1px 边框与滑块在最小值时溢出的拖柄。
         */
        container: "divide-default flex flex-col divide-y rounded-sm",
        /** 控制区：无底色，与预览区靠 divide 分隔 */
        controlPanel: "@container flex min-w-0 flex-col gap-5 py-5",
        /** 分组标题与横线承接字段，减少竖向装饰条的视觉干扰 */
        group: "flex min-w-0 flex-col gap-3",
        groupTitleWrapper: "flex min-w-0 items-center gap-3",
        groupTitleText: "text-highlighted shrink-0 text-sm font-semibold",
        groupTitleLine: "bg-gray-3 h-px min-w-4 flex-1",
        /** 控件栅格按容器宽度排一、二或四列；最大列数改动时同步 Playground 里的 COLUMNS */
        controlGrid: "grid grid-cols-1 gap-x-4 gap-y-3 @sm:grid-cols-2 @4xl:grid-cols-4",
        /**
         * 一格：标签在上、控件在下，算作一行里的一个控件。
         * 组内底部对齐，长标签自然换行；纯勾选框行不再预留空标签。
         * 子项要 min-w-0：栅格项默认按内容最小宽度撑开，长选项文案的下拉框会顶出格子
         */
        fieldWrapper: "flex min-w-0 flex-col justify-end gap-1.5 *:min-w-0",
        fieldLabel: "text-muted flex min-w-0 items-end justify-between gap-2 text-sm font-medium",
        fieldValue: "text-default bg-elevated shrink-0 rounded-sm px-1.5 font-mono text-sm tabular-nums",
        /** 状态项整行可点，文字与勾选框分居两端，并与输入框保持相同的高度 */
        checkboxControl: "border-gray-3 hover:border-gray-4 hover:bg-elevated/50 focus-within:border-primary/50 has-[:checked]:border-primary/40 has-[:checked]:bg-primary/5 flex min-h-8 w-full flex-row-reverse items-center justify-between gap-3 rounded-md border px-2.5 py-1.5 transition-colors data-[disabled=true]:opacity-50",
        checkboxLabel: "min-w-0 text-sm font-medium wrap-break-word",
        checkboxIndicator: "shrink-0 bg-gray-1",
        sliderControl: "flex min-h-8 items-center px-1",

        /**
         * 折叠区内容：在组件默认的 overflow-hidden 外留出 8px，
         * 否则控件的聚焦描边、滑块拖柄贴着边缘会被裁掉；内层再用负外边距抵消，保持与上方栅格对齐
         */
        collapseContent: "-mx-2 px-2",
        collapseInner: "flex flex-col gap-5 pt-3",
        collapseToggle: "border-default text-muted hover:text-highlighted hover:bg-elevated/50 focus-visible:ring-primary/40 mt-4 flex min-h-8 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed px-3 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none",
        collapseCount: "text-dimmed font-mono text-sm tabular-nums",
        collapseIcon: "size-3.5 shrink-0 transition-transform duration-200 motion-reduce:transition-none",

        /** 预览区：无底色、无光晕，示例本体直接落在画布表面上；这里承接容器让出的裁剪职责，拦住过宽示例 */
        previewPanel: "relative flex min-h-[320px] flex-col overflow-hidden",
        popoverWrapper: "absolute top-3 right-3 z-20",
        popoverBtn: "border-default text-muted hover:text-highlighted hover:bg-elevated flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-bold transition-colors active:scale-95",
        popoverIcon: "size-4",
        popoverContent: "w-[420px] overflow-hidden rounded-lg bg-zinc-900 p-5 font-mono text-sm leading-relaxed text-zinc-100 ring-1 ring-white/10",
        popoverPre: "overflow-x-auto",

        /** 顶部多留出一行给右上角的「传参明细」按钮，占满整行的示例（穿梭框、表格）才不会被它压住 */
        previewContent: "relative z-10 flex flex-1 items-center justify-center px-6 pt-14 pb-6",
    },
    variants: {
        /** 自成一张卡片时补回描边与内边距（与 DemoSection 同形态：只描边、不填充） */
        surface: {
            true: {
                container: "border-gray-3 border",
                controlPanel: "px-4 sm:px-5",
                previewPanel: "px-4",
            },
            false: {},
        },
    },
    defaultVariants: {
        surface: true as const,
    }
};
