const sizes = ["sm", "md", "lg"] as const;
const colors = ["primary", "secondary", "success", "info", "warning", "error", "neutral"] as const;

/**
 * 选中态的四种表现形式（设计规范「激活类型」）：
 * fill 背景填色 / fillRound 背景填色且为正圆 / outline 描边加文字 / text 仅文字变色。
 * 范围与多选时，除首尾两端外的中间项在 fill、fillRound 下改用浅色底（色板第 1 阶）加正文色。
 */
const activeTypes = ["fill", "fillRound", "outline", "text"] as const;

export type DatePickerActiveType = (typeof activeTypes)[number];

const datePickerTypes = [
  "year",
  "years",
  "month",
  "months",
  "quarter",
  "quarters",
  "date",
  "dates",
  "datetime",
  "week",
  "datetimerange",
  "daterange",
  "monthrange",
  "quarterrange",
  "yearrange",
] as const;

export type DatePickerType = (typeof datePickerTypes)[number];

const viewTypes = ["year", "month", "quarter", "date", "time"] as const;

export type ViewType = (typeof viewTypes)[number];

export interface CalDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  /** 不可点击：越界、被 disabledDate 排除，或（单选类型下）不属于当前月 */
  isDisabled: boolean;
  /** 被规则明确排除（越界或 disabledDate）。与 isDisabled 分开是因为范围类型下「非本月」只做占位、不该显示成禁用 */
  isBlocked: boolean;
  isInRange: boolean;
  isRangeStart: boolean;
  isRangeEnd: boolean;
}

const scrollbarHide =
  "[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

export {
  activeTypes as datePickerActiveTypes,
  colors as datePickerPanelColors,
  sizes as datePickerPanelSizes,
  datePickerTypes,
  viewTypes,
};

export default {
  slots: {
    wrapper: "bg-gray-1 transition-all overflow-hidden",
    container: "flex h-full",
    shortcuts: `border-r border-gray-2 p-4 flex flex-col gap-4 overflow-y-auto ${scrollbarHide}`,
    shortcut:
      "min-w-15 text-sm text-gray-6 hover:bg-gray-2 hover:text-primary cursor-pointer transition-colors whitespace-nowrap",
    /** 头部导航行：左右留 20px，上 16px、下 12px（设计规范「头部样式」） */
    header: "flex items-center justify-between px-[20px] pt-[16px] pb-[12px]",
    /** 翻页按钮组：同侧若有两个按钮（跨年 + 跨月），按钮之间留 8px */
    navGroup: "flex items-center gap-[8px]",
    navBtn:
      "flex items-center rounded-md hover:bg-gray-2 transition-colors cursor-pointer text-gray-6",
    navBtnHidden: "opacity-0 pointer-events-none",
    /** 标题：14px / 500 字重 / 标题色 */
    title: "text-base font-medium text-gray-10 cursor-pointer hover:text-primary transition-colors",
    /** 星期表头：与日期格同宽同高，保证两套栅格逐列对齐 */
    weekdays: "grid grid-cols-7 justify-items-center text-sm text-gray-6 px-[20px]",
    weekday: "size-[30px] flex items-center justify-center",
    /**
     * 日期网格：行距 12px。列宽由 grid-cols-7 均分，日期格固定 30px 居中，
     * 列宽必留富余（min-w 保证每列 ≥ 34px），相邻两格之间因此至少空出 4px——
     * dates 多选叠加 outline 激活类型时，相邻选中项的 1px 描边才不会并成一条粗线。
     */
    days: "grid grid-cols-7 gap-y-[12px] px-[20px] pb-[16px] min-w-[278px]",
    /**
     * 日期格的外层格位：宽度撑满所在列、高度与日期格一致。
     * 范围模式的底色画在这一层而不是 30px 的日期格上——相邻两列的底色因此首尾相接，
     * 连成一条不断的带子；日期格本身仍是 30px，选中端点的方块 / 圆形不会被拉宽。
     */
    dayCell: "flex h-[30px] w-full items-center justify-center",
    /** 范围带子的首端与末端封口，圆角跟随激活类型（见 activeType 变体） */
    dayRangeStart: "",
    dayRangeEnd: "",
    /** 单个日期格：30px 方格、14px 正文色 */
    day: "size-[30px] box-border flex items-center justify-center text-base cursor-pointer transition-colors text-gray-9 hover:bg-gray-2",
    /** 年 / 月 / 季度格：高 30px、14px 正文色，宽度撑满所在列 */
    yearMonthItem:
      "h-[30px] box-border flex items-center justify-center cursor-pointer transition-colors text-base text-gray-9 hover:bg-gray-2 w-full",
    dayActive: "",
    dayDisabled: "text-gray-5 pointer-events-none",
    dayHidden: "invisible",
    dayToday: "font-medium",
    dayInRange: "",
    yearMonthInRange: "",
    yearMonthOutside: "opacity-40",
    /** 年 / 月网格：四列，行距 30px；季度网格两列两行 */
    grid4Year:
      "grid grid-cols-4 gap-y-[30px] justify-items-center px-[20px] pb-[16px] min-w-[278px] overflow-auto",
    grid4Month:
      "grid grid-cols-4 gap-y-[30px] justify-items-center px-[20px] pb-[16px] min-w-[278px]",
    grid2Quarter:
      "grid grid-cols-2 gap-y-[30px] justify-items-center px-[20px] pb-[16px] min-w-[278px]",
    dateTimeHeader: "flex items-center justify-center gap-2 w-full",
    // 日期/时间切换段。字号取七级令牌 text-sm（12px），原先的 text-xs 是 Tailwind 原生值，
    // 字号同为 12px，只是行高不同。这里的 leading-6 保留：它不是排版覆写，而是让 24px 行盒
    // 撑满 h-6 的盒子做垂直居中（该元素是 flex 子项但自身不是 flex 容器，去掉会让文字贴顶）。
    dateTimeSegment:
      "ring-1 ring-gray-3 text-sm h-6 leading-6 w-24 text-center rounded-md transition-all text-gray-7 flex-1",
    dateTimeSegmentActive: "cursor-pointer hover:ring-primary/50 hover:text-primary",
    dateTimeSegmentDisabled: "cursor-not-allowed",
    dateTimeSeparator: "text-gray-3 font-light",
    content: "flex-1",
    panelLeft: "w-full",
    panelRight: "flex-1",
    /** 翻页图标：16px */
    icon: "transition-all size-[16px]",
  },
  variants: {
    border: {
      true: { wrapper: "border border-gray-2 rounded-xl shadow-sm" },
      false: { wrapper: "" },
    },
    // 整面板禁用：置灰并屏蔽所有指针事件（此前只声明了 false 分支，disabled 传了也没有任何表现）
    disabled: {
      true: { wrapper: "opacity-50 pointer-events-none" },
      false: { wrapper: "" },
    },
    overflow: {
      hidden: { wrapper: "overflow-hidden" },
      visible: { wrapper: "overflow-visible" },
    },
    /**
     * 宽度模式：auto（默认）由内部元素撑开——各视图的网格带同一套最小宽度，
     * 面板因此是一个稳定的自然宽度，放进弹层或行内都不会被拉长；
     * full 占满父容器，适合嵌在定宽卡片或自己控制宽度的弹层里。
     */
    width: {
      auto: { wrapper: "w-fit" },
      full: { wrapper: "w-full" },
    },
    /**
     * 激活类型决定「选中项长什么样」的骨架：圆角、是否描边、范围带子两端的封口。
     * 未选中格子的悬停圆角也一并由它给出——悬停与选中共用同一套圆角，不必再单独配置；
     * 具体配色由 color × activeType 复合变体给出。
     */
    activeType: {
      fill: {
        day: "rounded-[4px]",
        yearMonthItem: "rounded-[4px]",
        dayActive: "rounded-[4px]",
        dayRangeStart: "rounded-l-[4px]",
        dayRangeEnd: "rounded-r-[4px]",
      },
      fillRound: {
        day: "rounded-full",
        yearMonthItem: "rounded-full",
        dayActive: "rounded-full",
        dayRangeStart: "rounded-l-full",
        dayRangeEnd: "rounded-r-full",
      },
      outline: {
        day: "rounded-[4px]",
        yearMonthItem: "rounded-[4px]",
        dayActive: "rounded-[4px] border",
        dayRangeStart: "rounded-l-[4px]",
        dayRangeEnd: "rounded-r-[4px]",
      },
      // 仅文字类型的选中项没有底色，圆角只影响悬停底
      text: { day: "rounded-[4px]", yearMonthItem: "rounded-[4px]" },
    },
    dual: {
      true: {
        content: "flex flex-row gap-0 divide-x divide-gray-2",
        panelLeft: "flex-1",
      },
      false: {
        content: "",
        panelLeft: "w-full",
      },
    },
    range: {
      true: { wrapper: "min-w-50" },
      false: { wrapper: "" },
    },
    size: {
      // md 为设计规范基准档（日期格 30px、字号 14px）；sm / lg 等比缩放。
      sm: {
        day: "size-[26px] text-sm",
        dayCell: "h-[26px]",
        weekday: "size-[26px] text-sm",
        days: "min-w-[238px]",
        grid4Year: "min-w-[238px]",
        grid4Month: "min-w-[238px]",
        grid2Quarter: "min-w-[238px]",
        yearMonthItem: "h-[26px] text-sm",
        title: "text-sm",
        icon: "size-[14px]",
      },
      md: {},
      lg: {
        day: "size-[34px] text-lg",
        dayCell: "h-[34px]",
        weekday: "size-[34px] text-lg",
        days: "min-w-[306px]",
        grid4Year: "min-w-[306px]",
        grid4Month: "min-w-[306px]",
        grid2Quarter: "min-w-[306px]",
        yearMonthItem: "h-[34px] text-lg",
        title: "text-lg",
        icon: "size-[18px]",
      },
    },
    color: {
      primary: { dayToday: "text-primary", title: "hover:text-primary" },
      secondary: { dayToday: "text-secondary", title: "hover:text-secondary" },
      success: { dayToday: "text-success", title: "hover:text-success" },
      info: { dayToday: "text-info", title: "hover:text-info" },
      warning: { dayToday: "text-warning", title: "hover:text-warning" },
      error: { dayToday: "text-error", title: "hover:text-error" },
      neutral: { dayToday: "text-gray-6", title: "hover:text-gray-6" },
    },
  },
  /**
   * color × activeType 的配色矩阵。
   * 选中项统一取语义色（即各色板第 6 阶）；填色类型的文字用 gray-1，
   * 范围 / 多选的中间项（除首尾）在填色类型下改用色板第 1 阶浅底 + gray-9 正文色。
   * neutral 的语义色是 gray-4（偏浅，做底色时白字看不清），这里落到 gray-6。
   */
  compoundVariants: [
    // ---- primary ----
    {
      color: "primary",
      activeType: "fill",
      class: {
        dayActive: "bg-primary text-gray-1 hover:bg-primary",
        dayInRange: "bg-brand-1 text-gray-9 hover:bg-brand-1",
        yearMonthInRange: "bg-brand-1 text-gray-9 hover:bg-brand-1",
      },
    },
    {
      color: "primary",
      activeType: "fillRound",
      class: {
        dayActive: "bg-primary text-gray-1 hover:bg-primary",
        dayInRange: "bg-brand-1 text-gray-9 hover:bg-brand-1",
        yearMonthInRange: "bg-brand-1 text-gray-9 hover:bg-brand-1",
      },
    },
    {
      color: "primary",
      activeType: "outline",
      class: {
        dayActive: "border-primary text-primary",
        dayInRange: "bg-brand-1 text-gray-9 hover:bg-brand-1",
        yearMonthInRange: "bg-brand-1 text-gray-9 hover:bg-brand-1",
      },
    },
    {
      color: "primary",
      activeType: "text",
      class: {
        dayActive: "text-primary",
        dayInRange: "text-primary",
        yearMonthInRange: "text-primary",
      },
    },
    // ---- secondary ----
    {
      color: "secondary",
      activeType: "fill",
      class: {
        dayActive: "bg-secondary text-gray-1 hover:bg-secondary",
        dayInRange: "bg-secondary-1 text-gray-9 hover:bg-secondary-1",
        yearMonthInRange: "bg-secondary-1 text-gray-9 hover:bg-secondary-1",
      },
    },
    {
      color: "secondary",
      activeType: "fillRound",
      class: {
        dayActive: "bg-secondary text-gray-1 hover:bg-secondary",
        dayInRange: "bg-secondary-1 text-gray-9 hover:bg-secondary-1",
        yearMonthInRange: "bg-secondary-1 text-gray-9 hover:bg-secondary-1",
      },
    },
    {
      color: "secondary",
      activeType: "outline",
      class: {
        dayActive: "border-secondary text-secondary",
        dayInRange: "bg-secondary-1 text-gray-9 hover:bg-secondary-1",
        yearMonthInRange: "bg-secondary-1 text-gray-9 hover:bg-secondary-1",
      },
    },
    {
      color: "secondary",
      activeType: "text",
      class: {
        dayActive: "text-secondary",
        dayInRange: "text-secondary",
        yearMonthInRange: "text-secondary",
      },
    },
    // ---- success ----
    {
      color: "success",
      activeType: "fill",
      class: {
        dayActive: "bg-success text-gray-1 hover:bg-success",
        dayInRange: "bg-green-1 text-gray-9 hover:bg-green-1",
        yearMonthInRange: "bg-green-1 text-gray-9 hover:bg-green-1",
      },
    },
    {
      color: "success",
      activeType: "fillRound",
      class: {
        dayActive: "bg-success text-gray-1 hover:bg-success",
        dayInRange: "bg-green-1 text-gray-9 hover:bg-green-1",
        yearMonthInRange: "bg-green-1 text-gray-9 hover:bg-green-1",
      },
    },
    {
      color: "success",
      activeType: "outline",
      class: {
        dayActive: "border-success text-success",
        dayInRange: "bg-green-1 text-gray-9 hover:bg-green-1",
        yearMonthInRange: "bg-green-1 text-gray-9 hover:bg-green-1",
      },
    },
    {
      color: "success",
      activeType: "text",
      class: {
        dayActive: "text-success",
        dayInRange: "text-success",
        yearMonthInRange: "text-success",
      },
    },
    // ---- info ----
    {
      color: "info",
      activeType: "fill",
      class: {
        dayActive: "bg-info text-gray-1 hover:bg-info",
        dayInRange: "bg-blue-1 text-gray-9 hover:bg-blue-1",
        yearMonthInRange: "bg-blue-1 text-gray-9 hover:bg-blue-1",
      },
    },
    {
      color: "info",
      activeType: "fillRound",
      class: {
        dayActive: "bg-info text-gray-1 hover:bg-info",
        dayInRange: "bg-blue-1 text-gray-9 hover:bg-blue-1",
        yearMonthInRange: "bg-blue-1 text-gray-9 hover:bg-blue-1",
      },
    },
    {
      color: "info",
      activeType: "outline",
      class: {
        dayActive: "border-info text-info",
        dayInRange: "bg-blue-1 text-gray-9 hover:bg-blue-1",
        yearMonthInRange: "bg-blue-1 text-gray-9 hover:bg-blue-1",
      },
    },
    {
      color: "info",
      activeType: "text",
      class: { dayActive: "text-info", dayInRange: "text-info", yearMonthInRange: "text-info" },
    },
    // ---- warning ----
    {
      color: "warning",
      activeType: "fill",
      class: {
        dayActive: "bg-warning text-gray-1 hover:bg-warning",
        dayInRange: "bg-orange-1 text-gray-9 hover:bg-orange-1",
        yearMonthInRange: "bg-orange-1 text-gray-9 hover:bg-orange-1",
      },
    },
    {
      color: "warning",
      activeType: "fillRound",
      class: {
        dayActive: "bg-warning text-gray-1 hover:bg-warning",
        dayInRange: "bg-orange-1 text-gray-9 hover:bg-orange-1",
        yearMonthInRange: "bg-orange-1 text-gray-9 hover:bg-orange-1",
      },
    },
    {
      color: "warning",
      activeType: "outline",
      class: {
        dayActive: "border-warning text-warning",
        dayInRange: "bg-orange-1 text-gray-9 hover:bg-orange-1",
        yearMonthInRange: "bg-orange-1 text-gray-9 hover:bg-orange-1",
      },
    },
    {
      color: "warning",
      activeType: "text",
      class: {
        dayActive: "text-warning",
        dayInRange: "text-warning",
        yearMonthInRange: "text-warning",
      },
    },
    // ---- error ----
    {
      color: "error",
      activeType: "fill",
      class: {
        dayActive: "bg-error text-gray-1 hover:bg-error",
        dayInRange: "bg-red-1 text-gray-9 hover:bg-red-1",
        yearMonthInRange: "bg-red-1 text-gray-9 hover:bg-red-1",
      },
    },
    {
      color: "error",
      activeType: "fillRound",
      class: {
        dayActive: "bg-error text-gray-1 hover:bg-error",
        dayInRange: "bg-red-1 text-gray-9 hover:bg-red-1",
        yearMonthInRange: "bg-red-1 text-gray-9 hover:bg-red-1",
      },
    },
    {
      color: "error",
      activeType: "outline",
      class: {
        dayActive: "border-error text-error",
        dayInRange: "bg-red-1 text-gray-9 hover:bg-red-1",
        yearMonthInRange: "bg-red-1 text-gray-9 hover:bg-red-1",
      },
    },
    {
      color: "error",
      activeType: "text",
      class: { dayActive: "text-error", dayInRange: "text-error", yearMonthInRange: "text-error" },
    },
    // ---- neutral ----
    {
      color: "neutral",
      activeType: "fill",
      class: {
        dayActive: "bg-gray-6 text-gray-1 hover:bg-gray-6",
        dayInRange: "bg-gray-2 text-gray-9 hover:bg-gray-2",
        yearMonthInRange: "bg-gray-2 text-gray-9 hover:bg-gray-2",
      },
    },
    {
      color: "neutral",
      activeType: "fillRound",
      class: {
        dayActive: "bg-gray-6 text-gray-1 hover:bg-gray-6",
        dayInRange: "bg-gray-2 text-gray-9 hover:bg-gray-2",
        yearMonthInRange: "bg-gray-2 text-gray-9 hover:bg-gray-2",
      },
    },
    {
      color: "neutral",
      activeType: "outline",
      class: {
        dayActive: "border-gray-6 text-gray-6",
        dayInRange: "bg-gray-2 text-gray-9 hover:bg-gray-2",
        yearMonthInRange: "bg-gray-2 text-gray-9 hover:bg-gray-2",
      },
    },
    {
      color: "neutral",
      activeType: "text",
      class: {
        dayActive: "text-gray-6",
        dayInRange: "text-gray-6",
        yearMonthInRange: "text-gray-6",
      },
    },
  ] as any,
  defaultVariants: {
    size: "md" as (typeof sizes)[number],
    color: "primary" as (typeof colors)[number],
    width: "auto" as "auto" | "full",
    activeType: "fill" as (typeof activeTypes)[number],
  },
};
