import { placements } from "~/lib/placement";

const modes = ["popup", "dialog"] as const;
export const guideColors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
export { modes as guideModes, placements as guidePlacements };

/** 有色面板通过按钮 ui 覆盖配色，保留按钮本身的尺寸与交互。 */
export const guideButtonUi = {
  prev: { base: "border-gray-1 text-gray-1 enabled:hover:bg-gray-1/15" },
  next: { base: "border-gray-1 bg-gray-1 enabled:hover:bg-gray-1/90" },
  skip: { base: "text-gray-1 enabled:hover:text-gray-1/80" },
} as const;

// 阴影按设计值设置；背景与文字使用随主题变化的语义令牌。
const panel = "fixed flex flex-col gap-2 rounded-lg bg-gray-1 p-4 text-left outline-none shadow-[0_2px_12px_0_rgba(0,0,0,0.15)] transition-none will-change-[opacity,transform]";

export default {
  slots: {
    overlay: "fixed inset-0 touch-none",
    highlightMask: "absolute pointer-events-none rounded-lg",
    guideBox: `${panel} w-90 max-w-[calc(100vw-32px)]`,
    guideArrow: "absolute size-3 bg-gray-1 pointer-events-none",
    guideHeader: "relative text-left",
    guideTitle: "text-base font-medium text-gray-10",
    guideBody: "relative text-base text-gray-8",
    guideFooter: "relative flex items-center justify-between gap-2",
    counter: "shrink-0 text-base text-gray-8",
    buttonGroup: "ml-auto flex items-center gap-2",
    dialogOverlay: "fixed inset-0 touch-none",
    dialogBox: `${panel} w-120 max-w-[calc(100vw-32px)]`,
    closeRow: "relative flex justify-end",
    closeButton: "flex size-5 cursor-pointer items-center justify-center rounded-sm text-gray-8 hover:text-gray-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    // 外层 gap-2 加 mb-2，使封面与后面的标题相隔 16px。
    cover: "relative mb-2 block w-full rounded-lg object-cover",
    indicators: "flex flex-wrap items-center gap-2",
    indicatorDot: "shrink-0 rounded-full",
  },
  variants: {
    mode: { popup: {}, dialog: {} },
    color: {
      primary: { guideBox: "bg-primary", dialogBox: "bg-primary", guideArrow: "bg-primary" },
      secondary: { guideBox: "bg-secondary", dialogBox: "bg-secondary", guideArrow: "bg-secondary" },
      success: { guideBox: "bg-success", dialogBox: "bg-success", guideArrow: "bg-success" },
      info: { guideBox: "bg-info", dialogBox: "bg-info", guideArrow: "bg-info" },
      warning: { guideBox: "bg-warning", dialogBox: "bg-warning", guideArrow: "bg-warning" },
      error: { guideBox: "bg-error", dialogBox: "bg-error", guideArrow: "bg-error" },
      neutral: { guideBox: "bg-neutral", dialogBox: "bg-neutral", guideArrow: "bg-neutral" },
    },
    active: {
      true: { indicatorDot: "h-1.5 w-2.5 bg-primary" },
      false: { indicatorDot: "size-1.5 bg-gray-4" },
    },
  },
  compoundVariants: [
    {
      color: [...guideColors],
      class: {
        guideBox: "text-gray-1", dialogBox: "text-gray-1",
        guideTitle: "text-gray-1", guideBody: "text-gray-1", counter: "text-gray-1",
        closeButton: "text-gray-1 hover:text-gray-1 focus-visible:outline-gray-1",
      },
    },
    { color: [...guideColors], active: true, class: { indicatorDot: "bg-gray-1" } },
    { color: [...guideColors], active: false, class: { indicatorDot: "bg-gray-1/15" } },
  ],
  defaultVariants: { mode: "popup" as (typeof modes)[number] },
};
