const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { size as switchSizes, color as switchColors };

export default {
  slots: {
    wrapper: "inline-flex items-center gap-3 cursor-pointer select-none",
    input: "peer sr-only",
    track:
      "relative inline-flex items-center rounded-full bg-gray-3 transition-colors ring-1 ring-transparent peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 peer-disabled:cursor-not-allowed peer-disabled:bg-gray-2 data-[loading=true]:cursor-wait data-[loading=true]:opacity-80",
    thumb:
      "absolute left-0.5 top-0.5 flex items-center justify-center rounded-full bg-white shadow transition-transform duration-200",
    activeLabel: "text-gray-8 dark:text-gray-1",
    inactiveLabel: "text-gray-8 dark:text-gray-1",
  },
  variants: {
    size: {
      sm: {
        track: "h-5 w-9 peer-checked:[&>span]:translate-x-4",
        thumb: "size-4",
        activeLabel: "text-[length:var(--text-size-24)]",
        inactiveLabel: "text-[length:var(--text-size-24)]",
      },
      md: {
        track: "h-6 w-11 peer-checked:[&>span]:translate-x-5",
        thumb: "size-5",
        activeLabel: "text-[length:var(--text-size-26)]",
        inactiveLabel: "text-[length:var(--text-size-26)]",
      },
      lg: {
        track: "h-7 w-14 peer-checked:[&>span]:translate-x-7",
        thumb: "size-6",
        activeLabel: "text-[length:var(--text-size-28)]",
        inactiveLabel: "text-[length:var(--text-size-28)]",
      },
    },
    color: {
      primary: {
        track: "peer-checked:bg-primary",
      },
      secondary: {
        track: "peer-checked:bg-secondary",
      },
      success: {
        track: "peer-checked:bg-success",
      },
      info: {
        track: "peer-checked:bg-info",
      },
      warning: {
        track: "peer-checked:bg-warning",
      },
      error: {
        track: "peer-checked:bg-error",
      },
      neutral: {
        track: "peer-checked:bg-neutral",
      },
    },
    active: {
      true: {
        activeLabel: "font-medium",
        inactiveLabel: "text-gray-4 dark:text-gray-6",
      },
      false: {
        activeLabel: "text-gray-4 dark:text-gray-6",
        inactiveLabel: "text-gray-9 dark:text-gray-1 font-medium",
      },
    },
  },
  compoundVariants: [
    { color: "primary" as (typeof color)[number], active: true, class: { activeLabel: "text-primary" } },
    { color: "secondary" as (typeof color)[number], active: true, class: { activeLabel: "text-secondary" } },
    { color: "success" as (typeof color)[number], active: true, class: { activeLabel: "text-success" } },
    { color: "info" as (typeof color)[number], active: true, class: { activeLabel: "text-info" } },
    { color: "warning" as (typeof color)[number], active: true, class: { activeLabel: "text-warning" } },
    { color: "error" as (typeof color)[number], active: true, class: { activeLabel: "text-error" } },
    { color: "neutral" as (typeof color)[number], active: true, class: { activeLabel: "text-neutral" } },
    // Inactive states
    { color: "primary" as (typeof color)[number], active: false, class: { inactiveLabel: "text-primary" } },
    { color: "secondary" as (typeof color)[number], active: false, class: { inactiveLabel: "text-secondary" } },
    { color: "success" as (typeof color)[number], active: false, class: { inactiveLabel: "text-success" } },
    { color: "info" as (typeof color)[number], active: false, class: { inactiveLabel: "text-info" } },
    { color: "warning" as (typeof color)[number], active: false, class: { inactiveLabel: "text-warning" } },
    { color: "error" as (typeof color)[number], active: false, class: { inactiveLabel: "text-error" } },
    { color: "neutral" as (typeof color)[number], active: false, class: { inactiveLabel: "text-neutral" } },
  ],
  defaultVariants: {
    size: "md" as (typeof size)[number],
    color: "primary" as (typeof color)[number],
  },
};
