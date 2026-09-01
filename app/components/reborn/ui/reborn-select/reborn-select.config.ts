import type { ClassValue } from "clsx";

const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

/** 形态变体：描边 / 填充 / 无边框 / 下划线（与 RebornInput、RebornInputNumber 同一套形态语言） */
const variants = ["outlined", "filled", "borderless", "underlined"] as const;

export { sizes as selectSizes, colors as selectColors, variants as selectVariants };

/**
 * 触发器盒子可覆盖的样式键。
 * 原先由 RebornFieldTrigger 提供，现已内联进 RebornSelect，键名保持不变，
 * 调用方通过 triggerUi 传入的既有配置不受影响。
 */
export type SelectFieldUI = Partial<{
    trigger: ClassValue;
    triggerText: ClassValue;
    triggerIconWrapper: ClassValue;
    placeholder: ClassValue;
    clearBtn: ClassValue;
    arrow: ClassValue;
    searchInput: ClassValue;
    triggerLoadingIcon: ClassValue;
}>;

export default {
    slots: {
        /* ---------------- 触发器盒子（内联自 RebornFieldTrigger） ---------------- */

        /**
         * 触发器盒子。
         * group/field 供尾部图标区做「悬停时箭头淡出、清空按钮盖上来」的联动。
         * 圆角固定 6px（rounded-ui-xs），不随尺寸变化，与 Input 的 md 档保持一致的视觉语言。
         * 背景与边框不在此声明，全部交给 variant 形态变体，避免相互覆盖。
         * 字号基线 14px、行高 150%，由 size 变体按档位覆写。
         */
        trigger:
            "group/field box-border flex w-full cursor-pointer items-center justify-between gap-2 rounded-ui-xs text-[14px] leading-[1.5] transition-colors select-none outline-none",
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
         * 触发器内的搜索输入框（allow-search 开启且下拉展开时出现）。
         * [font:inherit] 让输入框直接继承触发器的字号与行高：
         * input 不会从父级继承 font，浏览器默认样式会把它压回 13.333px。
         * min-w 给一个下限，避免多选标签占满一行后输入区被挤成 0 宽而无法点击。
         */
        searchInput:
            "min-w-[40px] flex-1 cursor-text bg-transparent text-gray-9 outline-none [font:inherit] placeholder:text-gray-5",
        /**
         * 触发器加载中指示器（RebornLoading）：占满尾部图标格子，替代箭头。
         * 转圈动画由 RebornLoading 自带，这里不必再挂 animate-spin；
         * 颜色走 text-gray-5，配合 color="currentColor" 让指示器继承它。
         */
        triggerLoadingIcon: "size-full text-gray-5",

        /* ---------------- 下拉列表 ---------------- */

        /**
         * 下拉选项。字号基线 14px、行高 150%；内边距 6/4、圆角 4px（rounded-ui-2xs）。
         * 文字色不在此声明：未选中的 gray-6 由 active 变体给出，与 optionActive 的选中色
         * 落在同一维度上，二者永不同时出现（原因见下方 active 变体的注释）。
         * 颜色只用灰阶 token（base.css 的 .dark 会整条翻转），
         * 写 dark: 前缀会二次翻转，深色模式下反而更暗。
         */
        option:
            "flex cursor-pointer items-center rounded-ui-2xs px-[6px] py-[4px] text-base leading-[1.5] transition-colors data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[disabled=true]:hover:bg-transparent",
        optionContent: "flex w-full items-center gap-1",
        optionLabel: "truncate",
        optionActive: "",
        optionActiveIcon: "size-4 shrink-0 opacity-75",
        optionHighlight: "bg-gray-2",
        empty: "flex items-center justify-center py-6 text-[14px] leading-[1.5] text-gray-5",
        /**
         * 下拉框的内容区：内边距 4/6。
         * 内边距放在这里而不是浮层外壳上，是因为外壳的展开动画走 height 0 → scrollHeight，
         * 而 border-box 下 height:0 会被内边距撑成一段残留高度，收起时露出一条色块。
         * 圆角 8px 由浮层外壳给出（见 reborn-select-trigger.config.ts）。
         */
        dropdown: "max-h-60 overflow-y-auto px-[4px] py-[6px] scrollbar-hide space-y-[4px]",
        /**
         * 下拉菜单页头 / 页脚。
         * 两者与选项列表是兄弟节点、位于滚动容器之外，因此列表滚动时它们固定不动；
         * 分隔线用 gray-3，与浮层描边同一阶。
         */
        dropdownHeader:
            "shrink-0 border-b border-gray-3 px-[10px] py-[6px] text-[13px] leading-[1.5] text-gray-6",
        dropdownFooter:
            "shrink-0 border-t border-gray-3 px-[10px] py-[6px] text-[13px] leading-[1.5] text-gray-6",
        /** 下拉列表的加载中占位，与 empty 同一套排版 */
        loading:
            "flex items-center justify-center gap-2 py-6 text-[14px] leading-[1.5] text-gray-5",
        /** 下拉列表加载中占位里的转圈图标 */
        loadingIcon: "size-4 shrink-0 animate-spin",

        /* ---------------- 虚拟滚动 ---------------- */

        /**
         * 选项行容器：行间距统一在这里给出。
         * 选项被包进了「占位层 → 窗口层」两层结构，dropdown 上的 space-y 只剩一个子节点、已然失效，
         * 因此虚拟与非虚拟两种模式都靠这一条撑起 4px 行距。
         */
        optionList: "space-y-[4px]",
        /** 虚拟列表占位层：高度由 JS 按「总条数 × 步长」写成行内样式，撑出与真实列表等长的滚动条 */
        virtualPhantom: "relative w-full",
        /** 虚拟列表窗口层：脱离文档流贴在占位层顶部，靠行内 translateY 滑到当前区间的位置 */
        virtualWindow: "absolute inset-x-0 top-0",

        /* ---------------- 多选标签（交由 RebornBadge 渲染） ---------------- */

        /**
         * 多选标签区：撑满触发器剩余宽度。
         * 默认单行裁剪，超出部分交给 collapse-tags 收敛为 “+N”；
         * 未开启 collapse-tags 时由 wrapTags 变体改为逐行铺开、全部可见。
         * gap 同时作用于主轴与交叉轴，因此换行后的行间距无需额外声明。
         */
        tagList: "flex min-w-0 flex-1 items-center gap-1 overflow-hidden",
        /**
         * 单个标签的盒子，作为 RebornBadge 的 base 覆盖下发。
         * 圆角与高度都要带 ! 提权：tailwind-merge 不认识自定义的 rounded-ui-* / h-badge-*
         * 属于同一冲突组，不提权就会与 Badge 自带的档位值同时留在类名里，
         * 最终由 CSS 顺序决定胜负（实测 Badge 的 28px 会压过我们的 20px，把触发器撑满）。
         */
        tag: "rounded-ui-2xs! border-gray-3 bg-gray-2 text-gray-9",
        tagLabel: "truncate",
        tagClose: "shrink-0 text-gray-5 transition-colors hover:text-gray-8",
        /** 标签关闭图标的尺寸 */
        tagCloseIcon: "size-full",
        /** collapse-tags 折叠后的 “+N” 标签 */
        collapseTag: "",
    },
    variants: {
        /**
         * 多选形态。触发器内装的是标签而不是纯文本，标签自带描边与内边距，
         * 沿用 size 档位的 10/12/16px 会让左右留白明显偏大，故收敛为 4px。
         * 必须带 ! 提权：tailwind-merge 不认识自定义的 px-input-px-* 属于 padding-x 冲突组，
         * 不提权就会与 size 档位的值同时留在类名里，最终由 CSS 顺序决定胜负。
         * 本变体声明在 variant 之前，保证 borderless / underlined 的 px-0! 仍能压过它
         * （二者同属 tailwind-merge 认得的 px 冲突组，后写的胜出）。
         */
        multiple: {
            true: { trigger: "px-[4px]!" },
            false: {},
        },
        /**
         * 形态变体。四种形态各自负责背景与边框：
         * - outlined：底色 + 1px 描边（默认，对应规范里的 border: 1px solid gray-4）
         * - filled：灰底 + 透明描边，展开时转为底色
         * - borderless：完全无背景无描边，融入所在容器
         * - underlined：仅保留底部下划线，圆角强制压平
         * 背景一律使用 gray-1 / gray-2 灰阶 token（base.css 的 .dark 会整条翻转），
         * 不可写 bg-white，白色不随主题变化会在深色模式下露出白块。
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
                // 用 ! 提权压平圆角、抹掉水平内边距：
                // tailwind-merge 不认识自定义的 rounded-ui-* / px-input-px-* 属于同一冲突组，
                // 不提权就会与 size 档位的值同时留在类名里，最终由 CSS 顺序决定胜负。
                // 下划线形态的横向留白归零，让下划线与文字左右边缘齐平。
                trigger: "rounded-none! border-0 border-b border-gray-4 bg-transparent px-0!",
            },
        },
        /**
         * 尺寸档位。触发器高度取自 --height-input-*、水平内边距取自 --spacing-input-px-*。
         * 字号：sm 12px、md 14px、lg 16px，行高统一 150%（不用 text-sm/base/lg，
         * 那三个 token 自带 20/22/24px 的固定行高，会把 150% 覆盖掉）。
         * 选项与标签跟随同一套档位，标签始终比宿主字号小一档，避免撑破触发器高度。
         */
        size: {
            sm: {
                trigger: "h-input-sm px-input-px-sm text-[12px] leading-[1.5]",
                triggerIconWrapper: "size-3",
                tagList: "gap-0.5",
                tag: "h-4! px-1 text-[10px]",
                tagClose: "size-2.5",
            },
            md: {
                trigger: "h-input-md px-input-px-md text-[14px] leading-[1.5]",
                triggerIconWrapper: "size-4",
                tag: "h-5! px-1.5 text-[12px]",
                tagClose: "size-3",
            },
            lg: {
                trigger: "h-input-lg px-input-px-lg text-[16px] leading-[1.5]",
                triggerIconWrapper: "size-4",
                tag: "h-6! px-2 text-[14px]",
                tagClose: "size-3.5",
            },
        },
        /**
         * 多选标签换行。多选且未开启 collapse-tags 时开启：
         * 标签不再单行裁剪，而是逐行铺开、全部可见，触发器高度随之增长。
         * 高度必须用 h-auto! 提权：tailwind-merge 不认识 h-input-* 属于 height 冲突组，
         * 不提权 size 档位的固定高度会把内容压在单行里。
         * 最小高度与纵向内边距按档位在 compoundVariants 中给出，
         * 保证「只有一行标签」时与固定高度档位严格等高，不产生 1px 抖动。
         */
        wrapTags: {
            true: {
                trigger: "h-auto!",
                tagList: "flex-wrap overflow-visible",
            },
            false: {},
        },
        active: {
            true: {},
            false: { option: "text-gray-6" },
        },
        /**
         * 配色。同时决定两件事：
         * 1. 触发器聚焦态 / 展开态的描边色（group-focus 依赖浮层容器上的 group + tabindex）；
         * 2. 选项选中态：底色取色阶第 2 阶、文字取第 6 阶（设计稿的 tag 填充 / default 规则）。
         * 色阶 token 自身已随主题切换，不可再写 dark: 前缀，否则深色模式二次翻转。
         */
        color: {
            primary: {
                trigger: "group-focus:border-primary data-[state=open]:border-primary",
                optionActive: "bg-brand-1 text-primary",
            },
            secondary: {
                trigger: "group-focus:border-secondary data-[state=open]:border-secondary",
                optionActive: "bg-secondary-1 text-secondary-6",
            },
            success: {
                trigger: "group-focus:border-success data-[state=open]:border-success",
                optionActive: "bg-green-1 text-green-6",
            },
            info: {
                trigger: "group-focus:border-info data-[state=open]:border-info",
                optionActive: "bg-blue-1 text-blue-6",
            },
            warning: {
                trigger: "group-focus:border-warning data-[state=open]:border-warning",
                optionActive: "bg-orange-1 text-orange-6",
            },
            error: {
                trigger: "group-focus:border-error data-[state=open]:border-error",
                optionActive: "bg-red-1 text-red-6",
            },
            neutral: {
                trigger: "group-focus:border-neutral data-[state=open]:border-neutral",
                optionActive: "bg-gray-1 text-gray-6",
            },
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
                trigger: "pointer-events-none cursor-not-allowed border-gray-4 bg-gray-2",
                triggerText: "text-gray-5",
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
         * 标签换行态的每档最小高度与纵向内边距。
         * 内边距按 (档位高度 - 标签高度) / 2 - 1px 描边 反推，
         * 因此单行时的实际高度与固定高度档位完全一致（sm 24 / md 32 / lg 40）。
         * min-h 走 var() 而不是 min-h-input-*：设计令牌挂在 --height-* 命名空间下，
         * Tailwind 只据此生成 h-* 工具类，min-h-* 需要 --min-height-* 才会生成。
         */
        {
            wrapTags: true,
            size: "sm",
            class: { trigger: "min-h-[var(--height-input-sm)] py-[3px]" },
        },
        {
            wrapTags: true,
            size: "md",
            class: { trigger: "min-h-[var(--height-input-md)] py-[5px]" },
        },
        {
            wrapTags: true,
            size: "lg",
            class: { trigger: "min-h-[var(--height-input-lg)] py-[7px]" },
        },
    ] as any,
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
        variant: "outlined" as (typeof variants)[number],
        // 选项默认未选中，由模板逐项调用 option({ active }) 覆盖；缺省值保证漏传时仍有文字色
        active: false,
    },
};
