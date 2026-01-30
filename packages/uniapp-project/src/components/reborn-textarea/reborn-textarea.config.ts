const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

const config = {
    slots: {
        root: "relative box-border shrink-0 grow-0 basis-auto min-h-0 min-w-0 flex flex-row items-center bg-white rounded-lg p-2 transition-all duration-200 border-transparent",
        inner: "h-full flex-1 text-[28rpx] text-surface-700 bg-transparent disabled:cursor-not-allowed disabled:opacity-50",
        text: "absolute right-2 bottom-2 text-xs text-gray-5 pointer-events-none",
    },
    variants: {
        size: {
            sm: {
                inner: "text-[26rpx]",
            },
            md: {
                inner: "text-[28rpx]",
            },
            lg: {
                inner: "text-32!",
            },
        },
        border: {
            true: {
                root: "border border-solid border-surface-200 dark:border-surface-700",
            },
        },
        focused: {
            true: {},
        },
        disabled: {
            true: {
                root: "bg-gray-3 text-gray-5",
                inner: "cursor-not-allowed",
            },
        },
        error: {
            true: {
                root: "border-red-500",
            },
        },
        isDark: {
            true: {
                root: "bg-surface-800",
                inner: "text-white placeholder:text-surface-400",
            },
        },
        hasCount: {
            true: {
                inner: "pb-6",
            },
        },
        color: {
            primary: {
                root: "",
            },
            secondary: {
                root: "",
            },
            success: {
                root: "",
            },
            info: {
                root: "",
            },
            warning: {
                root: "",
            },
            error: {
                root: "",
            },
            neutral: {
                root: "",
            },
        },
    },
    compoundVariants: [
        {
            focused: true,
            color: "primary" as (typeof colors)[number],
            class: {
                root: "border-primary ring-2 ring-primary/20",
            },
        },
        {
            focused: true,
            color: "secondary" as (typeof colors)[number],
            class: {
                root: "border-secondary ring-2 ring-secondary/20",
            },
        },
        {
            focused: true,
            color: "success" as (typeof colors)[number],
            class: {
                root: "border-success ring-2 ring-success/20",
            },
        },
        {
            focused: true,
            color: "info" as (typeof colors)[number],
            class: {
                root: "border-info ring-2 ring-info/20",
            },
        },
        {
            focused: true,
            color: "warning" as (typeof colors)[number],
            class: {
                root: "border-warning ring-2 ring-warning/20",
            },
        },
        {
            focused: true,
            color: "error" as (typeof colors)[number],
            class: {
                root: "border-error ring-2 ring-error/20",
            },
        },
        {
            focused: true,
            color: "neutral" as (typeof colors)[number],
            class: {
                root: "border-neutral ring-2 ring-neutral/20",
            },
        },
    ],
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        border: true,
        color: "primary" as (typeof colors)[number],
    },
}

export { sizes as textareaSizes, colors as textareaColors };
export default config;
