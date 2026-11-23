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
 * 布局：预览区占满卡片；控件不在卡片里，点标题栏的「参数修改」后在右侧抽屉的竖排表单里调。
 */
export default {
    slots: {
        wrapper: "space-y-4",
        header: "flex items-start justify-between gap-4",
        headerTitleWrapper: "min-w-0",
        /** 小节标题：不再使用页面级 3xl 字号，避免与文档页大标题抢层级 */
        headerTitle: "text-highlighted text-base font-semibold tracking-tight",
        headerDesc: "text-muted mt-1 text-sm",
        /** 标题栏右侧：参数入口 + tag 插槽（重置按钮等） */
        headerActions: "flex shrink-0 items-center gap-2",
        headerTag: "text-muted border-default shrink-0 rounded-md border px-2 py-0.5 text-sm font-medium",

        /**
         * 主体容器：无背景、无投影，补充内容与预览区之间靠分隔线切分。
         * 容器只留圆角不裁剪，把裁剪下移到 previewPanel。
         */
        container: "divide-default flex flex-col divide-y rounded-sm",
        /** 补充内容区（extra 插槽，如事件回执） */
        extraPanel: "flex min-w-0 flex-col gap-5 py-5",

        /**
         * 参数抽屉：落在右栏目录里时与目录同宽，只有两百来像素，内边距收到 16px；
         * 去掉大投影换成左描边，贴着正文时不压住内容。
         */
        drawerRoot: "border-gray-3 border-l shadow-none",
        drawerHeader: "border-gray-3 border-b px-4 py-3",
        drawerTitle: "text-base font-semibold",
        drawerBody: "min-h-full p-4",
        drawerFooter: "border-gray-3 flex gap-2 border-t px-4 py-3 *:flex-1",
        /** 竖排表单：分组之间留 20px；表单项之间的间距用 RebornFormItem 自带的，不另设 */
        form: "flex flex-col gap-5",
        group: "flex min-w-0 flex-col",
        groupTitleWrapper: "mb-3 flex min-w-0 items-center gap-3",
        groupTitleText: "text-highlighted shrink-0 text-sm font-semibold",
        groupTitleLine: "bg-gray-3 h-px min-w-4 flex-1",
        /** 标签在上、控件在下：标签不设 py / mb，与控件的间隔沿用表单项自带的 */
        formItemLabel: "text-muted min-w-0 items-start gap-1 text-sm leading-5 font-medium",
        formItemContent: "min-w-0 *:min-w-0",
        /** 抽屉只有两百来像素宽，长标签换行而不是截断 */
        fieldLabelText: "min-w-0 wrap-break-word",
        /** 问号按钮：悬停或聚焦时显示「参数名: 当前值」 */
        fieldHelp: "text-dimmed hover:text-highlighted focus-visible:text-primary flex h-5 shrink-0 cursor-help items-center rounded-full focus-visible:outline-none",
        fieldValue: "text-default bg-elevated ml-auto shrink-0 rounded-sm px-1.5 font-mono text-sm leading-5 tabular-nums",
        sliderControl: "flex min-h-8 items-center px-1",

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
                extraPanel: "px-4 sm:px-5",
                previewPanel: "px-4",
            },
            false: {},
        },
    },
    defaultVariants: {
        surface: true as const,
    }
};
