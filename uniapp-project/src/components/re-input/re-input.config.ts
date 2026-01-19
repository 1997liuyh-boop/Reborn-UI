const inputSizes = ["sm", "md", "lg"] as const;

const config = {
  slots: {
    wrapper: "relative flex w-full items-center",
    input:
      "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    leading: "absolute left-3 top-0 bottom-0 flex items-center justify-center text-muted-foreground",
    trailing: "absolute right-3 top-0 bottom-0 flex items-center justify-center text-muted-foreground",
    // Styles for internal icons like clear and password toggle
    icon: "absolute right-3 top-0 bottom-0 flex items-center justify-center text-muted-foreground transition-opacity hover:opacity-80 cursor-pointer z-10",
  },
  variants: {
    size: {
      sm: {
        input: "h-9 px-3",
      },
      md: {
        input: "h-10 px-3 py-2",
      },
      lg: {
        input: "h-11 px-8 rounded-md",
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
  },
  defaultVariants: {
    size: "md",
  },
} as const;

export { inputSizes };
export default config;
