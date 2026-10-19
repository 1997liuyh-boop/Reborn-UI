import { placements } from "~/lib/placement";

const modes = ["popup", "dialog"] as const;
export { modes as guideModes, placements as guidePlacements };

/** 只过渡透明度与完整 transform；减少动态时保留短淡化，不产生位移。 */
export const guideMotionStyles = {
  prepare: "transition-none opacity-0",
  leave: "transition-[opacity,transform] motion-safe:duration-(--duration-instant) ease-out opacity-0",
  enter: "transition-[opacity,transform] motion-safe:duration-(--duration-fast) ease-out opacity-100 [transform:translateY(0)]",
  nextFrom: "[transform:translateY(4px)]",
  nextTo: "[transform:translateY(-4px)]",
  prevFrom: "[transform:translateY(-4px)]",
  prevTo: "[transform:translateY(4px)]",
  // 全局减少动态把时长令牌压到近零，这里保留 75ms 的可读淡化。
  reduced: "motion-reduce:transition-opacity motion-reduce:duration-75 motion-reduce:[transform:none]",
};

// 阴影按设计值设置；背景与文字使用随主题变化的语义令牌。
const panel = "fixed flex flex-col gap-2 rounded-lg bg-gray-1 p-4 text-left outline-none shadow-[0_2px_12px_0_rgba(0,0,0,0.15)]";

export default {
  slots: {
    overlay: "fixed inset-0 touch-none",
    highlightMask: "absolute pointer-events-none rounded-lg",
    guideBox: `${panel} w-[360px] max-w-[calc(100vw-32px)]`,
    guideArrow: "absolute size-3 bg-gray-1 pointer-events-none",
    guideHeader: "relative text-left",
    guideTitle: "text-base font-medium text-gray-10",
    guideBody: "relative text-base text-gray-8",
    guideFooter: "relative flex items-center justify-between gap-2",
    counter: "shrink-0 text-base text-gray-8",
    buttonGroup: "ml-auto flex items-center gap-2",
    dialogOverlay: "fixed inset-0 touch-none",
    dialogBox: `${panel} w-[480px] max-w-[calc(100vw-32px)]`,
    closeRow: "relative flex justify-end",
    closeButton: "flex size-5 cursor-pointer items-center justify-center rounded-sm text-gray-8 hover:text-gray-10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    // 外层 gap-2 加 mb-2，使封面与后面的标题相隔 16px。
    cover: "relative mb-2 block w-full rounded-lg object-cover",
    indicators: "flex flex-wrap items-center gap-2",
    indicatorDot: "shrink-0 rounded-full",
  },
  variants: { mode: { popup: {}, dialog: {} } },
  defaultVariants: { mode: "popup" as (typeof modes)[number] },
};
