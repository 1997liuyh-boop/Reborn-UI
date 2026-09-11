const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { colors as sliderColors, sizes as sliderSizes };

export default {
    slots: {
        wrapper: "flex items-center w-full",
        /**
         * 内层交互带：指针事件绑在这一层（而非几像素高的 track 条），
         * 按在滑块上但偏离轨道线时也能命中；touch-none 阻止触控滚动手势
         * 抢走指针（否则 pointercancel 会中断拖拽，表现为「不跟手」）。
         */
        inner: "flex-1 relative h-full flex items-center touch-none select-none cursor-pointer",
        // 轨道条粗细固定 4px，不随 size 变化（垂直模式由 vertical 变体换到宽度轴）
        track: "relative w-full h-1 rounded-full bg-gray-4",
        progress: "absolute top-0 h-full rounded-full pointer-events-none",
        /**
         * 滑块：外圆取语义色（即色阶 6），中心圆 bg-gray-1，按压拖拽时叠 10% 透明度的色晕环；
         * 定位交给 left 百分比 + translate 居中，尺寸全部由 size × active 组合变体给出。
         * outline-none：可编辑模式下滑块可聚焦（按键删除节点），聚焦视觉由色晕承担。
         */
        thumb:
            "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center pointer-events-none z-[1] shadow-[0_0_1px_1px_rgba(100,100,100,0.1)] outline-none transition-[width,height,opacity] duration-100",
        /** 滑块中心圆 */
        thumbDot: "rounded-full bg-gray-1",
        /**
         * 数值气泡：默认拖拽时显示在滑块上方（垂直模式显示在右侧），gray-9/gray-1 随主题自动反色；
         * 箭头用 after 伪元素的透明边框三角实现，指向方位由 vertical 变体给出。
         */
        tooltip: "absolute z-[3] rounded-ui-2xs bg-gray-9 px-2 py-1 text-xs text-gray-1 whitespace-nowrap pointer-events-none shadow-md after:absolute after:border-4 after:border-transparent after:content-['']",
        /**
         * 轨道节点统一样式（间断点与刻度点共用）：5px 圆点、gray-1 底、1.5px 边框，
         * 边框色由 color 变体取对应色板的第 3 阶。
         */
        stopDot: "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-[8px] rounded-full bg-gray-1 border-[1.5px] pointer-events-none",
        /** 轨道上的刻度点（marks），压在进度条之上、滑块之下 */
        markDot: "absolute top-1/2 -translate-x-1/2 -translate-y-1/2 size-[8px] rounded-full bg-gray-1 border-[1.5px] pointer-events-none",
        /** 刻度文字（marks 的 label），可点击跳转到对应刻度；单个标记的 style 以内联样式叠加 */
        markLabel: "absolute top-full mt-[8px] -translate-x-1/2 text-sm text-gray-6 whitespace-nowrap cursor-pointer select-none",
        /** 滑轨两侧的业务含义图标（#prefix / #suffix 插槽或 prefix-icon / suffix-icon 属性） */
        prefix: "shrink-0 inline-flex items-center text-gray-6 mr-[8px]",
        suffix: "shrink-0 inline-flex items-center text-gray-6 ml-[8px]",
        value: "text-center w-[50px] text-gray-8 dark:text-gray-1",
    },
    variants: {
        size: {
            sm: { value: "text-xs", prefix: "text-sm", suffix: "text-sm" },
            md: { value: "text-sm", prefix: "text-base", suffix: "text-base" },
            lg: { value: "text-base", prefix: "text-lg", suffix: "text-lg" },
        },
        // 外圆与色晕跟随语义色（语义色即各色板的第 6 阶），色晕取 20% 透明度；
        // 轨道节点边框取同色板第 3 阶（语义色未导出 3 阶别名，直接落到具体色板）
        color: {
            primary: { progress: "bg-primary", thumb: "bg-primary ring-primary/20", stopDot: "border-brand-3", markDot: "border-brand-3" },
            secondary: { progress: "bg-secondary", thumb: "bg-secondary ring-secondary/20", stopDot: "border-secondary-3", markDot: "border-secondary-3" },
            success: { progress: "bg-success", thumb: "bg-success ring-success/20", stopDot: "border-green-3", markDot: "border-green-3" },
            info: { progress: "bg-info", thumb: "bg-info ring-info/20", stopDot: "border-blue-3", markDot: "border-blue-3" },
            warning: { progress: "bg-warning", thumb: "bg-warning ring-warning/20", stopDot: "border-orange-3", markDot: "border-orange-3" },
            error: { progress: "bg-error", thumb: "bg-error ring-error/20", stopDot: "border-red-3", markDot: "border-red-3" },
            neutral: { progress: "bg-neutral", thumb: "bg-neutral ring-neutral/20", stopDot: "border-gray-3", markDot: "border-gray-3" },
        },
        /**
         * 激活态：尺寸更大并压在未激活滑块之上；单滑块恒为激活态，
         * 多滑块由「最近一次点击」决定（默认最右侧）。
         * 具体尺寸见 compoundVariants 的 size × active 组合。
         */
        active: {
            true: { thumb: "z-[2]" },
            false: {},
        },
        /** 按压拖拽中：显示 3px 的 10% 透明度色晕（ring 色由 color 变体给出，不占布局空间） */
        pressed: {
            true: { thumb: "ring-[3px]" },
            false: {},
        },
        /** 单柄禁用（disabled 传数组时）：外圆置灰，永远不会成为激活态 */
        handleDisabled: {
            true: { thumb: "cursor-not-allowed bg-gray-5" },
            false: {},
        },
        /** 可编辑模式下正被拖离滑轨的节点：隐去作为「松手即删除」的预览 */
        removing: {
            true: { thumb: "opacity-0" },
            false: {},
        },
        /**
         * 垂直模式：布局换轴。轨道 4px 粗细换到宽度轴、长度撑满内联高度；
         * 滑块定位从「top-1/2 + left%」换成「left-1/2 + top%」，进度条从宽度改为高度（内联样式给出）。
         */
        vertical: {
            true: {
                wrapper: "flex-col w-auto",
                inner: "flex-none flex-col justify-center w-auto",
                track: "w-1 h-full",
                thumb: "top-auto left-1/2",
                progress: "left-0 w-full",
                stopDot: "top-auto left-1/2",
                markDot: "top-auto left-1/2",
                markLabel: "top-auto mt-0 translate-x-0 left-full ml-[12px] -translate-y-1/2",
                prefix: "mr-0 mb-[8px]",
                suffix: "ml-0 mt-[8px]",
                // 气泡在滑块右侧，箭头贴气泡左缘、指向左
                tooltip: "left-full top-1/2 -translate-y-1/2 ml-[10px] after:right-full after:top-1/2 after:-translate-y-1/2 after:border-r-gray-9",
            },
            false: {
                // 气泡在滑块上方，箭头贴气泡下缘、指向下
                tooltip: "bottom-full left-1/2 -translate-x-1/2 mb-[8px] after:top-full after:left-1/2 after:-translate-x-1/2 after:border-t-gray-9",
            },
        },
        /** 是否有刻度标记：为下方（垂直模式为右侧）的刻度文字留出空间，见 compoundVariants */
        hasMarks: {
            true: {},
            false: {},
        },
        disabled: {
            true: { wrapper: "opacity-50 pointer-events-none" },
        },
        error: {
            true: {
                track: "ring-1 ring-red-5 dark:ring-red-5",
            },
        },
    },
    compoundVariants: [
        // 激活滑块：lg 16px（中心圆 10px）/ md 14px（8px）/ sm 12px（8px）
        { size: "lg", active: true, class: { thumb: "size-[16px]", thumbDot: "size-[10px]" } },
        { size: "md", active: true, class: { thumb: "size-[14px]", thumbDot: "size-[8px]" } },
        { size: "sm", active: true, class: { thumb: "size-[12px]", thumbDot: "size-[8px]" } },
        // 未激活滑块：无色环且小一号，sm 档不再缩小
        { size: "lg", active: false, class: { thumb: "size-[14px]", thumbDot: "size-[8px]" } },
        { size: "md", active: false, class: { thumb: "size-[12px]", thumbDot: "size-[8px]" } },
        { size: "sm", active: false, class: { thumb: "size-[12px]", thumbDot: "size-[8px]" } },
        // 刻度文字在滑轨下方（垂直模式在右侧），wrapper 留出对应空间
        { hasMarks: true, vertical: false, class: { wrapper: "pb-[26px]" } },
        { hasMarks: true, vertical: true, class: { wrapper: "pr-[36px]" } },
    ] as any,
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
        active: true,
        pressed: false,
        handleDisabled: false,
        removing: false,
        vertical: false,
        hasMarks: false,
    },
};
