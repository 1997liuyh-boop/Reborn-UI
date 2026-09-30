import type { ClassValue } from "clsx";

const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

/** 形态变体：描边 / 填充 / 无边框 / 下划线（与 RebornSelect、RebornInput 同一套形态语言） */
const variants = ["outlined", "filled", "borderless", "underlined"] as const;

export { colors as datePickerColors, sizes as datePickerSizes, variants as datePickerVariants };

/**
 * 触发器盒子可覆盖的样式键，通过 triggerUi 传入。
 * 键名与 RebornSelect 的 SelectFieldUI 一一对应（去掉了日期选择用不到的 searchInput），
 * 另加范围类型专有的 rangeWrapper / rangeText / rangeSeparator。
 */
export type DatePickerFieldUI = Partial<{
    trigger: ClassValue;
    triggerText: ClassValue;
    triggerIconWrapper: ClassValue;
    placeholder: ClassValue;
    clearBtn: ClassValue;
    arrow: ClassValue;
    triggerLoadingIcon: ClassValue;
    rangeWrapper: ClassValue;
    rangeText: ClassValue;
    rangeSeparator: ClassValue;
}>;

/**
 * 样式与 reborn-select.config.ts 逐条对齐：触发器盒子、形态、尺寸、配色、标签换行、禁用与错误态
 * 的类名全部照搬，保证同一表单里 Select 与 DatePicker 并排时高度、描边、字号、聚焦色完全一致。
 * 去掉的只有下拉选项、搜索框、虚拟滚动这些日期面板用不到的键。
 */
export default {
    slots: {
        /* ---------------- 触发器盒子（与 RebornSelect 相同） ---------------- */

        /**
         * 触发器盒子。
         * group/field 供尾部图标区做「悬停时箭头淡出、清空按钮盖上来」的联动。
         * 背景与边框不在此声明，全部交给 variant 形态变体，避免相互覆盖。
         */
        trigger:
            "group/field box-border flex w-full cursor-pointer items-center justify-between gap-2 rounded-md text-base transition-colors select-none outline-none",
        /** 已选中的文本：填充色 gray-9 */
        triggerText: "truncate text-gray-9",
        /** 尾部图标区：relative 为清空按钮的绝对覆盖提供定位参照 */
        triggerIconWrapper: "relative flex shrink-0 items-center justify-center",
        /** 占位文本：gray-5 */
        placeholder: "truncate text-gray-5",
        arrow: "size-full text-gray-6 transition-transform duration-200",
        /**
         * 清空按钮。默认绝对定位盖在箭头之上且隐藏，
         * 仅在 clearable 变体开启且鼠标悬停整个触发器时显示，避免箭头被永久顶掉。
         */
        clearBtn:
            "absolute inset-0 hidden cursor-pointer items-center justify-center text-gray-5 transition-colors hover:text-gray-7",
        /**
         * 触发器加载中指示器（RebornLoading）：占满尾部图标格子，替代箭头。
         * 颜色走 text-gray-5，配合 color="currentColor" 让指示器继承它。
         */
        triggerLoadingIcon: "size-full text-gray-5",

        /* ---------------- 范围类型的双段文本 ---------------- */

        /**
         * 开始 / 结束两段文本的容器：flex-1 平分触发器剩余宽度，
         * 内部两段各自 truncate，任一段过长只裁自己，不把分隔符挤出去。
         */
        rangeWrapper: "flex min-w-0 flex-1 items-center gap-2",
        /** 开始 / 结束日期文本：与单值文本同色，占位时另由 placeholder 着色 */
        rangeText: "min-w-0 flex-1 truncate text-center text-gray-9",
        /** 起止之间的分隔符，颜色比正文弱一档 */
        rangeSeparator: "shrink-0 text-gray-5",

        /* ---------------- 下拉浮层 ---------------- */

        /**
         * 浮层里包住日期面板的容器。
         * 面板自带内边距与底色，这里只负责不让面板被浮层宽度挤压换行。
         */
        panel: "w-max",
        /**
         * 下拉菜单页头 / 页脚，与 RebornSelect 同一套排版：
         * 分隔线用 gray-3，与浮层描边同一阶；字号比正文弱一档（text-sm）。
         */
        dropdownHeader:
            "shrink-0 border-b border-gray-3 px-[10px] py-[6px] text-sm text-gray-6",
        dropdownFooter:
            "shrink-0 border-t border-gray-3 px-[10px] py-[6px] text-sm text-gray-6",

        /* ---------------- 多选标签（dates / months / years / quarters，交由 RebornBadge 渲染） ---------------- */

        /**
         * 多选标签区：撑满触发器剩余宽度。
         * 默认单行裁剪，超出部分交给 collapse-tags 收敛为 “+N”；
         * 未开启 collapse-tags 时由 wrapTags 变体改为逐行铺开、全部可见。
         */
        tagList: "flex min-w-0 flex-1 items-center gap-1 overflow-hidden",
        tag: "rounded-sm! border-gray-3 bg-gray-2 text-gray-9",
        tagLabel: "truncate",
        tagClose: "shrink-0 text-gray-5 transition-colors hover:text-gray-8",
        /** 标签关闭图标的尺寸 */
        tagCloseIcon: "size-full",
        /** collapse-tags 折叠后的 “+N” 标签 */
        collapseTag: "",
    },
    variants: {
        /**
         * 多选形态。触发器内装的是标签而不是纯文本，水平内边距收敛为 4px。
         * 必须带 ! 提权，原因与 RebornSelect 相同：tailwind-merge 不认识 px-input-px-* 与之冲突。
         * 本变体声明在 variant 之前，保证 borderless / underlined 的 px-0! 仍能压过它。
         */
        multiple: {
            true: { trigger: "px-[4px]!" },
            false: {},
        },
        /**
         * 形态变体，与 RebornSelect 完全一致：
         * - outlined：底色 + 1px 描边（默认）
         * - filled：灰底 + 透明描边，展开时转为底色
         * - borderless：完全无背景无描边，融入所在容器
         * - underlined：仅保留底部下划线，圆角强制压平
         * 背景一律使用灰阶 token，不可写 bg-white，否则深色模式下露出白块。
         */
        variant: {
            outlined: {
                trigger: "border border-gray-4 bg-gray-1",
            },
            filled: {
                trigger:
                    "border border-transparent bg-gray-2 hover:bg-gray-3 data-[state=open]:bg-gray-1",
            },
            borderless: {
                // 无边框形态没有描边包裹，水平内边距归零才能与相邻文本对齐
                trigger: "border-0 bg-transparent px-0!",
            },
            underlined: {
                // 压平圆角、抹掉水平内边距，让下划线与文字左右边缘齐平
                trigger: "rounded-none! border-0 border-b border-gray-4 bg-transparent px-0!",
            },
        },
        /**
         * 尺寸档位，与 RebornSelect 相同：高度取 --height-input-*、水平内边距取 --spacing-input-px-*，
         * 字号 sm → text-sm、md → text-base、lg → text-lg；标签始终比宿主字号小一档。
         */
        size: {
            sm: {
                trigger: "h-input-sm px-input-px-sm text-sm",
                triggerIconWrapper: "size-3",
                tagList: "gap-0.5",
                // 标签比宿主 text-sm（12px）小一档，与 RebornSelect 一致；10px 低于字号令牌下限，只能写字面量
                tag: "h-4! px-1 text-[10px]",
                tagClose: "size-2.5",
            },
            md: {
                trigger: "h-input-md px-input-px-md text-base",
                triggerIconWrapper: "size-4",
                tag: "h-5! px-1.5 text-sm",
                tagClose: "size-3",
            },
            lg: {
                trigger: "h-input-lg px-input-px-lg text-lg",
                triggerIconWrapper: "size-4",
                tag: "h-6! px-2 text-base",
                tagClose: "size-3.5",
            },
        },
        /**
         * 多选标签换行。多选且未开启 collapse-tags 时开启：
         * 标签逐行铺开、全部可见，触发器高度随之增长。
         * h-auto! 提权的原因同 RebornSelect：tailwind-merge 不认识 h-input-* 属于 height 冲突组。
         */
        wrapTags: {
            true: {
                trigger: "h-auto!",
                tagList: "flex-wrap overflow-visible",
            },
            false: {},
        },
        /**
         * 配色：决定触发器聚焦态 / 展开态的描边色，同时下发给日期面板决定选中色。
         * 色阶 token 自身已随主题切换，不可再写 dark: 前缀。
         */
        color: {
            primary: { trigger: "group-focus:border-primary data-[state=open]:border-primary" },
            secondary: { trigger: "group-focus:border-secondary data-[state=open]:border-secondary" },
            success: { trigger: "group-focus:border-success data-[state=open]:border-success" },
            info: { trigger: "group-focus:border-info data-[state=open]:border-info" },
            warning: { trigger: "group-focus:border-warning data-[state=open]:border-warning" },
            error: { trigger: "group-focus:border-error data-[state=open]:border-error" },
            neutral: { trigger: "group-focus:border-neutral data-[state=open]:border-neutral" },
        },
        open: {
            true: { arrow: "rotate-180" },
        },
        /**
         * 可清空。开启后箭头在悬停时淡出，清空按钮盖上来，两者占据同一块尾部空间，
         * 因此不会出现「有值 / 无值」宽度跳动。
         */
        clearable: {
            true: {
                arrow: "group-hover/field:opacity-0",
                clearBtn: "group-hover/field:flex",
            },
            false: {},
        },
        disabled: {
            true: {
                // 禁用时保留触发器命中以显示禁止光标，仅屏蔽子元素的鼠标交互
                trigger: "cursor-not-allowed border-gray-4 bg-gray-2 [&_*]:pointer-events-none",
                triggerText: "text-gray-5",
                rangeText: "text-gray-5",
                arrow: "text-gray-5",
                tag: "text-gray-5",
                tagClose: "pointer-events-none",
            },
        },
        error: {
            true: {
                trigger: "border-red-5 group-focus:border-red-5 data-[state=open]:border-red-5",
            },
        },
    },
    compoundVariants: [
        // borderless 形态本身没有描边宽度，出错时需要补一圈，否则错误态完全不可见
        { variant: "borderless", error: true, class: { trigger: "border" } },
        // underlined 形态只在底边报错，避免补出一整圈与形态语言冲突的红框
        { variant: "underlined", error: true, class: { trigger: "border-b-red-5" } },
        /**
         * 标签换行态的每档最小高度与纵向内边距，数值与 RebornSelect 相同：
         * 按 (档位高度 - 标签高度) / 2 - 1px 描边 反推，单行时与固定高度档位严格等高。
         */
        {
            wrapTags: true,
            size: "sm",
            class: { trigger: "min-h-input-sm py-[3px]" },
        },
        {
            wrapTags: true,
            size: "md",
            class: { trigger: "min-h-input-md py-[5px]" },
        },
        {
            wrapTags: true,
            size: "lg",
            class: { trigger: "min-h-input-lg py-[7px]" },
        },
    ] as any,
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
        variant: "outlined" as (typeof variants)[number],
    },
};
