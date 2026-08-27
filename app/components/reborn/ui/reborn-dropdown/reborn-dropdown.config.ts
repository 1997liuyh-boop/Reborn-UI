const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { sizes as dropdownSizes, colors as dropdownColors };

export default {
  slots: {
    wrapper: "relative inline-flex",
    trigger: "inline-flex items-center cursor-pointer select-none outline-none transition-colors",
    /** 按钮组形态的外层行容器，负责限定整行高度并裁剪溢出内容 */
    splitRoot: "flex w-full items-center overflow-hidden",
    splitMain: "inline-flex items-center justify-center",
    splitArrow: "inline-flex items-center justify-center border-l border-white/20",
    dropdown: "overflow-hidden p-2 w-auto!",
    item: "flex w-full cursor-pointer select-none items-center gap-2 text-gray-7 transition-colors data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-40 dark:text-gray-2",
    divider: "my-1 border-t border-gray-2 dark:border-gray-7",
    icon: "flex shrink-0 items-center justify-center",
    label: "flex-1 truncate",
  },
  variants: {
    size: {
      sm: {
        trigger: "h-input-sm px-2 text-sm gap-1 rounded-ui-sm",
        splitRoot: "h-input-sm",
        splitArrow: "px-1.5 h-input-sm rounded-r-ui-sm",
        item: "h-8 px-3 text-sm rounded-md",
        icon: "size-3.5",
      },
      md: {
        trigger: "h-input-md px-3 text-base gap-1.5 rounded-ui-md",
        splitRoot: "h-input-md",
        splitArrow: "px-2 h-input-md rounded-r-ui-md",
        item: "h-9 px-4 text-base rounded-md",
        icon: "size-4",
      },
      lg: {
        trigger: "h-input-lg px-4 text-base gap-2 rounded-ui-base",
        splitRoot: "h-input-lg",
        splitArrow: "px-2.5 h-input-lg rounded-r-ui-base",
        item: "h-10 px-5 text-base rounded-md",
        icon: "size-5",
      },
    },
    color: {
      primary: {
        trigger: "bg-primary text-white hover:bg-primary/90",
        item: "hover:bg-primary/10 hover:text-primary data-[active=true]:bg-primary/10 data-[active=true]:text-primary",
        splitArrow: "bg-primary hover:bg-primary/90",
      },
      secondary: {
        trigger: "bg-secondary text-white hover:bg-secondary/90",
        item: "hover:bg-secondary/10 hover:text-secondary data-[active=true]:bg-secondary/10 data-[active=true]:text-secondary",
        splitArrow: "bg-secondary hover:bg-secondary/90",
      },
      success: {
        trigger: "bg-success text-white hover:bg-success/90",
        item: "hover:bg-success/10 hover:text-success data-[active=true]:bg-success/10 data-[active=true]:text-success",
        splitArrow: "bg-success hover:bg-success/90",
      },
      info: {
        trigger: "bg-info text-white hover:bg-info/90",
        item: "hover:bg-info/10 hover:text-info data-[active=true]:bg-info/10 data-[active=true]:text-info",
        splitArrow: "bg-info hover:bg-info/90",
      },
      warning: {
        trigger: "bg-warning text-white hover:bg-warning/90",
        item: "hover:bg-warning/10 hover:text-warning data-[active=true]:bg-warning/10 data-[active=true]:text-warning",
        splitArrow: "bg-warning hover:bg-warning/90",
      },
      error: {
        trigger: "bg-error text-white hover:bg-error/90",
        item: "hover:bg-error/10 hover:text-error data-[active=true]:bg-error/10 data-[active=true]:text-error",
        splitArrow: "bg-error hover:bg-error/90",
      },
      neutral: {
        trigger: "bg-neutral text-white hover:bg-neutral/90",
        item: "hover:bg-neutral/10 hover:text-neutral data-[active=true]:bg-neutral/10 data-[active=true]:text-neutral",
        splitArrow: "bg-neutral hover:bg-neutral/90",
      },
    },
    placement: {
      "bottom-start": { dropdown: "top-full left-0 mt-1" },
      bottom: { dropdown: "top-full left-1/2 -translate-x-1/2 mt-1" },
      "bottom-end": { dropdown: "top-full right-0 mt-1" },
      "top-start": { dropdown: "bottom-full left-0 mb-1" },
      top: { dropdown: "bottom-full left-1/2 -translate-x-1/2 mb-1" },
      "top-end": { dropdown: "bottom-full right-0 mb-1" },
    },
  },
  defaultVariants: {
    size: "md" as (typeof sizes)[number],
    color: "primary" as (typeof colors)[number],
    placement: "bottom-start" as const,
  },
};
