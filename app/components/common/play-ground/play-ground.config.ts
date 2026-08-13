export default {
    slots: {
        wrapper: "space-y-4",
        header: "flex items-center justify-between",
        headerTitleWrapper: "",
        headerTitle: "text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100",
        headerDesc: "mt-2 text-gray-500",
        headerTag: "rounded-full bg-primary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary",

        container: "rounded-ui-base border border-gray-200 bg-white shadow-xl shadow-zinc-950/[0.06] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none",
        controlPanel: "flex flex-col gap-8 bg-gray-50/50 p-4 dark:bg-gray-900/50",
        groupTitleWrapper: "flex items-center gap-2",
        groupTitleAccent: "h-4 w-1 rounded-full",
        groupTitleText: "text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider",
        controlList: "grid gap-1",
        fieldWrapper: "space-y-2",
        fieldLabel: "text-xs font-semibold text-gray-500 dark:text-gray-400",
        fieldValue: "text-xs font-semibold text-gray-400",

        /* 预览区：白底 + 细点阵画布，与站点背景 / DemoStage 画布语言一致 */
        previewPanel: "relative flex min-h-[560px] flex-col bg-white bg-[radial-gradient(circle,rgba(24,24,27,0.05)_1px,transparent_1px)] bg-[size:18px_18px] dark:bg-gray-950 dark:bg-[radial-gradient(circle,rgba(255,255,255,0.045)_1px,transparent_1px)]",
        popoverWrapper: "absolute top-5 left-5 z-20",
        popoverBtn: "flex items-center gap-1.5 rounded-xl bg-gray-100/80 px-3 py-2 text-xs font-bold text-gray-500 shadow-xs backdrop-blur-sm transition-all hover:bg-gray-200/80 hover:text-gray-700 active:scale-95 dark:bg-gray-800/80 dark:text-gray-400 dark:hover:bg-gray-700/80",
        popoverIcon: "size-4",
        popoverContent: "w-[420px] overflow-hidden rounded-2xl bg-zinc-900 p-5 font-mono text-sm leading-relaxed text-zinc-100 shadow-xl ring-1 ring-white/10",
        popoverPre: "overflow-x-auto",

        bgDecorationWrapper: "absolute inset-0 z-0 opacity-40 select-none pointer-events-none overflow-hidden",
        /* 单一主色光晕：避免红蓝双色渐变的杂色感 */
        bgDecoration: "absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-linear-to-br from-primary/15 via-primary/5 to-transparent blur-[100px]",
        previewContent: "relative z-10 flex flex-1 items-center justify-center p-12",
    },
    variants: {
        direction: {
            horizontal: {
                container: "grid lg:grid-cols-12",
                controlPanel: "border-r border-gray-100 dark:border-gray-800 lg:col-span-4",
                previewPanel: "lg:col-span-8",
            },
            vertical: {
                container: "flex flex-col",
                controlPanel: "border-t border-gray-100 dark:border-gray-800",
                previewPanel: "",
            }
        }
    },
    defaultVariants: {
        direction: "horizontal" as const,
    }
};
