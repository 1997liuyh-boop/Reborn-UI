const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as selectDateSizes, colors as selectDateColors };

export default {
    slots: {
        wrapper: "relative inline-flex w-full",
        trigger:
            "flex w-full items-center justify-between rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 transition-colors cursor-pointer select-none",
        triggerText: "truncate text-gray-800 dark:text-gray-100",
        placeholder: "text-gray-400 dark:text-gray-500",
        arrow: "transition-transform duration-200 text-gray-400 shrink-0",
        dropdown:
            "absolute z-50 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg p-3",
        calHeader: "flex items-center justify-between mb-2",
        calNavBtn: "p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer text-gray-600 dark:text-gray-300",
        calTitle: "text-sm font-medium text-gray-800 dark:text-gray-100",
        calWeekdays: "grid grid-cols-7 gap-0 text-center text-xs text-gray-400 dark:text-gray-500 mb-1",
        calDays: "grid grid-cols-7 gap-0",
        calDay:
            "flex items-center justify-center rounded-md text-sm cursor-pointer transition-colors text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700",
        calDayActive: "",
        calDayDisabled: "text-gray-300 dark:text-gray-600 pointer-events-none",
        calDayToday: "font-bold",
        clearBtn: "shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer",
    },
    variants: {
        size: {
            sm: {
                trigger: "h-8 px-2 text-xs gap-1",
                arrow: "size-3",
                clearBtn: "size-3",
                calDay: "h-7 w-7 text-xs",
            },
            md: {
                trigger: "h-10 px-3 text-sm gap-2",
                arrow: "size-4",
                clearBtn: "size-4",
                calDay: "h-8 w-8 text-sm",
            },
            lg: {
                trigger: "h-12 px-4 text-base gap-2",
                arrow: "size-5",
                clearBtn: "size-5",
                calDay: "h-9 w-9 text-base",
            },
        },
        color: {
            primary: {
                trigger: "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
                calDayActive: "bg-primary text-white hover:bg-primary/90",
            },
            secondary: {
                trigger: "focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20",
                calDayActive: "bg-secondary text-white hover:bg-secondary/90",
            },
            success: {
                trigger: "focus-within:border-success focus-within:ring-2 focus-within:ring-success/20",
                calDayActive: "bg-success text-white hover:bg-success/90",
            },
            info: {
                trigger: "focus-within:border-info focus-within:ring-2 focus-within:ring-info/20",
                calDayActive: "bg-info text-white hover:bg-info/90",
            },
            warning: {
                trigger: "focus-within:border-warning focus-within:ring-2 focus-within:ring-warning/20",
                calDayActive: "bg-warning text-white hover:bg-warning/90",
            },
            error: {
                trigger: "focus-within:border-error focus-within:ring-2 focus-within:ring-error/20",
                calDayActive: "bg-error text-white hover:bg-error/90",
            },
            neutral: {
                trigger: "focus-within:border-neutral focus-within:ring-2 focus-within:ring-neutral/20",
                calDayActive: "bg-neutral text-white hover:bg-neutral/90",
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
