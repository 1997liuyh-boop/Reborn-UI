import type { ClassValue } from "clsx";

const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as fieldTriggerSizes, colors as fieldTriggerColors };

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
        trigger: "flex w-full items-center justify-between leading-normal bg-gray-1 dark:bg-gray-8 transition-colors cursor-pointer select-none outline-none",
        triggerText: "truncate text-gray-8 dark:text-gray-1",
        triggerIconWrapper: "flex items-center gap-2",
        placeholder: "text-gray-4 dark:text-gray-5",
        arrow: "transition-transform duration-200 text-gray-8 dark:text-gray-1 shrink-0",
        clearBtn: "shrink-0 text-gray-4 hover:text-gray-6 dark:hover:text-gray-3 cursor-pointer",
    },
    variants: {
        bordered: {
            true: {
                trigger: "border border-gray-3 dark:border-gray-6",
            },
            false: {
                trigger: "border-none",
            },
        },
        size: {
            sm: {
                trigger: "h-input-sm px-2 text-sm gap-1 rounded-ui-sm leading-none",
                arrow: "size-3",
                clearBtn: "size-3",
            },
            md: {
                trigger: "h-input-md px-3 text-base gap-1 rounded-ui-md",
                arrow: "size-4",
                clearBtn: "size-4",
            },
            lg: {
                trigger: "h-input-lg px-4 text-base gap-1 rounded-ui-base",
                arrow: "size-5",
                clearBtn: "size-5",
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
        disabled: {
            true: {
                trigger: "opacity-50 pointer-events-none cursor-not-allowed bg-gray-50 dark:bg-gray-900",
            },
        },
        error: {
            true: {
                trigger: "border-red-5 focus:border-red-5 data-[state=open]:border-red-5",
            },
        },
    },
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
    },
};
