const size = ["sm", "md", "lg"] as const;
const color = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { size as switchSizes, color as switchColors };

export default {
  slots: {
    wrapper: "inline-flex items-center gap-3 cursor-pointer select-none",
    input: "sr-only",
    track:
      "relative inline-flex items-center rounded-full bg-gray-3 transition-colors ring-1 ring-transparent",
    thumb:
      "absolute left-0.5 top-0.5 flex items-center justify-center rounded-full bg-white shadow transition-transform duration-200",
    loading: "size-full p-0.5 animate-spin text-gray-400 border-2 border-current border-t-transparent rounded-full",
    activeLabel: "text-gray-8 dark:text-gray-1",
    inactiveLabel: "text-gray-8 dark:text-gray-1",
  },
  variants: {
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
    size: {
      sm: {
        track: "h-5 w-9",
        thumb: "size-4",
        activeLabel: "text-24",
        inactiveLabel: "text-24",
      },
      md: {
        track: "h-6 w-11",
        thumb: "size-5",
        activeLabel: "text-26",
        inactiveLabel: "text-26",
      },
      lg: {
        track: "h-7 w-14",
        thumb: "size-6",
        activeLabel: "text-28",
        inactiveLabel: "text-28",
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
  },
  compoundVariants: [
    // 开启状态下的轨道颜色
    { color: "primary" as (typeof color)[number], active: true, class: { track: "bg-primary", activeLabel: "text-primary" } },
    { color: "secondary" as (typeof color)[number], active: true, class: { track: "bg-secondary", activeLabel: "text-secondary" } },
    { color: "success" as (typeof color)[number], active: true, class: { track: "bg-success", activeLabel: "text-success" } },
    { color: "info" as (typeof color)[number], active: true, class: { track: "bg-info", activeLabel: "text-info" } },
    { color: "warning" as (typeof color)[number], active: true, class: { track: "bg-warning", activeLabel: "text-warning" } },
    { color: "error" as (typeof color)[number], active: true, class: { track: "bg-error", activeLabel: "text-error" } },
    { color: "neutral" as (typeof color)[number], active: true, class: { track: "bg-neutral", activeLabel: "text-neutral" } },

    // 关闭状态下的标签颜色
    { color: "primary" as (typeof color)[number], active: false, class: { inactiveLabel: "text-primary" } },
    { color: "secondary" as (typeof color)[number], active: false, class: { inactiveLabel: "text-secondary" } },
    { color: "success" as (typeof color)[number], active: false, class: { inactiveLabel: "text-success" } },
    { color: "info" as (typeof color)[number], active: false, class: { inactiveLabel: "text-info" } },
    { color: "warning" as (typeof color)[number], active: false, class: { inactiveLabel: "text-warning" } },
    { color: "error" as (typeof color)[number], active: false, class: { inactiveLabel: "text-error" } },
    { color: "neutral" as (typeof color)[number], active: false, class: { inactiveLabel: "text-neutral" } },

    // 开启状态下根据尺寸进行的滑块位移
    { size: "sm" as (typeof size)[number], active: true, class: { thumb: "translate-x-4" } },
    { size: "md" as (typeof size)[number], active: true, class: { thumb: "translate-x-5" } },
    { size: "lg" as (typeof size)[number], active: true, class: { thumb: "translate-x-7" } },
  ],
  defaultVariants: {
    size: "md" as (typeof size)[number],
    color: "primary" as (typeof color)[number],
  },
};
