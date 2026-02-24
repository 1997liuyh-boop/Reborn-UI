const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export default {
    slots: {
        root: "flex flex-row items-center",
        wrapper: "inline-flex items-center gap-2", // wrapper to align icon and label
        activeIcon: "flex justify-center items-center border-2 border-gray-4 dark:border-gray-600 transition-all duration-200",
        inactiveIcon: "border-2 border-gray-4 dark:border-gray-1 transition-all duration-200",
        label: "text-sm text-gray-7 dark:text-gray-2",
        control: "flex items-center justify-center rounded-full border border-gray-300 dark:border-gray-600 transition-colors",
    },
    variants: {
        color: {
            primary: {
                activeIcon: "bg-gradient-to-br from-primary/80 to-primary border-transparent",
                label: "data-[checked=true]:text-primary"
            },
            secondary: {
                activeIcon: "bg-gradient-to-br from-secondary/80 to-secondary border-transparent",
                label: "data-[checked=true]:text-secondary"
            },
            success: {
                activeIcon: "bg-gradient-to-br from-success/80 to-success border-transparent",
                label: "data-[checked=true]:text-success"
            },
            info: {
                activeIcon: "bg-gradient-to-br from-info/80 to-info border-transparent",
                label: "data-[checked=true]:text-info"
            },
            warning: {
                activeIcon: "bg-gradient-to-br from-warning/80 to-warning border-transparent",
                label: "data-[checked=true]:text-warning"
            },
            error: {
                activeIcon: "bg-gradient-to-br from-error/80 to-error border-transparent",
                label: "data-[checked=true]:text-error"
            },
            neutral: {
                activeIcon: "bg-gradient-to-br from-neutral/80 to-neutral border-transparent",
                label: "data-[checked=true]:text-neutral"
            },
        },
        size: {
            sm: {
                activeIcon: "w-[32rpx] h-[32rpx]",
                inactiveIcon: "w-[32rpx] h-[32rpx]",
                label: "text-24"
            },
            md: {
                activeIcon: "w-[36rpx] h-[36rpx]",
                inactiveIcon: "w-[36rpx] h-[36rpx]",
                label: "text-26"
            },
            lg: {
                activeIcon: "w-[40rpx] h-[40rpx]",
                inactiveIcon: "w-[40rpx] h-[40rpx]",
                label: "text-28"
            }
        },
        isRound: {
            true: {
                activeIcon: "rounded-full text-white",
                inactiveIcon: "rounded-full text-white"
            }
        },
        disabled: {
            true: {
                root: "opacity-50 pointer-events-none cursor-not-allowed",
            }
        }
    },
    defaultVariants: {
        size: "md",
        color: "primary",
        isRound: true
    }
} as const;

export { sizes as radioSizes, colors as radioColors };
