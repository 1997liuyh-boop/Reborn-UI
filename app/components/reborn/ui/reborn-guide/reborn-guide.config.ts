import { placements } from "~/lib/placement";

const modes = ["popup", "dialog"] as const;

export { placements as guidePlacements, modes as guideModes };

/*
 * 层级不在类名里声明：遮罩与指引框的 z-index 由 RebornGuide.vue 的 overlayStyle / guideBoxStyle
 * 按 props.zIndex 以内联样式注入（遮罩 = zIndex、高亮 = +1、指引框 = +2），使用方改 zIndex 即可整体抬升。
 * 原先的 z-[--guide-z] 在 Tailwind v4 下会编译成非法的 z-index: --guide-z，且变量从未定义，已移除。
 * 面板底色统一取纸面色 gray-1，灰阶随主题反转，不再写 dark: 前缀。
 */
export default {
  slots: {
    /** popup 模式：全屏遮罩容器 */
    overlay: "fixed inset-0",
    /** 挖洞高亮元素（box-shadow 技术） */
    highlightMask:
      "absolute rounded-lg transition-all duration-300 ease-out pointer-events-none",
    /** 指引框容器 */
    guideBox:
      "fixed bg-gray-1 rounded-3xl shadow-xl border border-gray-2 min-w-[260px] max-w-[360px]",
    /** 指引框箭头 */
    guideArrow: "absolute size-3 rotate-45 bg-gray-1 border-gray-2",
    /** 指引框头部 */
    guideHeader: "flex items-center justify-between px-5 pt-5 pb-2",
    /** 指引框标题 */
    guideTitle: "text-base font-semibold text-gray-9",
    /** 指引框正文。行高用 text-sm 令牌自带的 20px，不再叠 leading-relaxed（原先 19.5px） */
    guideBody: "px-5 py-2 text-sm text-gray-6",
    /** 指引框底部 */
    guideFooter: "flex items-center justify-between px-5 pb-5 pt-3 gap-2",
    /** 计数器。字号取七级令牌 text-sm（12px），与原先的原生 text-xs 同字号，行高 16px → 20px */
    counter: "text-sm text-gray-4",
    /** 按钮组 */
    buttonGroup: "flex items-center gap-2",
    /** 跳过链接 */
    skipLink: "text-sm text-gray-4 hover:text-gray-6 cursor-pointer transition-colors",
    /** dialog 模式：遮罩 */
    dialogOverlay:
      "fixed inset-0 bg-black/60 flex items-center justify-center p-4",
    /** dialog 模式：对话框 */
    dialogBox:
      "bg-gray-1 rounded-3xl shadow-xl w-full max-w-[480px]",
  },
  variants: {
    mode: {
      popup: {},
      dialog: {},
    },
  },
  defaultVariants: {
    mode: "popup" as (typeof modes)[number],
  },
};
