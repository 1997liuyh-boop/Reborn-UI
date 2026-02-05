const size = ["sm", "md", "lg"] as const;
const labelPositions = ["left", "top", "right"] as const;
export default {
    slots: {
        root: "flex gap-2 mb-4",
        wrapper: "flex-1",
        label: "text-gray-8 dark:text-gray-1 font-medium flex items-center shrink-0",
        content: "relative w-full flex-1",
        error: "text-xs text-red-500 mt-1 animate-in slide-in-from-top-1 fade-in duration-200"
    },
    variants: {
        size: {
            sm: {
                label: "text-26",
            },
            md: {
                label: "text-28",
            },
            lg: {
                label: "text-30",
            },
        },
        error: {
            true: {
                root: "re-form-item--error"
            }
        },
        labelPosition: {
            left: {
                root: "flex-row",
                label: "justify-start text-left",
            },
            right: {
                root: "flex-row",
                label: "justify-end text-right",
            },
            top: {
                root: "flex-col items-stretch",
                label: "justify-start text-left w-full",
            }
        }
    },
    defaultVariants: {
        size: "sm",
        error: false,
        labelPosition: "left"
    }
} as const;

export { labelPositions as formItemLabelPositions };