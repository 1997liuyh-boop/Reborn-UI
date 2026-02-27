const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as sliderSizes, colors as sliderColors };

export default {
    slots: {
        wrapper: "flex items-center w-full",
        inner: "flex-1 relative h-full flex items-center",
        track: "relative w-full rounded-full bg-gray-200 dark:bg-gray-700",
        progress: "absolute top-0 h-full rounded-full",
        thumb:
            "absolute rounded-full border-2 border-solid border-white pointer-events-none z-[1] shadow-[0_0_1px_1px_rgba(100,100,100,0.1)]",
        thumbActive: "z-[2]",
        value: "text-center w-[50px] text-gray-700 dark:text-gray-200",
    },
    variants: {
        size: {
            sm: { track: "h-1", value: "text-xs" },
            md: { track: "h-1.5", value: "text-sm" },
            lg: { track: "h-2", value: "text-base" },
        },
        color: {
            primary: { progress: "bg-primary", thumb: "bg-primary" },
            secondary: { progress: "bg-secondary", thumb: "bg-secondary" },
            success: { progress: "bg-success", thumb: "bg-success" },
            info: { progress: "bg-info", thumb: "bg-info" },
            warning: { progress: "bg-warning", thumb: "bg-warning" },
            error: { progress: "bg-error", thumb: "bg-error" },
            neutral: { progress: "bg-neutral", thumb: "bg-neutral" },
        },
        disabled: {
            true: { wrapper: "opacity-50 pointer-events-none" },
        },
    },
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
    },
};
