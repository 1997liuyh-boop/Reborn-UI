import type { ClassValue } from "clsx";

/** 布局排列方向 */
export const layoutDirections = ["horizontal", "vertical"] as const;
export type LayoutDirection = (typeof layoutDirections)[number];

/**
 * 会让父级 Layout 转为纵向排列的子组件名。
 * 与 Element Plus 一致：出现顶栏或底栏时，整组子元素改为上下堆叠。
 */
export const VERTICAL_LAYOUT_CHILDREN = new Set(["RebornLayoutHeader", "RebornLayoutFooter"]);

/**
 * 尺寸下发用的 CSS 变量名。
 * height / width 允许任意合法 CSS 长度（60px、10%、auto），
 * 无法穷举成 Tailwind 类，因此走内联变量 + 任意值类名的组合。
 */
export const LAYOUT_HEADER_HEIGHT_VAR = "--reborn-layout-header-height";
export const LAYOUT_FOOTER_HEIGHT_VAR = "--reborn-layout-footer-height";
export const LAYOUT_ASIDE_WIDTH_VAR = "--reborn-layout-aside-width";

/** 样式覆盖对象，键名与 slots 一一对应 */
export interface LayoutUI {
  /** 外层容器 */
  root?: ClassValue;
  /** 顶栏 */
  header?: ClassValue;
  /** 侧边栏 */
  aside?: ClassValue;
  /** 主区域 */
  main?: ClassValue;
  /** 底栏 */
  footer?: ClassValue;
}

export default {
  slots: {
    /** flex-auto + basis-auto 让嵌套的 Layout 能被父级 flex 撑开；min-w/h-0 避免内容溢出时挤爆兄弟节点 */
    root: "box-border flex min-h-0 min-w-0 flex-auto basis-auto",
    header: "box-border shrink-0 px-5 h-[var(--reborn-layout-header-height)]",
    aside: "box-border shrink-0 overflow-auto w-[var(--reborn-layout-aside-width)]",
    /** 主区域独立滚动，长内容不会把整页撑高 */
    main: "box-border block min-w-0 flex-1 basis-auto overflow-auto p-5",
    footer: "box-border shrink-0 px-5 h-[var(--reborn-layout-footer-height)]",
  },
  variants: {
    /** 排列方向；未显式指定时由 RebornLayout 扫描子节点自动判定 */
    direction: {
      horizontal: {
        root: "flex-row",
      },
      vertical: {
        root: "flex-col",
      },
    },
  },
  defaultVariants: {
    direction: "horizontal",
  },
};
