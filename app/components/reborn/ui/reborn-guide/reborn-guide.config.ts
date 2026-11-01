import { placements } from "~/lib/placement";

const modes = ["popup", "dialog"] as const;
export const guideColors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;
export { modes as guideModes, placements as guidePlacements };

/**
 * 有色面板通过按钮 ui 覆盖配色，保留按钮本身的尺寸与交互。
 * 颜色取面板上的两个内部变量（见 guideTones）：亮色实底配深色字、深色实底配浅色字，按钮与正文始终与面板底色成对。
 * 「下一步」反相：前景色作底、面板底色作字，对比度与面板正文一致；不沿用 outlined 的文字色，neutral 的 gray-10 落在深色底上会看不清。
 */
export const guideButtonUi = {
  prev: { base: "border-(--reborn-guide-internal-foreground) text-(--reborn-guide-internal-foreground) enabled:hover:bg-(--reborn-guide-internal-foreground)/15" },
  next: { base: "border-(--reborn-guide-internal-foreground) bg-(--reborn-guide-internal-foreground) text-(--reborn-guide-internal-surface) enabled:hover:bg-(--reborn-guide-internal-foreground)/90" },
  skip: { base: "text-(--reborn-guide-internal-foreground) enabled:hover:text-(--reborn-guide-internal-foreground)/80 enabled:active:text-(--reborn-guide-internal-foreground)/80" },
} as const;

/**
 * 每种语义色写入面板底色与配对前景两个内部变量，面板内的文字、指示点与按钮覆盖都从这里继承。
 * 类名必须保持字面量，Tailwind 才能扫描生成对应规则。
 */
const guideTones = {
  primary: "[--reborn-guide-internal-surface:var(--color-primary)] [--reborn-guide-internal-foreground:var(--color-primary-foreground)]",
  secondary: "[--reborn-guide-internal-surface:var(--color-secondary)] [--reborn-guide-internal-foreground:var(--color-secondary-foreground)]",
  success: "[--reborn-guide-internal-surface:var(--color-success)] [--reborn-guide-internal-foreground:var(--color-success-foreground)]",
  info: "[--reborn-guide-internal-surface:var(--color-info)] [--reborn-guide-internal-foreground:var(--color-info-foreground)]",
  warning: "[--reborn-guide-internal-surface:var(--color-warning)] [--reborn-guide-internal-foreground:var(--color-warning-foreground)]",
  error: "[--reborn-guide-internal-surface:var(--color-error)] [--reborn-guide-internal-foreground:var(--color-error-foreground)]",
  neutral: "[--reborn-guide-internal-surface:var(--color-neutral)] [--reborn-guide-internal-foreground:var(--color-neutral-foreground)]",
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
    // 面板底色与前景由 guideTones 写入内部变量，复合变体统一消费；箭头只有底色，直接取语义实底。
    color: {
      primary: { guideBox: guideTones.primary, dialogBox: guideTones.primary, guideArrow: "bg-primary" },
      secondary: { guideBox: guideTones.secondary, dialogBox: guideTones.secondary, guideArrow: "bg-secondary" },
      success: { guideBox: guideTones.success, dialogBox: guideTones.success, guideArrow: "bg-success" },
      info: { guideBox: guideTones.info, dialogBox: guideTones.info, guideArrow: "bg-info" },
      warning: { guideBox: guideTones.warning, dialogBox: guideTones.warning, guideArrow: "bg-warning" },
      error: { guideBox: guideTones.error, dialogBox: guideTones.error, guideArrow: "bg-error" },
      neutral: { guideBox: guideTones.neutral, dialogBox: guideTones.neutral, guideArrow: "bg-neutral" },
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
        guideBox: "bg-(--reborn-guide-internal-surface) text-(--reborn-guide-internal-foreground)", dialogBox: "bg-(--reborn-guide-internal-surface) text-(--reborn-guide-internal-foreground)",
        guideTitle: "text-(--reborn-guide-internal-foreground)", guideBody: "text-(--reborn-guide-internal-foreground)", counter: "text-(--reborn-guide-internal-foreground)",
        closeButton: "text-(--reborn-guide-internal-foreground) hover:text-(--reborn-guide-internal-foreground) focus-visible:outline-(--reborn-guide-internal-foreground)",
      },
    },
    { color: [...guideColors], active: true, class: { indicatorDot: "bg-(--reborn-guide-internal-foreground)" } },
    { color: [...guideColors], active: false, class: { indicatorDot: "bg-(--reborn-guide-internal-foreground)/15" } },
  ],
  defaultVariants: { mode: "popup" as (typeof modes)[number] },
};
