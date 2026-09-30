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
    rangeText: "flex items-center gap-2 truncate w-full text-center",
    separator: "shrink-0 text-gray-5",
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
    isRange: {
      true: {},
      false: {},
    },
    disabled: {
      true: {},
    },
  },
  compoundVariants: [
    { isRange: true, size: "sm", class: { dropdown: "min-w-72", trigger: "min-w-45" } },
    { isRange: true, size: "md", class: { dropdown: "min-w-80", trigger: "min-w-50" } },
    { isRange: true, size: "lg", class: { dropdown: "min-w-88", trigger: "min-w-55" } },
    { isRange: false, size: "sm", class: { dropdown: "min-w-40" } },
    { isRange: false, size: "md", class: { dropdown: "min-w-45" } },
    { isRange: false, size: "lg", class: { dropdown: "min-w-52" } },
  ] as any,
  defaultVariants: {
    size: "md" as (typeof sizes)[number],
    color: "primary" as (typeof colors)[number],
  },
};
