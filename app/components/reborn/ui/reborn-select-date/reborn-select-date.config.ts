const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as selectDateSizes, colors as selectDateColors };

export default {
    slots: {
        wrapper: "relative inline-flex w-full group outline-none",
        trigger:
            "flex w-full items-center justify-between rounded-lg border border-gray-3 dark:border-gray-6 bg-gray-1 dark:bg-gray-8 transition-colors cursor-pointer select-none outline-none",
        triggerText: "truncate text-gray-8 dark:text-gray-1",
        placeholder: "text-gray-4 dark:text-gray-5",
        arrow: "transition-transform duration-200 text-gray-4 shrink-0",
        dropdown:
            "absolute z-50 mt-1 w-full rounded-lg border border-gray-2 dark:border-gray-7 bg-white dark:bg-gray-8 shadow-lg p-3",
        calHeader: "flex items-center justify-between mb-2",
        calNavBtn: "p-1 rounded-md hover:bg-gray-2 dark:hover:bg-gray-7 transition-colors cursor-pointer text-gray-6 dark:text-gray-3",
        calTitle: "text-sm font-medium text-gray-8 dark:text-gray-1 cursor-pointer hover:text-primary transition-colors",
        calWeekdays: "grid grid-cols-7 gap-0 text-center text-xs text-gray-4 dark:text-gray-5",
        calDays: "grid grid-cols-7 gap-0",
        calDay:
            "flex items-center justify-center rounded-md text-sm cursor-pointer transition-colors text-gray-7 dark:text-gray-2 hover:bg-gray-2 dark:hover:bg-gray-7",
        calDayActive: "",
        calDayDisabled: "text-gray-4 dark:text-gray-5 opacity-40 pointer-events-none",
        calDayToday: "font-bold",
        clearBtn: "shrink-0 text-gray-4 hover:text-gray-6 dark:hover:text-gray-3 cursor-pointer",
    },
    variants: {
        size: {
            sm: {
                trigger: "h-8 px-2 text-xs gap-1",
                calWeekdays: " mb-2",
                arrow: "size-3",
                clearBtn: "size-3",
                calDays: "gap-y-2",
                calDay: "text-xs",
            },
            md: {
                trigger: "h-10 px-3 text-sm gap-2",
                arrow: "size-4",
                clearBtn: "size-4",
                calWeekdays: " mb-3",
                calDays: "gap-y-3",
                calDay: "text-sm",
            },
            lg: {
                trigger: "h-12 px-4 text-base gap-2",
                arrow: "size-5",
                clearBtn: "size-5",
                calWeekdays: " mb-4",
                calDays: "gap-y-4",
                calDay: "text-base",
            },
        },
        color: {
            primary: {
                trigger: "group-focus:border-primary group-focus:ring-2 group-focus:ring-primary/20 data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary/20",
                calDayActive: "bg-primary text-white hover:bg-primary/90",
            },
            secondary: {
                trigger: "group-focus:border-secondary group-focus:ring-2 group-focus:ring-secondary/20 data-[state=open]:border-secondary data-[state=open]:ring-2 data-[state=open]:ring-secondary/20",
                calDayActive: "bg-secondary text-white hover:bg-secondary/90",
            },
            success: {
                trigger: "group-focus:border-success group-focus:ring-2 group-focus:ring-success/20 data-[state=open]:border-success data-[state=open]:ring-2 data-[state=open]:ring-success/20",
                calDayActive: "bg-success text-white hover:bg-success/90",
            },
            info: {
                trigger: "group-focus:border-info group-focus:ring-2 group-focus:ring-info/20 data-[state=open]:border-info data-[state=open]:ring-2 data-[state=open]:ring-info/20",
                calDayActive: "bg-info text-white hover:bg-info/90",
            },
            warning: {
                trigger: "group-focus:border-warning group-focus:ring-2 group-focus:ring-warning/20 data-[state=open]:border-warning data-[state=open]:ring-2 data-[state=open]:ring-warning/20",
                calDayActive: "bg-warning text-white hover:bg-warning/90",
            },
            error: {
                trigger: "group-focus:border-error group-focus:ring-2 group-focus:ring-error/20 data-[state=open]:border-error data-[state=open]:ring-2 data-[state=open]:ring-error/20",
                calDayActive: "bg-error text-white hover:bg-error/90",
            },
            neutral: {
                trigger: "group-focus:border-neutral group-focus:ring-2 group-focus:ring-neutral/20 data-[state=open]:border-neutral data-[state=open]:ring-2 data-[state=open]:ring-neutral/20",
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
