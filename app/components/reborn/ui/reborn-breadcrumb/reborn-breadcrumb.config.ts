import type { ClassValue } from "clsx";

/** 父子组件通信用的 provide/inject 键 */
export const BREADCRUMB_INJECTION_KEY = "reborn-breadcrumb";

/** 面包屑下拉菜单项：label 为展示文案，path 为点击后的跳转地址 */
export interface BreadcrumbDroplistItem {
  /** 菜单项文案 */
  label: string;
  /** 菜单项跳转地址，缺省时点击仅抛出 select 事件不跳转 */
  path?: string;
}

/** 面包屑路由数据项，用于 routes 属性驱动渲染 */
export interface BreadcrumbRoute {
  /** 面包屑名称 */
  label: string;
  /** 跳转路径（a 标签的 href） */
  path?: string;
  /** 下拉菜单展示项 */
  children?: BreadcrumbDroplistItem[];
}

/** 面包屑样式覆盖对象，键名与 config 的 slots 一一对应 */
export interface BreadcrumbUI {
  /** 根节点（nav） */
  root?: ClassValue;
  /** 单个条目容器 */
  item?: ClassValue;
  /** 条目链接/文本节点 */
  link?: ClassValue;
  /** 分隔符节点 */
  separator?: ClassValue;
  /** 折叠省略号节点 */
  more?: ClassValue;
  /** 折叠省略号内的默认图标 */
  moreIcon?: ClassValue;
  /** 下拉箭头图标 */
  dropIcon?: ClassValue;
  /** 下拉菜单面板 */
  droplist?: ClassValue;
  /** 下拉菜单项 */
  droplistItem?: ClassValue;
}

export default {
  slots: {
    root: "flex items-center flex-wrap gap-x-1.5 text-sm leading-none",
    item: "reborn-breadcrumb-item flex items-center gap-x-1.5 group",
    link: "text-gray-7 transition-colors flex items-center gap-1 group-first:text-gray-8 group-first:font-semibold group-last:text-gray-9 group-last:font-medium",
    separator: "text-gray-4 select-none flex items-center justify-center text-xs group-last:hidden",
    /** 超出 max-count 后的折叠占位内容 */
    more: "text-gray-7 flex items-center",
    moreIcon: "size-4",
    /** 条目带下拉菜单时追加的箭头，方向由 open 变体控制 */
    dropIcon: "size-3.5 shrink-0 transition-transform duration-200",
    droplist: "min-w-32",
    droplistItem: "whitespace-nowrap",
  },
  variants: {
    /** 条目是否可跳转：由是否传入 to 决定 */
    active: {
      true: {
        link: "hover:text-primary cursor-pointer",
      },
      false: {
        link: "cursor-default",
      },
    },
    /**
     * 首项样式的兜底开关。
     * 根因：折叠时父组件会在最前插入省略号节点，首项不再是 first-child，group-first 会失效。
     * 方案：仅在折叠态下由注册索引补发首项样式，其余情况仍走结构伪类，保证服务端首屏就正确。
     */
    first: {
      true: {
        link: "text-gray-8 font-semibold",
      },
      false: {},
    },
    /** 条目的下拉菜单是否展开：仅驱动箭头方向 */
    open: {
      true: {
        dropIcon: "rotate-180",
      },
      false: {},
    },
    /** 条目是否承载下拉菜单：整块可点击 */
    droplist: {
      true: {
        link: "cursor-pointer hover:text-primary",
      },
      false: {},
    },
    /** 条目是否被 max-count 折叠：保留挂载但不可见，避免卸载后索引抖动 */
    collapsed: {
      true: {
        item: "hidden",
      },
      false: {},
    },
  },
  defaultVariants: {
    active: false,
    first: false,
    open: false,
    droplist: false,
    collapsed: false,
  },
};