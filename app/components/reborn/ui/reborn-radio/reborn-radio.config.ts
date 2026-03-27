const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as radioSizes, colors as radioColors };

export default {
    slots: {
        root: "inline-flex cursor-pointer select-none items-center",
        wrapper: "inline-flex items-center gap-2",
        activeIcon:
            "inline-flex items-center justify-center rounded-full transition-all duration-200",
        inactiveIcon:
            "inline-flex items-center justify-center rounded-full border-gray-4 dark:border-gray-6 transition-all duration-200",
        innerDot: "rounded-full bg-current transition-all duration-200 size-[60%]",
        label: "text-gray-8 dark:text-gray-1",
    },
    variants: {
        variant: {
            circle: {
                activeIcon: "bg-transparent border-[2px]!",
                inactiveIcon: "bg-transparent border-[2px]!",
                innerDot: "flex",
            },
            simple: {
                activeIcon: "text-white",
                inactiveIcon: "border-2",
                innerDot: "hidden",
            },
        },
        size: {
            sm: {
                activeIcon: "size-input-sep-sm text-caption-sm",
                inactiveIcon: "size-input-sep-sm",
                label: "text-caption-lg",
                innerDot: 'size-[50%]'
            },
            md: {
                activeIcon: "size-input-sep-md text-caption-lg",
                inactiveIcon: "size-input-sep-md",
                label: "text-body-base",
                innerDot: 'size-[60%]'
            },
            lg: {
                activeIcon: "size-input-sep-lg text-body-base",
                inactiveIcon: "size-input-sep-lg",
                label: "text-title-md",
                innerDot: 'size-[70%]'
            },
        },
        color: {
            primary: { activeIcon: "bg-primary border-primary", innerDot: "bg-primary" },
            secondary: { activeIcon: "bg-secondary border-secondary", innerDot: "bg-secondary" },
            success: { activeIcon: "bg-success border-success", innerDot: "bg-success" },
            info: { activeIcon: "bg-info border-info", innerDot: "bg-info" },
            warning: { activeIcon: "bg-warning border-warning", innerDot: "bg-warning" },
            error: { activeIcon: "bg-error border-error", innerDot: "bg-error" },
            neutral: { activeIcon: "bg-neutral border-neutral", innerDot: "bg-neutral" },
        },
        checked: {
            true: {},
            false: {},
        },
        disabled: {
            true: {
                root: "opacity-50 pointer-events-none",
            },
        },
    },
    compoundVariants: [
        // 当为 circle 变体时，覆盖 activeIcon 的背景和边框逻辑
        {
            variant: "circle" as const,
            color: "primary" as const,
            class: { activeIcon: "bg-transparent border-primary" }
        },
        {
            variant: "circle" as const,
            color: "secondary" as const,
            class: { activeIcon: "bg-transparent border-secondary" }
        },
        {
            variant: "circle" as const,
            color: "success" as const,
            class: { activeIcon: "bg-transparent border-success" }
        },
        {
            variant: "circle" as const,
            color: "info" as const,
            class: { activeIcon: "bg-transparent border-info" }
        },
        {
            variant: "circle" as const,
            color: "warning" as const,
            class: { activeIcon: "bg-transparent border-warning" }
        },
        {
            variant: "circle" as const,
            color: "error" as const,
            class: { activeIcon: "bg-transparent border-error" }
        },
        {
            variant: "circle" as const,
            color: "neutral" as const,
            class: { activeIcon: "bg-neutral border-neutral" }
        },

        // 选中后的文字颜色逻辑
        { checked: true as const, color: "primary" as const, class: { label: "text-primary" } },
        { checked: true as const, color: "secondary" as const, class: { label: "text-secondary" } },
        { checked: true as const, color: "success" as const, class: { label: "text-success" } },
        { checked: true as const, color: "info" as const, class: { label: "text-info" } },
        { checked: true as const, color: "warning" as const, class: { label: "text-warning" } },
        { checked: true as const, color: "error" as const, class: { label: "text-error" } },
        { checked: true as const, color: "neutral" as const, class: { label: "text-neutral" } },
    ],
    defaultVariants: {
        variant: "simple" as const,
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
        checked: false,
    },
};
