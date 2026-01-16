const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { size as checkboxSizes, color as checkboxColors };

export default {
  slots: {
    wrapper: "inline-flex items-center gap-3 cursor-pointer select-none",
    input: "peer sr-only",
    control:
      "flex items-center justify-center rounded-md border border-gray-4 bg-white text-white transition-colors ring-1 ring-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-disabled:cursor-not-allowed peer-disabled:bg-gray-2 peer-disabled:border-gray-3 peer-checked:[&>*]:opacity-100 peer-checked:[&>*]:scale-100",
    icon: "size-4 opacity-0 scale-75 transition-all",
    label: "text-gray-8 dark:text-gray-2",
  },
  variants: {
    size: {
      sm: {
        control: "size-4",
        label: "text-[length:var(--text-size-24)]",
      },
      md: {
        control: "size-5",
        label: "text-[length:var(--text-size-26)]",
      },
      lg: {
        control: "size-6",
        label: "text-[length:var(--text-size-28)]",
      },
    },
    color: {
      primary: {
        control: "peer-checked:bg-primary peer-checked:border-primary",
        icon: "text-white",
      },
      secondary: {
        control: "peer-checked:bg-secondary peer-checked:border-secondary",
        icon: "text-white",
      },
      success: {
        control: "peer-checked:bg-success peer-checked:border-success",
        icon: "text-white",
      },
      info: {
        control: "peer-checked:bg-info peer-checked:border-info",
        icon: "text-white",
      },
      warning: {
        control: "peer-checked:bg-warning peer-checked:border-warning",
        icon: "text-white",
      },
      error: {
        control: "peer-checked:bg-error peer-checked:border-error",
        icon: "text-white",
      },
      neutral: {
        control: "peer-checked:bg-neutral peer-checked:border-neutral",
        icon: "text-white",
      },
    },
  },
  defaultVariants: {
    size: "md" as (typeof size)[number],
    color: "primary" as (typeof color)[number],
  },
};
