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
    columns: "relative flex w-full overflow-hidden",
    column: "relative flex flex-1 flex-col items-center",
    arrowButton:
      "flex w-full shrink-0 cursor-pointer items-center justify-center text-gray-4 transition-colors hover:text-primary dark:text-gray-5 z-20",
    list: "flex-1 flex flex-col items-center w-full overflow-y-auto scrollbar-hide",
    item: "flex w-full shrink-0 cursor-pointer items-center justify-center transition-all",
    itemActive: "font-semibold text-primary scale-110",
    itemDisabled: "cursor-not-allowed opacity-30 grayscale",
    itemIdle: "text-gray-4 hover:text-gray-7 dark:text-gray-5 dark:hover:text-gray-3",
    indicator:
      "absolute left-2 right-2 top-1/2 z-10 -translate-y-1/2 pointer-events-none border-y border-gray-2 dark:border-gray-7",
    mask: "absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-white/80 via-transparent to-white/80 dark:from-gray-8/80 dark:to-gray-8/80",
    footer:
      "flex items-center justify-end gap-3 border-t border-gray-2 p-2 dark:border-gray-7",
  },
  variants: {
    size: {
      sm: {
        wrapper: "p-1",
        columns: "h-45 gap-2",
        list: "py-16",
        item: "h-8 text-sm",
        indicator: "h-8",
        arrowButton: "h-4",
      },
      md: {
        wrapper: "p-2",
        columns: "h-55 gap-3",
        list: "py-20",
        item: "h-10 text-base",
        indicator: "h-10",
        arrowButton: "h-5",
      },
      lg: {
        wrapper: "p-3",
        columns: "h-65 gap-4",
        list: "py-22",
        item: "h-11 text-lg",
        indicator: "h-11",
        arrowButton: "h-6",
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
