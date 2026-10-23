import { tv } from "~/lib/tv";

/** 语义色：决定有事项日期的底色、描边、日期文字，以及选中 / 今天标记的颜色 */
const colors = ["primary", "secondary", "success", "info", "warning", "error"] as const;
/** 视图模式：month 按日排的月视图 / year 按月排的年视图 */
const modes = ["month", "year"] as const;
/** 工具栏左侧的切换控件：select 年月下拉 / button 前后翻页按钮 */
const controllerTypes = ["select", "button"] as const;
/** 表头星期与日期标题的水平对齐 */
const titleAligns = ["left", "center", "right"] as const;

export { colors as calendarColors, controllerTypes as calendarControllerTypes, modes as calendarModes, titleAligns as calendarTitleAligns };

export type CalendarColor = (typeof colors)[number];
export type CalendarMode = (typeof modes)[number];
export type CalendarControllerType = (typeof controllerTypes)[number];
export type CalendarTitleAlign = (typeof titleAligns)[number];

/**
 * 每种语义色用到的完整类名，写成字面量 Tailwind 才扫得到。
 * 深色（设计稿的「第 6 阶」）用语义令牌 bg-primary 等：浅色下它就是第 6 阶，暗色下自动换成对比度更好的第 5 阶，
 * primary 还会跟随站点的主题色切换；浅底（第 1 阶）没有语义令牌，直接取色板，映射与 RebornDatePickerPanel 一致。
 * 描边只给顶边上色（border-t-*）：边框模式下单元格还有左边线，整圈上色会把相邻格的分隔线也染掉
 */
const tones: Record<CalendarColor, { solid: string; soft: string; text: string; border: string; ring: string; hover: string; hoverText: string }> = {
  primary: { solid: "bg-primary", soft: "bg-brand-1", text: "text-primary", border: "border-t-primary", ring: "ring-primary", hover: "hover:bg-brand-1 hover:border-t-primary", hoverText: "group-hover/cell:text-primary" },
  secondary: { solid: "bg-secondary", soft: "bg-secondary-1", text: "text-secondary", border: "border-t-secondary", ring: "ring-secondary", hover: "hover:bg-secondary-1 hover:border-t-secondary", hoverText: "group-hover/cell:text-secondary" },
  success: { solid: "bg-success", soft: "bg-green-1", text: "text-success", border: "border-t-success", ring: "ring-success", hover: "hover:bg-green-1 hover:border-t-success", hoverText: "group-hover/cell:text-success" },
  info: { solid: "bg-info", soft: "bg-blue-1", text: "text-info", border: "border-t-info", ring: "ring-info", hover: "hover:bg-blue-1 hover:border-t-info", hoverText: "group-hover/cell:text-info" },
  warning: { solid: "bg-warning", soft: "bg-orange-1", text: "text-warning", border: "border-t-warning", ring: "ring-warning", hover: "hover:bg-orange-1 hover:border-t-warning", hoverText: "group-hover/cell:text-warning" },
  error: { solid: "bg-error", soft: "bg-red-1", text: "text-error", border: "border-t-error", ring: "ring-error", hover: "hover:bg-red-1 hover:border-t-error", hoverText: "group-hover/cell:text-error" },
};

/**
 * 尺寸全部取自设计稿：
 * | 部位         | 规格                                                        |
 * | 工具栏       | 左侧控件间隔 8px，与日历主体间隔 24px                        |
 * | 表头         | 高 28px，14px 字号，gray-5                                   |
 * | 单元格       | 内边距 4px，顶边 1px gray-4，左右间隔 8px                    |
 * | 日期标题     | 14px 字号，gray-9                                            |
 * | 事项区       | 高 65px，顶部留 2px；超出纵向滚动                            |
 * | 单条事项     | 4px 圆点 + 4px 间隔 + 14px / 150% 行高的 gray-8 标题，超长省略 |
 * 事项行高 21px，事项区去掉 2px 顶距后正好放下 3 条，第 4 条起滚动。
 * 颜色只用灰阶与语义令牌（base.css 的 .dark 会整条翻转），不写 bg-white 或 dark: 前缀。
 */
export const calendarTheme = tv({
  slots: {
    /** 根容器 */
    root: "reborn-calendar w-full min-w-0",
    /** 工具栏：左侧切换控件，右侧「今天」；窄屏时换行 */
    header: "flex flex-wrap items-center justify-between gap-2",
    /** 工具栏左侧：年月下拉或翻页按钮 + 月 / 年切换，间隔 8px */
    controller: "flex flex-wrap items-center gap-2",
    /** 翻页模式与区间模式下的年月标题 */
    title: "px-1 text-base font-medium whitespace-nowrap text-gray-10 tabular-nums",
    /** 农历模式下工具栏里的干支年与生肖 */
    lunarYear: "text-sm whitespace-nowrap text-gray-6",
    /** 年份、月份下拉；下拉本身撑满父元素，宽度在这里给定 */
    select: "",
    /** 翻页按钮：与 md 按钮等高的正方形 */
    navButton: "w-8 px-0",
    /** 日历主体，与工具栏间隔 24px */
    body: "mt-6",
    /** 一行：表头行、每一周、年视图的每一季 */
    row: "grid gap-x-2",
    /** 表头星期；文字套一层与日期胶囊等宽的盒子，靠左 / 居中 / 靠右时都与下方日期对齐 */
    weekday: "flex h-7 items-center px-1 text-base text-gray-5",
    /** 单元格：日期标题 + 事项区；group/cell 让悬停时日期文字也跟着变色 */
    cell: "group/cell relative min-w-0 cursor-pointer border-t border-gray-4 p-1 transition-colors",
    /** 日期标题：普通模式一行，农历模式通过变体改为上下两行 */
    cellHeader: "flex h-6 min-w-0 items-center",
    /**
     * 日期标题：做成按钮，键盘可聚焦、回车即选中；
     * 圆角胶囊同时承载「今天」描边与「选中」实底两种标记
     */
    date: "inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-base whitespace-nowrap tabular-nums transition-colors outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-primary",
    /** 农历文字：公历下方的小字；限制宽度，节日名称不会撑破日期格 */
    lunar: "max-w-full min-w-0 truncate text-sm text-gray-6",
    /** 事项区 */
    content: "relative h-[65px] pt-0.5",
    /** 事项列表：超出事项区高度时纵向滚动，滚到头不带动页面 */
    eventList: "flex h-full flex-col overflow-y-auto overscroll-contain [scrollbar-width:thin]",
    /** 单条事项：圆点与标题间隔 4px */
    event: "flex min-w-0 shrink-0 items-center gap-1",
    /** 事项圆点 */
    eventDot: "size-1 shrink-0 rounded-full",
    /**
     * 事项标题：设计稿给的行高是 150%（21px），不是 text-base 令牌自带的 22px，
     * 差的 1px 决定事项区能否正好放下 3 条，所以这里有意叠了 leading-normal
     */
    eventTitle: "min-w-0 flex-1 truncate text-base leading-normal text-gray-8",
  },
  variants: {
    color: Object.fromEntries(colors.map(c => [c, {}])) as Record<CalendarColor, object>,
    /** 月视图 7 列，年视图 4 列 */
    view: {
      month: { row: "grid-cols-7" },
      year: { row: "grid-cols-4" },
    },
    /** 表头星期与日期标题的水平对齐 */
    titleAlign: {
      left: { weekday: "justify-start", cellHeader: "justify-start" },
      center: { weekday: "justify-center", cellHeader: "justify-center" },
      right: { weekday: "justify-end", cellHeader: "justify-end" },
    },
    /** 农历模式：取消固定高度，上方公历、下方农历，列内对齐由组合变体控制 */
    lunar: {
      true: { cellHeader: "h-auto flex-col" },
      false: {},
    },
    /** 边框模式：主体为直角外框，格子去掉列间距、补上左分隔线，整体成网格 */
    border: {
      true: {
        body: "overflow-hidden rounded-none border border-gray-4",
        row: "gap-x-0",
        weekday: "border-l border-gray-4 first:border-l-0",
        cell: "border-l first:border-l-0",
      },
      false: {},
    },
    /** 农历文字是否为节日或节气，是则用语义色强调 */
    festival: {
      true: {},
      false: {},
    },
    /** 单元格是否有事项 */
    hasEvents: {
      true: {},
      false: {},
    },
    /** 单元格是否属于当前月（年视图的月份格恒为 true） */
    inMonth: {
      true: { date: "text-gray-9" },
      false: { date: "text-gray-5" },
    },
    /** 是否今天（年视图里是本月） */
    today: {
      true: { date: "ring-1 ring-inset" },
      false: {},
    },
    /** 是否选中 */
    selected: {
      true: { date: "text-gray-1" },
      false: {},
    },
  },
  compoundVariants: [
    { lunar: true, titleAlign: "left" as const, class: { cellHeader: "items-start" } },
    { lunar: true, titleAlign: "center" as const, class: { cellHeader: "items-center" } },
    { lunar: true, titleAlign: "right" as const, class: { cellHeader: "items-end" } },
    ...Object.entries(tones).flatMap(([color, tone]) => [
      // 有事项：浅底 + 深色顶边 + 深色日期
      { color: color as CalendarColor, hasEvents: true, class: { cell: `${tone.soft} ${tone.border}` } },
      { color: color as CalendarColor, hasEvents: true, inMonth: true, selected: false, class: { date: tone.text } },
      // 悬停与选中复用「有事项」的外观：任意格子悬停时浅底 + 深色顶边，本月未选中的日期文字同时变深色；
      // 选中格常驻同样的浅底与顶边，日期本身仍是下面的实底胶囊
      { color: color as CalendarColor, class: { cell: tone.hover } },
      { color: color as CalendarColor, inMonth: true, selected: false, class: { date: tone.hoverText } },
      { color: color as CalendarColor, selected: true, class: { cell: `${tone.soft} ${tone.border}` } },
      { color: color as CalendarColor, today: true, class: { date: tone.ring } },
      { color: color as CalendarColor, festival: true, class: { lunar: tone.text } },
      // 选中排在最后：实底盖过描边与文字色
      { color: color as CalendarColor, selected: true, class: { date: tone.solid } },
    ]),
  ],
  defaultVariants: {
    color: "primary",
    view: "month",
    titleAlign: "right",
    lunar: false,
    border: false,
    festival: false,
    hasEvents: false,
    inMonth: true,
    today: false,
    selected: false,
  },
});

/** 事项圆点的颜色：每条事项可以单独指定，与单元格的配色解耦 */
export const calendarDotTheme = tv({
  base: "",
  variants: {
    color: Object.fromEntries(Object.entries(tones).map(([c, tone]) => [c, tone.solid])) as Record<CalendarColor, string>,
  },
  defaultVariants: { color: "primary" },
});

/** 语义化结构键，供 ui 属性按节点覆盖样式 */
export interface CalendarUI {
  /** 根容器 */
  root?: string;
  /** 工具栏 */
  header?: string;
  /** 工具栏左侧控件组 */
  controller?: string;
  /** 翻页模式与区间模式下的年月标题 */
  title?: string;
  /** 农历模式下工具栏里的干支年 */
  lunarYear?: string;
  /** 年份、月份下拉 */
  select?: string;
  /** 翻页按钮 */
  navButton?: string;
  /** 日历主体 */
  body?: string;
  /** 表头行与每一行单元格 */
  row?: string;
  /** 表头星期 */
  weekday?: string;
  /** 单元格 */
  cell?: string;
  /** 日期标题所在行 */
  cellHeader?: string;
  /** 日期标题 */
  date?: string;
  /** 农历文字 */
  lunar?: string;
  /** 事项区 */
  content?: string;
  /** 事项列表 */
  eventList?: string;
  /** 单条事项 */
  event?: string;
  /** 事项圆点 */
  eventDot?: string;
  /** 事项标题 */
  eventTitle?: string;
}

export default calendarTheme;
