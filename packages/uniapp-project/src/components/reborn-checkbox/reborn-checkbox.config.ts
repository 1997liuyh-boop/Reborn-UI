const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { size as checkboxSizes, color as checkboxColors };

export default {
  slots: {
    wrapper: "group inline-flex items-center gap-3 cursor-pointer select-none",
    input: "sr-only",
    control:
      "flex items-center justify-center rounded-md border border-gray-4 bg-white text-white transition-colors ring-1 ring-transparent group-[.is-disabled]:cursor-not-allowed group-[.is-disabled]:bg-gray-2 group-[.is-disabled]:border-gray-3",
    icon: "size-4 opacity-0 scale-75 transition-all group-[.is-checked]:opacity-100 group-[.is-checked]:scale-100",
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
        control: "group-[.is-checked]:bg-primary group-[.is-checked]:border-primary",
        icon: "text-white",
      },
      secondary: {
        control: "group-[.is-checked]:bg-secondary group-[.is-checked]:border-secondary",
        icon: "text-white",
      },
      success: {
        control: "group-[.is-checked]:bg-success group-[.is-checked]:border-success",
        icon: "text-white",
      },
      info: {
        control: "group-[.is-checked]:bg-info group-[.is-checked]:border-info",
        icon: "text-white",
      },
      warning: {
        control: "group-[.is-checked]:bg-warning group-[.is-checked]:border-warning",
        icon: "text-white",
      },
      error: {
        control: "group-[.is-checked]:bg-error group-[.is-checked]:border-error",
        icon: "text-white",
      },
      neutral: {
        control: "group-[.is-checked]:bg-neutral group-[.is-checked]:border-neutral",
        icon: "text-white",
      },
    },
    error: {
      true: {
        control: "border-error",
        label: "text-error",
      },
    },
  },
  defaultVariants: {
    size: "md" as (typeof size)[number],
    color: "primary" as (typeof color)[number],
  },
};
