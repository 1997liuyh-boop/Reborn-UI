import type { ClassValue } from "clsx";

const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

/** 形态变体：描边 / 填充 / 无边框 / 下划线（与 RebornInput、RebornInputNumber 同一套形态语言） */
const variants = ["outlined", "filled", "borderless", "underlined"] as const;

export {
    colors as fieldTriggerColors,
    sizes as fieldTriggerSizes,
    variants as fieldTriggerVariants,
};

/** 触发器盒子可覆盖的样式键 */
export type FieldTriggerUI = Partial<{
    trigger: ClassValue;
    triggerText: ClassValue;
    triggerIconWrapper: ClassValue;
    placeholder: ClassValue;
    clearBtn: ClassValue;
    arrow: ClassValue;
}>;

export default {
    slots: {
        /**
         * 触发器盒子。
         * group/field 供尾部图标区做「悬停时箭头淡出、清空按钮盖上来」的联动。
         * 圆角固定 6px（rounded-ui-xs），不随尺寸变化，与 Input 的 md 档保持一致的视觉语言。
         * 背景与边框不在此声明，全部交给 variant 形态变体，避免相互覆盖。
         */
        trigger:
            "group/field box-border flex w-full cursor-pointer items-center justify-between gap-2 rounded-ui-xs leading-normal transition-colors select-none outline-none",
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
    },
    variants: {
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
                trigger: "border-0 bg-transparent",
            },
            underlined: {
                // 用 ! 提权压平圆角：tailwind-merge 不认识自定义的 rounded-ui-* 属于 border-radius 冲突组
                trigger: "rounded-none! border-0 border-b border-gray-4 bg-transparent",
            },
        },
        /**
         * 遗留的描边开关，语义与 variant="borderless" 重叠，为兼容既有调用方保留。
         * 必须声明在 variant 之后：tv 按声明顺序拼接类名，靠 tailwind-merge 让后者胜出。
         */
        bordered: {
            true: {},
            false: {
                trigger: "border-0",
            },
        },
        /**
         * 尺寸档位，取自 typography.css 的设计令牌：
         * 高度 --height-input-*、水平内边距 --spacing-input-px-*。
         * 字号：sm 12px（text-sm）、md 14px（text-base）、lg 16px（text-lg）。
         */
        size: {
            sm: {
                trigger: "h-input-sm px-input-px-sm text-sm",
                triggerIconWrapper: "size-3",
            },
            md: {
                trigger: "h-input-md px-input-px-md text-base",
                triggerIconWrapper: "size-4",
            },
            lg: {
                trigger: "h-input-lg px-input-px-lg text-lg",
                triggerIconWrapper: "size-4",
            },
        },
        /**
         * 聚焦态与展开态的描边色。
         * group-focus 依赖外层浮层容器（RebornSelectTrigger 的 wrapper）上的 group + tabindex，
         * 因此本组件必须渲染在该 wrapper 内部才有聚焦描边。
         */
        color: {
            primary: {
                trigger: "group-focus:border-primary data-[state=open]:border-primary",
            },
            secondary: {
                trigger: "group-focus:border-secondary data-[state=open]:border-secondary",
            },
            success: {
                trigger: "group-focus:border-success data-[state=open]:border-success",
            },
            info: {
                trigger: "group-focus:border-info data-[state=open]:border-info",
            },
            warning: {
                trigger: "group-focus:border-warning data-[state=open]:border-warning",
            },
            error: {
                trigger: "group-focus:border-error data-[state=open]:border-error",
            },
            neutral: {
                trigger: "group-focus:border-neutral data-[state=open]:border-neutral",
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
                trigger:
                    "pointer-events-none cursor-not-allowed border-gray-4 bg-gray-2",
                triggerText: "text-gray-5",
                arrow: "text-gray-5",
            },
        },
        error: {
            true: {
                trigger:
                    "border-red-5 group-focus:border-red-5 data-[state=open]:border-red-5",
            },
        },
    },
    compoundVariants: [
        // borderless 形态本身没有描边宽度，出错时需要补一圈，否则错误态完全不可见
        { variant: "borderless", error: true, class: { trigger: "border" } },
        // underlined 形态只在底边报错，避免补出一整圈与形态语言冲突的红框
        { variant: "underlined", error: true, class: { trigger: "border-b-red-5" } },
    ] as any,
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
        variant: "outlined" as (typeof variants)[number],
    },
};
