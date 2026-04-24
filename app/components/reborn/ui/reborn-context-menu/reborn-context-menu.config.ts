import { tv } from "~/lib/tv";

const contextMenuSizes = ["sm", "md", "lg"] as const;
const contextMenuTriggers = ["contextmenu", "click", "hover"] as const;
const contextMenuColors = ["neutral", "primary", "success", "warning", "error"] as const;

export { contextMenuColors, contextMenuSizes, contextMenuTriggers };

export default tv({
  slots: {
    wrapper: "relative",
    trigger: "",
    contentWrapper: "fixed left-0 top-0 z-[10000]",
    content:
      "relative min-w-[220px] overflow-hidden rounded-2xl border border-gray-200/80 bg-white/95 p-2 shadow-[0_24px_80px_-24px_rgba(15,23,42,0.4)] backdrop-blur-xl dark:border-gray-800 dark:bg-gray-950/95",
    group: "flex flex-col gap-1",
    separator: "my-2 h-px bg-gray-200/70 dark:bg-gray-800",
    item:
      "group/item relative flex w-full select-none items-center gap-3 rounded-xl text-left outline-none transition-all duration-200 ease-out",
    itemLeading: "flex size-5 shrink-0 items-center justify-center text-gray-500 dark:text-gray-400",
    itemBody: "min-w-0 flex-1",
    itemLabel: "truncate font-medium text-gray-900 dark:text-white",
    itemDescription: "mt-0.5 text-xs leading-5 text-gray-500 dark:text-gray-400",
    itemTrailing: "ml-auto flex items-center gap-2 pl-4",
    itemKbd:
      "rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-gray-500 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400",
    itemArrow: "text-gray-400 transition-transform duration-200 group-hover/item:translate-x-0.5",
    empty: "px-3 py-2 text-sm text-gray-500 dark:text-gray-400",
    bridge: "absolute inset-0 z-[-1]",
    mask: "fixed inset-0 z-[9999] bg-black/15 backdrop-blur-[1px]",
  },
  variants: {
    size: {
      sm: {
        content: "min-w-[200px] rounded-xl",
        item: "px-2.5 py-2 text-sm",
        itemLabel: "text-sm",
      },
      md: {
        item: "px-3 py-2.5 text-sm",
        itemLabel: "text-sm",
      },
      lg: {
        content: "min-w-[240px] rounded-[20px]",
        item: "px-3.5 py-3 text-[15px]",
        itemLabel: "text-[15px]",
      },
    },
    nested: {
      true: {
        content: "rounded-xl shadow-[0_20px_56px_-20px_rgba(15,23,42,0.45)]",
      },
      false: {},
    },
    disabled: {
      true: {
        trigger: "cursor-not-allowed opacity-50",
        item: "pointer-events-none opacity-45",
      },
      false: {},
    },
    itemColor: {
      neutral: {},
      primary: {},
      success: {},
      warning: {},
      error: {},
    },
  },
  compoundVariants: [
    {
      itemColor: "neutral",
      class: {
        item: "text-gray-700 hover:bg-gray-100/90 active:scale-[0.99] dark:text-gray-200 dark:hover:bg-white/6",
      },
    },
    {
      itemColor: "primary",
      class: {
        item: "text-primary hover:bg-primary/10 active:scale-[0.99] dark:hover:bg-primary/12",
      },
    },
    {
      itemColor: "success",
      class: {
        item: "text-success hover:bg-success/10 active:scale-[0.99] dark:hover:bg-success/12",
      },
    },
    {
      itemColor: "warning",
      class: {
        item: "text-warning hover:bg-warning/10 active:scale-[0.99] dark:hover:bg-warning/12",
      },
    },
    {
      itemColor: "error",
      class: {
        item: "text-error hover:bg-error/10 active:scale-[0.99] dark:hover:bg-error/12",
      },
    },
  ],
  defaultVariants: {
    size: "md" as (typeof contextMenuSizes)[number],
    nested: false,
    disabled: false,
    itemColor: "neutral" as (typeof contextMenuColors)[number],
  },
});
