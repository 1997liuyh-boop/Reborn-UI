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
  /** 跳转路径 */
  path?: string;
  /** 下拉菜单展示项 */
  children?: BreadcrumbDroplistItem[];
}

/** 面包屑样式覆盖对象，键名与 config 的 slots 一一对应 */
export interface BreadcrumbUI {
  /** 根节点 */
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
  /** 下拉菜单展开时的点击遮罩 */
  droplistMask?: ClassValue;
}

export default {
  slots: {
    root: "flex flex-row items-center flex-wrap gap-x-1.5 text-28 leading-none",
    item: "reborn-breadcrumb-item flex flex-row items-center gap-x-1.5 relative group",
    link: "text-gray-500 transition-colors flex flex-row items-center gap-1",
    separator: "text-gray-400 select-none flex flex-row items-center justify-center text-24",
    /** 超出 max-count 后的折叠占位内容 */
    more: "text-gray-500 flex flex-row items-center",
    moreIcon: "w-4 h-4",
    /** 条目带下拉菜单时追加的箭头，方向由 open 变体控制 */
    dropIcon: "w-3 h-3 shrink-0 transition-transform duration-200",
    droplist:
      "absolute left-0 top-full z-[999] mt-1 min-w-[200rpx] rounded-ui-base bg-white dark:bg-gray-8 border border-gray-2 dark:border-gray-7 shadow-lg py-1",
    droplistItem: "px-3 py-2 text-28 leading-normal text-gray-8 dark:text-gray-2 active:bg-gray-50 dark:active:bg-gray-7",
    /** 小程序没有全局点击外部事件，用全屏遮罩兜底关闭下拉 */
    droplistMask: "fixed inset-0 z-[998]",
  },
  variants: {
    /** 条目是否可跳转：由是否传入 to 决定 */
    active: {
      true: {
        link: "text-gray-600",
      },
      false: {
        link: "pointer-events-none",
      },
    },
    /**
     * 首项样式。
     * 根因：小程序里每个条目都是独立自定义组件，其根节点恒为自身组件内的唯一子节点，
     * :first-child / :last-child 恒成立，group-first / group-last 会对所有条目同时命中。
     * 方案：改由父组件下发的注册索引判定首尾，不依赖结构伪类。
     */
    first: {
      true: {
        link: "text-gray-800 font-semibold",
      },
      false: {},
    },
    /** 末项样式：代表当前页面，且其后不再需要分隔符 */
    last: {
      true: {
        link: "text-gray-900 font-medium",
        separator: "hidden",
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
        link: "pointer-events-auto text-gray-600",
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
    last: false,
    open: false,
    droplist: false,
    collapsed: false,
  },
};