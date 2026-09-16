import type { ClassValue } from "clsx";
import { tv } from "~/lib/tv";

/** 树节点 key 类型：整棵树范围内必须唯一 */
export type TreeKey = string | number;

/** 树的主题色取值，与 reborn-menu / reborn-checkbox 的语义色一致 */
const treeColors = [
  "primary",
  "secondary",
  "success",
  "info",
  "warning",
  "error",
  "neutral",
] as const;

export { treeColors };

/** 树的主题色：统一控制选中背景、筛选高亮、复选框与拖拽指示的用色 */
export type TreeColor = (typeof treeColors)[number];

/**
 * 树节点数据结构（对齐 Ant Design 的 DataNode）。
 * 字段名可通过 fieldNames 重新映射，此处的 title/key/children 只是默认字段名。
 */
export interface TreeDataNode {
  /** 节点唯一标识，被 expandedKeys / checkedKeys / selectedKeys 引用 */
  key: TreeKey;
  /** 节点标题文案，复杂内容请改用 title 插槽 */
  title?: string;
  /** 子节点数据 */
  children?: TreeDataNode[];
  /** 是否禁用整个节点（选中、勾选、拖拽全部失效） */
  disabled?: boolean;
  /** 仅禁用该节点的复选框，标题仍可点选 */
  disableCheckbox?: boolean;
  /** 该节点是否可被点选，默认为 true */
  selectable?: boolean;
  /** 树为 checkable 时，单独控制该节点是否渲染复选框（不影响父子联动计算） */
  checkable?: boolean;
  /**
   * 是否为叶子节点。仅在配置了 loadData 时有意义：
   * 未加载过子级的节点默认按父节点渲染展开箭头，设为 true 可强制按叶子渲染
   */
  isLeaf?: boolean;
  /** 节点图标名称，交由 Icon 组件渲染（如 "lucide:folder"），需配合 showIcon 使用 */
  icon?: string;
  /** 允许携带任意业务字段，配合 fieldNames 或插槽消费 */
  [prop: string]: unknown;
}

/** 自定义节点字段名映射（对齐 antd 的 fieldNames） */
export interface TreeFieldNames {
  /** 标题字段名，默认 "title" */
  title?: string;
  /** 唯一标识字段名，默认 "key" */
  key?: string;
  /** 子级字段名，默认 "children" */
  children?: string;
}

/** checkStrictly 模式下 checkedKeys 的对象形态 */
export interface TreeCheckedStrictly {
  /** 完全选中的节点 key */
  checked: TreeKey[];
  /** 半选状态的节点 key */
  halfChecked: TreeKey[];
}

/** checkedKeys 可接受的两种形态：普通数组 / checkStrictly 下的对象 */
export type TreeCheckedKeys = TreeKey[] | TreeCheckedStrictly;

/** 拖拽放置位置：-1 目标节点之前 / 0 目标节点内部 / 1 目标节点之后 */
export type TreeDropPosition = -1 | 0 | 1;

/** allowDrop 回调的入参 */
export interface TreeAllowDropInfo {
  /** 拟放置的目标节点 */
  dropNode: TreeDataNode;
  /** 拟放置的位置 */
  dropPosition: TreeDropPosition;
}

/** draggable 的对象写法 */
export interface TreeDraggableConfig {
  /** 是否显示拖拽手柄图标，false 时隐藏但仍可拖拽 */
  icon?: boolean;
  /** 按节点判定是否可拖拽 */
  nodeDraggable?: (node: TreeDataNode) => boolean;
}

/** showLine 的对象写法 */
export interface TreeShowLineConfig {
  /** 叶子图标：false 不渲染、true 渲染默认文件图标、字符串指定图标名称 */
  showLeafIcon?: boolean | string;
}

/**
 * 内部拍平后的节点实体：携带层级与父子引用，
 * 展开状态、勾选联动、虚拟滚动都基于它计算，不直接反查原始 treeData
 */
export interface TreeEntity {
  /** 归一化后的节点 key */
  key: TreeKey;
  /** 归一化后的标题文案 */
  title: string;
  /** 原始节点数据（未做字段映射，交给插槽时保持原样） */
  node: TreeDataNode;
  /** 父级实体，根节点为 null */
  parent: TreeEntity | null;
  /** 子级实体列表 */
  children: TreeEntity[];
  /** 所在层级，根为 0 */
  level: number;
  /** 是否为同级最后一项，showLine 的连接线依赖它判断截断 */
  isLastInLevel: boolean;
  /** 各祖先层是否为「同级最后一项」，下标即层级，用于决定该层缩进列是否画竖线 */
  ancestorIsLast: boolean[];
}

/** 树组件各语义化结构的样式覆盖对象，键名与 config 的 slots 一一对应 */
export interface TreeUI {
  /** 根容器 */
  root?: ClassValue;
  /** 节点列表容器 */
  list?: ClassValue;
  /** 单个节点行 */
  node?: ClassValue;
  /** 单层缩进列 */
  indentUnit?: ClassValue;
  /** 展开/折叠开关容器 */
  switcher?: ClassValue;
  /** 展开/折叠图标 */
  switcherIcon?: ClassValue;
  /** 拖拽手柄图标 */
  dragHandle?: ClassValue;
  /** 复选框容器 */
  checkbox?: ClassValue;
  /** 节点图标容器 */
  iconEle?: ClassValue;
  /** 标题点击区（含图标与文本） */
  content?: ClassValue;
  /** 标题文本 */
  title?: ClassValue;
  /** 标题后的附加内容容器（extra 插槽） */
  extra?: ClassValue;
  /** 拖拽放置指示线 */
  dropIndicator?: ClassValue;
}

const theme = tv({
  slots: {
    root: "relative text-base text-gray-9 select-none",
    list: "relative flex flex-col",
    // relative 是放置指示线的定位基准；gap 交给内部元素自身的 margin 控制以保证行高稳定（虚拟滚动按定高换算）
    node: "relative flex items-center",
    // 缩进列固定 24px 一层；showLine 时在列中心画一条竖线
    indentUnit: "relative w-6 shrink-0 self-stretch",
    switcher:
      "flex size-6 shrink-0 cursor-pointer items-center justify-center rounded-sm text-gray-6 transition-colors hover:bg-gray-2",
    switcherIcon: "size-4 transition-transform duration-200",
    dragHandle: "flex size-5 shrink-0 cursor-grab items-center justify-center text-gray-5",
    checkbox: "mr-1 flex shrink-0 items-center",
    iconEle: "flex size-5 shrink-0 items-center justify-center text-gray-7",
    // 水平间距规范：左右内边距 6px（px-1.5，无图标时文字距左缘 6px），图标与文字间隔 6px（gap-1.5）
    content:
      "flex min-w-0 cursor-pointer items-center gap-1.5 rounded-sm px-1.5 py-0.5 transition-colors duration-150 hover:bg-gray-2",
    title: "truncate",
    // ml-auto 在 blockNode（content 拉满整行）时把附加内容推到行尾；普通模式下紧跟标题
    extra: "ml-auto flex shrink-0 items-center gap-1 pl-2",
    // 指示线本体：left 由内联样式按缩进换算，颜色由 color 变体给出
    dropIndicator:
      "pointer-events-none absolute right-0 z-10 h-0.5 rounded-full after:absolute after:-left-1 after:-top-[3px] after:size-2 after:rounded-full after:border-2 after:content-['']",
  },
  variants: {
    // 主题色：统一控制选中背景/文字、筛选高亮、拖拽指示的用色（复选框色由组件透传给 RebornCheckbox）。
    // 配方：选中填充取色阶 1 档、拖拽内部放置取 2 档（比选中重一档以示区分）、文字/描边取 6 档；
    // 语义别名没有数字档位，须写各色阶本名。
    // 指示线不依赖其他状态，颜色直接挂在本变体上；选中/高亮/内部放置的着色见下方复合变体
    color: {
      primary: { dropIndicator: "bg-brand-6 after:border-brand-6" },
      secondary: { dropIndicator: "bg-secondary-6 after:border-secondary-6" },
      success: { dropIndicator: "bg-green-6 after:border-green-6" },
      info: { dropIndicator: "bg-blue-6 after:border-blue-6" },
      warning: { dropIndicator: "bg-orange-6 after:border-orange-6" },
      error: { dropIndicator: "bg-red-6 after:border-red-6" },
      // neutral 的强调取 gray-9（正文色）：gray-6 属弱化文本，压不住指示语义
      neutral: { dropIndicator: "bg-gray-9 after:border-gray-9" },
    },
    // 节点占据整行：点击区拉满剩余宽度，悬浮/选中背景铺满整行
    blockNode: {
      true: {
        content: "flex-1",
      },
      false: {},
    },
    // 选中态：着色由 selected × color 的复合变体给出
    selected: {
      true: {},
      false: {},
    },
    // 禁用态：按灰阶规范用 text-gray-5 + cursor-not-allowed，不用透明度
    disabled: {
      true: {
        content: "cursor-not-allowed text-gray-5 hover:bg-transparent",
        switcher: "cursor-not-allowed text-gray-4 hover:bg-transparent",
        dragHandle: "cursor-not-allowed text-gray-4",
      },
      false: {},
    },
    // 展开态：默认箭头顺时针旋转 90°；showLine 的加减号图标不旋转（由组件侧换图标）
    expanded: {
      true: {
        switcherIcon: "rotate-90",
      },
      false: {},
    },
    // showLine 模式：缩进列中心画竖线；加减号图标不参与旋转
    showLine: {
      true: {
        indentUnit:
          "before:absolute before:bottom-0 before:left-1/2 before:top-0 before:w-px before:bg-gray-3 before:content-['']",
        switcherIcon: "rotate-0",
      },
      false: {},
    },
    // 叶子节点的 switcher 只是对齐占位（点击无行为），去掉手型光标与悬浮底色，
    // 否则悬浮到标题前的空白会浮出一块灰色方块
    leaf: {
      true: {
        switcher: "cursor-default hover:bg-transparent",
      },
      false: {},
    },
    // 缩进列对应的祖先已是同级末位：这一层不再画竖线
    lineEnd: {
      true: {
        indentUnit: "before:hidden",
      },
      false: {},
    },
    // filterTreeNode 命中的高亮节点：颜色由 filtered × color 的复合变体给出
    filtered: {
      true: {
        title: "font-medium",
      },
      false: {},
    },
    // 拖拽悬停在节点内部（dropPosition = 0）：描边与底色由 dropInside × color 的复合变体给出
    dropInside: {
      true: {
        content: "ring-1",
      },
      false: {},
    },
    // 正在被拖拽的源节点：降饱和提示
    dragging: {
      true: {
        node: "opacity-50",
      },
      false: {},
    },
  },
  compoundVariants: [
    // ── 选中态：填充 1 档 + 文字 6 档（hover 钉在同一填充色上，避免又跳回灰底） ──
    // neutral 例外：gray-1 是页面/面板底色，选中填充用它会隐形，保留 2 档
    { selected: true, color: "primary", class: { content: "bg-brand-1 text-brand-6 hover:bg-brand-1" } },
    { selected: true, color: "secondary", class: { content: "bg-secondary-1 text-secondary-6 hover:bg-secondary-1" } },
    { selected: true, color: "success", class: { content: "bg-green-1 text-green-6 hover:bg-green-1" } },
    { selected: true, color: "info", class: { content: "bg-blue-1 text-blue-6 hover:bg-blue-1" } },
    { selected: true, color: "warning", class: { content: "bg-orange-1 text-orange-6 hover:bg-orange-1" } },
    { selected: true, color: "error", class: { content: "bg-red-1 text-red-6 hover:bg-red-1" } },
    { selected: true, color: "neutral", class: { content: "bg-gray-2 text-gray-9 hover:bg-gray-2" } },
    // ── 筛选高亮：文字取 6 档（neutral 取 9 档正文色） ──
    { filtered: true, color: "primary", class: { title: "text-brand-6" } },
    { filtered: true, color: "secondary", class: { title: "text-secondary-6" } },
    { filtered: true, color: "success", class: { title: "text-green-6" } },
    { filtered: true, color: "info", class: { title: "text-blue-6" } },
    { filtered: true, color: "warning", class: { title: "text-orange-6" } },
    { filtered: true, color: "error", class: { title: "text-red-6" } },
    { filtered: true, color: "neutral", class: { title: "text-gray-9" } },
    // ── 拖拽放入内部：填充 2 档 + 描边 6 档 ──
    { dropInside: true, color: "primary", class: { content: "bg-brand-2 ring-brand-6" } },
    { dropInside: true, color: "secondary", class: { content: "bg-secondary-2 ring-secondary-6" } },
    { dropInside: true, color: "success", class: { content: "bg-green-2 ring-green-6" } },
    { dropInside: true, color: "info", class: { content: "bg-blue-2 ring-blue-6" } },
    { dropInside: true, color: "warning", class: { content: "bg-orange-2 ring-orange-6" } },
    { dropInside: true, color: "error", class: { content: "bg-red-2 ring-red-6" } },
    { dropInside: true, color: "neutral", class: { content: "bg-gray-2 ring-gray-9" } },
  ],
  defaultVariants: {
    color: "primary" as TreeColor,
    blockNode: false,
    selected: false,
    disabled: false,
    expanded: false,
    showLine: false,
    leaf: false,
    lineEnd: false,
    filtered: false,
    dropInside: false,
    dragging: false,
  },
});

export default theme;
