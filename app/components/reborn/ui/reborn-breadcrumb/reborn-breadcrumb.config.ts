import type { ClassValue } from "clsx";
import type { ComputedRef, InjectionKey } from "vue";

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
  /** 下拉菜单项之间的分隔线（divided 的菜单项才渲染） */
  droplistDivider?: ClassValue;
}

/**
 * 容器下发给条目的上下文：只放只读的 computed，条目不能改写容器状态。
 * 条目的位置与折叠结果不走注入，由容器渲染时按插槽顺序直接写进条目的内部 prop。
 */
export interface BreadcrumbContext {
  /** 容器级分隔符文字 */
  separator: ComputedRef<string | number>;
  /** 容器级图标分隔符 */
  separatorIcon: ComputedRef<any>;
  /** 容器级样式覆盖，条目与自身的 ui 按键合并 */
  ui: ComputedRef<BreadcrumbUI>;
}

/** 父子组件通信用的注入键（Symbol），注入方据此拿到 BreadcrumbContext 类型 */
export const BREADCRUMB_INJECTION_KEY: InjectionKey<BreadcrumbContext> = Symbol("reborn-breadcrumb");

export default {
  slots: {
    root: "flex items-center flex-wrap gap-x-1.5 text-sm leading-none",
    /**
     * 条目容器。
     * 分组用具名 group/breadcrumb 而非匿名 group：带下拉的条目内部嵌了
     * RebornSelectTrigger，它的浮层锚点自带匿名 group 且恰好是本容器的 first-child，
     * 匿名 group-first 会被它命中，导致每一项都套上首项样式。
     */
    item: "reborn-breadcrumb-item flex items-center gap-x-1.5 group/breadcrumb",
    /**
     * 条目文本/链接节点。
     * 全部条目一视同仁：统一 text-gray-9、统一字重，首项与末项都不加粗；
     * 视觉上的唯一变化来自 hover（可跳转与带下拉的条目变主色），见 active / droplist 变体。
     */
    link: "text-gray-9 transition-colors flex items-center gap-1",
    separator:
      "text-gray-4 select-none flex items-center justify-center text-sm group-last/breadcrumb:hidden",
    /** 超出 max-count 后的折叠占位内容 */
    more: "text-gray-9 flex items-center",
    moreIcon: "size-4",
    /** 条目带下拉菜单时追加的箭头，方向由 open 变体控制 */
    dropIcon: "size-3.5 shrink-0 transition-transform duration-200",
    /**
     * 下拉面板的内容区。
     * 内边距落在这里而不是浮层外壳（RebornSelectTrigger 的 dropdown）上：
     * 外壳的展开动画走 height 0 → scrollHeight，border-box 下内边距会把 height:0
     * 撑出一段残留高度，收起时露出一条色块。
     */
    droplist: "min-w-32 max-h-60 overflow-y-auto px-[4px] py-[6px] space-y-[4px] scrollbar-hide",
    /**
     * 下拉菜单项。字号 14px（text-base）与其余 Reborn 浮层保持一致：
     * 浮层默认传送到 body，拿不到面包屑根节点的 text-sm，必须自带字号。
     * 行高随字号令牌走 22px，不再叠 leading-[1.5]。
     * 颜色只用灰阶 token（base.css 的 .dark 会整条翻转），不可写 dark: 前缀。
     */
    droplistItem:
      "flex cursor-pointer select-none items-center gap-1 whitespace-nowrap rounded-sm px-[6px] py-[4px] text-base text-gray-7 transition-colors hover:bg-gray-2 hover:text-primary data-[disabled=true]:cursor-not-allowed data-[disabled=true]:opacity-50 data-[disabled=true]:hover:bg-transparent data-[disabled=true]:hover:text-gray-7",
    /** 菜单项分隔线，与浮层描边同一阶 */
    droplistDivider: "my-[4px] border-t border-gray-3",
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
     * 首项样式钩子，当前为空——首项不做任何视觉区分。
     * 容器按插槽顺序给条目编号，省略号插在首项之后，DOM 顺序即视觉顺序，首项始终是 first-child；
     * 这里额外按编号下发 first，以后若要给首项加样式，写在这里或用 `group-first/breadcrumb:` 都可以。
     */
    first: {
      true: {},
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
    /** 条目是否被 max-count 折叠：保留挂载但不可见，展开时不必重新创建条目（下拉菜单等状态得以保留） */
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