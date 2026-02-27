const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

const config = {
  slots: {
    wrapper: "relative flex w-full items-center",
    input:
      "flex h-10 w-full rounded-md border border-gray-2 dark:border-gray-7 bg-gray-2 dark:bg-gray-8 px-3  text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    leading: "absolute left-3 top-0 bottom-0 flex items-center justify-center text-muted-foreground",
    trailing: "absolute right-3 top-0 bottom-0 flex items-center justify-center text-muted-foreground",
    // Styles for internal icons like clear and password toggle
    icon: "absolute right-3 top-0 bottom-0 flex items-center justify-center text-muted-foreground transition-opacity hover:opacity-80 cursor-pointer z-10",
  },
  variants: {
    size: {
      sm: {
        input: "h-input-sm px-3",
      },
      md: {
        input: "h-input-md px-3",
      },
      lg: {
        input: "h-input-lg px-8 rounded-md",
      },
    },
    color: {
      primary: {
        input: "focus-within:ring-[1.5px] focus-within:ring-primary",
      },
      secondary: {
        input: "focus-within:ring-[1.5px] focus-within:ring-secondary",
      },
      success: {
        input: "focus-within:ring-[1.5px] focus-within:ring-success",
      },
      info: {
        input: "focus-within:ring-[1.5px] focus-within:ring-info",
      },
      warning: {
        input: "focus-within:ring-[1.5px] focus-within:ring-warning",
      },
      error: {
        input: "focus-within:ring-[1.5px] focus-within:ring-error",
      },
      neutral: {
        input: "focus-within:ring-[1.5px] focus-within:ring-gray-4",
      },
    },
    multiline: {
      true: {
        input: "h-auto",
      },
    },
    fieldGroup: {
      horizontal: {
        wrapper: "first:rounded-r-none last:rounded-l-none",
        input: "first:rounded-r-none last:rounded-l-none focus:z-10",
      },
      vertical: {
        wrapper: "first:rounded-b-none last:rounded-t-none",
        input: "first:rounded-b-none last:rounded-t-none focus:z-10",
      },
    },
    hasLeading: {
      true: {
        input: "pl-9",
      },
    },
    hasTrailing: {
      true: {
        input: "pr-9",
      },
    },
    rounded: {
      true: {
        input: "rounded-full",
      },
      false: {
        input: "rounded-md",
      },
    },
    error: {
      true: {
        input: "border-error text-error placeholder:text-error/50 focus-visible:ring-error focus-within:ring-error focus-within:border-error ring-error",
      },
    },
  },
  defaultVariants: {
    size: "md",
    color: "neutral",
    rounded: true,
  },
} as const;

export { sizes as inputSizes, colors as inputColors };
export default config;
