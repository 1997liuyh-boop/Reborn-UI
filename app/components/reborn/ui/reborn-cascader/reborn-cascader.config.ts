const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as cascaderSizes, colors as cascaderColors };

export default {
  slots: {
    wrapper: "relative inline-flex w-full group outline-none",
    trigger: "",
    triggerText: "truncate text-gray-8 dark:text-gray-1 flex-1",
    placeholder: "truncate text-gray-4 dark:text-gray-5 flex-1",
    dropdown: "!w-auto !overflow-visible !border-transparent !bg-transparent !shadow-none p-0",
    panel: "flex w-max items-start gap-2 bg-transparent p-1",
    column:
      "min-w-[160px] shrink-0 overflow-y-auto rounded-ui-md border border-gray-2 bg-white py-1 min-h-[280px] shadow-lg",
    option:
      "relative flex items-center gap-2 px-3 py-2 text-body-md text-gray-900 cursor-pointer transition-colors hover:bg-gray-1",
    optionActive: "font-medium",
    optionDisabled: "cursor-not-allowed opacity-50 hover:bg-transparent",
    optionLabel: "flex-1 truncate",
    optionIcon: "shrink-0 text-gray-5",
    empty:
      "min-w-[160px] rounded-ui-md border border-gray-2 bg-white px-4 py-6 text-body-md text-gray-5 shadow-lg",
  },
  variants: {
    size: {
      sm: {
        column: "min-w-[140px] max-h-[280px]",
        option: "px-2 py-1.5 text-body-sm",
      },
      md: {
        column: "max-h-[320px]",
      },
      lg: {
        column: "min-w-[180px] max-h-[360px]",
        option: "px-4 py-2.5 text-body-lg",
      },
    },
    color: {
      primary: {
        optionActive: "bg-primary/10 text-primary",
      },
      secondary: {
        optionActive: "bg-secondary/10 text-secondary",
      },
      success: {
        optionActive: "bg-success/10 text-success",
      },
      info: {
        optionActive: "bg-info/10 text-info",
      },
      warning: {
        optionActive: "bg-warning/10 text-warning",
      },
      error: {
        optionActive: "bg-error/10 text-error",
      },
      neutral: {
        optionActive: "bg-neutral/10 text-neutral",
      },
    },
    disabled: {
      true: {},
    },
  },
  compoundVariants: [
    { size: "sm", class: { dropdown: "min-w-0" } },
    { size: "md", class: { dropdown: "min-w-0" } },
    { size: "lg", class: { dropdown: "min-w-0" } },
  ] as any,
  defaultVariants: {
    size: "md" as (typeof sizes)[number],
    color: "primary" as (typeof colors)[number],
  },
};
