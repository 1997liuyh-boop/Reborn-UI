const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as selectSizes, colors as selectColors };

export default {
    slots: {
        wrapper: "relative inline-flex w-full group outline-none",
        trigger:
            "flex w-full items-center justify-between rounded-lg border border-gray-3 dark:border-gray-6 bg-gray-1 dark:bg-gray-8 transition-colors cursor-pointer select-none outline-none",
        triggerText: "truncate text-gray-8 dark:text-gray-1",
        placeholder: "text-gray-4 dark:text-gray-5",
        arrow: "transition-transform duration-200 text-gray-4 shrink-0",
        dropdown:
            "absolute z-50 mt-1 w-full rounded-lg border border-gray-2 dark:border-gray-7 bg-white dark:bg-gray-8 shadow-lg overflow-auto",
        option:
            "flex items-center cursor-pointer transition-colors text-gray-7 dark:text-gray-2",
        optionActive: "",
        clearBtn: "shrink-0 text-gray-4 hover:text-gray-6 dark:hover:text-gray-3 cursor-pointer",
    },
    variants: {
        size: {
            sm: {
                trigger: "h-8 px-2 text-xs gap-1",
                option: "px-2 py-1.5 text-xs",
                arrow: "size-3",
                clearBtn: "size-3",
            },
            md: {
                trigger: "h-10 px-3 text-sm gap-2",
                option: "px-3 py-2 text-sm",
                arrow: "size-4",
                clearBtn: "size-4",
            },
            lg: {
                trigger: "h-12 px-4 text-base gap-2",
                option: "px-4 py-2.5 text-base",
                arrow: "size-5",
                clearBtn: "size-5",
            },
        },
        color: {
            primary: {
                trigger: "group-focus:border-primary group-focus:ring-2 group-focus:ring-primary/20 data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
                optionActive: "bg-primary/10 text-primary",
            },
            secondary: {
                trigger: "group-focus:border-secondary group-focus:ring-2 group-focus:ring-secondary/20 data-[state=open]:border-secondary data-[state=open]:ring-2 data-[state=open]:ring-secondary/20",
                optionActive: "bg-secondary/10 text-secondary",
            },
            success: {
                trigger: "group-focus:border-success group-focus:ring-2 group-focus:ring-success/20 data-[state=open]:border-success data-[state=open]:ring-2 data-[state=open]:ring-success/20",
                optionActive: "bg-success/10 text-success",
            },
            info: {
                trigger: "group-focus:border-info group-focus:ring-2 group-focus:ring-info/20 data-[state=open]:border-info data-[state=open]:ring-2 data-[state=open]:ring-info/20",
                optionActive: "bg-info/10 text-info",
            },
            warning: {
                trigger: "group-focus:border-warning group-focus:ring-2 group-focus:ring-warning/20 data-[state=open]:border-warning data-[state=open]:ring-2 data-[state=open]:ring-warning/20",
                optionActive: "bg-warning/10 text-warning",
            },
            error: {
                trigger: "group-focus:border-error group-focus:ring-2 group-focus:ring-error/20 data-[state=open]:border-error data-[state=open]:ring-2 data-[state=open]:ring-error/20",
                optionActive: "bg-error/10 text-error",
            },
            neutral: {
                trigger: "group-focus:border-neutral group-focus:ring-2 group-focus:ring-neutral/20 data-[state=open]:border-neutral data-[state=open]:ring-2 data-[state=open]:ring-neutral/20",
                optionActive: "bg-neutral/10 text-neutral",
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
    },
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
    },
};
