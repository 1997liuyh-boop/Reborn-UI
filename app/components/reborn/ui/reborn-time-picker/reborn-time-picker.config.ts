const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as timePickerSizes, colors as timePickerColors };

export default {
  slots: {
    wrapper: "relative inline-flex w-full group outline-none",
    triggerText: "truncate text-gray-8 dark:text-gray-1 flex-1",
    placeholder: "truncate text-gray-4 dark:text-gray-5 flex-1",
    dropdown:
      "absolute z-50 mt-2 w-full rounded-2xl border border-gray-2 bg-white p-2 shadow-xl shadow-gray-9/8 dark:border-gray-7 dark:bg-gray-8 dark:shadow-black/20 top-full",
    rangeText: "flex items-center gap-2 truncate w-full",
    separator: "shrink-0 text-gray-4 dark:text-gray-5",
  },
  variants: {
    size: {
      sm: {},
      md: {},
      lg: {},
    },
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
    open: {
      true: {},
    },
    disabled: {
      true: {},
    },
  },
  defaultVariants: {
    size: "md" as (typeof sizes)[number],
    color: "primary" as (typeof colors)[number],
  },
};
