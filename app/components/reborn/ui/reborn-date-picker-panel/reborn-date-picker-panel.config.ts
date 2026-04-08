const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

const datePickerTypes = [
    "year",
    "years",
    "month",
    "months",
    "date",
    "dates",
    "datetime",
    "week",
    "datetimerange",
    "daterange",
    "monthrange",
    "yearrange"
] as const;

export type DatePickerType = typeof datePickerTypes[number];

const viewTypes = [
    "year",
    "month",
    "date",
    "time"
] as const;

export type ViewType = typeof viewTypes[number];

export interface CalDay {
    date: Date;
    day: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    isDisabled: boolean;
    isInRange: boolean;
    isRangeStart: boolean;
    isRangeEnd: boolean;
}

const scrollbarHide = "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

export { sizes as datePickerPanelSizes, colors as datePickerPanelColors, datePickerTypes, viewTypes };

export default {
    slots: {
        wrapper: "w-full bg-white dark:bg-gray-8 transition-all overflow-hidden",
        container: "flex h-full",
        shortcuts: `border-r border-gray-2 dark:border-gray-7 p-4 flex flex-col gap-4 overflow-y-auto ${scrollbarHide}`,
        shortcut: "min-w-15 text-xs text-gray-6 dark:text-gray-4 hover:bg-gray-1 dark:hover:bg-gray-7 hover:text-primary cursor-pointer transition-colors whitespace-nowrap",
        header: "flex items-center justify-between py-4",
        navBtn: "flex items-center p-1 rounded-md hover:bg-gray-2 dark:hover:bg-gray-7 transition-colors cursor-pointer text-gray-6 dark:text-gray-3",
        navBtnHidden: "p-1 opacity-0 pointer-events-none",
        title: "text-sm font-medium text-gray-8 dark:text-gray-1 cursor-pointer hover:text-primary transition-colors",
        weekdays: "grid grid-cols-7 gap-0 text-center justify-items-center text-xs text-gray-4 dark:text-gray-5 mb-4",
        days: "grid grid-cols-7 justify-items-center gap-4",
        day: "flex items-center justify-center text-sm cursor-pointer transition-colors text-gray-7 dark:text-gray-2 hover:bg-gray-2 dark:hover:bg-gray-7 aspect-square w-full h-full",
        yearMonthItem: "flex items-center justify-center cursor-pointer transition-colors text-gray-7 dark:text-gray-2 hover:bg-gray-2 dark:hover:bg-gray-7 w-full rounded-lg",
        dayActive: "",
        dayDisabled: "text-gray-4 dark:text-gray-5 opacity-40 pointer-events-none",
        dayHidden: "invisible",
        dayToday: "font-bold underline",
        dayInRange: "",
        yearMonthInRange: "",
        yearMonthOutside: "opacity-40",
        grid4Year: "grid grid-cols-4 gap-y-2 justify-items-center overflow-auto",
        grid4Month: "grid grid-cols-4 gap-y-2 justify-items-center py-2",
        dateTimeHeader: "flex items-center justify-center gap-2 w-full",
        dateTimeSegment: "ring-1 ring-gray-3 dark:ring-gray-6 text-xs h-6 leading-6 w-24 text-center rounded-md transition-all text-gray-7 dark:text-gray-2 flex-1",
        dateTimeSegmentActive: "cursor-pointer hover:ring-primary/50 hover:text-primary",
        dateTimeSegmentDisabled: "cursor-not-allowed",
        dateTimeSeparator: "text-gray-3 dark:text-gray-6 font-light",
        content: "flex-1 p-4",
        panelLeft: "w-full",
        panelRight: "flex-1 px-2!",
        icon: "transition-all",
    },
    variants: {
        border: {
            true: { wrapper: "border border-gray-2 dark:border-gray-7 rounded-xl shadow-sm" },
            false: { wrapper: "" },
        },
        disabled: {
            false: { wrapper: "" },
        },
        overflow: {
            hidden: { wrapper: "overflow-hidden" },
            visible: { wrapper: "overflow-visible" },
        },
        shape: {
            square: { day: "rounded-md", shortcut: "" },
            circle: { day: "rounded-full", shortcut: "" },
        },
        dual: {
            true: {
                content: "flex flex-row gap-0 divide-x divide-gray-1 dark:divide-gray-7",
                panelLeft: "flex-1 mr-2 px-2!",
            },
            false: {
                content: "",
                panelLeft: "w-full",
            },
        },
        range: {
            true: { wrapper: "min-w-50 py-4" },
            false: { wrapper: "" },
        },
        size: {
            sm: {
                day: "max-w-[32px] text-xs",
                yearMonthItem: "max-w-[56px] h-8 text-xs",
                navBtn: "p-0.5",
                title: "text-xs",
                icon: "size-3.5",
            },
            md: {
                day: "max-w-[38px] text-sm",
                yearMonthItem: "max-w-[68px] h-10 text-sm",
                navBtn: "p-1",
                title: "text-sm",
                icon: "size-4",
            },
            lg: {
                day: "max-w-[44px] text-base",
                yearMonthItem: "max-w-[80px] h-12 text-base",
                navBtn: "p-1.5",
                title: "text-base",
                icon: "size-5",
            },
        },
        color: {
            primary: {
                dayActive: "bg-primary text-white hover:bg-primary/90",
                dayToday: "text-primary",
                title: "hover:text-primary",
                dayInRange: "bg-primary/10 dark:bg-primary/20",
                yearMonthInRange: "bg-primary/10 dark:bg-primary/20",
            },
            secondary: {
                dayActive: "bg-secondary text-white hover:bg-secondary/90",
                dayToday: "text-secondary",
                title: "hover:text-secondary",
                dayInRange: "bg-secondary/10 dark:bg-secondary/20",
                yearMonthInRange: "bg-secondary/10 dark:bg-secondary/20",
            },
            success: {
                dayActive: "bg-success text-white hover:bg-success/90",
                dayToday: "text-success",
                title: "hover:text-success",
                dayInRange: "bg-success/10 dark:bg-success/20",
                yearMonthInRange: "bg-success/10 dark:bg-success/20",
            },
            info: {
                dayActive: "bg-info text-white hover:bg-info/90",
                dayToday: "text-info",
                title: "hover:text-info",
                dayInRange: "bg-info/10 dark:bg-info/20",
                yearMonthInRange: "bg-info/10 dark:bg-info/20",
            },
            warning: {
                dayActive: "bg-warning text-white hover:bg-warning/90",
                dayToday: "text-warning",
                title: "hover:text-warning",
                dayInRange: "bg-warning/10 dark:bg-warning/20",
                yearMonthInRange: "bg-warning/10 dark:bg-warning/20",
            },
            error: {
                dayActive: "bg-error text-white hover:bg-error/90",
                dayToday: "text-error",
                title: "hover:text-error",
                dayInRange: "bg-error/10 dark:bg-error/20",
                yearMonthInRange: "bg-error/10 dark:bg-error/20",
            },
            neutral: {
                dayActive: "bg-neutral text-white hover:bg-neutral/90",
                dayToday: "text-neutral",
                title: "hover:text-neutral",
                dayInRange: "bg-neutral/10 dark:bg-neutral/20",
                yearMonthInRange: "bg-neutral/10 dark:bg-neutral/20",
            },
        },
    },
    defaultVariants: {
        size: "md" as (typeof sizes)[number],
        color: "primary" as (typeof colors)[number],
        shape: "square" as "square" | "circle",
    },
};
