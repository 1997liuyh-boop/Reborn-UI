const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { color as rateColors, size as rateSizes };

export default {
    slots: {
        wrapper: "inline-flex flex-row items-center gap-1",
        star: "relative cursor-pointer transition-all duration-200 ease-out",
        icon: "transition-all duration-200 ease-out dark:text-gray-2",
        iconActive: "transition-all duration-200 ease-out",
        value: "ml-1 font-medium tabular-nums dark:text-gray-1",
    },
    variants: {
        size: {
            sm: {
                icon: "size-4",
                iconActive: "size-4",
                value: "text-[length:var(--text-size-24)]",
            },
            md: {
                icon: "size-5",
                iconActive: "size-5",
                value: "text-[length:var(--text-size-28)]",
            },
            lg: {
                icon: "size-7",
                iconActive: "size-7",
                value: "text-[length:var(--text-size-32)]",
            },
        },
        color: {
            primary: { iconActive: "text-primary" },
            secondary: { iconActive: "text-secondary" },
            success: { iconActive: "text-success" },
            info: { iconActive: "text-info" },
            warning: { iconActive: "text-warning" },
            error: { iconActive: "text-error" },
            neutral: { iconActive: "text-neutral" },
        },
        disabled: {
            true: {
                wrapper: "opacity-50 pointer-events-none",
            },
        },
        readonly: {
            true: {
                star: "cursor-default active:scale-100",
            },
        },
    },
    defaultVariants: {
        size: "md" as (typeof size)[number],
        color: "warning" as (typeof color)[number],
    },
};
