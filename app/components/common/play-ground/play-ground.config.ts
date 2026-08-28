/**
 * Playground（交互演练场）样式配置
 *
 * ── 背景层级铁律 ────────────────────────────────────────────────
 * 示例分组已各自成卡（DemoSection），DemoStage 的全宽画布不再铺底，
 * 因此演练场默认 `surface=true`，自己就是一张卡片 —— 与相邻的分组卡片同级。
 * 卡片内部控制面板与预览区靠分隔线（divide-default）切分，各自不再铺底色。
 * 若要嵌进别的表面里（例如已有卡片内部），传 `:surface="false"` 去掉这层。
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

        /**
         * 主体容器：无背景、无投影，仅靠分隔线切分控制区与预览区。
         *
         * 根因：容器若加 overflow-hidden，圆角裁剪边界正好压在控制面板上——
         * 非 surface 模式下 controlPanel 没有左内边距，输入框的 1px 左边框被裁剪边缘抹掉，
         * 滑块头（left: calc(pct% - blockSize/2px)）在最小值时更是真的溢出到容器外被整块裁掉。
         * 方案：容器只留圆角不裁剪，把裁剪下移到 previewPanel —— 过宽示例仍被拦住，控制面板得以完整渲染。
         */
        container: "rounded-ui-md",
        /** 控制面板：无底色，与预览区靠 divide 分隔 */
        controlPanel: "flex flex-col gap-8 py-4 lg:pr-6",
        groupTitleWrapper: "flex items-center gap-2",
        groupTitleAccent: "h-4 w-1 rounded-full",
        groupTitleText: "text-muted text-xs font-bold tracking-wider uppercase",
        controlList: "grid gap-2",
        fieldWrapper: "space-y-2",
        fieldLabel: "block text-muted text-xs font-semibold mb-1",
        fieldValue: "text-dimmed text-xs font-semibold",

        /** 预览区：无底色、无光晕，示例本体直接落在画布表面上；这里承接容器让出的裁剪职责，拦住过宽示例 */
        previewPanel: "relative flex min-h-[420px] flex-col overflow-hidden",
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
        surface: true as const,
    }
};
