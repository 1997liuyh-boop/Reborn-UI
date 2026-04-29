import { tv } from "~/lib/tv";

const menuModes = ["horizontal", "vertical"] as const;
const menuTriggers = ["hover", "click"] as const;
const menuColors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
const expandTypes = ["normal", "popup"] as const;

export { menuModes, menuTriggers, menuColors, expandTypes };

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
        subMenuPopup: "left-full top-0 ml-2",
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
    expandType: {
      normal: {
        subMenuPopup: "relative z-auto left-auto top-auto ml-0 mt-0 border-0 shadow-none p-0 bg-transparent overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out grid",
        subMenuContent: "min-w-0 ml-4",
      },
      popup: {},
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
      class: {
        menuItem: "hover:bg-gray-2 active:scale-[0.98]",
      },
    },
    {
      mode: "vertical",
      expandType: "normal",
      opened: true,
      class: {
        menuItemArrow: "rotate-90",
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
    expandType: "popup" as (typeof expandTypes)[number],
  },
});

export default theme;
