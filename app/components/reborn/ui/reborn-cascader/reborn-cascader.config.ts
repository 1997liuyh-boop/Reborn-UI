import type { ClassValue } from "clsx";
import type { VNodeChild } from "vue";
import selectTheme, {
  selectColors,
  selectSizes,
  selectVariants,
} from "../reborn-select/reborn-select.config";

/**
 * 尺寸、配色、形态三条枚举直接复用 reborn-select：
 * 级联选择器的触发器就是一个选择框，两者分叉只会让同一页面里的表单控件对不齐。
 */
export {
  selectColors as cascaderColors,
  selectSizes as cascaderSizes,
  selectVariants as cascaderVariants,
};

/** 触发器盒子可覆盖的样式键，与 reborn-select 同名同义 */
export type { SelectFieldUI as CascaderFieldUI } from "../reborn-select/reborn-select.config";

/** 选项值。对象值靠 value-key 指定的属性做同一性判定 */
export type CascaderOptionValue = string | number | Record<string, any>;

/**
 * 绑定值。四种形态由 path-mode 与 multiple 两两组合决定：
 * 单选 + 值模式 → 选项值；单选 + 路径模式 → 值数组；
 * 多选 + 值模式 → 值数组；多选 + 路径模式 → 值数组的数组。
 */
export type CascaderValue =
  | CascaderOptionValue
  | (CascaderOptionValue | CascaderOptionValue[])[]
  | undefined;

/** 级联选项 */
export interface CascaderOption {
  /** 选项值，支持对象（此时同一性由 value-key 决定） */
  value?: CascaderOptionValue;
  /** 选项文本 */
  label?: string;
  /** 自定义渲染函数，返回值直接作为选项内容 */
  render?: () => VNodeChild;
  /** 是否禁用 */
  disabled?: boolean;
  /** 该选项在多选标签上的 RebornBadge 属性 */
  tagProps?: Record<string, any>;
  /** 下一级选项 */
  children?: CascaderOption[];
  /** 是否是叶子节点。懒加载时必须显式标记，否则组件无从判断还能不能展开 */
  isLeaf?: boolean;
  /** 其他自定义属性 */
  [key: string]: any;
}

/** 自定义 CascaderOption 中的字段名 */
export interface CascaderFieldNames {
  value?: string;
  label?: string;
  children?: string;
  disabled?: string;
  isLeaf?: string;
  tagProps?: string;
  render?: string;
}

/**
 * 虚拟滚动参数。传入该对象即开启虚拟滚动，逐列生效：
 * 只渲染列可视区内的选项，DOM 数量与数据量解耦，代价是每项必须等高。
 */
export interface VirtualListProps {
  /** 单项占位高度（px，含项间 4px 间距），默认 33，与 reborn-select 的实测步长一致 */
  height?: number;
  /** 可视区上下各多渲染的项数，用于抵消快速滚动时的白屏，默认 4 */
  buffer?: number;
  /** 列内选项数超过该值才启用虚拟滚动，默认 0（一律启用） */
  threshold?: number;
}

/** 下拉面板与多选标签可覆盖的样式键 */
export type CascaderUI = Partial<{
  dropdown: ClassValue;
  panel: ClassValue;
  column: ClassValue;
  columnDivider: ClassValue;
  option: ClassValue;
  optionContent: ClassValue;
  optionLabel: ClassValue;
  optionActive: ClassValue;
  optionHighlight: ClassValue;
  optionCheckbox: ClassValue;
  optionArrow: ClassValue;
  optionLoading: ClassValue;
  optionList: ClassValue;
  virtualPhantom: ClassValue;
  virtualWindow: ClassValue;
  searchList: ClassValue;
  empty: ClassValue;
  loading: ClassValue;
  loadingIcon: ClassValue;
  prefix: ClassValue;
  tagList: ClassValue;
  tag: ClassValue;
  tagLabel: ClassValue;
  tagClose: ClassValue;
  tagCloseIcon: ClassValue;
  collapseTag: ClassValue;
}>;

/** RebornCascaderPanel 可覆盖的样式键：面板部分与 RebornCascader 同名同义 */
export type CascaderPanelUI = Pick<
  CascaderUI,
  | "panel"
  | "column"
  | "columnDivider"
  | "option"
  | "optionContent"
  | "optionLabel"
  | "optionActive"
  | "optionHighlight"
  | "optionCheckbox"
  | "optionArrow"
  | "optionLoading"
  | "optionList"
  | "virtualPhantom"
  | "virtualWindow"
  | "empty"
>;

const selectSlots = selectTheme.slots;
const selectVariantMap = selectTheme.variants;
const selectSize = selectVariantMap.size;

export default {
  slots: {
    // 触发器盒子、选项行、多选标签、虚拟滚动四组样式整体取自 reborn-select，
    // 下面只覆盖「级联是多列」这一点带来的差异。
    ...selectSlots,

    /**
     * 浮层内容区。级联的滚动发生在每一列内部，这一层既不滚动也不留内边距：
     * 内边距挪到了列上（与 reborn-select 的 dropdown 同为 4/6），
     * 否则多列之间的分割线会被上下内边距截短，连不到浮层的上下边缘。
     */
    dropdown: "flex max-h-none w-full p-0",
    /**
     * 选项文字。比 reborn-select 多一条 flex-1：
     * 级联选项行尾部固定挂着箭头 / 加载指示器，文字必须先占满剩余宽度，箭头才会被推到最右。
     */
    optionLabel: "min-w-0 flex-1 truncate",

    /* ---------------- 级联面板 ---------------- */

    /**
     * 多列横向容器。列数超出浮层可用宽度时横向滚动，
     * 不让浮层无限变宽（浮层的 max-width 由 RebornSelectTrigger 按视口余量内联下发）。
     */
    panel: "flex w-full items-stretch overflow-x-auto scrollbar-hide",
    /**
     * 单列。内边距与滚动规则与 reborn-select 的下拉列表完全一致（4/6、max-h-60、隐藏滚动条），
     * 列宽给下限而不是定值：标签长短不一时列会自行变宽，而不是把文字截断。
     */
    column:
      "flex max-h-60 min-w-[160px] max-w-[280px] shrink-0 flex-col overflow-y-auto px-[4px] py-[6px] scrollbar-hide",
    /** 列分割线：1px 宽的 gray-2 竖线，取代「每列一张卡片」的分块做法 */
    columnDivider: "w-px shrink-0 self-stretch bg-gray-2",
    /**
     * 选项行内的勾选框。它是可点的：非叶子节点点行体是「展开下一级」，点勾选框才是「勾选整棵子树」，
     * 两件事必须分开落点。搜索结果那一列没有展开动作，组件会另外给它补上 pointer-events-none。
     * 用 flex 而不是默认的行内布局：行内布局会给内部的 inline-flex 勾选框留出基线下空隙，
     * 勾选框会比文字略微偏上，摆成 flex + items-center 才是真正的垂直居中。
     * 与文字的间隔定为 8px：optionContent 的 gap 出 4px，这里的右边距再补 4px。
     */
    optionCheckbox: "mr-1 flex shrink-0 items-center",
    /** 非叶子节点行尾的箭头 */
    optionArrow: "size-4 shrink-0 text-gray-5",
    /** 懒加载子节点时行尾的转圈图标，替换箭头 */
    optionLoading: "size-4 shrink-0 animate-spin text-gray-5",
    /** 搜索结果列表：单列铺开，滚动与内边距同列 */
    searchList:
      "flex max-h-60 w-full flex-col overflow-y-auto px-[4px] py-[6px] scrollbar-hide",
    /** 触发器内的前缀元素 */
    prefix: "flex shrink-0 items-center text-gray-6",
    /** 搜索态下替换箭头的搜索图标 */
    searchIcon: "size-full text-gray-6",
  },
  variants: {
    ...selectVariantMap,
    /**
     * 尺寸档位。触发器与标签沿用 reborn-select 的三档，
     * 级联额外按档位给列宽下限：档位越大，列越宽，避免 lg 下文字贴着分割线。
     */
    size: {
      sm: { ...selectSize.sm, column: "min-w-[140px]" },
      md: { ...selectSize.md, column: "min-w-[160px]" },
      lg: { ...selectSize.lg, column: "min-w-[180px]" },
    },
    /**
     * 面板是否自带外框。RebornCascaderPanel 单独使用时需要一圈描边与阴影，
     * 放进 RebornCascader 的浮层里时外框由浮层给出，此处必须关掉，否则两圈描边叠在一起。
     * 宽度也跟着分两档：独立使用时收成 w-max 贴着列宽，嵌进浮层时撑满（浮层的最小宽度是触发器宽度，
     * 面板不撑满的话，列右边会空出一段没有底色的缝）。
     */
    bordered: {
      true: { panel: "w-max max-w-full rounded-lg border border-gray-3 bg-gray-1 shadow-lg" },
      false: {},
    },
    /** 标签内容不换行：单行展示、超出截断；关闭时长文本按标签宽度换行，标签随之变高 */
    tagNowrap: {
      true: { tagLabel: "truncate whitespace-nowrap" },
      false: { tagLabel: "whitespace-normal break-all" },
    },
  },
  compoundVariants: selectTheme.compoundVariants,
  defaultVariants: {
    ...selectTheme.defaultVariants,
    bordered: false,
    tagNowrap: false,
  },
};
