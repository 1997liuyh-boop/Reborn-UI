const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { size as selectTriggerSizes, color as selectTriggerColors };

export default {
    slots: {
        wrapper:
            "flex flex-row items-center w-full box-border rounded-lg bg-white dark:bg-gray-8 border border-solid border-gray-2 dark:border-gray-7 transition-[border-color] duration-200 px-2.5",
        content: "flex-1 truncate",
        text: "text-sm",
        placeholder: "text-sm text-gray-4",
        iconWrapper: "flex flex-row items-center justify-center pl-2.5",
        clearIcon: "i-lucide-x-circle text-gray-4 size-4",
        arrowIcon: "i-lucide-chevron-down text-gray-4 size-4",
    },
    variants: {
        size: {
            sm: {
                wrapper: "h-7",
                text: "text-[length:var(--text-size-24)]",
                placeholder: "text-[length:var(--text-size-24)]",
            },
            md: {
                wrapper: "h-8",
                text: "text-[length:var(--text-size-28)]",
                placeholder: "text-[length:var(--text-size-28)]",
            },
            lg: {
                wrapper: "h-10",
                text: "text-[length:var(--text-size-32)]",
                placeholder: "text-[length:var(--text-size-32)]",
            },
        },
        color: {
            primary: {},
            secondary: {},
            success: {},
            info: {},
            warning: {},
            error: {},
            neutral: {},
        },
        disabled: {
            true: {
                wrapper: "opacity-70 bg-gray-1 dark:bg-gray-7 pointer-events-none",
                text: "text-gray-4",
            },
        },
        focus: {
            true: {
                wrapper: "border-primary dark:border-primary",
            },
        },
        error: {
            true: {
                wrapper: "border-error dark:border-error",
            },
        },
    },
    compoundVariants: [
        { color: "primary" as (typeof color)[number], focus: true as const, class: { wrapper: "border-primary" } },
        { color: "secondary" as (typeof color)[number], focus: true as const, class: { wrapper: "border-secondary" } },
        { color: "success" as (typeof color)[number], focus: true as const, class: { wrapper: "border-success" } },
        { color: "info" as (typeof color)[number], focus: true as const, class: { wrapper: "border-info" } },
        { color: "warning" as (typeof color)[number], focus: true as const, class: { wrapper: "border-warning" } },
        { color: "error" as (typeof color)[number], focus: true as const, class: { wrapper: "border-error" } },
        { color: "neutral" as (typeof color)[number], focus: true as const, class: { wrapper: "border-neutral" } },
    ],
    defaultVariants: {
        size: "md" as (typeof size)[number],
        color: "primary" as (typeof color)[number],
    },
};
