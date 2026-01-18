const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

const variant = ["solid", "outline", "soft", "subtle"] as const;

const size = [
  "xs",
  "sm",
  "default", // Mapped to md
  "md",
  "lg",
  "xl",
  "2xl",
  "icon-xs",
  "icon-sm",
  "icon", // Mapped to icon-md
  "icon-md",
  "icon-lg",
  "icon-xl",
  "icon-2xl",
] as const;

export { color as buttonColors, variant as buttonVariants, size as buttonSizes };

export default {
  slots: {
    base: "inline-flex items-center justify-center gap-2 whitespace-nowrap transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-gray-4 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    label: "truncate",
    leadingIcon: "shrink-0",
    leadingAvatar: "shrink-0",
    leadingAvatarSize: "",
    trailingIcon: "shrink-0",
    hoverClass: "",
  },
  variants: {
    fieldGroup: {
      horizontal:
        "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]",
      vertical:
        "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]",
    },
    color: {
      primary: "",
      secondary: "",
      success: "",
      info: "",
      warning: "",
      error: "",
      neutral: "",
    },
    variant: {
      solid: "",
      outline: "",
      soft: "",
      subtle: "",
    },
    size: {
      xs: {
        base: "h-[var(--button-xs-height)] text-[var(--text-20)] leading-[1.5] gap-1.5 px-3 has-[>svg]:px-2.5",
      },
      sm: {
        base: "h-[var(--button-sm-height)] text-[var(--text-22)] leading-[1.5] gap-1.5 px-3 has-[>svg]:px-2.5",
      },
      default: {
        base: "h-[var(--button-base-height)] text-[var(--text-24)] leading-[1.5] px-4 py-4 has-[>svg]:px-3",
      },
      md: { base: "h-[var(--button-base-height)] text-[var(--text-24)] leading-[1.5] px-4 py-4 has-[>svg]:px-3" },
      lg: { base: "h-[var(--button-lg-height)] text-[var(--text-26)] leading-[1.5] px-6 has-[>svg]:px-4" },
      xl: { base: "h-[var(--button-xl-height)] text-[var(--text-28)] leading-[1.5] px-6 has-[>svg]:px-4" },
      "2xl": { base: "h-[var(--button-2xl-height)] text-[var(--text-30)] leading-[1.5] px-6 has-[>svg]:px-4" },
      "icon-xs": { base: "" },
      "icon-sm": { base: "size-[var(--button-sm-height)]" },
      icon: { base: "size-[var(--button-base-height)]" },
      "icon-md": { base: "size-[var(--button-base-height)]" },
      "icon-lg": { base: "size-[var(--button-lg-height)]" },
      "icon-xl": { base: "size-[var(--button-xl-height)]" },
      "icon-2xl": { base: "size-[var(--button-2xl-height)]" },
    },
    square: {
      true: { base: "p-0" },
    },
  },
  compoundVariants: [
    // Solid Variants
    {
      color: "primary" as (typeof color)[number],
      variant: "solid" as (typeof variant)[number],
      class: {
        base: "bg-primary text-white",
        hoverClass: "opacity-90 scale-[0.98]"
      },
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "solid" as (typeof variant)[number],
      class: {
        base: "bg-secondary text-white",
        hoverClass: "opacity-90 scale-[0.98]"
      },
    },
    {
      color: "success" as (typeof color)[number],
      variant: "solid" as (typeof variant)[number],
      class: {
        base: "bg-success text-white",
        hoverClass: "opacity-90 scale-[0.98]"
      },
    },
    {
      color: "info" as (typeof color)[number],
      variant: "solid" as (typeof variant)[number],
      class: {
        base: "bg-info text-white",
        hoverClass: "opacity-90 scale-[0.98]"
      },
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "solid" as (typeof variant)[number],
      class: {
        base: "bg-warning text-white",
        hoverClass: "opacity-90 scale-[0.98]"
      },
    },
    {
      color: "error" as (typeof color)[number],
      variant: "solid" as (typeof variant)[number],
      class: {
        base: "bg-error text-white",
        hoverClass: "opacity-90 scale-[0.98]"
      },
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "solid" as (typeof variant)[number],
      class: {
        base: "bg-neutral text-white",
        hoverClass: "opacity-90 scale-[0.98]"
      },
    },

    // Outline Variants
    {
      color: "primary" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class: {
        base: "bg-transparent text-primary border border-primary disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        hoverClass: "bg-primary/20 scale-[0.98]",
      }
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class: {
        base: "bg-transparent text-secondary border border-secondary disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        hoverClass: "bg-secondary/20 scale-[0.98]",
      }
    },
    {
      color: "success" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class: {
        base: "bg-transparent text-success border border-success disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        hoverClass: "bg-success/20 scale-[0.98]",
      }
    },
    {
      color: "info" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class: {
        base: "bg-transparent text-info border border-info disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        hoverClass: "bg-info/20 scale-[0.98]",
      }
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class: {
        base: "bg-transparent text-warning border border-warning disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        hoverClass: "bg-warning/20 scale-[0.98]",
      }
    },
    {
      color: "error" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class: {
        base: "bg-transparent text-error border border-error disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        hoverClass: "bg-error/20 scale-[0.98]",
      }
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class: {
        base: "bg-transparent text-neutral border border-neutral disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
        hoverClass: "bg-neutral/20 scale-[0.98]",
      }
    },

    // Soft Variants
    {
      color: "primary" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: {
        base: "bg-primary/10 text-primary",
        hoverClass: "bg-primary/20 scale-[0.98]",
      }
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: {
        base: "bg-secondary/10 text-secondary",
        hoverClass: "bg-secondary/20 scale-[0.98]",
      }
    },
    {
      color: "success" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: {
        base: "bg-success/10 text-success",
        hoverClass: "bg-success/20 scale-[0.98]",
      }
    },
    {
      color: "info" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: {
        base: "bg-info/10 text-info",
        hoverClass: "bg-info/20 scale-[0.98]",
      }
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: {
        base: "bg-warning/10 text-warning",
        hoverClass: "bg-warning/20 scale-[0.98]",
      }
    },
    {
      color: "error" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: {
        base: "bg-error/10 text-error",
        hoverClass: "bg-error/20 scale-[0.98]",
      }
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: {
        base: "bg-neutral/10 text-neutral",
        hoverClass: "bg-neutral/20 scale-[0.98]",
      }
    },

    // Subtle Variants
    {
      color: "primary" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: {
        base: "bg-primary/10 ring-1 ring-inset ring-primary text-primary",
        hoverClass: "bg-primary/20 scale-[0.98]",
      }
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: {
        base: "bg-secondary/10 ring-1 ring-inset ring-secondary text-secondary",
        hoverClass: "bg-secondary/20 scale-[0.98]",
      }
    },
    {
      color: "success" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: {
        base: "bg-success/10 ring-1 ring-inset ring-success text-success",
        hoverClass: "bg-success/20 scale-[0.98]",
      }
    },
    {
      color: "info" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: {
        base: "bg-info/10 ring-1 ring-inset ring-info text-info",
        hoverClass: "bg-info/20 scale-[0.98]",
      }
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: {
        base: "bg-warning/10 ring-1 ring-inset ring-warning text-warning",
        hoverClass: "bg-warning/20 scale-[0.98]",
      }
    },
    {
      color: "error" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: {
        base: "bg-error/10 ring-1 ring-inset ring-error text-error",
        hoverClass: "bg-error/20 scale-[0.98]",
      }
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: {
        base: "bg-neutral/10 ring-1 ring-inset ring-neutral text-neutral",
        hoverClass: "bg-neutral/20 scale-[0.98]",
      }
    },
  ],
  defaultVariants: {
    color: "primary" as (typeof color)[number],
    variant: "solid" as (typeof variant)[number],
    size: "md" as (typeof size)[number],
  },
};
