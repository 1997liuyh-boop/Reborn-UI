/** 搜索框组件支持的尺寸变体 */
const sizes = ["sm", "md", "lg"] as const;

export { sizes as searchBoxSizes };

/**
 * 各 size 对应的 RebornInput 内部 UI 覆盖配置
 * 边框与内边距由控件行外壳（control）承担：内部输入框恒为 borderless、水平内边距归零；
 * 圆角由 shape 变体控制：circle 不覆盖，square 统一取 rounded-ui-xs（压掉 RebornInput 自身的按尺寸圆角，与控件行外框保持一致）
 */
export const inputTheme = {
    slots: {
        wrapper: "px-0!",
        icon: "",
        iconBox: "",
    },
    variants: {
        size: {
            sm: { icon: "!text-xl", iconBox: "gap-4!" },
            md: { icon: "!text-2xl", iconBox: "gap-6!" },
            lg: { icon: "!text-2xl", iconBox: "gap-6!" },
        },
        /** 外形轮廓：与 RebornInput 的 shape 取值对齐 */
        shape: {
            circle: { wrapper: "" },
            square: { wrapper: "rounded-ui-xs!" },
        },
    },
    defaultVariants: {
        shape: "circle",
    },
} as const;

/** RebornSearchBox 基础样式配置 */
export default {
    slots: {
        /** 最外层容器 */
        wrapper: "relative z-10",
        backdropCard: "absolute inset-x-0 -top-[6px] -left-[6px] w-[calc(100%+12px)] bg-gray-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] border border-gray-1 border-b-0 z-0 pointer-events-none transition-[opacity,transform] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        /**
         * 控件行（外层边框所在的一层）：横向排布「外置前置插槽 + 输入框区 + 外置后置插槽」，
         * 边框把外置插槽一并囊括在内，激活态一律由 focused 变体驱动而非 CSS focus-within，
         * 因此点中外置插槽里的选择器等元素不会点亮任何边框。两种形态：
         * - 无外置插槽时：输入框区就是整行，聚焦高亮直接落在这一层（focused × color 复合变体）
         * - 有外置插槽时：这一层恒为 border-gray-4 不变色，高亮改由输入框区自己另起一圈（见 inputWrapper）
         * items-stretch 让两个外置插槽包裹层与输入框区一样撑满整行高度（插槽内容再由各自的 items-center 居中）。
         * 水平内边距落在输入框区（见 size 变体），圆角由 shape 变体控制
         */
        control: "flex items-stretch flex-1 relative z-20 transition-colors border border-gray-4 overflow-hidden",
        /**
         * 输入框区：撑满剩余空间的结构层，自身不占边框宽度。
         * 存在外置插槽时由 hasOuterSlots 变体挂上 ::before 覆盖层，在这块区域内单独画一圈聚焦描边——
         * 纯装饰、绝对定位，不参与布局也不挤压输入框高度；内缩会导致宽高不足，统一 inset-0 撑满输入框区
         */
        inputWrapper: "flex items-center flex-1 min-w-0 relative",

        // --- 下拉面板相关 ---
        /** 下拉面板外层容器 (负责高度过渡动画，内容淡入由内层控制) */
        dropdownOuter: "absolute -left-[6px] w-[calc(100%+12px)] overflow-hidden transition-[height] duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] z-10 pointer-events-none drop-shadow-xl will-change-[height]",
        /** 下拉面板内容区 (承载插槽内容与背景；底色与底色卡片一致；仅下半部分带圆角，上半部分与底色卡片无缝衔接) */
        dropdown: "left-0 w-full bg-gray-1 border border-gray-1 border-t-0 overflow-hidden py-4 px-5 flex flex-col gap-6 transition-[opacity,transform] duration-250 ease-out",
        // --- 外置插槽包裹层 ---
        /** 外置前置插槽包裹层（在边框内、输入框之外，聚焦时不参与边框高亮；高度由控件行的 items-stretch 撑满整行，内容自身居中） */
        leadingWrapper: "flex items-center shrink-0",
        /** 外置后置插槽包裹层（在边框内、输入框之外，聚焦时不参与边框高亮；高度由控件行的 items-stretch 撑满整行，内容自身居中） */
        trailingWrapper: "flex gap-x-[24px] items-center shrink-0",
    },
    variants: {
        /**
         * 尺寸轴：高度等尺寸样式由内部 RebornInput 承担，这里只给输入框区的水平内边距
         * （sm 8px / md、lg 12px，同时充当输入框与外置插槽之间的间距），
         * 并为 shape、hasOuterSlots 的复合变体（圆角）提供维度
         */
        size: {
            sm: { inputWrapper: "px-[8px]" },
            md: { inputWrapper: "px-[12px]" },
            lg: { inputWrapper: "px-[12px]" },
        },
        /**
         * 配色轴：本身不出样式，与 focused 组合后在 compoundVariants 中给出激活描边色，
         * 色族映射与 RebornInput 一致（统一取对应色族 5 阶）
         */
        color: {
            primary: {},
            secondary: {},
            success: {},
            info: {},
            warning: {},
            error: {},
            neutral: {},
        },
        /**
         * 激活轴：仅由「内部输入框获得焦点」驱动（组件内以 focus / blur 事件维护，不用 CSS focus-within），
         * 因此点中外置插槽里的选择器、按钮等可聚焦元素时边框保持默认色
         */
        focused: {
            true: {},
            false: {},
        },
        /**
         * 是否存在外置插槽（leading / trailing 任一渲染即为 true，由组件按插槽实际情况传入）：
         * 决定聚焦高亮画在哪一层——false 时点亮控件行外框，true 时外框恒为灰色、
         * 只在输入框区内用 ::before 覆盖层另起一圈，外置插槽因此不会跟着变色
         */
        hasOuterSlots: {
            true: {
                inputWrapper:
                    "before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:border before:border-transparent before:transition-colors",
            },
            false: {},
        },
        /**
         * 外形轮廓：与 RebornInput 的 shape 取值对齐。
         * circle 为胶囊；square 不分尺寸、统一取 rounded-ui-xs（6px）令牌，
         * 底色卡片的上半部分圆角随之与输入框的上半部分完全对齐。
         * 下拉面板只保留下半部分圆角——其上半部分被底色卡片覆盖、需与卡片无缝衔接，不做圆角。
         */
        shape: {
            circle: {
                backdropCard: "rounded-full",
                control: "rounded-full",
                dropdown: "rounded-b-ui-sm",
            },
            square: {
                backdropCard: "rounded-ui-xs",
                control: "rounded-ui-xs",
                dropdown: "rounded-b-ui-xs",
            },
        },
        /** 下拉面板展开状态：本身不出样式，供组件传入状态位（展开时的动画由内联 style 驱动） */
        expanded: {
            true: {},
            false: {},
        },
    },

    compoundVariants: [
        // 激活描边（无外置插槽）：整行只有输入框，直接点亮控件行外框，色值按 color 取对应色族 5 阶
        { color: "primary" as const, focused: true, hasOuterSlots: false, class: { control: "border-brand-5" } },
        { color: "secondary" as const, focused: true, hasOuterSlots: false, class: { control: "border-secondary-5" } },
        { color: "success" as const, focused: true, hasOuterSlots: false, class: { control: "border-green-5" } },
        { color: "info" as const, focused: true, hasOuterSlots: false, class: { control: "border-blue-5" } },
        { color: "warning" as const, focused: true, hasOuterSlots: false, class: { control: "border-orange-5" } },
        { color: "error" as const, focused: true, hasOuterSlots: false, class: { control: "border-red-5" } },
        { color: "neutral" as const, focused: true, hasOuterSlots: false, class: { control: "border-gray-5" } },

        // 激活描边（有外置插槽）：外框恒为 gray-4，只在输入框区内另起一圈，外置插槽不跟着变色
        { color: "primary" as const, focused: true, hasOuterSlots: true, class: { inputWrapper: "before:border-brand-5" } },
        { color: "secondary" as const, focused: true, hasOuterSlots: true, class: { inputWrapper: "before:border-secondary-5" } },
        { color: "success" as const, focused: true, hasOuterSlots: true, class: { inputWrapper: "before:border-green-5" } },
        { color: "info" as const, focused: true, hasOuterSlots: true, class: { inputWrapper: "before:border-blue-5" } },
        { color: "warning" as const, focused: true, hasOuterSlots: true, class: { inputWrapper: "before:border-orange-5" } },
        { color: "error" as const, focused: true, hasOuterSlots: true, class: { inputWrapper: "before:border-red-5" } },
        { color: "neutral" as const, focused: true, hasOuterSlots: true, class: { inputWrapper: "before:border-gray-5" } },

        // 描边仅在未接触外置插槽的一侧保留圆角：首项保留左侧，末项保留右侧，避免接缝处出现圆角（square 统一 rounded-ui-xs，不分尺寸）
        { hasOuterSlots: true, shape: "circle" as const, class: { inputWrapper: "first:before:rounded-l-full last:before:rounded-r-full" } },
        { hasOuterSlots: true, shape: "square" as const, class: { inputWrapper: "first:before:rounded-l-ui-xs last:before:rounded-r-ui-xs" } },
    ],

    defaultVariants: {
        size: "md" as const,
        shape: "circle" as const,
        color: "primary" as const,
        expanded: false,
        focused: false,
        hasOuterSlots: false,
    },
};





