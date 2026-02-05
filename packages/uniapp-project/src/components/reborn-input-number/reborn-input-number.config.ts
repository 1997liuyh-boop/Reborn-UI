const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
const shape = ["circle", "square"] as const;

export { size as inputNumberSizes, color as inputNumberColors, shape as inputNumberShapes };

export default {
  slots: {
    wrapper:
      "group relative inline-flex items-center overflow-hidden bg-white text-gray-8 ring-[1.5px] ring-gray-4 transition-colors focus-within:ring-2 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-gray-1 data-[disabled=true]:text-gray-4 dark:bg-gray-800 dark:text-gray-200  dark:data-[disabled=true]:bg-gray-900 dark:data-[disabled=true]:text-gray-600",
    button:
      "flex h-full items-center justify-center text-gray-8 transition-colors disabled:cursor-not-allowed disabled:text-gray-4 dark:text-gray-400 dark:hover:text-gray-200 dark:disabled:text-gray-600",
    input:
      "min-w-0 flex-1 bg-transparent text-center text-gray-8 outline-none placeholder:text-gray-4 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:text-gray-200 dark:placeholder:text-gray-500",
    divider: "h-full w-[1.5px] bg-gray-4",
    icon: "shrink-0",
  },
  variants: {
    size: {
      sm: {
        wrapper: "h-[calc(var(--text-size-26)*2)] text-[length:var(--text-size-26)]",
        input: "w-[calc(var(--text-size-26)*2.5)] text-[length:var(--text-size-26)]",
        button: "p-1.5",
        icon: "size-3.5",
      },
      md: {
        wrapper: "h-[calc(var(--text-size-28)*2)] text-[length:var(--text-size-28)]",
        input: "w-[calc(var(--text-size-28)*2.5)] text-[length:var(--text-size-28)]",
        button: "p-2",
        icon: "size-4",
      },
      lg: {
        wrapper: "h-[calc(var(--text-size-32)*2)] text-[length:var(--text-size-32)]",
        input: "w-[calc(var(--text-size-32)*5)] text-[length:var(--text-size-32)]",
        button: "p-2",
        icon: "size-5",
      },
    },
    color: {
      primary: {
        wrapper: "focus-within:ring-primary",
        button: "hover:text-primary",
        divider: "group-focus-within:bg-primary",
      },
      secondary: {
        wrapper: "focus-within:ring-secondary",
        button: "hover:text-secondary",
        divider: "group-focus-within:bg-secondary",
      },
      success: {
        wrapper: "focus-within:ring-success",
        button: "hover:text-success",
        divider: "group-focus-within:bg-success",
      },
      info: {
        wrapper: "focus-within:ring-info",
        button: "hover:text-info",
        divider: "group-focus-within:bg-info",
      },
      warning: {
        wrapper: "focus-within:ring-warning",
        button: "hover:text-warning",
        divider: "group-focus-within:bg-warning",
      },
      error: {
        wrapper: "focus-within:ring-error",
        button: "hover:text-error",
        divider: "group-focus-within:bg-error",
      },
      neutral: {
        wrapper: "focus-within:ring-gray-4",
        button: "hover:text-neutral",
        divider: "group-focus-within:bg-gray-4",
      },
    },
    shape: {
      circle: {
        wrapper: "rounded-full",
      },
      square: {
        wrapper: "rounded-md",
      },
    },
    fieldGroup: {
      horizontal:
        "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-within:z-[1]",
      vertical:
        "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-within:z-[1]",
    },
  },
  defaultVariants: {
    size: "sm" as (typeof size)[number],
    color: "neutral" as (typeof color)[number],
    shape: "circle" as (typeof shape)[number],
  },
};
