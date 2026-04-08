const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
const timeUnits = ["hour", "minute", "second", "millisecond"] as const;

export type TimeUnit = (typeof timeUnits)[number];
export type TimeRangeRole = "start" | "end";

export { sizes as timePickerSizes, colors as timePickerColors, timeUnits };

export default {
  slots: {
    wrapper: "w-full",
    rangeWrapper: "grid gap-4 md:grid-cols-[1fr_auto_1fr]",
    rangeSeparator: "hidden items-center justify-center text-gray-4 dark:text-gray-5 md:flex",
    section: "space-y-4",
    columns: "grid gap-3 relative",
    column: "overflow-hidden relative flex flex-col items-center",
    arrowButton:
      "flex w-full items-center justify-center text-gray-8 transition-colors disabled:pointer-events-none disabled:opacity-30 dark:text-gray-1 cursor-pointer h-6",
    list: "relative h-56 w-full overflow-y-auto px-2 py-24 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden scroll-smooth",
    item: "flex h-10 w-full items-center justify-center text-sm font-medium tabular-nums transition-colors shrink-0",
    itemActive: "font-bold scale-110",
    itemDisabled: "cursor-not-allowed text-gray-300 dark:text-gray-600 opacity-50 select-none",
    itemIdle:
      "cursor-pointer text-gray-7 hover:bg-gray-1 hover:text-gray-9 dark:text-gray-2 dark:hover:bg-gray-7 dark:hover:text-white",
    indicator:
      "absolute left-2 right-2 top-1/2 z-10 h-10 -translate-y-1/2 pointer-events-none border-y border-gray-2 dark:border-gray-7",
    mask: "absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-white via-transparent to-white dark:from-gray-8 dark:to-gray-8",
    footer:
      "flex items-center justify-end gap-3 border-t border-gray-2 p-3 dark:border-gray-7",
  },
  variants: {
    size: {
      sm: {
        columns: "gap-2",
        item: "h-8 text-xs",
      },
      md: {
        columns: "gap-3",
        item: "h-10 text-sm",
      },
      lg: {
        columns: "gap-4",
        item: "h-11 text-base",
      },
    },
    color: {
      primary: {
        indicator: "border-y border-primary/20 dark:border-primary/20",
        itemActive: "text-primary",
      },
      secondary: {
        indicator: "border-y border-secondary/20 dark:border-secondary/20",
        itemActive: "text-secondary",
      },
      success: {
        indicator: "border-y border-success/20 dark:border-success/20",
        itemActive: "text-success",
      },
      info: {
        indicator: "border-y border-info/20 dark:border-info/20",
        itemActive: "text-info",
      },
      warning: {
        indicator: "border-y border-warning/20 dark:border-warning/20",
        itemActive: "text-warning",
      },
      error: {
        indicator: "border-y border-error/20 dark:border-error/20",
        itemActive: "text-error",
      },
      neutral: {
        indicator: "border-y border-neutral/20 dark:border-neutral/20",
        itemActive: "text-neutral",
      },
    },
    arrowControl: {
      false: {
        arrowButton: "hidden",
      },
    },
  },
  defaultVariants: {
    size: "md" as (typeof sizes)[number],
    color: "primary" as (typeof colors)[number],
  },
};
