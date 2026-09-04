import { tv } from "~/lib/tv";

const contextMenuSizes = ["sm", "md", "lg"] as const;
/** 触发方式：contextmenu 右键 / click 点击 / hover 悬浮 / selection 划词（配合浏览器 Selection API，选中文字后在选区上方弹出） */
const contextMenuTriggers = ["contextmenu", "click", "hover", "selection"] as const;
const contextMenuColors = ["neutral", "primary", "success", "warning", "error"] as const;

export { contextMenuColors, contextMenuSizes, contextMenuTriggers };

/*
 * 视觉规格：面板圆角 8px、底色 #FFFFFF（gray-1，深色模式随令牌翻转）、
 * 阴影 0 2px 16px rgba(1,27,70,.1)、内边距 6px；选项 14px 字号、内边距 6/4、间隔 2px。
 * 颜色只用灰阶 token（base.css 的 .dark 会整条翻转），不写 dark: 前缀以免二次翻转。
 * 根菜单走自顶向下的高度展开动画（select-collapse），外壳在动画期间由过渡类裁剪内容。
 */
export default tv({
  slots: {
    wrapper: "relative",
    trigger: "",
    contentWrapper: "fixed left-0 top-0 z-[10000] origin-top",
    content: "relative min-w-[160px] rounded-lg bg-gray-1 p-[6px] shadow-[0_2px_16px_0_rgba(1,27,70,0.1)]",
    group: "flex flex-col gap-[2px]",
    separator: "my-[4px] h-px bg-gray-3",
    item:
      "group/item relative flex w-full cursor-pointer select-none items-center gap-2 rounded-ui-2xs px-[6px] py-[4px] text-left text-base leading-[1.5] outline-none transition-colors",
    itemLeading: "flex size-4 shrink-0 items-center justify-center text-gray-5",
    itemBody: "min-w-0 flex-1",
    itemLabel: "truncate",
    itemDescription: "mt-0.5 text-xs leading-[1.5] text-gray-5",
    itemTrailing: "ml-auto flex items-center gap-1 pl-3",
    itemKbd: "rounded-ui-2xs border border-gray-3 bg-gray-2 px-1 py-px text-[11px] font-medium uppercase tracking-wide text-gray-5",
    itemArrow: "text-gray-5 transition-transform duration-200 group-hover/item:translate-x-0.5",
    empty: "px-[6px] py-[4px] text-base leading-[1.5] text-gray-5",
    bridge: "absolute inset-0 z-[-1]",
    mask: "fixed inset-0 z-[9999] bg-black/15 backdrop-blur-[1px]",
  },
  variants: {
    size: {
      sm: {
        item: "py-[2px] text-sm",
        itemLabel: "text-sm",
      },
      md: {},
      lg: {
        item: "py-[6px]",
      },
    },
    nested: {
      true: {},
      false: {},
    },
    disabled: {
      true: {
        item: "pointer-events-none opacity-50",
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
        item: "text-gray-7 hover:bg-gray-2",
      },
    },
    {
      itemColor: "primary",
      class: {
        item: "text-primary hover:bg-primary/10",
      },
    },
    {
      itemColor: "success",
      class: {
        item: "text-success hover:bg-success/10",
      },
    },
    {
      itemColor: "warning",
      class: {
        item: "text-warning hover:bg-warning/10",
      },
    },
    {
      itemColor: "error",
      class: {
        item: "text-error hover:bg-error/10",
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
