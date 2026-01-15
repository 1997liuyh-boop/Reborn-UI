const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { size as inputNumberSizes, color as inputNumberColors };

export default {
  slots: {
    wrapper:
      "relative inline-flex items-center overflow-hidden rounded-full bg-white text-gray-8 ring-1 ring-gray-2 transition-colors focus-within:ring-2 data-[disabled=true]:cursor-not-allowed data-[disabled=true]:bg-gray-1 data-[disabled=true]:text-gray-4 dark:bg-gray-800 dark:text-gray-200 dark:ring-gray-700 dark:data-[disabled=true]:bg-gray-900 dark:data-[disabled=true]:text-gray-600",
    button:
      "flex h-full items-center justify-center text-gray-6 transition-colors disabled:cursor-not-allowed disabled:text-gray-4 dark:text-gray-400 dark:hover:text-gray-200 dark:disabled:text-gray-600",
    input:
      "min-w-0 flex-1 bg-transparent text-center text-gray-8 outline-none placeholder:text-gray-4 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none dark:text-gray-200 dark:placeholder:text-gray-500",
    divider: "h-1/2 w-px bg-gray-3 dark:bg-gray-700",
    icon: "shrink-0",
  },
  variants: {
    size: {
      sm: {
        wrapper: "h-[var(--input-sm-height)] w-28 text-[length:var(--text-size-26)]",
        input: "text-[length:var(--text-size-26)]",
        button: "px-3",
        icon: "size-3.5",
      },
      md: {
        wrapper: "h-[var(--input-md-height)] w-36 text-[length:var(--text-size-28)]",
        input: "text-[length:var(--text-size-28)]",
        button: "px-4",
        icon: "size-4",
      },
      lg: {
        wrapper: "h-[var(--input-lg-height)] w-44 text-[length:var(--text-size-32)]",
        input: "text-[length:var(--text-size-32)]",
        button: "px-5",
        icon: "size-5",
      },
    },
    color: {
      primary: {
        wrapper: "focus-within:ring-primary/20",
        button: "hover:text-primary",
      },
      secondary: {
        wrapper: "focus-within:ring-secondary/20",
        button: "hover:text-secondary",
      },
      success: {
        wrapper: "focus-within:ring-success/20",
        button: "hover:text-success",
      },
      info: {
        wrapper: "focus-within:ring-info/20",
        button: "hover:text-info",
      },
      warning: {
        wrapper: "focus-within:ring-warning/20",
        button: "hover:text-warning",
      },
      error: {
        wrapper: "focus-within:ring-error/20",
        button: "hover:text-error",
      },
      neutral: {
        wrapper: "focus-within:ring-neutral/20",
        button: "hover:text-neutral",
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
    size: "md" as (typeof size)[number],
    color: "primary" as (typeof color)[number],
  },
};
