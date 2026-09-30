import type { ClassValue } from "clsx";
import type { Component } from "vue";

/** 父子组件通信用的 provide/inject 键 */
export const TIMELINE_INJECTION_KEY = "reborn-timeline";

/** 节点颜色预设：与主题配置中的七个语义色保持一致 */
export type TimelinePresetColor = "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";

/** 内容（与时间戳）位于轴线的哪一侧，仅 vertical 方向生效 */
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
  /** 节点内容，按 HTML 渲染 */
  content?: string;
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
  /** 实心圆点；带图标时是承载图标的底圆 */
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
    /** 实心圆：无图标时是小圆点，有图标时放大为底圆，图标以白色居中 */
    dot: "flex shrink-0 items-center justify-center rounded-full text-white size-3",
    icon: "size-2 shrink-0",
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
    direction: {
      /**
       * 竖向：三列网格（左格 | 轴线 | 右格），节点间距用格子的 pb 撑出，
       * 而不是 row-gap——行间距会切断连接线，pb 则让轴线格随行高一起拉伸。
       * 轴线格与两侧格子同时下移 pt-1：连接线从节点上方露出一截，圆点仍对齐内容首行。
       */
      vertical: {
        item: "col-span-3 grid-cols-subgrid",
        axis: "col-start-2 row-start-1 flex-col items-center pt-1",
        /** 高度取内容首行行高（text-base 为 22px），圆点在其中垂直居中；最小宽度与图标底圆一致，有无图标时内容缩进相同 */
        dotWrapper: "h-[22px] min-w-5",
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
        /** 高度固定为图标底圆的尺寸：有无图标的节点共用同一行，轴线行高不随之跳动 */
        dotWrapper: "h-5",
        line: "inset-x-0 top-1/2 h-px -translate-y-1/2",
        body: "row-start-3 pl-1 pr-5 pt-4",
        opposite: "row-start-1 pb-4 pl-1 pr-5",
      },
    },
    /** 是否带图标：带图标时圆点放大为可容纳图标的底圆 */
    // iconed: {
    //   true: { dot: "size-5" },
    //   false: { dot: "size-2.5" },
    // },
    /**
     * 竖向网格的列轨道，由所有节点的内容侧共同决定：
     * end 表示内容全在右侧（左列只放时间戳，按内容自适应宽度），
     * start 表示内容全在左侧，both 表示两侧都有（左右等宽，轴线居中）。
     */
    columns: {
      end: { root: "grid grid-cols-[auto_auto_1fr]" },
      start: { root: "grid grid-cols-[1fr_auto_auto]" },
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
    /** 竖向并排时两端对齐，时间戳贴在远离轴线的一端 */
    { direction: "vertical", flow: "inline", class: { body: "justify-between" } },
    /** 竖向内容在左侧时，堆叠的内容与时间戳一起靠右对齐贴近轴线 */
    { direction: "vertical", side: "left", flow: "stacked", class: { body: "items-end" } },
  ],
  /** side 与 columns 不设默认值：它们只属于竖向，横向时必须缺省，否则会串入列定位类 */
  defaultVariants: {
    direction: "vertical",
    iconed: false,
    flow: "stacked",
  },
};
