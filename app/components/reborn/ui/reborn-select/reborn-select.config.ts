const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as selectSizes, colors as selectColors };

export default {
  slots: {
    wrapper: "relative inline-flex w-full",
    trigger:
      "flex w-full items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 transition-colors cursor-pointer select-none",
    triggerText: "truncate text-gray-800 dark:text-gray-100",
    placeholder: "text-gray-400 dark:text-gray-500",
    arrow: "transition-transform duration-200 text-gray-400 shrink-0",
    dropdown:
      "absolute z-50 mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg overflow-auto",
    option: "flex items-center cursor-pointer transition-colors text-gray-700 dark:text-gray-200",
    optionActive: "",
    clearBtn: "shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer",
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
        trigger: "focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20",
        optionActive: "bg-primary/10 text-primary",
      },
      secondary: {
        trigger: "focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/20",
        optionActive: "bg-secondary/10 text-secondary",
      },
      success: {
        trigger: "focus-within:border-success focus-within:ring-2 focus-within:ring-success/20",
        optionActive: "bg-success/10 text-success",
      },
      info: {
        trigger: "focus-within:border-info focus-within:ring-2 focus-within:ring-info/20",
        optionActive: "bg-info/10 text-info",
      },
      warning: {
        trigger: "focus-within:border-warning focus-within:ring-2 focus-within:ring-warning/20",
        optionActive: "bg-warning/10 text-warning",
      },
      error: {
        trigger: "focus-within:border-error focus-within:ring-2 focus-within:ring-error/20",
        optionActive: "bg-error/10 text-error",
      },
      neutral: {
        trigger: "focus-within:border-neutral focus-within:ring-2 focus-within:ring-neutral/20",
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
