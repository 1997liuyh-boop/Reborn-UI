const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { colors as timePickerColors, sizes as timePickerSizes };

export default {
  slots: {
    wrapper: "relative inline-flex w-full group outline-none",
    trigger: "",
    input:
      "min-w-0 w-full flex-1 bg-transparent text-gray-9 outline-none [font:inherit] placeholder:text-gray-5 disabled:cursor-not-allowed disabled:text-gray-5",
    triggerText: "truncate text-gray-9 flex-1",
    placeholder: "truncate text-gray-5 flex-1",
    dropdown: "",
    rangeText: "relative flex h-full w-full min-w-0 items-center gap-2 text-center",
    rangeSegment: "relative flex h-full min-w-0 flex-1 cursor-pointer items-center truncate text-inherit [text-align:inherit] outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed",
    rangeIndicator: "pointer-events-none absolute bottom-0 left-0 h-0.5 bg-primary transition-[width,transform] duration-200 ease-out motion-reduce:transition-none",
    separator: "shrink-0 text-gray-5",
  },
  variants: {
    size: {
      sm: {},
      md: {},
      lg: {},
    },
    color: {
      primary: { rangeIndicator: "bg-primary" },
      secondary: { rangeIndicator: "bg-secondary" },
      success: { rangeIndicator: "bg-success" },
      info: { rangeIndicator: "bg-info" },
      warning: { rangeIndicator: "bg-warning" },
      error: { rangeIndicator: "bg-error" },
      neutral: { rangeIndicator: "bg-neutral" },
    },
    open: {
      true: {},
    },
    isRange: {
      true: {},
      false: {},
    },
    disabled: {
      true: {},
    },
  },
  compoundVariants: [
    { isRange: true, size: "sm", class: { dropdown: "min-w-40", trigger: "min-w-45" } },
    { isRange: true, size: "md", class: { dropdown: "min-w-45", trigger: "min-w-50" } },
    { isRange: true, size: "lg", class: { dropdown: "min-w-52", trigger: "min-w-55" } },
    { isRange: false, size: "sm", class: { dropdown: "min-w-40" } },
    { isRange: false, size: "md", class: { dropdown: "min-w-45" } },
    { isRange: false, size: "lg", class: { dropdown: "min-w-52" } },
  ] as any,
  defaultVariants: {
    size: "md" as (typeof sizes)[number],
    color: "primary" as (typeof colors)[number],
  },
};
