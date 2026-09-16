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

/** 响应式断点：低于对应视口宽度（px）时侧边栏自动收起 */
export const layoutSiderBreakpoints = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1600,
} as const;
export type LayoutSiderBreakpoint = keyof typeof layoutSiderBreakpoints;

/** 折叠事件来源：点击触发器 / 响应式断点 */
export type LayoutSiderCollapseType = "clickTrigger" | "responsive";

/** 样式覆盖对象，键名与 slots 一一对应 */
export interface LayoutUI {
  /** 外层容器 */
  root?: ClassValue;
  /** 顶栏 */
  header?: ClassValue;
  /** 侧边栏 */
  aside?: ClassValue;
  /** 侧边栏内容滚动区 */
  asideContent?: ClassValue;
  /** 侧边栏底部折叠触发器 */
  trigger?: ClassValue;
  /** collapsedWidth 为 0 时贴在侧边栏外缘的特殊触发器 */
  zeroTrigger?: ClassValue;
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
    /**
     * 侧边栏改为纵向 flex：内容滚动区 + 底部触发器。
     * relative 供零宽触发器绝对定位；宽度变化带过渡，配合折叠动画。
     */
    aside: "relative box-border flex shrink-0 flex-col w-[var(--reborn-layout-aside-width)] transition-[width] duration-200 ease-in-out motion-reduce:transition-none",
    /** 内容滚动区：滚动行为从侧边栏根节点下放到这里，收起到 0 宽时内容随之隐藏 */
    asideContent: "min-h-0 min-w-0 flex-1 overflow-auto",
    /** 底部折叠触发器：48px 高通栏，箭头居中 */
    trigger: "flex h-[48px] shrink-0 cursor-pointer select-none items-center justify-center border-t border-gray-2 text-gray-8 transition-colors hover:text-gray-10",
    /** 零宽特殊触发器：贴在侧边栏外缘的 36×42 按钮，具体贴左还是贴右由组件按 reverseArrow 决定 */
    zeroTrigger: "absolute top-[64px] z-[1] flex h-[42px] w-[36px] cursor-pointer items-center justify-center bg-gray-9 text-gray-1 transition-colors hover:bg-gray-8",
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
    /** 零宽触发器贴边：默认贴右外缘（侧边栏在左），reverseArrow 时贴左外缘（侧边栏在右） */
    zeroTriggerSide: {
      right: { zeroTrigger: "-right-[36px] rounded-r-sm" },
      left: { zeroTrigger: "-left-[36px] rounded-l-sm" },
    },
  },
  defaultVariants: {
    direction: "horizontal",
    zeroTriggerSide: "right",
  },
};
