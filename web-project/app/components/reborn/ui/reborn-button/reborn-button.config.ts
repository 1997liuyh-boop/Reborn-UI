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
        base: "h-[var(--button-xs-height)] text-24 leading-[1.5] gap-1.5 px-3 has-[>svg]:px-2.5",
      },
      sm: {
        base: "h-[var(--button-sm-height)] text-24 leading-[1.5] gap-1.5 px-3 has-[>svg]:px-2.5",
      },
      default: {
        base: "h-[var(--button-base-height)] text-26 leading-[1.5] px-4 py-4 has-[>svg]:px-3",
      },
      md: { base: "h-[var(--button-base-height)] text-26 leading-[1.5] px-4 py-4 has-[>svg]:px-3" },
      lg: { base: "h-[var(--button-lg-height)] text-28 leading-[1.5] px-6 has-[>svg]:px-4" },
      xl: { base: "h-[var(--button-xl-height)] text-30 leading-[1.5] px-6 has-[>svg]:px-4" },
      "2xl": { base: "h-[var(--button-2xl-height)] text-32 leading-[1.5] px-6 has-[>svg]:px-4" },
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
      class: "bg-primary text-white hover:bg-primary/75",
    },
    {
      color: "secondary" as (typeof color)[number], // Secondary not in original, defaulting to Purple/Violet or Gray? User had Info=Gray. I'll make Secondary=Violet
      variant: "solid" as (typeof variant)[number],
      class: "bg-secondary text-white hover:bg-secondary/75",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "solid" as (typeof variant)[number],
      class: "bg-success text-white hover:bg-success/75",
    },
    {
      color: "info" as (typeof color)[number], // User's original info was gray-8. I will keep that as explicit choice.
      variant: "solid" as (typeof variant)[number],
      class: "bg-info text-white hover:bg-info/75",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "solid" as (typeof variant)[number],
      class: "bg-warning text-white hover:bg-warning/75",
    },
    {
      color: "error" as (typeof color)[number], // User's original default was red.
      variant: "solid" as (typeof variant)[number],
      class: "bg-error text-white hover:bg-error/75",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "solid" as (typeof variant)[number],
      class: "bg-neutral text-white hover:bg-neutral/75",
    },

    // Outline Variants
    {
      color: "primary" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class:
        "bg-transparent text-primary border border-primary hover:bg-primary/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class:
        "bg-transparent text-secondary border border-secondary hover:bg-secondary/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class:
        "bg-transparent text-success border border-success hover:bg-success/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class:
        "bg-transparent text-info border border-info hover:bg-info/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class:
        "bg-transparent text-warning border border-warning hover:bg-warning/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class:
        "bg-transparent text-error border border-error hover:bg-error/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "outline" as (typeof variant)[number],
      class:
        "bg-transparent text-neutral border border-neutral hover:bg-neutral/10 disabled:bg-gray-2 disabled:border-gray-4 disabled:text-gray-6",
    },

    // Soft Variants (Freestyling as requested, using lighter 1/2 shades)
    {
      color: "primary" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-primary/10 text-primary hover:bg-primary/20",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-secondary/10 text-secondary hover:bg-secondary/20",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-success/10 text-success hover:bg-success/20",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-info/10 text-info hover:bg-info/20",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-warning/10 text-warning hover:bg-warning/20",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-error/10 text-error hover:bg-error/20",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "soft" as (typeof variant)[number],
      class: "bg-neutral/10 text-neutral hover:bg-neutral/20",
    },

    // Subtle Variants (Transparent bg, colored text, hover light bg)
    {
      color: "primary" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      // class: "bg-transparent text-primary hover:bg-primary/10",
      class: "bg-primary/10 ring-1 ring-inset ring-primary text-primary hover:bg-primary/20",
    },
    {
      color: "secondary" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class:
        "bg-secondary/10 ring-1 ring-inset ring-secondary text-secondary hover:bg-secondary/20",
    },
    {
      color: "success" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-success/10 ring-1 ring-inset ring-success text-success hover:bg-success/20",
    },
    {
      color: "info" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-info/10 ring-1 ring-inset ring-info text-info hover:bg-info/20",
    },
    {
      color: "warning" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-warning/10 ring-1 ring-inset ring-warning text-warning hover:bg-warning/20",
    },
    {
      color: "error" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-error/10 ring-1 ring-inset ring-error text-error hover:bg-error/20",
    },
    {
      color: "neutral" as (typeof color)[number],
      variant: "subtle" as (typeof variant)[number],
      class: "bg-neutral/10 ring-1 ring-inset ring-neutral text-neutral hover:bg-neutral/20",
    },
  ],
  defaultVariants: {
    color: "primary" as (typeof color)[number],
    variant: "solid" as (typeof variant)[number],
    size: "md" as (typeof size)[number],
  },
};
