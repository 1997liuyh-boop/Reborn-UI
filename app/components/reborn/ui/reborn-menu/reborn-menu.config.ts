import type { ClassValue } from "clsx";
import type { ComputedRef, ModelRef } from "vue";
import type { RouteLocationRaw } from "vue-router";
import { tv } from "~/lib/tv";

/** 父子组件通信用的 provide/inject 键 */
export const MENU_INJECTION_KEY = "reborn-menu";

const menuModes = ["horizontal", "vertical"] as const;
const menuTriggers = ["hover", "click"] as const;
const menuColors = [
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "error",
  "neutral",
] as const;
const expandTypes = ["normal", "popup"] as const;
/** 菜单层级：root 为一级菜单，sub 为次级及以下菜单 */
const menuLevels = ["root", "sub"] as const;

export { expandTypes, menuColors, menuLevels, menuModes, menuTriggers };

/** 菜单显示模式：水平或垂直 */
export type MenuMode = (typeof menuModes)[number];
/** 子菜单触发方式：悬浮或点击 */
export type MenuTrigger = (typeof menuTriggers)[number];
/** 菜单主题色 */
export type MenuColor = (typeof menuColors)[number];
/** 二级菜单展开方式：平铺展开 / 浮层展开 */
export type ExpandType = (typeof expandTypes)[number];
/** 菜单层级 */
export type MenuLevel = (typeof menuLevels)[number];

// --- 数据驱动结构（对齐 Ant Design 的 ItemType） ---

/** 普通菜单项 */
export interface MenuItemType {
  /** 菜单项唯一标识，同时作为 router 模式下的跳转路径 */
  key: string;
  /** 菜单项文案 */
  label?: string;
  /** 图标名称，交由 Icon 组件渲染，如 "lucide:home" */
  icon?: string;
  /** 原生 title 提示文案 */
  title?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 是否为危险项（展示为错误色） */
  danger?: boolean;
  /** 右侧额外内容，常用于展示快捷键 */
  extra?: string;
  /** 指定跳转地址，缺省时 router 模式下回退使用 key */
  route?: RouteLocationRaw;
}

/** 含子级的子菜单项 */
export interface SubMenuType {
  /** 子菜单唯一标识 */
  key: string;
  /** 子菜单标题文案 */
  label?: string;
  /** 图标名称 */
  icon?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 子级菜单数据 */
  children: ItemType[];
  /** 浮层的自定义类名 */
  popupClassName?: ClassValue;
  /** 浮层相对触发元素的偏移量 [x, y] */
  popupOffset?: [number, number];
  /** 点击子菜单标题时触发 */
  onTitleClick?: (info: { key: string; domEvent: MouseEvent }) => void;
}

/** 菜单项分组 */
export interface MenuItemGroupType {
  /** 类型判别字段 */
  type: "group";
  /** 分组唯一标识 */
  key?: string;
  /** 分组标题文案 */
  label?: string;
  /** 分组下的菜单项 */
  children: ItemType[];
}

/** 菜单分割线 */
export interface MenuDividerType {
  /** 类型判别字段 */
  type: "divider";
  /** 分割线唯一标识 */
  key?: string;
  /** 是否为虚线样式 */
  dashed?: boolean;
}

/** items 属性接受的联合类型 */
export type ItemType = MenuItemType | SubMenuType | MenuItemGroupType | MenuDividerType;

/** 判定是否为分割线节点 */
export function isMenuDivider(item: ItemType): item is MenuDividerType {
  return (item as MenuDividerType).type === "divider";
}

/** 判定是否为分组节点 */
export function isMenuGroup(item: ItemType): item is MenuItemGroupType {
  return (item as MenuItemGroupType).type === "group";
}

/** 判定是否为子菜单节点（带 children 且非分组） */
export function isSubMenu(item: ItemType): item is SubMenuType {
  return (
    !isMenuDivider(item) && !isMenuGroup(item) && Array.isArray((item as SubMenuType).children)
  );
}

/** 菜单样式覆盖对象，键名与 config 的 slots 一一对应 */
export interface MenuUI {
  /** 根容器 */
  root?: ClassValue;
  /** 菜单列表（ul） */
  menu?: ClassValue;
  /** 单个菜单项 */
  menuItem?: ClassValue;
  /** 菜单项内容行 */
  menuItemContent?: ClassValue;
  /** 菜单项标题文本 */
  menuItemTitle?: ClassValue;
  /** 菜单项图标 */
  menuItemIcon?: ClassValue;
  /** 菜单项右侧额外内容 */
  menuItemExtra?: ClassValue;
  /** 子菜单展开箭头 */
  menuItemArrow?: ClassValue;
  /** 子菜单容器（li） */
  subMenu?: ClassValue;
  /** 子菜单浮层 */
  subMenuPopup?: ClassValue;
  /** 子菜单内容列表 */
  subMenuContent?: ClassValue;
  /** 分组容器 */
  menuItemGroup?: ClassValue;
  /** 分组内容列表（ul） */
  menuItemGroupContent?: ClassValue;
  /** 分组标题 */
  menuItemGroupTitle?: ClassValue;
  /** 分割线 */
  menuDivider?: ClassValue;
}

/**
 * 菜单上下文：由 RebornMenu 下发，RebornSubMenu 逐层扩展后再下发。
 * 唯一定义在此处，禁止在各子组件里内联重复声明。
 */
export interface MenuContext {
  /** 当前选中项的完整路径 */
  selectedKeys: ModelRef<string[]>;
  /** 当前展开的子菜单标识集合 */
  openedMenus: { value: string[] };
  /** 当前层级之上的父级路径 */
  parentIndexPath: ComputedRef<string[]>;
  /** 菜单模式 */
  mode: ComputedRef<MenuMode>;
  /** 是否折叠 */
  collapse: ComputedRef<boolean>;
  /** 子菜单触发方式 */
  menuTrigger: ComputedRef<MenuTrigger>;
  /** 主题色 */
  color: ComputedRef<MenuColor>;
  /** 选中项是否展示背景块 */
  showActiveBackground: ComputedRef<boolean>;
  /**
   * 平铺展开的缩进层级：根级为 0，每下沉一层平铺子菜单 +1。
   * 浮层子菜单会把它重置回 0——浮层是独立面板，内部条目不该继承外层缩进。
   */
  inlineDepth: ComputedRef<number>;
  /** 自定义背景色 */
  backgroundColor: ComputedRef<string>;
  /** 自定义文字色 */
  textColor: ComputedRef<string>;
  /** 选中态文字色 */
  activeTextColor: ComputedRef<string>;
  /** 子菜单展开方式 */
  expandType: ComputedRef<ExpandType>;
  /** 同级子菜单是否互斥展开 */
  expandMutex: ComputedRef<boolean>;
  /** 浮层关闭后是否保留 DOM */
  persistent: ComputedRef<boolean>;
  /** 浮层相对触发元素的偏移量 */
  popperOffset: ComputedRef<number>;
  /** 浮层展开延时（毫秒） */
  showTimeout: ComputedRef<number>;
  /** 浮层关闭延时（毫秒） */
  hideTimeout: ComputedRef<number>;
  /** 是否开启折叠过渡动画 */
  collapseTransition: ComputedRef<boolean>;
  /** 根节点计算出的样式函数集合 */
  ui: ComputedRef<Record<string, (opts?: Record<string, unknown>) => string>>;
  /** 用户传入的样式覆盖对象 */
  uiOverrides: ComputedRef<MenuUI>;
  /** 选中菜单项 */
  handleSelect: (index: string, indexPath: string[], route?: RouteLocationRaw) => void;
  /** 展开子菜单 */
  handleOpen: (index: string, indexPath: string[]) => void;
  /** 收起子菜单 */
  handleClose: (index: string, indexPath: string[]) => void;
  /** 切换子菜单展开状态 */
  toggleSubMenu: (index: string, indexPath: string[]) => void;
  /** 清除所有延时关闭定时器 */
  clearCloseTimer?: () => void;
  /** 注册一个延时关闭定时器 */
  registerCloseTimer?: (timer: ReturnType<typeof setTimeout>) => void;
  /** 注册浮层元素，供点击外部判定使用 */
  registerPopup?: (el: HTMLElement) => void;
  /** 注销浮层元素 */
  unregisterPopup?: (el: HTMLElement) => void;
  /** 安排全局兜底关闭 */
  scheduleCloseAll?: () => void;
  /** 取消全局兜底关闭 */
  cancelCloseAll?: () => void;
  /** 通知父级重新计算高度 */
  notifyResize?: () => void;
}

/** 平铺展开时每下沉一层子菜单增加的缩进量（像素） */
export const MENU_INLINE_INDENT = 16;

const theme = tv({
  slots: {
    root: "relative shadow-sm bg-gray-1 transition-[width] duration-300 ease-in-out",
    menu: "flex transition-all duration-300 ease-in-out",
    // group 供水平一级菜单的 hover 高亮使用：标题被 level 变体钉死了灰阶，
    // 只能靠 group-hover 反查父级的悬浮态才能改色
    menuItem:
      "group relative flex cursor-pointer select-none items-center transition-all duration-200 ease-in-out",
    menuItemContent: "flex w-full items-center gap-2 transition-all duration-300 ease-in-out",
    // 一级/次级的字号字重与灰阶由 level 变体给出，此处只留布局
    // transition-all 是折叠动画的落点：折叠态用 w-0 + opacity-0 收起而非 display:none，才能过渡
    menuItemTitle: "flex-1 truncate transition-all duration-300 ease-in-out",
    // w-5 把图标固定成 20px 的一列（图形本身 16px 还是 20px 都由 justify-center 居中），
    // 与 Element Plus 给菜单图标定死 24px 列宽是同一套做法。这是折叠动画能单向收起的前提：
    // 折叠态要把这一列撑到 w-8（= 轨道 64px 减去左右各 16px 内边距）才能让图标落在轨道正中，
    // 而 CSS 只在「两端都是确定值」时插值——展开态留 width:auto 会在第 0 帧直接瞬切
    // （实测图标右跳 6px、标题右跳 12px）；换 min-w 也不行：min-w 线性推进但实际宽度取
    // max(图形宽, min-w)，前 60% 纹丝不动、后 40% 才追上，而间隙从第一帧就在收，
    // 两条曲线错开会把标题左边缘先往左拽 5px 再推回 9px（实测 398→393→402）。
    menuItemIcon:
      "flex w-5 shrink-0 items-center justify-center transition-all duration-300 ease-in-out",
    // 尾部附加文本：取规范内的 text-sm(12px)，比标题低一档
    menuItemExtra: "ml-auto shrink-0 text-sm text-gray-5 transition-all duration-300 ease-in-out",
    menuItemArrow:
      "flex shrink-0 items-center justify-center transition-all duration-300 ease-in-out",
    subMenu: "relative",
    subMenuPopup:
      "absolute z-50 overflow-visible border border-gray-2 bg-gray-1 p-1 shadow-xl rounded-md",
    // 浮层内条目间距 4px，与根级垂直菜单的 gap-y-1 对齐
    subMenuContent: "flex flex-col gap-y-1",
    menuItemGroup: "flex flex-col",
    // 分组内条目间距 4px，与根级垂直菜单及浮层内容的 gap-y-1 对齐
    menuItemGroupContent: "flex flex-col gap-y-1",
    menuItemGroupTitle: "px-4 py-2 text-sm font-bold uppercase tracking-wider text-gray-400",
    menuDivider: "my-1 list-none",
  },
  variants: {
    mode: {
      horizontal: {
        // 一级条目之间留 16px
        menu: "flex-row items-center gap-x-4 px-2 py-1",
        menuItem: "h-10 px-4",
        subMenuPopup: "left-full top-0 ml-2",
        subMenuContent: "min-w-[200px]",
      },
      vertical: {
        // w-full 是折叠动画的另一个端点：宽度从 auto 收到 w-16 无法插值，必须两端都是确定值
        root: "w-full",
        menu: "w-full flex-col gap-y-1",
        menuItem: "w-full px-4 py-3",
        subMenuPopup: "left-full top-0 ml-2",
        subMenuContent: "min-w-[200px]",
      },
    },
    collapse: {
      true: {
        menu: "w-16",
        // ⚠️ 根因：旧实现用 display:none 收起标题/尾注/箭头，display 不可过渡，
        // 折叠时文字是「瞬间消失」，宽度动画看着像是卡帧。
        // ✅ 修复：改用 w-0 + opacity-0 + overflow-hidden，配合基础槽上的 transition 收放。
        menuItemTitle: "w-0 flex-none opacity-0",
        menuItemExtra: "w-0 overflow-hidden opacity-0",
        menuItemArrow: "w-0 overflow-hidden opacity-0",
        // ⚠️ 根因：旧实现靠 menuItem/menuItemContent 上的 justify-center 让折叠后的图标居中，
        // 但 justify-content 不可过渡——第 0 帧就把「图标 + 标题」整组钉到行中线上，
        // 之后标题收缩把整组往右推、容器变窄又把它往左拉，实测图标「先右移 9px 再回落 4px」，
        // 标题左边缘同样来回摆（398 → 405 → 396），看着就是文字从两端往中间挤。
        // ✅ 修复：折叠态不再动 justify 与内边距（全程 start 对齐 + 沿用 px-4），
        // 改为把图标框撑到 w-8（= 轨道 64px 减去左右各 16px 内边距），
        // 由图标框自身的 justify-center 把图形摆到轨道正中。
        // 这样左内边距与图标框左边缘全程不动，标题只从右端朝图标方向收，收起方向唯一。
        // 另：图标框(20→32px) + 间隙(8→0px) + 标题(−标题宽) 与容器宽度的增量两端恰好相等，
        // 又共用同一条 300ms 曲线，所以动画全程内容既不溢出也不留空，
        // 标题左边缘只有 398→402 这 4px 的单调位移（同向、朝图标那侧），全程没有回摆。
        menuItemIcon: "w-8",
        // 标题归零后要一并收掉图标与标题之间的 8px 间隙，否则图标会被挤到轨道中线左侧
        menuItemContent: "gap-0",
      },
      false: {},
    },
    // 菜单层级：落 menu.md 的一级/次级字号字重与灰阶规范
    level: {
      root: {
        // 一级菜单：font-weight 500 / 14px / gray-10
        // 注意：本项目字号阶梯整体下移一档（typography.css），14px 对应 text-base 而非 text-sm
        menuItemTitle: "text-base font-medium text-gray-10",
      },
      sub: {
        // 次级菜单：14px / gray-9
        menuItemTitle: "text-base font-normal text-gray-9",
      },
    },
    active: {
      true: {
        // 投影只在有背景块时才成立，已下沉到 active + showActiveBackground 的复合变体
        menuItemTitle: "font-semibold",
      },
      false: {},
    },
    color: {
      primary: {},
      secondary: {},
      success: {},
      info: {},
      warning: {},
      error: {},
      neutral: {},
    },
    // 选中项是否展示背景块：关闭后只保留文字高亮，行内不再有色块
    showActiveBackground: {
      true: {},
      false: {},
    },
    disabled: {
      true: {
        // ⚠️ 根因：旧实现用 opacity-40 + pointer-events-none，前者不符合 menu.md 的灰阶规范，
        // 后者会让 cursor-not-allowed 完全不生效（元素不接收指针事件，光标样式无从命中）。
        // ✅ 修复：改用规范要求的 text-gray-5 + cursor-not-allowed，交互拦截交给各 handler 的 disabled 前置判断。
        menuItem: "cursor-not-allowed text-gray-5",
        menuItemTitle: "text-gray-5",
        menuItemExtra: "text-gray-5",
      },
      false: {},
    },
    // 危险项：对齐 Ant Design 的 danger 语义
    danger: {
      true: {
        menuItem: "text-error",
        menuItemTitle: "text-error",
      },
      false: {},
    },
    opened: {
      true: {},
      false: {},
    },
    // 是否含子菜单：水平菜单的底部指示器只画在叶子项上，靠它区分
    hasSubmenu: {
      true: {},
      false: {},
    },
    // 关闭折叠过渡：去掉宽度与展开高度上的动画
    collapseTransition: {
      true: {},
      false: {
        root: "transition-none",
        menu: "transition-none",
        // menuItemContent(间隙) 与 menuItemIcon(图标框宽度) 也参与折叠动画，关闭时一并去掉
        menuItemContent: "transition-none",
        menuItemTitle: "transition-none",
        menuItemIcon: "transition-none",
        menuItemExtra: "transition-none",
        menuItemArrow: "transition-none",
        subMenuPopup: "transition-none",
      },
    },
    dashed: {
      true: {
        menuDivider: "h-0 border-t border-dashed border-gray-2 bg-transparent",
      },
      false: {
        menuDivider: "h-px bg-gray-2",
      },
    },
    expandType: {
      normal: {
        // 平铺容器不需要浮层底色，bg-transparent 直接盖掉基础槽的 bg-gray-1（单一色阶，无需再写 dark: 变体）
        subMenuPopup:
          "relative z-auto left-auto top-auto ml-0 mt-0 border-0 shadow-none p-0 bg-transparent overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out grid",
        // ⚠️ 根因：缩进原先写在容器 ul 上（ml-4），整列条目被一起右推，
        // 悬浮态与选中态的背景块跟着缩进，行首露出 16px 空白，背景铺不满整行。
        // ✅ 修复：容器不再缩进，缩进改由条目自身的 paddingLeft 承担（见 MENU_INLINE_INDENT），
        // 条目宽度重新占满整行，背景块自然铺满。
        subMenuContent: "min-w-0",
      },
      popup: {},
    },
  },
  compoundVariants: [
    // ── 选中态文字色：取色阶第 6 档 ──
    // ⚠️ 根因：旧实现写 bg-primary/10 text-primary，用的是扁平语义别名 + 透明度，
    // 色阶层次由不透明度模拟，与规范里「填充取 2 档、文字取 6 档」的配色表对不上。
    // ✅ 修复：改用带档位的真实色阶（primary → brand），与 reborn-badge 的 soft 变体同一套配方。
    // 注意：语义别名没有数字档位（不存在 bg-primary-2），必须写各色阶本名；
    // 暗色下这些档位在 base.css 里已整体反转，无需再写 dark: 变体。
    {
      active: true,
      color: "primary",
      class: { menuItem: "text-brand-6" },
    },
    {
      active: true,
      color: "secondary",
      class: { menuItem: "text-secondary-6" },
    },
    {
      active: true,
      color: "success",
      class: { menuItem: "text-green-6" },
    },
    {
      active: true,
      color: "info",
      class: { menuItem: "text-blue-6" },
    },
    {
      active: true,
      color: "warning",
      class: { menuItem: "text-orange-6" },
    },
    {
      active: true,
      color: "error",
      class: { menuItem: "text-red-6" },
    },
    // neutral 的文字取 gray-9（正文色），gray-6 在灰阶里属于弱化文本，压不住选中态
    {
      active: true,
      color: "neutral",
      class: { menuItem: "text-gray-9" },
    },
    // ── 选中态背景块：取色阶第 2 档，由 showActiveBackground 控制是否给出 ──
    {
      active: true,
      showActiveBackground: true,
      color: "primary",
      class: { menuItem: "bg-brand-2" },
    },
    {
      active: true,
      showActiveBackground: true,
      color: "secondary",
      class: { menuItem: "bg-secondary-2" },
    },
    {
      active: true,
      showActiveBackground: true,
      color: "success",
      class: { menuItem: "bg-green-2" },
    },
    {
      active: true,
      showActiveBackground: true,
      color: "info",
      class: { menuItem: "bg-blue-2" },
    },
    {
      active: true,
      showActiveBackground: true,
      color: "warning",
      class: { menuItem: "bg-orange-2" },
    },
    {
      active: true,
      showActiveBackground: true,
      color: "error",
      class: { menuItem: "bg-red-2" },
    },
    {
      active: true,
      showActiveBackground: true,
      color: "neutral",
      class: { menuItem: "bg-gray-2" },
    },
    // 投影依附于背景块：关掉背景后若仍留 shadow-sm，会变成一道悬空的浮起阴影
    {
      active: true,
      showActiveBackground: true,
      class: { menuItem: "shadow-sm" },
    },
    // ⚠️ 根因：level 变体给 menuItemTitle 固定了 text-gray-10 / text-gray-9，
    // 会盖住选中态从 menuItem 继承下来的主题色。
    // ✅ 修复：选中时把标题色改回 inherit，让它跟随 menuItem 的主题色。
    // 该规则排在 level 变体之后，twMerge 后者胜，故能生效。
    {
      active: true,
      class: {
        menuItemTitle: "text-inherit",
      },
    },
    {
      active: false,
      disabled: false,
      class: {
        menuItem: "hover:bg-gray-2 active:scale-[0.98]",
      },
    },
    // 危险项的悬浮反馈单独给，避免被通用 hover:bg-gray-2 覆盖
    {
      danger: true,
      active: false,
      disabled: false,
      class: {
        menuItem: "hover:bg-error/10",
      },
    },
    {
      mode: "vertical",
      expandType: "normal",
      opened: true,
      class: {
        menuItemArrow: "rotate-90",
      },
    },
    // 展开态高亮：把主题色给到 menuItem，图标与文字都走 currentColor 一起变色。
    // ⚠️ 根因：旧实现在标题上叠了 bg-gradient + background-clip:text 的流光动画，
    // 由于默认 trigger 是 hover，鼠标一划过就会开始跑渐变，观感嘈杂。
    // ✅ 修复：只保留纯色高亮，渐变与 keyframes 一并移除。
    {
      opened: true,
      color: "primary",
      class: {
        menuItem: "text-primary",
        menuItemTitle: "text-inherit",
      },
    },
    {
      opened: true,
      color: "secondary",
      class: {
        menuItem: "text-secondary",
        menuItemTitle: "text-inherit",
      },
    },
    {
      opened: true,
      color: "success",
      class: {
        menuItem: "text-success",
        menuItemTitle: "text-inherit",
      },
    },
    {
      opened: true,
      color: "info",
      class: {
        menuItem: "text-info",
        menuItemTitle: "text-inherit",
      },
    },
    {
      opened: true,
      color: "warning",
      class: {
        menuItem: "text-warning",
        menuItemTitle: "text-inherit",
      },
    },
    {
      opened: true,
      color: "error",
      class: {
        menuItem: "text-error",
        menuItemTitle: "text-inherit",
      },
    },
    {
      opened: true,
      color: "neutral",
      class: {
        menuItem: "text-neutral",
        menuItemTitle: "text-inherit",
      },
    },
    // ── 水平菜单的一级条目：只高亮图标与文字，不要背景块 ──
    // group-hover 是必需的：标题的灰阶由 level 变体钉死在 text-gray-10，
    // 光靠 menuItem 上的 hover:text-* 继承不下来，得反查父级悬浮态改回 inherit。
    {
      mode: "horizontal",
      level: "root",
      disabled: false,
      class: {
        menuItem: "hover:bg-transparent active:scale-100",
        menuItemTitle: "group-hover:text-inherit",
      },
    },
    {
      mode: "horizontal",
      level: "root",
      disabled: false,
      color: "primary",
      class: { menuItem: "hover:text-primary" },
    },
    {
      mode: "horizontal",
      level: "root",
      disabled: false,
      color: "secondary",
      class: { menuItem: "hover:text-secondary" },
    },
    {
      mode: "horizontal",
      level: "root",
      disabled: false,
      color: "success",
      class: { menuItem: "hover:text-success" },
    },
    {
      mode: "horizontal",
      level: "root",
      disabled: false,
      color: "info",
      class: { menuItem: "hover:text-info" },
    },
    {
      mode: "horizontal",
      level: "root",
      disabled: false,
      color: "warning",
      class: { menuItem: "hover:text-warning" },
    },
    {
      mode: "horizontal",
      level: "root",
      disabled: false,
      color: "error",
      class: { menuItem: "hover:text-error" },
    },
    {
      mode: "horizontal",
      level: "root",
      disabled: false,
      color: "neutral",
      class: { menuItem: "hover:text-neutral" },
    },
    // 选中态同样去掉背景块，只留文字高亮（色值由上方 active + color 的组合给出）
    {
      mode: "horizontal",
      level: "root",
      active: true,
      class: {
        menuItem: "bg-transparent shadow-none",
      },
    },
    // 底部 2px 指示器只给「没有子菜单」的一级项：
    // 有子菜单时选中通常是子项带来的祖先高亮，再画下划线会与浮层指向冲突。
    // bg-current 让指示器自动取当前文字色，省去逐色再写七条组合。
    {
      mode: "horizontal",
      level: "root",
      active: true,
      hasSubmenu: false,
      class: {
        menuItem:
          "after:absolute after:inset-x-4 after:bottom-0 after:h-0.5 after:rounded-full after:bg-current after:content-['']",
      },
    },
    // 禁用态必须压过 danger / opened / hover 的着色，排在最后
    {
      disabled: true,
      class: {
        menuItem: "text-gray-5 hover:text-gray-5",
        menuItemTitle: "text-gray-5 group-hover:text-gray-5",
      },
    },
  ],
  defaultVariants: {
    mode: "vertical" as MenuMode,
    color: "primary" as MenuColor,
    level: "root" as MenuLevel,
    collapse: false,
    active: false,
    showActiveBackground: true,
    disabled: false,
    danger: false,
    opened: false,
    hasSubmenu: false,
    dashed: false,
    collapseTransition: true,
    expandType: "popup" as ExpandType,
  },
});

export default theme;
