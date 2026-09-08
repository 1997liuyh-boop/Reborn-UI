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
    root: "flex flex-row items-center flex-wrap gap-x-[12rpx] text-28 leading-none",
    item: "reborn-breadcrumb-item flex flex-row items-center gap-x-[12rpx] relative group",
    /**
     * 条目文本/链接节点。
     * 与 web 端对齐：全部条目一视同仁，统一顶阶灰（本端灰阶只到 8，用 gray-8 对应 web 的 gray-9），
     * 统一字重，首项与末项都不加粗；视觉变化只来自按压反馈，见 active / droplist 变体。
     */
    link: "text-gray-8 transition-colors flex flex-row items-center gap-[8rpx]",
    separator: "text-gray-4 select-none flex flex-row items-center justify-center text-24",
    /** 超出 max-count 后的折叠占位内容 */
    more: "text-gray-8 flex flex-row items-center",
    moreIcon: "w-[32rpx] h-[32rpx]",
    /** 条目带下拉菜单时追加的箭头，方向由 open 变体控制；尺寸与 web 端 size-3.5 对齐 */
    dropIcon: "w-[28rpx] h-[28rpx] shrink-0 transition-transform duration-200",
    droplist:
      "absolute left-0 top-full z-[999] mt-[8rpx] min-w-[200rpx] rounded-ui-base bg-white dark:bg-gray-8 border border-gray-2 dark:border-gray-7 shadow-lg py-[8rpx]",
    /** 菜单项配色与 web 端一致：文字 gray-7，按压底色 gray-2（web 为 hover，本端换按压反馈） */
    droplistItem: "px-[24rpx] py-[16rpx] text-28 leading-normal text-gray-7 dark:text-gray-2 active:bg-gray-2 dark:active:bg-gray-7",
    /** 小程序没有全局点击外部事件，用全屏遮罩兜底关闭下拉 */
    droplistMask: "fixed inset-0 z-[998]",
  },
  variants: {
    /** 条目是否可跳转：由是否传入 to 决定（web 为 hover 变主色，本端换按压反馈） */
    active: {
      true: {
        link: "active:text-primary",
      },
      false: {
        link: "pointer-events-none",
      },
    },
    /**
     * 首项样式的兜底开关，当前为空——与 web 端对齐，首项不做任何视觉区分。
     * 保留这个钩子的根因仍然存在：小程序里每个条目都是独立自定义组件，
     * :first-child / :last-child 恒成立，group-first / group-last 会对所有条目同时命中，
     * 首尾改由父组件下发的注册索引判定；以后若要给首项加样式，写在这里即可。
     */
    first: {
      true: {},
      false: {},
    },
    /**
     * 末项：其后不再渲染分隔符（web 端由 group-last 伪类实现，本端小程序伪类失效，
     * 只能走索引判定的 last 变体）；末项文字与其余条目保持一致，不做加粗与变色。
     */
    last: {
      true: {
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
    /** 条目是否承载下拉菜单：整块可点击（配色同 active 条目，按压变主色） */
    droplist: {
      true: {
        link: "pointer-events-auto active:text-primary",
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