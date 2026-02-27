const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as radioSizes, colors as radioColors };

export default {
    slots: {
        root: "inline-flex cursor-pointer select-none",
        wrapper: "inline-flex items-center gap-2",
        activeIcon:
            "inline-flex items-center justify-center rounded-full border-2 border-transparent text-white transition-all duration-200",
        inactiveIcon:
            "inline-flex items-center justify-center rounded-full border-2 border-gray-4 dark:border-gray-6 transition-all duration-200",
        label: "text-gray-8 dark:text-gray-1",
    },
    variants: {
        size: {
            sm: {
                activeIcon: "size-4 text-[10px]",
                inactiveIcon: "size-4",
                label: "text-xs",
            },
            md: {
                activeIcon: "size-5 text-xs",
                inactiveIcon: "size-5",
                label: "text-sm",
            },
            lg: {
                activeIcon: "size-6 text-sm",
                inactiveIcon: "size-6",
                label: "text-base",
            },
        },
        color: {
            primary: {
                activeIcon: "bg-primary border-primary",
            },
            secondary: {
                activeIcon: "bg-secondary border-secondary",
            },
            success: {
                activeIcon: "bg-success border-success",
            },
            info: {
                activeIcon: "bg-info border-info",
            },
            warning: {
                activeIcon: "bg-warning border-warning",
            },
            error: {
                activeIcon: "bg-error border-error",
            },
            neutral: {
                activeIcon: "bg-neutral border-neutral",
            },
        },
        disabled: {
            true: {
                root: "opacity-50 pointer-events-none",
            },
        },
    },
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
    },
};
