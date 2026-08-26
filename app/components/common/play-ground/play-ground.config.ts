/**
 * Playground（交互演练场）样式配置
 *
 * ── 背景层级铁律 ────────────────────────────────────────────────
 * 本组件默认**不自带表面背景**：它通常渲染在 DemoStage 画布内部，
 * 而画布已经是示例区唯一的表面层。控制面板与预览区靠分隔线（divide-default）
 * 切分，而不是各自铺一层底色 —— 否则就会出现「画布套面板」的双层背景。
 * 若需脱离 DemoStage 独立使用（例如 /playground 页面），传 `surface` 补回表面样式。
 * 完整规范见文档页 /getting-started/demo-guidelines。
 * ────────────────────────────────────────────────────────────────
 */
export default {
    slots: {
        wrapper: "space-y-4",
        header: "flex items-center justify-between gap-4",
        headerTitleWrapper: "",
        /** 小节标题：不再使用页面级 3xl 字号，避免与文档页大标题抢层级 */
        headerTitle: "text-highlighted text-base font-semibold tracking-tight",
        headerDesc: "text-muted mt-1 text-sm",
        headerTag: "text-primary bg-primary/10 shrink-0 rounded-full px-3 py-1 text-[11px] font-bold tracking-widest uppercase",

        /** 主体容器：无背景、无投影，仅靠分隔线切分控制区与预览区 */
        container: "rounded-ui-md overflow-hidden",
        /** 控制面板：无底色，与预览区靠 divide 分隔 */
        controlPanel: "flex flex-col gap-8 py-4 lg:pr-6",
        groupTitleWrapper: "flex items-center gap-2",
        groupTitleAccent: "h-4 w-1 rounded-full",
        groupTitleText: "text-muted text-xs font-bold tracking-wider uppercase",
        controlList: "grid gap-1",
        fieldWrapper: "space-y-2",
        fieldLabel: "text-muted text-xs font-semibold",
        fieldValue: "text-dimmed text-xs font-semibold",

        /** 预览区：无底色、无光晕，示例本体直接落在画布表面上 */
        previewPanel: "relative flex min-h-[420px] flex-col",
        popoverWrapper: "absolute top-3 right-3 z-20",
        popoverBtn: "border-default text-muted hover:text-highlighted hover:bg-elevated flex items-center gap-1.5 rounded-ui-xs border px-2.5 py-1.5 text-xs font-bold transition-colors active:scale-95",
        popoverIcon: "size-4",
        popoverContent: "w-[420px] overflow-hidden rounded-ui-sm bg-zinc-900 p-5 font-mono text-sm leading-relaxed text-zinc-100 ring-1 ring-white/10",
        popoverPre: "overflow-x-auto",

        previewContent: "relative z-10 flex flex-1 items-center justify-center p-6",
    },
    variants: {
        direction: {
            horizontal: {
                container: "divide-default grid lg:grid-cols-12 lg:divide-x",
                controlPanel: "lg:col-span-4",
                previewPanel: "lg:col-span-8 lg:pl-6",
            },
            vertical: {
                container: "divide-default flex flex-col divide-y",
                controlPanel: "lg:pr-0",
                previewPanel: "",
            }
        },
        /** 脱离 DemoStage 单独使用时补回表面样式（如 /playground 页面） */
        surface: {
            true: {
                container: "border-default bg-default border",
                controlPanel: "px-4 lg:pr-6 lg:pl-4",
                previewPanel: "lg:pr-4",
            },
            false: {},
        },
    },
    defaultVariants: {
        direction: "horizontal" as const,
        surface: false as const,
    }
};
