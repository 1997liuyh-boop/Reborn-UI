const placements = [
  "top", "left", "right", "bottom",
  "top-left", "top-right", "bottom-left", "bottom-right",
  "left-top", "left-bottom", "right-top", "right-bottom",
] as const;

const modes = ["popup", "dialog"] as const;

export { placements as guidePlacements, modes as guideModes };

export default {
  slots: {
    /** popup 模式：全屏遮罩容器 */
    overlay: "fixed inset-0 z-[--guide-z]",
    /** 挖洞高亮元素（box-shadow 技术） */
    highlightMask:
      "absolute rounded-lg transition-all duration-300 ease-out pointer-events-none",
    /** 指引框容器 */
    guideBox:
      "fixed z-[--guide-box-z] bg-white dark:bg-gray-9 rounded-ui-lg shadow-xl border border-gray-2 dark:border-gray-7 min-w-[260px] max-w-[360px]",
    /** 指引框箭头 */
    guideArrow: "absolute w-3 h-3 rotate-45 bg-white dark:bg-gray-9 border-gray-2 dark:border-gray-7",
    /** 指引框头部 */
    guideHeader: "flex items-center justify-between px-5 pt-5 pb-2",
    /** 指引框标题 */
    guideTitle: "text-base font-semibold text-gray-9 dark:text-gray-1",
    /** 指引框正文 */
    guideBody: "px-5 py-2 text-sm text-gray-6 dark:text-gray-3 leading-relaxed",
    /** 指引框底部 */
    guideFooter: "flex items-center justify-between px-5 pb-5 pt-3 gap-2",
    /** 计数器 */
    counter: "text-xs text-gray-4 dark:text-gray-5",
    /** 按钮组 */
    buttonGroup: "flex items-center gap-2",
    /** 跳过链接 */
    skipLink: "text-xs text-gray-4 hover:text-gray-6 cursor-pointer transition-colors",
    /** dialog 模式：遮罩 */
    dialogOverlay:
      "fixed inset-0 z-[--guide-z] bg-gray-900/60 flex items-center justify-center p-4",
    /** dialog 模式：对话框 */
    dialogBox:
      "bg-white dark:bg-gray-9 rounded-ui-lg shadow-xl w-full max-w-[480px]",
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
