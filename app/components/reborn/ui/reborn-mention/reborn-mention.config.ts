import { tv } from "~/lib/tv";

/** 下拉面板的展开方向：默认向下，放不下时自动翻到另一侧 */
const placements = ["bottom", "top"] as const;
export { placements as mentionPlacements };

export const mentionTheme = tv({
  slots: {
    /** 根容器：包住输入框，class 与 style 落在这里 */
    root: "reborn-mention relative w-full min-w-0",
    /**
     * 下拉面板外壳：传送到 body、按视口坐标定位，宽度通过变量同步输入框，最大宽度保留视口边距。
     * 底色、描边、圆角与 RebornSelect 的下拉框同一套（gray-1 / gray-3 / 8px），并排使用时看不出两种浮层。
     * 背景与描边只用灰阶 token，深色模式由 base.css 整条翻转，不能写 bg-white 或 dark: 前缀。
     */
    dropdown: "fixed top-0 left-0 z-[9999] flex w-(--rb-mention-width) min-w-0 max-w-[calc(100vw-16px)] flex-col rounded-lg border border-gray-3 bg-gray-1 shadow-lg",
    /** 页头（#header 插槽）：与列表是兄弟节点，列表滚动时固定不动 */
    header: "shrink-0 border-b border-gray-3 px-[10px] py-[6px] text-sm text-gray-6",
    /** 选项列表：滚动发生在这一层；内边距 4/6、行距 4px 与 RebornSelect 一致 */
    list: "max-h-60 space-y-[4px] overflow-y-auto overscroll-contain px-[4px] py-[6px] scrollbar-hide",
    /** 单个选项：14px 字号、6/4 内边距、4px 圆角 */
    option: "flex cursor-pointer items-center rounded-sm px-[6px] py-[4px] text-base text-gray-8 transition-colors",
    /** 键盘或鼠标当前指向的选项，Enter 选中的就是它 */
    optionActive: "bg-gray-2 text-gray-10",
    /** 禁用选项：不可点、键盘导航跳过 */
    // 不加 pointer-events-none，否则禁止光标显示不出来：点击在 handleSelect 里拦，悬停在模板里跳过
    optionDisabled: "cursor-not-allowed text-gray-5",
    /** 选项文本（未使用 #label 插槽时渲染） */
    optionLabel: "truncate",
    /** 页脚（#footer 插槽） */
    footer: "shrink-0 border-t border-gray-3 px-[10px] py-[6px] text-sm text-gray-6",
    /** 加载中占位（未使用 #loading 插槽时渲染），与 RebornSelect 同一套排版 */
    loading: "flex cursor-wait items-center justify-center gap-2 py-6 text-base text-gray-5",
    /** 加载中的转圈图标 */
    loadingIcon: "size-4 shrink-0 animate-spin",
    /**
     * 指向光标的小箭头：12px 方块旋转 45°，与面板同底色同描边，只露出朝向输入框的两条边。
     * 位置（贴面板哪条边、对准哪个 x）由脚本写成行内样式。
     */
    arrow: "pointer-events-none absolute size-3 rotate-45 border-gray-3 bg-gray-1",
  },
  variants: {
    /** 实际展开方向（已处理翻转）：决定箭头露出哪两条描边 */
    side: {
      bottom: { arrow: "border-t border-l" },
      top: { arrow: "border-r border-b" },
    },
  },
  defaultVariants: {
    side: "bottom",
  },
});

/** 语义化结构键，供 ui 属性按节点覆盖样式 */
export interface MentionUI {
  /** 根容器 */
  root?: string;
  /** 下拉面板外壳 */
  dropdown?: string;
  /** 页头 */
  header?: string;
  /** 选项列表（滚动层） */
  list?: string;
  /** 单个选项 */
  option?: string;
  /** 当前指向的选项 */
  optionActive?: string;
  /** 禁用选项 */
  optionDisabled?: string;
  /** 选项文本 */
  optionLabel?: string;
  /** 页脚 */
  footer?: string;
  /** 加载中占位 */
  loading?: string;
  /** 加载中图标 */
  loadingIcon?: string;
  /** 指向光标的箭头 */
  arrow?: string;
}

export default mentionTheme;
