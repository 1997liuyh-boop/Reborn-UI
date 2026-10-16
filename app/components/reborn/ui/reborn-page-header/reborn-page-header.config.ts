import { tv } from "~/lib/tv";

/**
 * 尺寸全部取自设计稿（MasterGo「页头」组件）：
 * 外边距 24px、面包屑与标题行间隔 24px、图标 / 标题 / 分割线 / 内容之间间隔 16px，
 * 标题 20px 中粗 gray-10、内容 16px 常规 gray-8、分割线与描边 gray-2。
 */
export const pageHeaderTheme = tv({
  slots: {
    /** 根容器：纵向排列「面包屑 → 标题行 → 正文」，间隔 24px；描边是设计稿的默认样式，只要底边时用 ui.root 改 */
    root: "reborn-page-header flex flex-col gap-6 border border-gray-2 p-6",
    /** 面包屑区（#breadcrumb 插槽） */
    breadcrumb: "min-w-0",
    /** 标题行：左侧返回区 + 内容，右侧扩展操作，两端对齐 */
    header: "flex min-w-0 items-center justify-between gap-4",
    /** 标题行左半部分：返回区、分割线、内容依次排开，间隔 16px */
    left: "flex min-w-0 items-center gap-4",
    /** 返回区：图标 + 标题，整块可点击并派发 back；键盘可聚焦，Enter / 空格触发 */
    back: "group/back flex shrink-0 cursor-pointer items-center gap-4 rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    /** 图标盒子：24px，悬停返回区时转为主色 */
    icon: "flex size-6 shrink-0 items-center justify-center text-gray-8 transition-colors group-hover/back:text-primary",
    /** 标题：20px 中粗 */
    title: "text-xl font-medium whitespace-nowrap text-gray-10",
    /** 标题与内容之间的竖分割线，仅有内容时渲染 */
    divider: "h-[26px] w-px shrink-0 bg-gray-2",
    /** 内容：16px 常规，过长时截断 */
    content: "min-w-0 truncate text-lg text-gray-8",
    /** 扩展区（#extra 插槽）：右侧操作按钮 */
    extra: "flex shrink-0 items-center gap-2",
    /** 正文区（默认插槽）：标题行下方 */
    main: "min-w-0",
  },
});

/** 语义化结构键，供 ui 属性按节点覆盖样式 */
export interface PageHeaderUI {
  /** 根容器 */
  root?: string;
  /** 面包屑区 */
  breadcrumb?: string;
  /** 标题行 */
  header?: string;
  /** 标题行左半部分 */
  left?: string;
  /** 返回区（图标 + 标题） */
  back?: string;
  /** 图标盒子 */
  icon?: string;
  /** 标题 */
  title?: string;
  /** 分割线 */
  divider?: string;
  /** 内容 */
  content?: string;
  /** 扩展区 */
  extra?: string;
  /** 正文区 */
  main?: string;
}

export default pageHeaderTheme;
