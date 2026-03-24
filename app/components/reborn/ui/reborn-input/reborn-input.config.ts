const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { colors as inputColors, sizes as inputSizes };

export default {
  slots: {
    wrapper:
      "relative inline-flex w-full items-center transition-colors ring-1 ring-transparent bg-gray-2 dark:bg-gray-8 text-gray-8 dark:text-gray-1",
    input:
      "min-w-0 flex-1 bg-transparent text-gray-8 dark:text-gray-1 placeholder:text-gray-5 outline-none disabled:cursor-not-allowed",
    leading: "inline-flex items-center text-gray-6",
    iconBox: "inline-flex items-center gap-2",
    icon: "",
    iconSection: "flex cursor-pointer items-center justify-center text-gray-5 transition-all hover:opacity-80",
    separator: "w-px transition-colors bg-gray-4",
  },
  variants: {
    size: {
      sm: {
        wrapper: "h-input-sm px-input-px-sm",
        input: "text-26 leading-normal",
        icon: "text-26",
        separator: "h-input-sep-sm",
      },
      md: {
        wrapper: "h-input-md px-input-px-md",
        input: "text-28 leading-normal",
        icon: "text-28",
        separator: "h-input-sep-md",
      },
      lg: {
        wrapper: "h-input-lg px-input-px-lg",
        input: "text-28 leading-normal",
        icon: "text-28",
        separator: "h-input-sep-lg",
      },
    },
    rounded: {
      true: "",
      false: ""
    },
    border: {
      true: {
        wrapper: "ring-gray-3 dark:ring-gray-7",
      },
      false: {
        wrapper: "",
      },
    },
    error: {
      true: {
        wrapper: "ring-error/50 bg-error/5 focus-within:ring-error",
        input: "text-error placeholder:text-error/50",
      },
    },
    multiline: {
      true: {
        wrapper: "h-auto items-start py-4",
        input: "min-h-[160px] resize-none",
      },
    },
    fieldGroup: {
      horizontal: {
        wrapper: "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-within:z-[1]",
      },
      vertical: {
        wrapper: "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-within:z-[1]",
      },
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
    focus: {
      true: {},
      false: {},
    },
    hasLeading: { true: {} },
    hasTrailing: { true: {} },
  },
  compoundVariants: [
    {
      color: "primary",
      focus: true,
      border: true,
      class: { wrapper: "bg-white dark:bg-gray-900 ring-primary/30", separator: "bg-primary/40" },
    },
    {
      color: "secondary",
      focus: true,
      border: true,
      class: { wrapper: "bg-white dark:bg-gray-900 ring-secondary/30", separator: "bg-secondary/40" },
    },
    {
      color: "success",
      focus: true,
      border: true,
      class: { wrapper: "bg-white dark:bg-gray-900 ring-success/30", separator: "bg-success/40" },
    },
    {
      color: "info",
      focus: true,
      border: true,
      class: { wrapper: "bg-white dark:bg-gray-900 ring-info/30", separator: "bg-info/40" },
    },
    {
      color: "warning",
      focus: true,
      border: true,
      class: { wrapper: "bg-white dark:bg-gray-900 ring-warning/30", separator: "bg-warning/40" },
    },
    {
      color: "error",
      focus: true,
      border: true,
      class: { wrapper: "bg-white dark:bg-gray-900 ring-error/30", separator: "bg-error/40" },
    },
    {
      color: "neutral",
      focus: true,
      border: true,
      class: { wrapper: "bg-white dark:bg-gray-900 ring-gray-400/30", separator: "bg-gray-400/40" },
    },
    { size: "sm", rounded: true, class: { wrapper: "rounded-ui-sm" } },
    { size: "md", rounded: true, class: { wrapper: "rounded-ui-sm" } },
    { size: "lg", rounded: true, class: { wrapper: "rounded-full" } },
  ] as any,
  defaultVariants: {
    size: "md",
    color: "neutral",
    rounded: true,
    border: true,
    focus: false,
  },
} as const;
