import type { ComputedRef } from 'vue';
import { tv } from '~/lib/tv';

/** 菜单弹出位置：12 向，命名对齐 Arco */
export const dropdownPositions = [
  'top',
  'topLeft',
  'topRight',
  'bottom',
  'bottomLeft',
  'bottomRight',
  'left',
  'leftTop',
  'leftBottom',
  'right',
  'rightTop',
  'rightBottom',
] as const;
export type DropdownPosition = (typeof dropdownPositions)[number];

/**
 * 触发下拉的行为；移动端不支持 hover。
 * manual：组件不绑定任何触发行为，由使用者通过默认插槽下发的 open / close / toggle
 * 或 v-model:popup-visible 自行控制（如按钮组里只让右侧箭头按钮展开）。
 */
export const dropdownTriggers = ['click', 'hover', 'manual'] as const;
export type DropdownTrigger = (typeof dropdownTriggers)[number];

/**
 * 子菜单面板与触发行的间距：4px 可见间隙 + 父面板 4px 水平内边距 + 1px 描边，
 * 使子面板与父面板外缘之间正好留出 4px。
 */
export const SUBMENU_POPUP_OFFSET = 9;

/** position → 底层 Popover 的 side / align */
export const DROPDOWN_POSITION_MAP: Record<
  DropdownPosition,
  { side: 'top' | 'bottom' | 'left' | 'right'; align: 'start' | 'center' | 'end' }
> = {
  top: { side: 'top', align: 'center' },
  topLeft: { side: 'top', align: 'start' },
  topRight: { side: 'top', align: 'end' },
  bottom: { side: 'bottom', align: 'center' },
  bottomLeft: { side: 'bottom', align: 'start' },
  bottomRight: { side: 'bottom', align: 'end' },
  left: { side: 'left', align: 'center' },
  leftTop: { side: 'left', align: 'start' },
  leftBottom: { side: 'left', align: 'end' },
  right: { side: 'right', align: 'center' },
  rightTop: { side: 'right', align: 'start' },
  rightBottom: { side: 'right', align: 'end' },
};

/** 选项值 */
export type DropdownValue = string | number | Record<string, any>;

/** 菜单配置项（options 数据驱动方式） */
export interface DropdownOption {
  /** 选项文字 */
  label: string;
  /** 选项值，select 事件回传 */
  value: DropdownValue;
  /** 是否禁用 */
  disabled?: boolean;
  /** 左侧图标名 */
  icon?: string;
}

/** 上下文下发给子节点的样式键 */
export type DropdownContextUIKey = 'item' | 'itemIcon' | 'itemLabel' | 'submenuIcon' | 'group' | 'groupTitle';

/** RebornDoption / RebornDsubmenu / RebornDgroup 以及嵌套的 RebornDropdown 通过 inject 取得的上下文 */
export interface DropdownContext {
  /** 选项被点击时回调，由 Dropdown 触发 select 事件并按需收起；嵌套时逐级向上冒泡 */
  select: (value: DropdownValue, ev: Event) => void;
  /** 子级面板的悬停进入 / 离开：子菜单面板已传送到 body，需向上通知父级维持展开 */
  hoverEnter: () => void;
  hoverLeave: () => void;
  /** 注册子级的「节点是否在其内部」判定，父级外部点击判定据此排除子菜单面板；返回注销函数 */
  registerNested: (contains: (node: Node) => boolean) => () => void;
  /** 子节点样式 */
  ui: ComputedRef<Record<DropdownContextUIKey, (opts?: { class?: any }) => string>>;
}
export const DROPDOWN_INJECTION_KEY = 'reborn-dropdown';

/*
 * 视觉规格对齐 reborn-select 的下拉列表：
 * 选项字号 14px / 行高 150% / 内边距 6/4 / 圆角 4px（rounded-ui-2xs），文字 gray-6，
 * hover 浅灰底 bg-gray-2（与 select 的 optionHighlight 同色），行距 4px，
 * 面板内边距 4/6，页头页脚 13px 字号、gray-3 分隔线。
 * 颜色只用灰阶 token（base.css 的 .dark 会整条翻转），不写 dark: 前缀以免二次翻转。
 * 浮层外壳（底色 / 描边 / 圆角 / 阴影）由 RebornSelectTrigger 给出，与 Select 完全同源；
 * 这里只负责壳内的内容排版。禁用态走 data-[disabled]。
 */
export const dropdownTheme = tv({
  slots: {
    // 覆盖 SelectTrigger 锚点的 w-full：锚点必须与触发元素等宽，居中 / 末端对齐与箭头都以它为基准；
    // 用 w-fit 而非 w-auto，auto 宽度在网格 / 拉伸布局里仍会被撑满整格
    wrapper: 'inline-flex w-fit',
    trigger: 'inline-flex cursor-pointer',
    panel: 'px-[4px] py-[6px]',
    header: 'shrink-0 border-b border-gray-3 px-[10px] py-[6px] text-[13px] leading-[1.5] text-gray-6',
    list: 'max-h-60 overflow-y-auto scrollbar-hide space-y-[4px]',
    item: 'flex w-full cursor-pointer select-none items-center gap-1 rounded-ui-2xs px-[6px] py-[4px] text-base leading-[1.5] text-gray-6 transition-colors hover:bg-gray-2 data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[disabled=true]:hover:bg-transparent',
    itemIcon: 'flex size-4 shrink-0 items-center justify-center',
    itemLabel: 'flex-1 truncate',
    // 子菜单入口右侧的展开指示箭头
    submenuIcon: 'ml-auto size-4 shrink-0 text-gray-5',
    // 选项组：组内选项沿用列表的 4px 行距；组标题 12px 弱化灰
    group: 'space-y-[4px]',
    groupTitle: 'select-none px-[6px] py-[4px] text-[12px] leading-[1.5] text-gray-5',
    footer: 'shrink-0 border-t border-gray-3 px-[10px] py-[6px] text-[13px] leading-[1.5] text-gray-6',
  },
});

/** 语义化结构键，供 ui 属性按节点覆盖样式 */
export interface DropdownUI {
  wrapper?: string;
  trigger?: string;
  panel?: string;
  header?: string;
  list?: string;
  item?: string;
  itemIcon?: string;
  itemLabel?: string;
  submenuIcon?: string;
  group?: string;
  groupTitle?: string;
  footer?: string;
}
