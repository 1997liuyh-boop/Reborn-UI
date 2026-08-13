const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as selectDateSizes, colors as selectDateColors };

export default {
    slots: {
        wrapper: "",
        // 与触发器同宽。不能用 w-full：浮层传送到 body 后是 fixed 定位，
        // 百分比宽度会以视口为参照而非触发器。变量由 RebornSelectTrigger 下发，
        // 回退值 100% 让关闭 portal 时退化为原来的 w-full 行为。
        dropdown: "w-[var(--rb-trigger-width,100%)]",
        content: "w-full",
        calHeader: "flex items-center justify-between mb-2",
        calNavBtn: "p-1 rounded-md hover:bg-gray-2 dark:hover:bg-gray-7 transition-colors cursor-pointer text-gray-6 dark:text-gray-3",
        calTitle: "text-sm font-medium text-gray-8 dark:text-gray-1 cursor-pointer hover:text-primary transition-colors",
        calWeekdays: "grid grid-cols-7 gap-0 text-center text-xs text-gray-4 dark:text-gray-5",
        calDays: "grid grid-cols-7 gap-0.5",
        calDay:
            "flex items-center justify-center rounded-md text-sm cursor-pointer transition-colors text-gray-7 dark:text-gray-2 hover:bg-gray-2 dark:hover:bg-gray-7",
        calDayActive: "",
        calDayDisabled: "text-gray-4 dark:text-gray-5 opacity-40 pointer-events-none",
        calDayToday: "font-bold",
    },
    variants: {
        size: {
            sm: {
                calWeekdays: " mb-2",
                calDay: "text-xs",
            },
            md: {
                calWeekdays: " mb-3",
                calDay: "text-sm",
            },
            lg: {
                calWeekdays: " mb-4",
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
            true: {},
        },
        disabled: {
            true: {},
        },
        error: {
            true: {},
        },
        rangeable: {
            true: {
                dropdown: "min-w-[600px]",
            },
        },
    },
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
    },
};
