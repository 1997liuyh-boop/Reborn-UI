import type { ClassValue } from "tailwind-variants";
import type { Component, ComputedRef, InjectionKey } from "vue";

/** 父子组件通信用的 provide/inject 键 */
export const TIMELINE_INJECTION_KEY: InjectionKey<TimelineContext> = Symbol("reborn-timeline");

export interface TimelineContext {
  readonly direction: ComputedRef<TimelineDirection>;
  readonly size?: ComputedRef<TimelineSize>;
  readonly variant?: ComputedRef<TimelineVariant>;
  readonly ui: ComputedRef<TimelineUI>;
}

export const timelineSizes = ["sm", "md", "lg"] as const;
export const timelineVariants = ["solid", "outlined"] as const;
export type TimelineSize = (typeof timelineSizes)[number];
export type TimelineVariant = (typeof timelineVariants)[number];

/** 节点颜色预设：与主题配置中的七个语义色保持一致 */
export type TimelinePresetColor = "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";

/** 内容位于轴线的哪一侧，仅 vertical 方向生效 */
export type TimelineLabelPosition = "left" | "right";

/** 时间戳相对内容或轴线的位置 */
export type TimelinePlacement = "left" | "right" | "top" | "bottom";

/** 时间轴方向 */
export type TimelineDirection = "horizontal" | "vertical";

/** items 数据驱动模式下的单个节点配置，字段与 RebornTimelineItem 的同名属性一一对应 */
export interface TimelineItemData {
  /** 列表渲染用的唯一标识，缺省时退回数组下标 */
  key?: string | number;
  /** 时间戳文本 */
  timestamp?: string;
  /** 节点颜色：primary / secondary / success / info / warning / error / neutral，或任意 CSS 色值 */
  color?: TimelinePresetColor | (string & {});
  /** 节点尺寸，未传时继承时间线 */
  size?: TimelineSize;
  /** 节点实心或空心样式，未传时继承时间线 */
  variant?: TimelineVariant;
  /** 节点内容，默认作为文本渲染 */
  content?: string;
  /** 显式启用 HTML；仅传入已经清理过的可信内容 */
  dangerouslyUseHTMLString?: boolean;
  /** 自定义节点图标：Iconify 名称或组件 */
  icon?: string | Component;
  /** 是否为加载中节点 */
  loading?: boolean;
  /** 内容位于轴线的哪一侧 */
  labelPosition?: TimelineLabelPosition;
  /** 时间戳位置 */
  placement?: TimelinePlacement;
  /** 追加到该节点根元素的类名 */
  class?: ClassValue;
  /** 该节点的细粒度样式覆盖 */
  ui?: TimelineUI;
}

/** 时间线样式覆盖对象，键名与 config 的 slots 一一对应 */
export interface TimelineUI {
  /** 根节点（ol） */
  root?: ClassValue;
  /** 单个节点（li） */
  item?: ClassValue;
  /** 轴线格：承载节点圆点与连接线 */
  axis?: ClassValue;
  /** 圆点 / 图标的定位容器，高度与内容首行行高一致 */
  dotWrapper?: ClassValue;
  /** 节点圆点，支持实心与空心样式 */
  dot?: ClassValue;
  /** 自定义图标与加载图标 */
  icon?: ClassValue;
  /** 相邻节点之间的连接线 */
  line?: ClassValue;
  /** 内容侧格子：内容以及落在同侧的时间戳 */
  body?: ClassValue;
  /** 对侧格子：时间戳越过轴线时落在这里 */
  opposite?: ClassValue;
  /** 内容文本 */
  content?: ClassValue;
  /** 时间戳文本 */
  timestamp?: ClassValue;
}

/**
 * 预设色对应的填充类：圆点与图标底圆都是实心圆，统一用背景色着色。
 * 语义色读取主题令牌，修改主题配置后节点同步更新。
 */
export const TIMELINE_PRESET_COLORS: Record<TimelinePresetColor, string> = {
  primary: "bg-primary",
  secondary: "bg-secondary",
  success: "bg-success",
  info: "bg-info",
  warning: "bg-warning",
  error: "bg-error",
  neutral: "bg-neutral",
};

/** 空心节点的边框和图标共用语义色，中心背景遮住背后的连接线。 */
export const TIMELINE_OUTLINED_COLORS: Record<TimelinePresetColor, string> = {
  primary: "border-primary text-primary",
  secondary: "border-secondary text-secondary",
  success: "border-success text-success",
  info: "border-info text-info",
  warning: "border-warning text-warning",
  error: "border-error text-error",
  neutral: "border-neutral text-neutral",
};

export default {
  slots: {
    root: "m-0 list-none p-0 text-base",
    /**
     * 节点本身是父网格的一行（或一列），通过 subgrid 继承父级轨道：
     * 所有节点的轴线格落在同一条轨道上，某一项时间戳变长也不会让轴线错位。
     */
    item: "grid",
    /** 轴线格随整行拉伸，作为连接线的定位容器 */
    axis: "relative flex",
    /** 相对定位且排在连接线之后：实心圆点叠在连接线上方，线从圆点背后穿过 */
    dotWrapper: "relative flex shrink-0 items-center justify-center",
    /** 尺寸由 size 决定，图标与加载态不会改变节点外径。 */
    dot: "box-border flex shrink-0 items-center justify-center rounded-full",
    icon: "shrink-0",
    /**
     * 连接线绝对定位并铺满整个轴线格：相邻节点的轴线格首尾相接，线就不会断开；
     * 末项同样铺满，长度与该节点的内容（含底部留白）一致。
     */
    line: "pointer-events-none absolute bg-gray-3",
    body: "min-w-0",
    opposite: "min-w-0 text-gray-6",
    content: "min-w-0 break-words text-gray-9",
    timestamp: "shrink-0 text-sm text-gray-6",
  },
  variants: {
    /** 空心内孔取节点外径的一半，边框宽度通过组合变体保证几何关系。 */
    size: {
      sm: { dot: "size-2", icon: "hidden" },
      md: { dot: "size-3", icon: "size-1.5" },
      lg: { dot: "size-4", icon: "size-2" },
    },
    variant: {
      solid: { dot: "border-0 text-white" },
      outlined: { dot: "border-solid bg-gray-1" },
    },
    direction: {
      /**
       * 竖向：三列网格（左格 | 轴线 | 右格），节点间距用格子的 pb 撑出，
       * 而不是 row-gap——行间距会切断连接线，pb 则让轴线格随行高一起拉伸。
       * 轴线格与两侧格子同时下移 pt-1：连接线从节点上方露出一截，圆点仍对齐内容首行。
       */
      vertical: {
        item: "col-span-3 grid-cols-subgrid",
        axis: "col-start-2 row-start-1 flex-col items-center pt-1",
        /** 高度跟随正文首行，轴线轨道保留 20px 宽度，混合节点尺寸仍能居中对齐。 */
        dotWrapper: "h-5.5 min-w-5",
        line: "inset-y-0 left-1/2 w-px -translate-x-1/2",
        body: "row-start-1 pb-5 pt-1",
        opposite: "row-start-1 pb-5 pt-1",
      },
      /**
       * 横向：三行网格（上格 | 轴线 | 下格），每个节点等分一列；
       * 上格只在时间戳 placement 为 top 时有内容，无内容时该行高度为 0。
       * 轴线格与上下格子同时右移 pl-1：连接线从首个节点左侧露出一截，文字仍与节点左缘对齐。
       */
      horizontal: {
        root: "grid grid-flow-col auto-cols-fr grid-rows-[auto_auto_auto]",
        item: "row-span-3 grid-rows-subgrid",
        axis: "row-start-2 items-center pl-1",
        /** 固定预留 20px 高度，所有尺寸与图标状态共用同一条横向轴线。 */
        dotWrapper: "h-5",
        line: "inset-x-0 top-1/2 h-px -translate-y-1/2",
        body: "row-start-3 pl-1 pr-5 pt-4",
        opposite: "row-start-1 pb-4 pl-1 pr-5",
      },
    },
    /**
     * 竖向网格的列轨道，由所有节点的内容侧共同决定：
     * end / start 分别表示内容全在右侧 / 左侧，左列按内容自适应宽度，剩余空间留在右侧，
     * 不因切换内容侧而将整条时间线推到容器右端；both 表示两侧都有，左右等宽、轴线居中。
     */
    columns: {
      end: { root: "grid grid-cols-[auto_auto_1fr]" },
      start: { root: "grid grid-cols-[auto_auto_1fr]" },
      both: { root: "grid grid-cols-[1fr_auto_1fr]" },
    },
    /** 竖向时内容所在侧：决定内容格与对侧格落在哪一列、文字朝哪边对齐，与轴线格间隔 16px；横向不传 */
    side: {
      right: {
        body: "col-start-3 pl-4",
        opposite: "col-start-1 pr-4 text-right",
      },
      left: {
        body: "col-start-1 pr-4 text-right",
        opposite: "col-start-3 pl-4",
      },
    },
    /**
     * 内容格内部排布：stacked 为时间戳与内容上下堆叠，
     * inline 为时间戳与内容同一行并排（时间戳落在内容同侧的 left / right）。
     */
    flow: {
      stacked: { body: "flex flex-col gap-1" },
      inline: { body: "flex items-baseline gap-3" },
    },
  },
  compoundVariants: [
    { size: "sm" as const, variant: "outlined" as const, class: { dot: "border-2" } },
    { size: "md" as const, variant: "outlined" as const, class: { dot: "border-3" } },
    { size: "lg" as const, variant: "outlined" as const, class: { dot: "border-4" } },
    /** 竖向并排时整组贴近轴线，时间戳与内容只保留固定间距。 */
    { direction: "vertical" as const, side: "left" as const, flow: "inline" as const, class: { body: "justify-end" } },
    /** 竖向内容在左侧时，堆叠的内容与时间戳一起靠右对齐贴近轴线 */
    { direction: "vertical" as const, side: "left" as const, flow: "stacked" as const, class: { body: "items-end" } },
  ],
  /** side 与 columns 不设默认值：它们只属于竖向，横向时必须缺省，否则会串入列定位类 */
  defaultVariants: {
    size: "md" as const,
    variant: "solid" as const,
    direction: "vertical" as const,
    flow: "stacked" as const,
  },
};
