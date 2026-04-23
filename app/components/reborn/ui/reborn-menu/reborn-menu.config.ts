import { tv } from "~/lib/tv";

const menuModes = ["horizontal", "vertical"] as const;
const menuTriggers = ["hover", "click"] as const;
const menuColors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

export { menuModes, menuTriggers, menuColors };

const theme = tv({
  slots: {
    root: "relative rounded-xl shadow-sm p-2  bg-white dark:bg-gray-9",
    menu: "flex rounded-xl transition-all duration-300 ease-in-out",
    menuItem: "relative flex cursor-pointer select-none items-center transition-all duration-200 ease-in-out",
    menuItemContent: "flex w-full items-center gap-3",
    menuItemTitle: "flex-1 truncate font-medium",
    menuItemIcon: "flex shrink-0 items-center justify-center",
    menuItemArrow: "flex shrink-0 items-center justify-center transition-transform duration-200 ease-in-out",
    subMenu: "relative",
    subMenuPopup: "absolute z-50 overflow-visible rounded-lg border border-gray-2 bg-white p-2 shadow-xl dark:bg-gray-9",
    subMenuContent: "flex flex-col",
    menuItemGroup: "flex flex-col",
    menuItemGroupTitle: "px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-5",
  },
  variants: {
    mode: {
      horizontal: {
        menu: "flex-row items-center px-2 py-1",
        menuItem: "h-10 rounded-xl px-4",
        subMenuPopup: "left-0 top-full mt-2",
        subMenuContent: "min-w-[200px]",
      },
      vertical: {
        menu: "flex-col",
        menuItem: "w-full px-4 py-3 rounded-lg",
        subMenuPopup: "left-full top-0 ml-2",
        subMenuContent: "min-w-[200px]",
      },
    },
    collapse: {
      true: {
        menu: "w-16",
        menuItem: "justify-center px-2",
        menuItemTitle: "hidden",
        menuItemArrow: "hidden",
        menuItemContent: "justify-center",
      },
      false: {},
    },
    active: {
      true: {
        menuItem: "font-semibold shadow-sm",
      },
      false: {},
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
    disabled: {
      true: {
        menuItem: "cursor-not-allowed pointer-events-none opacity-40",
      },
      false: {},
    },
    opened: {
      true: {},
      false: {},
    },
  },
  compoundVariants: [
    {
      active: true,
      color: "primary",
      class: {
        menuItem: "bg-primary/10 text-primary dark:bg-primary/80",
      },
    },
    {
      active: true,
      color: "secondary",
      class: {
        menuItem: "bg-secondary/10 text-secondary dark:bg-secondary/80",
      },
    },
    {
      active: true,
      color: "success",
      class: {
        menuItem: "bg-success/10 text-success dark:bg-success/80",
      },
    },
    {
      active: true,
      color: "info",
      class: {
        menuItem: "bg-info/10 text-info dark:bg-info/80",
      },
    },
    {
      active: true,
      color: "warning",
      class: {
        menuItem: "bg-warning/10 text-warning dark:bg-warning/80",
      },
    },
    {
      active: true,
      color: "error",
      class: {
        menuItem: "bg-error/10 text-error dark:bg-error/80",
      },
    },
    {
      active: true,
      color: "neutral",
      class: {
        menuItem: "bg-neutral/10 text-neutral dark:bg-neutral/80",
      },
    },
    {
      active: false,
      color: "primary",
      class: {
        menuItem: "hover:bg-primary/10 hover:text-primary active:scale-[0.98] dark:hover:bg-primary/20",
      },
    },
    {
      active: false,
      color: "secondary",
      class: {
        menuItem: "hover:bg-secondary/10 hover:text-secondary active:scale-[0.98] dark:hover:bg-secondary/20",
      },
    },
    {
      active: false,
      color: "success",
      class: {
        menuItem: "hover:bg-success/10 hover:text-success active:scale-[0.98] dark:hover:bg-success/20",
      },
    },
    {
      active: false,
      color: "info",
      class: {
        menuItem: "hover:bg-info/10 hover:text-info active:scale-[0.98] dark:hover:bg-info/20",
      },
    },
    {
      active: false,
      color: "warning",
      class: {
        menuItem: "hover:bg-warning/10 hover:text-warning active:scale-[0.98] dark:hover:bg-warning/20",
      },
    },
    {
      active: false,
      color: "error",
      class: {
        menuItem: "hover:bg-error/10 hover:text-error active:scale-[0.98] dark:hover:bg-error/20",
      },
    },
    {
      active: false,
      color: "neutral",
      class: {
        menuItem: "hover:bg-neutral/10 hover:text-neutral active:scale-[0.98] dark:hover:bg-neutral/20",
      },
    },
    {
      mode: "horizontal",
      opened: true,
      class: {
        menuItemArrow: "rotate-180",
      },
    },
  ],
  defaultVariants: {
    mode: "vertical" as (typeof menuModes)[number],
    color: "primary" as (typeof menuColors)[number],
    collapse: false,
    active: false,
    disabled: false,
    opened: false,
  },
});

export default theme;
