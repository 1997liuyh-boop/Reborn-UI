<script setup lang="ts">
/* eslint vue/custom-event-name-casing: off -- 保留既有公开事件名 */
import type { ClassValue } from "clsx";
import type { TimeRangeRole } from "../reborn-time-picker/reborn-time-panel.config";
import type { UnitCell } from "./DatePickerUnitGrid.vue";
import type { CalDay, DatePickerActiveType, DatePickerCell, datePickerPanelColors, datePickerPanelSizes, DatePickerType, ViewType } from "./reborn-date-picker-panel.config";
import type { PanelSide } from "./useDatePickerNavigation";
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import { RebornTimePicker } from "../reborn-time-picker";
import DatePickerDateGrid from "./DatePickerDateGrid.vue";
import DatePickerHeader from "./DatePickerHeader.vue";
import DatePickerUnitGrid from "./DatePickerUnitGrid.vue";
import theme, { DATE_PANEL_NESTED_OVERLAY_CLASS } from "./reborn-date-picker-panel.config";
import { dayjs, dayKey, parseDateValue, quarterOf, quarterStartDate, weekEndOf, weekStartOf } from "./reborn-date-picker.utils";
import { useDatePickerNavigation } from "./useDatePickerNavigation";
import { useDatePickerRange } from "./useDatePickerRange";

export type DatePickerDefaultValue = Date | string | number;

export interface DatePickerPanelProps {
  type?: DatePickerType; // 选择器类型：date, datetime, year, month 等
  start?: string; // 可选范围开始时间
  end?: string; // 可选范围结束时间
  disabledMethod?: (date: Date, unit: "year" | "month" | "quarter" | "week" | "date") => boolean; // 逐项判定是否禁用，返回 true 即不可选；unit 标识当前判定粒度——日期格传 date（week / weekrange 类型传 week），年 / 月 / 季度视图分别传 year / month / quarter，同一个方法可按粒度限制任意档位
  size?: (typeof datePickerPanelSizes)[number]; // 尺寸：sm, md, lg
  overflow?: "hidden" | "visible";
  disabledHours?: (role?: TimeRangeRole, comparingValue?: string | null) => number[]; // 返回需禁用的小时数组；仅含时间的类型（datetime/datetimerange）生效，范围模式可按 role 区分开始/结束面板
  disabledMinutes?: (
    hour: number,
    role?: TimeRangeRole,
    comparingValue?: string | null,
  ) => number[]; // 返回需禁用的分钟数组，入参为当前选中的小时；范围模式可按 role 区分开始/结束面板
  disabledSeconds?: (
    hour: number,
    minute: number,
    role?: TimeRangeRole,
    comparingValue?: string | null,
  ) => number[]; // 返回需禁用的秒数组，入参为当前选中的时、分；范围模式可按 role 区分开始/结束面板
  disabledMilliseconds?: (
    hour: number,
    minute: number,
    second: number,
    role?: TimeRangeRole,
    comparingValue?: string | null,
  ) => number[]; // 返回需禁用的毫秒数组，入参为当前选中的时、分、秒；范围模式可按 role 区分开始/结束面板
  color?: (typeof datePickerPanelColors)[number]; // 颜色主题
  activeType?: DatePickerActiveType; // 选中态表现：fill 背景 / fillRound 背景正圆 / outline 描边加文字 / text 仅文字
  width?: "auto" | "full"; // 宽度模式：auto 由内部元素撑开（默认）/ full 占满父容器
  class?: any; // 自定义类名
  valueFormat?: string; // 值格式化字符串
  disabled?: boolean; // 是否禁用
  border?: boolean; // 是否显示边框
  shortcuts?: { text: string; value: any }[]; // 快捷选项
  shortcutPosition?: "left" | "right"; // 快捷侧栏位置，默认位于日期面板左侧
  showWeekNumber?: boolean; // 日期视图左侧显示 ISO 周数（week / weekrange 类型本身按周选择，不生效）
  unlinkPanels?: boolean; // 范围选择时取消两个面板之间的联动，左右面板各自翻页
  singlePanel?: boolean; // 范围选择时只显示一个面板
  showToday?: boolean; // 面板底部显示「今天」按钮：点击选中当前时间所在的日 / 周 / 月 / 季度 / 年，文案随类型变为今天、此刻（datetime）、本周、本月、本季度、今年
  highlightToday?: boolean; // 高亮今天 / 本月 / 本季度 / 今年，默认关闭，不影响已选样式
  defaultValue?: DatePickerDefaultValue | DatePickerDefaultValue[]; // 未选值时面板初始展示的日期，不写入绑定值；默认展示当天。数组时第一项定位左面板，取消联动（unlinkPanels）时第二项定位右面板；字符串按 valueFormat 解析，数字按时间戳
  ui?: Partial<{
    // 样式覆盖
    wrapper: ClassValue;
    container: ClassValue;
    navGroup: ClassValue;
    weekday: ClassValue;
    grid2Quarter: ClassValue;
    shortcuts: ClassValue;
    shortcut: ClassValue;
    yearMonthItem: ClassValue;
    header: ClassValue;
    navBtn: ClassValue;
    navBtnHidden: ClassValue;
    navBtnDisabled: ClassValue;
    weekNumberHeader: ClassValue;
    weekNumber: ClassValue;
    title: ClassValue;
    weekdays: ClassValue;
    days: ClassValue;
    dayCell: ClassValue;
    dayRangeStart: ClassValue;
    dayRangeEnd: ClassValue;
    day: ClassValue;
    dayActive: ClassValue;
    dayDisabled: ClassValue;
    dayDisabledBand: ClassValue;
    dayOutside: ClassValue;
    dayToday: ClassValue;
    dayInRange: ClassValue;
    yearMonthInRange: ClassValue;
    yearMonthRangeStart: ClassValue;
    yearMonthRangeEnd: ClassValue;
    yearMonthOutside: ClassValue;
    grid4Year: ClassValue;
    grid4Month: ClassValue;
    dateTimeHeader: ClassValue;
    dateTimeSegment: ClassValue;
    dateTimeSegmentActive: ClassValue;
    dateTimeSegmentDisabled: ClassValue;
    dateTimeSeparator: ClassValue;
    content: ClassValue;
    panelLeft: ClassValue;
    panelRight: ClassValue;
    icon: ClassValue;
    footer: ClassValue;
    footerDisabled: ClassValue;
  }>;
}

type TimeRole = "start" | "end";

const props = withDefaults(defineProps<DatePickerPanelProps>(), {
  type: "date",
  start: "1970-01-01",
  end: "2099-12-31",
  size: "md",
  overflow: "visible",
  color: "primary",
  activeType: "fill",
  width: "auto",
  disabled: false,
  border: false,
  shortcuts: () => [],
  shortcutPosition: "left",
  valueFormat: "",
  showWeekNumber: false,
  unlinkPanels: false,
  singlePanel: false,
  showToday: false,
  highlightToday: false,
});

const emit = defineEmits<{
  (e: "change", value: any): void;
  // 范围类型点选日期时触发：第一次点选只有开始日期，结束日期为 null
  (e: "calendar-change", value: [Date, Date | null]): void;
  // 面板翻页、切换视图或下钻时触发：date 为面板当前展示年月的 1 日（双面板时为 [左, 右]）；
  // mode 为变化粒度（日期视图按月翻页为 month，其余为 year），view 为变化后的视图
  (
    e: "panel-change",
    date: Date | [Date, Date],
    mode: "month" | "year",
    view: ViewType,
  ): void;
  // 调用 clear 清空选中值时触发
  (e: "clear"): void;
  // 候选日期预览；离开网格或悬停禁用格时为 null，不写入绑定值
  (e: "hover-change", value: Date | [Date, Date | null] | null): void;
}>();

defineSlots<{
  /** 自定义单元格内容：作用域参数即单元格数据，年 / 月 / 季度 / 日期四种视图共用 */
  default?: (props: DatePickerCell) => any;
  /** 上个月图标：仅日期视图的内侧单箭头 */
  "prev-month"?: () => any;
  /** 下个月图标：仅日期视图的内侧单箭头 */
  "next-month"?: () => any;
  /** 上一年图标：日期视图的外侧双箭头，以及年 / 月 / 季度视图的翻页按钮（这三种视图按年或十年翻页） */
  "prev-year"?: () => any;
  /** 下一年图标：日期视图的外侧双箭头，以及年 / 月 / 季度视图的翻页按钮 */
  "next-year"?: () => any;
}>();

const model = defineModel<any>({ default: "" });
const b = tv(theme);

// --- 组件状态标识 ---
const isMultiple = computed(() =>
  ["years", "months", "quarters", "dates"].includes(props.type as string),
); // 是否为多选模式
const isRange = computed(() =>
  [
    "yearrange",
    "monthrange",
    "quarterrange",
    "daterange",
    "datetimerange",
    "week",
    "weekrange",
  ].includes(props.type as string),
); // 是否为范围选择模式
const isDual = computed(() =>
  ["yearrange", "monthrange", "quarterrange", "daterange", "datetimerange", "weekrange"].includes(
    props.type as string,
  ),
); // 是否显示双面板
const isWeekUnit = computed(() => ["week", "weekrange"].includes(props.type as string)); // 是否按整周选择
const isQuarterType = computed(() =>
  ["quarter", "quarters", "quarterrange"].includes(props.type as string),
); // 是否为季度类型
const hasTime = computed(() => ["datetime", "datetimerange"].includes(props.type as string)); // 是否包含时间选择
const showDual = computed(() => isDual.value && !props.singlePanel); // 实际是否渲染双面板：singlePanel 时范围类型也只出一个面板
const isUnlinked = computed(() => showDual.value && props.unlinkPanels); // 左右面板是否各自翻页
const showWeek = computed(() => props.showWeekNumber && !isWeekUnit.value); // 是否显示周数列

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
  const styles = b({
    shortcutPosition: props.shortcutPosition,
    size: props.size,
    color: props.color,
    activeType: props.activeType,
    width: props.width,
    disabled: props.disabled,
    border: props.border,
    range: isRange.value,
    dual: showDual.value, // 双面板
    weekNumber: showWeek.value, // 周数列
    overflow: props.overflow,
  });
  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    container: (opts?: { class?: any }) =>
      styles.container({ class: cn(opts?.class, uiOverrides.value.container) }),
    navGroup: (opts?: { class?: any }) =>
      styles.navGroup({ class: cn(opts?.class, uiOverrides.value.navGroup) }),
    weekday: (opts?: { class?: any }) =>
      styles.weekday({ class: cn(opts?.class, uiOverrides.value.weekday) }),
    grid2Quarter: (opts?: { class?: any }) =>
      styles.grid2Quarter({ class: cn(opts?.class, uiOverrides.value.grid2Quarter) }),
    shortcuts: (opts?: { class?: any }) =>
      styles.shortcuts({ class: cn(opts?.class, uiOverrides.value.shortcuts) }),
    shortcut: (opts?: { class?: any }) =>
      styles.shortcut({ class: cn(opts?.class, uiOverrides.value.shortcut) }),
    yearMonthItem: (opts?: { class?: any }) =>
      styles.yearMonthItem({ class: cn(opts?.class, uiOverrides.value.yearMonthItem) }),
    header: (opts?: { class?: any }) =>
      styles.header({ class: cn(opts?.class, uiOverrides.value.header) }),
    navBtn: (opts?: { class?: any }) =>
      styles.navBtn({ class: cn(opts?.class, uiOverrides.value.navBtn) }),
    navBtnHidden: (opts?: { class?: any }) =>
      styles.navBtnHidden({ class: cn(opts?.class, uiOverrides.value.navBtnHidden) }),
    navBtnDisabled: (opts?: { class?: any }) =>
      styles.navBtnDisabled({ class: cn(opts?.class, uiOverrides.value.navBtnDisabled) }),
    weekNumberHeader: (opts?: { class?: any }) =>
      styles.weekNumberHeader({ class: cn(opts?.class, uiOverrides.value.weekNumberHeader) }),
    weekNumber: (opts?: { class?: any }) =>
      styles.weekNumber({ class: cn(opts?.class, uiOverrides.value.weekNumber) }),
    title: (opts?: { class?: any }) =>
      styles.title({ class: cn(opts?.class, uiOverrides.value.title) }),
    weekdays: (opts?: { class?: any }) =>
      styles.weekdays({ class: cn(opts?.class, uiOverrides.value.weekdays) }),
    days: (opts?: { class?: any }) =>
      styles.days({ class: cn(opts?.class, uiOverrides.value.days) }),
    dayCell: (opts?: { class?: any }) =>
      styles.dayCell({ class: cn(opts?.class, uiOverrides.value.dayCell) }),
    dayRangeStart: (opts?: { class?: any }) =>
      styles.dayRangeStart({ class: cn(opts?.class, uiOverrides.value.dayRangeStart) }),
    dayRangeEnd: (opts?: { class?: any }) =>
      styles.dayRangeEnd({ class: cn(opts?.class, uiOverrides.value.dayRangeEnd) }),
    day: (opts?: { class?: any }) => styles.day({ class: cn(opts?.class, uiOverrides.value.day) }),
    dayActive: (opts?: { class?: any }) =>
      styles.dayActive({ class: cn(opts?.class, uiOverrides.value.dayActive) }),
    dayDisabled: (opts?: { class?: any }) =>
      styles.dayDisabled({ class: cn(opts?.class, uiOverrides.value.dayDisabled) }),
    dayDisabledBand: (opts?: { class?: any }) =>
      styles.dayDisabledBand({ class: cn(opts?.class, uiOverrides.value.dayDisabledBand) }),
    dayOutside: (opts?: { class?: any }) =>
      styles.dayOutside({ class: cn(opts?.class, uiOverrides.value.dayOutside) }),
    dayToday: (opts?: { class?: any }) =>
      styles.dayToday({ class: cn(opts?.class, uiOverrides.value.dayToday) }),
    dayInRange: (opts?: { class?: any }) =>
      styles.dayInRange({ class: cn(opts?.class, uiOverrides.value.dayInRange) }),
    yearMonthInRange: (opts?: { class?: any }) =>
      styles.yearMonthInRange({ class: cn(opts?.class, uiOverrides.value.yearMonthInRange) }),
    yearMonthRangeStart: (opts?: { class?: any }) =>
      styles.yearMonthRangeStart({ class: cn(opts?.class, uiOverrides.value.yearMonthRangeStart) }),
    yearMonthRangeEnd: (opts?: { class?: any }) =>
      styles.yearMonthRangeEnd({ class: cn(opts?.class, uiOverrides.value.yearMonthRangeEnd) }),
    yearMonthOutside: (opts?: { class?: any }) =>
      styles.yearMonthOutside({ class: cn(opts?.class, uiOverrides.value.yearMonthOutside) }),
    grid4Year: (opts?: { class?: any }) =>
      styles.grid4Year({ class: cn(opts?.class, uiOverrides.value.grid4Year) }),
    grid4Month: (opts?: { class?: any }) =>
      styles.grid4Month({ class: cn(opts?.class, uiOverrides.value.grid4Month) }),
    dateTimeHeader: (opts?: { class?: any }) =>
      styles.dateTimeHeader({ class: cn(opts?.class, uiOverrides.value.dateTimeHeader) }),
    dateTimeSegment: (opts?: { class?: any }) =>
      styles.dateTimeSegment({ class: cn(opts?.class, uiOverrides.value.dateTimeSegment) }),
    dateTimeSegmentActive: (opts?: { class?: any }) =>
      styles.dateTimeSegmentActive({
        class: cn(opts?.class, uiOverrides.value.dateTimeSegmentActive),
      }),
    dateTimeSegmentDisabled: (opts?: { class?: any }) =>
      styles.dateTimeSegmentDisabled({
        class: cn(opts?.class, uiOverrides.value.dateTimeSegmentDisabled),
      }),
    dateTimeSeparator: (opts?: { class?: any }) =>
      styles.dateTimeSeparator({ class: cn(opts?.class, uiOverrides.value.dateTimeSeparator) }),
    content: (opts?: { class?: any }) =>
      styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
    panelLeft: (opts?: { class?: any }) =>
      styles.panelLeft({ class: cn(opts?.class, uiOverrides.value.panelLeft) }),
    panelRight: (opts?: { class?: any }) =>
      styles.panelRight({ class: cn(opts?.class, uiOverrides.value.panelRight) }),
    icon: (opts?: { class?: any }) =>
      styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    footer: (opts?: { class?: any }) =>
      styles.footer({ class: cn(opts?.class, uiOverrides.value.footer) }),
    footerDisabled: (opts?: { class?: any }) =>
      styles.footerDisabled({ class: cn(opts?.class, uiOverrides.value.footerDisabled) }),
  };
});

// --- 日历核心状态 ---
/** 当前日期，挂载后才读取时钟：服务端与水合首帧不判「今天」，避免两端渲染不一致 */
const today = shallowRef<Date | null>(null);
/**
 * 面板是否已定位到实际月份：有绑定值或 defaultValue 时立即为 true，否则挂载后才为 true。
 * 在此之前导航停在固定基准月（1970 年 1 月），内容区先隐藏，服务端首屏不会露出明显错误的年月
 */
const viewSettled = shallowRef(false);

// --- 导航：当前视图、左右面板所示年月与十年页，约束与翻页事件都在导航内部收口 ---
const nav = useDatePickerNavigation({
  type: () => props.type,
  disabled: () => props.disabled,
  showDual,
  isUnlinked,
  onPanelChange: (date, mode, view) => emit("panel-change", date, mode, view),
});
const currentView = nav.view; // 当前视图：year, month, quarter, date
/** 年 / 月 / 季度视图共用一套网格组件，日期视图单独渲染 */
const isUnitView = computed(() => ["year", "month", "quarter"].includes(currentView.value));
const unitKind = computed<"year" | "month" | "quarter">(() =>
  currentView.value === "month" || currentView.value === "quarter" ? currentView.value : "year",
);

// 选中的数据状态
const selectedDate = shallowRef<Date | null>(null); // 单个选中日期
const range = useDatePickerRange({ type: () => props.type, isRange, disabled: () => props.disabled }); // 范围端点与悬停预览

const selectedHour = shallowRef(0); // 选中的小时
const selectedMinute = shallowRef(0); // 选中的分钟
const selectedSecond = shallowRef(0); // 选中的秒

const timeFormat = computed(() => {
  if (props.valueFormat.includes("SSS")) return "HH:mm:ss.SSS";
  return "HH:mm:ss";
});

const displayDate1 = computed(() => {
  const d = isRange.value ? range.start.value : selectedDate.value;
  return d ? dayjs(d).format("YYYY-MM-DD") : "选择日期";
});

const displayTime1 = computed(() => {
  const d = isRange.value ? range.start.value : selectedDate.value;
  if (!d) return "选择时间";
  return dayjs(d)
    .hour(selectedHour.value)
    .minute(selectedMinute.value)
    .second(selectedSecond.value)
    .format(timeFormat.value);
});

const displayDate2 = computed(() => {
  if (!isRange.value) return "";
  return range.end.value ? dayjs(range.end.value).format("YYYY-MM-DD") : "选择日期";
});

const selectedHour2 = shallowRef(0);
const selectedMinute2 = shallowRef(0);
const selectedSecond2 = shallowRef(0);

const displayTime2 = computed(() => {
  if (!isRange.value) return "";
  if (!range.end.value) return "选择时间";
  return dayjs(range.end.value)
    .hour(selectedHour2.value)
    .minute(selectedMinute2.value)
    .second(selectedSecond2.value)
    .format(timeFormat.value);
});

const timeModel1 = computed({
  get: () => displayTime1.value,
  set: (val) => {
    const d = dayjs(val, timeFormat.value);
    if (d.isValid()) {
      selectedHour.value = d.hour();
      selectedMinute.value = d.minute();
      selectedSecond.value = d.second();

      if (isRange.value) {
        // 还没选日期就先选时间：起止都落到今天，结束时间与开始时间相同
        if (!range.start.value) {
          const now = new Date();
          range.setRange(now, now);
          selectedHour2.value = d.hour();
          selectedMinute2.value = d.minute();
          selectedSecond2.value = d.second();
        }
        model.value = rangeValue();
      } else {
        if (!selectedDate.value) {
          selectedDate.value = new Date();
        }
        model.value = formatDate(selectedDate.value);
      }
    }
  },
});

const timeModel2 = computed({
  get: () => displayTime2.value,
  set: (val) => {
    const d = dayjs(val, timeFormat.value);
    if (d.isValid()) {
      selectedHour2.value = d.hour();
      selectedMinute2.value = d.minute();
      selectedSecond2.value = d.second();

      if (isRange.value) {
        // 缺哪一端就用此刻补上
        range.setRange(range.start.value ?? new Date(), range.end.value ?? new Date());
        model.value = rangeValue();
      }
    }
  },
});

/**
 * 解析输入值为 Date 对象
 */
function parseValue(v: unknown): Date | null { return parseDateValue(v, props.valueFormat); }

function isSameDate(v1: any, v2: any): boolean {
  if (!v1 || !v2) return false;
  const d1 = v1 instanceof Date ? v1 : parseValue(v1);
  const d2 = v2 instanceof Date ? v2 : parseValue(v2);
  return d1?.toDateString() === d2?.toDateString();
}

/**
 * 生成对外输出值：传了 valueFormat 输出格式化字符串，否则输出 Date 对象。
 * 时分秒的注入必须发生在格式化之前、且与有无 valueFormat 无关——
 * 此前无 valueFormat 时直接原样返回入参，一是丢掉了时间选择器选的时分秒，
 * 二是 emit 的还是同一个 Date 引用，v-model 判等后不触发更新（表现为选了时间值不动）。
 */
function formatDate(d: Date | null, role: "start" | "end" = "start"): any {
  if (!d) return "";

  // 如果包含时间选择，注入选中的时分秒
  let dateObj = dayjs(d);
  if (["datetime", "datetimerange"].includes(props.type as string)) {
    const h = role === "start" ? selectedHour.value : selectedHour2.value;
    const m = role === "start" ? selectedMinute.value : selectedMinute2.value;
    const s = role === "start" ? selectedSecond.value : selectedSecond2.value;
    dateObj = dateObj.hour(h).minute(m).second(s);
  }

  // 无 valueFormat 时输出 Date 对象；toDate() 总是全新实例，保证每次 emit 都能触发响应式更新
  if (!props.valueFormat) return dateObj.toDate();
  return dateObj.format(props.valueFormat);
}

// --- 范围提交：组装绑定值与派发事件只在这里写一份 ---

/** 范围类型的绑定值：起点按开始时间、终点按结束时间格式化，缺终点时为空串 */
function rangeValue() {
  return [formatDate(range.start.value), formatDate(range.end.value, "end")];
}

/** 范围类型点选后抛出 calendar-change：只选了起点时终点为 null；week 类型一次点选即成整周，不抛 */
function emitCalendarChange() {
  const start = range.start.value;
  if (props.type === "week" || !start) return;
  emit("calendar-change", [new Date(start), range.end.value ? new Date(range.end.value) : null]);
}

/** 范围类型的统一提交：写回绑定值、抛 calendar-change，两端齐了再抛 change */
function commitRange() {
  const val = rangeValue();
  model.value = val;
  emitCalendarChange();
  if (range.start.value && range.end.value) emit("change", val);
}

// --- 日期网格 ---

/** 日期格的可选边界 */
function dayLimits() {
  return {
    start: props.start ? new Date(props.start) : null,
    end: props.end ? new Date(props.end) : null,
  };
}

/** 某天是否被规则排除：越界或 disabledMethod 命中（week 类型按 week 粒度询问），整面板禁用时每一天都算 */
function isDayBlocked(d: Date, limits = dayLimits()): boolean {
  let blocked = false;
  if (limits.start && d < limits.start) blocked = true;
  if (limits.end && d > limits.end) blocked = true;
  if (!blocked && props.disabledMethod?.(new Date(d), isWeekUnit.value ? "week" : "date")) blocked = true;
  // 整面板禁用：每一格都视为被排除，统一走禁用样式与灰带
  return blocked || props.disabled;
}

/**
 * 生成日历日期列表
 */
function getBaseCalendarDays(y: number, m: number): CalDay[] {
  const firstDayOfMonth = new Date(y, m, 1);
  const startWeekday = firstDayOfMonth.getDay();
  // 月首恰逢周日时前补一整周上月日期（如 2018/4 前补 3/25-31），
  // 保证 6 行网格始终前后都有补位，而不是首行顶格、尾部堆两行下月
  const leadingDays = startWeekday === 0 ? 7 : startWeekday;

  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - leadingDays);

  // 固定 6 行 × 7 列 = 42 格：行数不随月份浮动，切月时面板高度保持稳定
  const totalCells = 42;
  const days: CalDay[] = [];
  const limits = dayLimits();

  for (let i = 0; i < totalCells; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    // 只有被规则排除的格子才禁用；非本月的补位格只调淡文字（dayOutside），照常可点
    const isBlocked = isDayBlocked(d, limits);

    days.push({
      date: d,
      day: d.getDate(),
      isCurrentMonth: d.getMonth() === m && d.getFullYear() === y,
      isToday: d.toDateString() === today.value?.toDateString(),
      isSelected: false,
      isDisabled: isBlocked,
      isBlocked,
      isInRange: false,
      isRangeStart: false,
      isRangeEnd: false,
      // 禁用灰带：只有被规则排除的格子进灰带，连续格子的底色自然连成一条
      isDisabledBand: isBlocked,
    });
  }
  return days;
}

/** 日期网格的规则层：只随所示年月与禁用规则重算，范围悬停预览不会重跑 disabledMethod */
const baseCalendarDays = computed(() => getBaseCalendarDays(nav.leftYear.value, nav.leftMonth.value));
const baseCalendarDays2 = computed(() => getBaseCalendarDays(nav.rightYear.value, nav.rightMonth.value));
const selectedDayKeys = computed(() => new Set((Array.isArray(model.value) ? model.value : [])
  .map(parseValue).filter((date): date is Date => date !== null).map(dayKey)));
/** 日期网格的选中层：选中、范围带与起止端点 */
function applySelection(days: CalDay[]) {
  const a = range.start.value ? dayKey(range.start.value) : null;
  const b = range.previewEnd.value ? dayKey(range.previewEnd.value) : null;
  let lo = a !== null && b !== null ? Math.min(a, b) : a;
  let hi = a !== null && b !== null ? Math.max(a, b) : null;
  if (props.type === 'weekrange' && lo !== null) {
    hi = weekEndOf(new Date(hi ?? lo)).getTime();
    lo = weekStartOf(new Date(lo)).getTime();
  }
  return days.map(day => {
    const t = dayKey(day.date);
    const result = { ...day, isSelected: isDateActive(day.date), isInRange: lo !== null && hi !== null && t >= lo && t <= hi,
      isRangeStart: lo !== null && t === lo, isRangeEnd: hi !== null && t === hi };
    return { ...result, active: !isRangePlaceholder(result) && result.isSelected, rangeBand: showRangeBand(result) };
  });
}
const calendarDays = computed(() => applySelection(baseCalendarDays.value));
const calendarDays2 = computed(() => applySelection(baseCalendarDays2.value));

/**
 * 双面板范围类型（daterange / datetimerange）下，补位格只做灰字占位：
 * 选中态与范围带子一律不上——该日期真正归属的月份在另一侧面板渲染，两边同时高亮会重复。
 * singlePanel 时没有另一侧面板，补位格照常高亮。
 */
function isRangePlaceholder(day: CalDay): boolean {
  return (
    showDual.value && ["daterange", "datetimerange"].includes(props.type) && !day.isCurrentMonth
  );
}

/** 该格是否画范围带子：起止同一天不画（两端半宽带子会叠加错位），双面板的补位格不画 */
function showRangeBand(day: CalDay): boolean {
  if (props.disabled) return false;
  return day.isInRange && !(day.isRangeStart && day.isRangeEnd) && !isRangePlaceholder(day);
}

// --- 年 / 月 / 季度网格 ---

/** 年份是否禁用：start / end 越界，或 disabledMethod 按 year 粒度命中（以当年 1 月 1 日询问） */
function isYearDisabled(y: number): boolean {
  const start = props.start ? new Date(props.start).getFullYear() : 1970;
  const end = props.end ? new Date(props.end).getFullYear() : 2099;
  if (props.disabled) return true;
  return y < start || y > end || !!props.disabledMethod?.(new Date(y, 0, 1), "year");
}

/** 月份是否禁用：disabledMethod 按 month 粒度命中（以当月 1 日询问） */
function isMonthDisabled(m: number, year: number): boolean {
  if (props.disabled) return true;
  return !!props.disabledMethod?.(new Date(year, m - 1, 1), "month");
}

/** 季度是否禁用：disabledMethod 按 quarter 粒度命中（以季度首日询问） */
function isQuarterDisabled(q: number, year: number): boolean {
  if (props.disabled) return true;
  return !!props.disabledMethod?.(quarterStartDate(year, q), "quarter");
}

const monthList = Array.from({ length: 12 }, (_, i) => i + 1);
const quarterList = [1, 2, 3, 4];

type UnitBase = Omit<UnitCell, "selected" | "inRange" | "cap" | "isToday">;

/**
 * 年 / 月 / 季度网格的规则层：只随视图、所示年份（年视图为十年页）与禁用规则重算，
 * 范围悬停预览只改选中层，不会重跑 disabledMethod。年视图前后各补一年，共 12 格
 */
function unitBase(view: ViewType, year: () => number, pageStart: () => number): UnitBase[] {
  if (view === "year") {
    const start = pageStart();
    return Array.from({ length: 12 }, (_, i) => start - 1 + i).map(y => ({
      value: y, date: new Date(y, 0, 1), label: String(y), disabled: isYearDisabled(y), outside: y < start || y > start + 9,
    }));
  }
  if (view === "month") {
    const y = year();
    return monthList.map(m => ({ value: m, date: new Date(y, m - 1, 1), label: `${m}月`, disabled: isMonthDisabled(m, y), outside: false }));
  }
  if (view === "quarter") {
    const y = year();
    return quarterList.map(q => ({ value: q, date: quarterStartDate(y, q), label: `第${q}季度`, disabled: isQuarterDisabled(q, y), outside: false }));
  }
  return [];
}

/** 年 / 月 / 季度网格的选中层：选中、范围带、端点封口与「今天」 */
function applyUnitSelection(view: ViewType, cells: UnitBase[], year: number): UnitCell[] {
  const now = today.value;
  return cells.map((cell) => {
    if (view === "year") {
      return { ...cell, selected: isYearActive(cell.value), inRange: isYearInRange(cell.value),
        cap: yearMonthRangeCap("year", cell.value, year), isToday: cell.value === now?.getFullYear() };
    }
    if (view === "month") {
      return { ...cell, selected: isMonthActive(cell.value, year), inRange: isMonthInRange(cell.value, year),
        cap: yearMonthRangeCap("month", cell.value, year), isToday: year === now?.getFullYear() && cell.value - 1 === now?.getMonth() };
    }
    return { ...cell, selected: isQuarterActive(cell.value, year), inRange: isQuarterInRange(cell.value, year),
      cap: yearMonthRangeCap("quarter", cell.value, year), isToday: year === now?.getFullYear() && cell.value === (now ? quarterOf(now) : 0) };
  });
}

const leftUnitBase = computed(() => unitBase(currentView.value, () => nav.leftYear.value, () => nav.leftPage.value));
const rightUnitBase = computed(() => unitBase(currentView.value, () => nav.rightYear.value, () => nav.rightPage.value));
const leftUnits = computed(() => applyUnitSelection(currentView.value, leftUnitBase.value, nav.leftYear.value));
const rightUnits = computed(() => applyUnitSelection(currentView.value, rightUnitBase.value, nav.rightYear.value));

// --- 选择 ---

/**
 * 选中某个日期
 */
function selectDay(day: CalDay, side: PanelSide = "left") {
  if (day.isDisabled) return;

  // 单面板点中补位格时翻到该日期所在月份，选中结果才看得见（双面板的真实格子在另一侧，不翻页）
  if (!day.isCurrentMonth && !showDual.value) nav.showMonthOf(day.date);

  if (props.type === "week") {
    // 周选择模式：选中整周
    range.setRange(weekStartOf(day.date), weekEndOf(day.date));
    commitRange();
  } else if (props.type === "dates") {
    // 多选模式
    const current = (model.value as any[]) || [];
    const idx = current.findIndex((v) => isSameDate(v, day.date));
    const newVal = [...current];
    if (idx > -1) newVal.splice(idx, 1);
    else newVal.push(formatDate(day.date));
    model.value = newVal;
  } else if (isRange.value) {
    range.pick(day.date, side);
    commitRange();
  } else {
    // 单选模式
    selectedDate.value = day.date;
    const val = formatDate(day.date);
    model.value = val;
    emit("change", val);
  }
}

/**
 * 选中某个年份
 */
function selectYear(year: number, side: PanelSide = "left") {
  // 禁用格不再靠 pointer-events-none 拦截（要显示 cursor-not-allowed），点击在此守卫
  if (isYearDisabled(year)) return;
  const d = new Date(year, 0, 1);

  if (props.type === "year") {
    selectedDate.value = d;
    const val = formatDate(d);
    model.value = val;
    emit("change", val);
    return;
  }

  if (props.type === "years") {
    const current = (model.value as any[]) || [];
    const valStr = formatDate(d);
    const idx = current.findIndex((v) => {
      const dv = dayjs(v);
      return dv.isValid() && dv.year() === year;
    });
    const newVal = [...current];
    if (idx > -1) newVal.splice(idx, 1);
    else newVal.push(valStr);
    model.value = newVal;
    return;
  }

  if (props.type === "yearrange") {
    range.pick(d, side);
    commitRange();
    return;
  }

  // 其余类型从年视图下钻到月 / 季度视图
  nav.drillYear(side, year);
}

/**
 * 选中某个月份（month 从 1 起，year 为该格所在面板的年份）
 */
function selectMonth(month: number, year: number, side: PanelSide = "left") {
  if (isMonthDisabled(month, year)) return;
  const d = new Date(year, month - 1, 1);

  if (props.type === "month") {
    selectedDate.value = d;
    const val = formatDate(d);
    model.value = val;
    emit("change", val);
    return;
  }

  if (props.type === "months") {
    const current = (model.value as any[]) || [];
    const valStr = formatDate(d);
    const idx = current.findIndex((v) => {
      const dv = dayjs(v);
      return dv.isValid() && dv.year() === year && dv.month() === month - 1;
    });
    const newVal = [...current];
    if (idx > -1) newVal.splice(idx, 1);
    else newVal.push(valStr);
    model.value = newVal;
    return;
  }

  if (props.type === "monthrange") {
    range.pick(d, side);
    commitRange();
    return;
  }

  // 其余类型从月视图下钻到日期视图
  nav.drillMonth(side, year, month);
}

/**
 * 选中某个季度。单选直接提交，多选按已选集合增删，范围按首尾两端记录。
 */
function selectQuarter(q: number, year: number, side: PanelSide = "left") {
  if (isQuarterDisabled(q, year)) return;
  const d = quarterStartDate(year, q);

  if (props.type === "quarter") {
    selectedDate.value = d;
    const val = formatDate(d);
    model.value = val;
    emit("change", val);
    return;
  }

  if (props.type === "quarters") {
    const current = (model.value as any[]) || [];
    const valStr = formatDate(d);
    const idx = current.findIndex((v) => {
      const dv = v instanceof Date ? v : parseValue(v);
      return !!dv && dv.getFullYear() === year && quarterOf(dv) === q;
    });
    const newVal = [...current];
    if (idx > -1) newVal.splice(idx, 1);
    else newVal.push(valStr);
    model.value = newVal;
    return;
  }

  range.pick(d, side);
  commitRange();
}

/** 年 / 月 / 季度网格的点击按当前视图分派 */
function selectUnit(panel: { side: PanelSide; year: number }, cell: UnitCell) {
  if (currentView.value === "year") selectYear(cell.value, panel.side);
  else if (currentView.value === "month") selectMonth(cell.value, panel.year, panel.side);
  else selectQuarter(cell.value, panel.year, panel.side);
}

/** 预览与选择分开上报，沿用已计算的禁用状态，避免悬停反复调用禁用规则。 */
function onCellHover(date: Date | null, side: PanelSide) {
  range.setHover(date);
  const unit = props.type.startsWith("year") ? "year"
    : props.type.startsWith("month") ? "month"
      : props.type.startsWith("quarter") ? "quarter" : "date";
  if (!date || props.disabled || currentView.value !== unit) {
    emit("hover-change", null);
    return;
  }
  const candidate = parseValue(formatDate(date))!;
  if (props.type === "week") {
    emit("hover-change", [weekStartOf(date), weekEndOf(date)]);
  } else if (isRange.value) {
    let start = side === "right" ? range.start.value ?? new Date()
      : range.start.value && !range.end.value ? range.start.value : date;
    let end = side === "right" || (range.start.value && !range.end.value) ? date : null;
    if (end && end < start) [start, end] = [end, start];
    if (props.type === "weekrange") {
      start = weekStartOf(start);
      if (end) end = weekEndOf(end);
    }
    emit("hover-change", [parseValue(formatDate(start))!, end ? parseValue(formatDate(end, "end")) : null]);
  } else {
    emit("hover-change", candidate);
  }
}

// 翻页、切换视图或禁用面板后，旧网格的候选日期立即失效。
watch([currentView, nav.leftYear, nav.leftMonth, nav.leftPage, nav.rightYear, nav.rightMonth, nav.rightPage, () => props.disabled], () => onCellHover(null, "left"));

// --- 选中判定 ---

/** 该季度是否为选中项（范围模式下仅首尾两端为选中项） */
function isQuarterActive(q: number, year: number) {
  // 整面板禁用：不显示选中 / 范围高亮，所有格统一走禁用样式
  if (props.disabled) return false;
  const hit = (d: Date | null) => !!d && d.getFullYear() === year && quarterOf(d) === q;

  if (props.type === "quarter") return hit(selectedDate.value);
  if (props.type === "quarters") {
    return ((model.value as any[]) || []).some((v) =>
      hit(v instanceof Date ? v : parseValue(v)),
    );
  }
  return hit(range.start.value) || hit(range.end.value);
}

/** 该季度是否落在范围内（含首尾，首尾由模板优先取选中样式） */
function isQuarterInRange(q: number, year: number) {
  if (props.disabled) return false;
  const start = range.start.value;
  const end = range.previewEnd.value;
  if (props.type !== "quarterrange" || !start || !end) return false;
  const t = quarterStartDate(year, q).getTime();
  const min = Math.min(start.getTime(), end.getTime());
  const max = Math.max(start.getTime(), end.getTime());
  return t >= min && t <= max;
}

/**
 * 年 / 月 / 季度范围端点的封口方向：'start' 为范围最小端、'end' 为最大端，
 * 'both' 表示起止落在同一格（保留完整圆角），null 为非端点或非对应范围类型。
 * 端点内侧的圆角要压平（yearMonthRangeStart / yearMonthRangeEnd），
 * 才能与中间项的直带无缝相接——带子整体轮廓与日期网格的范围带对齐。
 */
function yearMonthRangeCap(
  kind: "year" | "month" | "quarter",
  value: number,
  year: number,
): "start" | "end" | "both" | null {
  if (props.disabled) return null;
  const start = range.start.value;
  const end = range.previewEnd.value;
  if (!start || !end) return null;
  let t: number;
  let a: number;
  let b: number;
  if (kind === "year") {
    if (props.type !== "yearrange") return null;
    t = value;
    a = start.getFullYear();
    b = end.getFullYear();
  } else if (kind === "month") {
    if (props.type !== "monthrange") return null;
    t = new Date(year, value - 1, 1).getTime();
    a = new Date(start.getFullYear(), start.getMonth(), 1).getTime();
    b = new Date(end.getFullYear(), end.getMonth(), 1).getTime();
  } else {
    if (props.type !== "quarterrange") return null;
    t = quarterStartDate(year, value).getTime();
    a = quarterStartDate(start.getFullYear(), quarterOf(start)).getTime();
    b = quarterStartDate(end.getFullYear(), quarterOf(end)).getTime();
  }
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  if (t === min && t === max) return "both";
  if (t === min) return "start";
  if (t === max) return "end";
  return null;
}

function isYearActive(y: number) {
  // 整面板禁用：不显示选中 / 范围高亮，所有格统一走禁用样式
  if (props.disabled) return false;
  if (props.type === "year") return selectedDate.value?.getFullYear() === y;
  if (props.type === "years") {
    return ((model.value as any[]) || []).some((v) => {
      const date = v instanceof Date ? v : parseValue(v);
      return date?.getFullYear() === y;
    });
  }
  if (props.type === "yearrange")
    return range.start.value?.getFullYear() === y || range.end.value?.getFullYear() === y;
  return false;
}

function isYearInRange(y: number) {
  if (props.disabled) return false;
  const start = range.start.value;
  const end = range.previewEnd.value;
  if (props.type === "yearrange" && start && end) {
    const min = Math.min(start.getFullYear(), end.getFullYear());
    const max = Math.max(start.getFullYear(), end.getFullYear());
    return y >= min && y <= max;
  }
  return false;
}

function isMonthActive(m: number, year: number) {
  // 整面板禁用：不显示选中 / 范围高亮，所有格统一走禁用样式
  if (props.disabled) return false;
  if (props.type === "month") {
    return (
      selectedDate.value?.getFullYear() === year && selectedDate.value?.getMonth() === m - 1
    );
  }
  if (props.type === "months") {
    return ((model.value as any[]) || []).some((v) => {
      const date = v instanceof Date ? v : parseValue(v);
      return date?.getFullYear() === year && date?.getMonth() === m - 1;
    });
  }
  if (props.type === "monthrange") {
    return (
      isSameDate(range.start.value, new Date(year, m - 1, 1)) ||
      isSameDate(range.end.value, new Date(year, m - 1, 1))
    );
  }
  return false;
}

function isMonthInRange(m: number, year: number) {
  if (props.disabled) return false;
  const start = range.start.value;
  const end = range.previewEnd.value;
  if (props.type === "monthrange" && start && end) {
    const t = new Date(year, m - 1, 1).getTime();
    const min = Math.min(start.getTime(), end.getTime());
    const max = Math.max(start.getTime(), end.getTime());
    return t >= min && t <= max;
  }
  return false;
}

function isDateActive(d: Date) {
  // 整面板禁用：不显示选中 / 范围高亮，所有格统一走禁用样式
  if (props.disabled) return false;
  if (props.type === "date" || props.type === "datetime") {
    return isSameDate(selectedDate.value, d);
  }
  if (props.type === "dates") {
    return selectedDayKeys.value.has(dayKey(d));
  }
  if (props.type === "week" || isRange.value) {
    return (
      d.toDateString() === range.start.value?.toDateString() ||
      d.toDateString() === range.end.value?.toDateString()
    );
  }
  return false;
}

// --- 绑定值与 defaultValue ---

/** defaultValue 的单项转为日期：数字按时间戳，字符串按 valueFormat 解析，不匹配时按常规日期格式兜底 */
function toDefaultDate(v: unknown): Date | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v === "number") return Number.isNaN(v) ? null : new Date(v);
  const d = parseValue(v);
  if (d) return new Date(d);
  const fallback = dayjs(v as string);
  return fallback.isValid() ? fallback.toDate() : null;
}

/** defaultValue 的第 index 项：第一项定位左面板（单面板即唯一面板），第二项在取消联动时定位右面板 */
function defaultDate(index: number): Date | null {
  const list = Array.isArray(props.defaultValue) ? props.defaultValue : [props.defaultValue];
  return toDefaultDate(list[index]);
}

/** 绑定值里是否没有任何日期：null、空串、空数组或 ["", ""] 都算未选 */
function isValueEmpty() {
  const v = model.value;
  if (Array.isArray(v)) return !v.some((item) => parseValue(item));
  return !parseValue(v);
}

/**
 * 根据 modelValue 初始化状态：先整体复位（含悬停与时分秒），再解析，
 * 绑定值变成空数组或缺终点时不会残留旧的选中状态
 */
function initFromValue() {
  selectedDate.value = null;
  range.reset();
  selectedHour.value = selectedMinute.value = selectedSecond.value = 0;
  selectedHour2.value = selectedMinute2.value = selectedSecond2.value = 0;
  // 绑定值里第一个能解析的日期决定面板定位
  let focusDate: Date | null = null;
  if (model.value) {
    if (isRange.value && Array.isArray(model.value)) {
      const [start, end] = model.value;
      const d1 = start ? parseValue(start) : null;
      const d2 = end ? parseValue(end) : null;
      range.setRange(d1, d2);
      if (d1) {
        selectedHour.value = d1.getHours();
        selectedMinute.value = d1.getMinutes();
        selectedSecond.value = d1.getSeconds();
        focusDate = d1;
      }
      if (d2) {
        selectedHour2.value = d2.getHours();
        selectedMinute2.value = d2.getMinutes();
        selectedSecond2.value = d2.getSeconds();
      }
    } else if (isMultiple.value && Array.isArray(model.value)) {
      focusDate = parseValue(model.value[0]);
    } else {
      const d = parseValue(model.value);
      if (d) {
        selectedDate.value = d;
        selectedHour.value = d.getHours();
        selectedMinute.value = d.getMinutes();
        selectedSecond.value = d.getSeconds();
        focusDate = d;
      }
    }
  }
  // 绑定值里没有日期时按 defaultValue 定位视图；它只决定面板显示哪个月 / 年，不写入绑定值
  const firstDefault = isValueEmpty() ? defaultDate(0) : null;
  nav.focus(focusDate ?? firstDefault);
  if (focusDate || firstDefault) viewSettled.value = true;
  nav.syncRight(range.end.value);
  if (firstDefault) {
    const second = defaultDate(1);
    if (second) nav.placeRight(second);
  }
}

// --- 交互 ---

/** 标题点击切换视图；整面板禁用时不响应 */
function switchView(view: ViewType) {
  if (props.disabled) return;
  range.clearHover();
  nav.switchView(view);
}

/** 点击头部「时间」段展开时间选择；整面板禁用时不响应 */
function openTime(toggle: () => void) {
  if (props.disabled) return;
  toggle();
}

function handleShortcut(s: any) {
  if (props.disabled) return;
  const value = typeof s.value === "function" ? s.value() : s.value;

  if (Array.isArray(value)) {
    range.setRange(value[0], value[1]);
    const val = [formatDate(value[0]), formatDate(value[1])];
    model.value = val;
    emitCalendarChange();
    emit("change", val);
  } else {
    selectedDate.value = value;
    nav.showMonthOf(value);
    const val = formatDate(value);
    model.value = val;
    emit("change", val);
  }
}

/**
 * 清空选中值：范围与多选类型回到空数组，其余回到空字符串。
 * 清空前本有值才抛 change，最后总会抛 clear。
 */
function clear() {
  const had = isRange.value || isMultiple.value
    ? Array.isArray(model.value) && model.value.some(Boolean)
    : !!model.value;
  selectedDate.value = null;
  range.reset();
  const val = isRange.value || isMultiple.value ? [] : "";
  model.value = val;
  if (had) emit("change", val);
  emit("clear");
}

// --- 底部「今天」栏 ---
const yearTypes = ["year", "years", "yearrange"];
const monthTypes = ["month", "months", "monthrange"];

/** 按类型取文案：选中的是当前时间所在的那一个单位，文案随单位走 */
const todayText = computed(() => {
  const type = props.type as string;
  if (type === "datetime") return "此刻";
  if (isWeekUnit.value) return "本周";
  if (monthTypes.includes(type)) return "本月";
  if (yearTypes.includes(type)) return "今年";
  if (isQuarterType.value) return "本季度";
  return "今天";
});

/** 取当前日期在日历网格中的格子，点击「今天」时交给 selectDay */
function todayCell(now: Date): CalDay | undefined {
  return getBaseCalendarDays(now.getFullYear(), now.getMonth()).find(
    (d) => d.isCurrentMonth && d.date.getDate() === now.getDate(),
  );
}

/**
 * 「今天」是否不可点：整面板禁用，或当前时间所在单位被禁用。
 * 日期类型只判定当天这一格，不生成整月网格；
 * datetime 另外校验当前时分秒是否落在 disabledHours / disabledMinutes / disabledSeconds 里。
 */
function isTodayDisabledAt(now: Date) {
  if (props.disabled) return true;
  const y = now.getFullYear();
  const type = props.type as string;
  if (yearTypes.includes(type)) return isYearDisabled(y);
  if (monthTypes.includes(type)) return isMonthDisabled(now.getMonth() + 1, y);
  if (isQuarterType.value) return isQuarterDisabled(quarterOf(now), y);
  if (isDayBlocked(new Date(y, now.getMonth(), now.getDate()))) return true;
  if (type === "datetime") {
    const h = now.getHours();
    const m = now.getMinutes();
    if (props.disabledHours?.()?.includes(h)) return true;
    if (props.disabledMinutes?.(h)?.includes(m)) return true;
    if (props.disabledSeconds?.(h, m)?.includes(now.getSeconds())) return true;
  }
  return false;
}

/** 底部栏的置灰样式：只随日期与禁用规则重算，范围悬停不影响；点击时另按点击时刻重新判定 */
const isTodayDisabled = computed(() => !today.value || isTodayDisabledAt(today.value));

/**
 * 选中当前时间所在的日 / 周 / 月 / 季度 / 年，并把视图拉回当前年月。
 * - 单值与按周：走各自的 select 方法，抛出 update:modelValue 与 change
 * - datetime：日期取今天，时分秒取此刻
 * - 多选：只追加不移除，今天已在选中集合里时不做处理
 * - 范围：起止都落在当前单位上，一次抛出完整范围；datetimerange 起止时间为 00:00:00 与 23:59:59
 */
function selectToday() {
  // 用同一时刻判定与取值：面板常驻跨过零点后，缓存的 isTodayDisabled 仍是前一天的结果
  const now = new Date();
  if (isTodayDisabledAt(now)) return;
  const y = now.getFullYear();
  const m = now.getMonth();
  const q = quarterOf(now);
  const type = props.type as string;

  // 视图回到当前年月，选中结果才看得见；取消联动时右面板也回到紧跟左侧的位置，不停留在用户翻到的远处
  range.clearHover();
  nav.resetView();
  nav.focus(now);
  nav.realignRight(range.end.value);

  if (isDual.value) {
    const unitStart = () => {
      if (type === "yearrange") return new Date(y, 0, 1);
      if (type === "monthrange") return new Date(y, m, 1);
      if (type === "quarterrange") return quarterStartDate(y, q);
      return new Date(y, m, now.getDate());
    };
    // 周范围起止取本周的周日与周六，与点选时的吸附一致
    if (type === "weekrange") range.setRange(weekStartOf(now), weekEndOf(now));
    else range.setRange(unitStart(), unitStart());
    if (hasTime.value) {
      selectedHour.value = 0;
      selectedMinute.value = 0;
      selectedSecond.value = 0;
      selectedHour2.value = 23;
      selectedMinute2.value = 59;
      selectedSecond2.value = 59;
    }
    commitRange();
    return;
  }

  if (yearTypes.includes(type)) {
    if (type === "years" && isYearActive(y)) return;
    selectYear(y);
    return;
  }
  if (monthTypes.includes(type)) {
    if (type === "months" && isMonthActive(m + 1, y)) return;
    selectMonth(m + 1, y);
    return;
  }
  if (isQuarterType.value) {
    if (type === "quarters" && isQuarterActive(q, y)) return;
    selectQuarter(q, y);
    return;
  }

  const cell = todayCell(now);
  if (!cell) return;
  if (type === "dates" && isDateActive(cell.date)) return;
  if (type === "datetime") {
    selectedHour.value = now.getHours();
    selectedMinute.value = now.getMinutes();
    selectedSecond.value = now.getSeconds();
  }
  selectDay(cell);
}

/** 只定位面板，不改变选中集合，供外部输入与多选追加共用。 */
function focusDate(date: Date) {
  if (props.disabled || Number.isNaN(date.getTime())) return;
  nav.resetView();
  nav.focus(date);
  nav.realignRight(range.end.value);
  viewSettled.value = true;
}

defineExpose({
  /** 清空选中值，触发 update:modelValue、change（清空前有值时）与 clear */
  clear,
  /** 定位到日期所在的月份或年份，不提交绑定值。 */
  focusDate,
});

// --- 模板辅助 ---

/** 按起止角色读写头部时间：start 对应左侧（或单面板的第一段），end 对应右侧 */
function getTime(role: TimeRole): string {
  return role === "start" ? timeModel1.value : timeModel2.value;
}
function setTime(role: TimeRole, v: string | string[]) {
  const val = Array.isArray(v) ? (v[0] ?? "") : v;
  if (role === "start") timeModel1.value = val;
  else timeModel2.value = val;
}
function getDisplayDate(role: TimeRole): string {
  return role === "start" ? displayDate1.value : displayDate2.value;
}

/** 42 格日历按 7 格一行切开，便于在每行前插入周数 */
function chunkWeeks<T extends CalDay>(days: T[]): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
  return rows;
}

/**
 * 面板描述：单面板只有 left，双面板为 [left, right]。
 * 模板对每一侧渲染同一套结构，差异（数据源、翻页按钮的显隐与禁用、头部时间段）都收在这里；
 * 只为当前视图准备数据：日期视图给 rows，年 / 月 / 季度视图给 units
 */
const panels = computed(() => nav.headers.value.map((header) => {
  const isLeft = header.side === "left";
  return {
    ...header,
    // 单面板的 datetimerange 两段时间都放在唯一的头部里
    times: (isLeft ? (showDual.value || !isDual.value || !hasTime.value ? ["start"] : ["start", "end"]) : ["end"]) as TimeRole[],
    rows: isUnitView.value ? [] : chunkWeeks((isLeft ? calendarDays : calendarDays2).value),
    units: isUnitView.value ? (isLeft ? leftUnits : rightUnits).value : [],
  };
}));

let todayTimer: ReturnType<typeof setTimeout> | undefined;
function refreshToday() {
  today.value = new Date();
  clearTimeout(todayTimer);
  const now = today.value;
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  todayTimer = setTimeout(refreshToday, Math.max(1, tomorrow.getTime() - now.getTime()));
}
onMounted(() => {
  refreshToday();
  if (isValueEmpty()) {
    const first = defaultDate(0);
    if (first) {
      nav.showMonthOf(first);
    } else {
      const now = today.value!;
      nav.focus(now);
      selectedHour.value = selectedHour2.value = now.getHours();
      selectedMinute.value = selectedMinute2.value = now.getMinutes();
      nav.syncRight(range.end.value);
    }
  }
  viewSettled.value = true;
  document.addEventListener('visibilitychange', refreshToday);
});
onBeforeUnmount(() => { clearTimeout(todayTimer); document.removeEventListener('visibilitychange', refreshToday); });
watch(model, initFromValue, { immediate: true });
watch(
  () => props.type,
  () => {
    nav.resetView();
    nav.realignRight(range.end.value);
  },
);
// 联动方式或面板数量变化：右面板重新对齐到左侧
watch(
  () => [props.unlinkPanels, props.singlePanel],
  () => nav.realignRight(range.end.value),
);
// 父组件内联传数组时每次渲染都是新引用，按解析后的时间戳判断 defaultValue 是否真的变化
const defaultValueKey = computed(() => {
  const list = Array.isArray(props.defaultValue) ? props.defaultValue : [props.defaultValue];
  return list.map((v) => toDefaultDate(v)?.getTime() ?? "").join("|");
});
// 已有选中值时视图跟随选中值，defaultValue 变化不打断
watch(defaultValueKey, () => {
  if (isValueEmpty()) initFromValue();
});
</script>

<template>
  <div :class="ui.wrapper({ class: props.class })">
    <div :class="ui.container()">
      <!-- 快捷选项侧栏 -->
      <div v-if="shortcuts.length" :class="ui.shortcuts()">
        <button v-for="(s, i) in shortcuts" :key="i" type="button" :disabled="disabled" :class="ui.shortcut()" @click.stop="handleShortcut(s)">
          {{ s.text }}
        </button>
      </div>

      <!-- 主内容区：定位到实际月份之前先隐藏（只占位），服务端首屏不露出固定基准月 -->
      <div :class="ui.content()" :style="viewSettled ? undefined : { visibility: 'hidden' }">
        <!-- 左侧 / 单面板；范围类型双面板时再渲染右侧。两侧结构一致，差异（数据源、翻页按钮）收在 panels 里 -->
        <div v-for="p in panels" :key="p.side" :class="p.side === 'left' ? ui.panelLeft() : ui.panelRight()">
          <!-- 头部日期 / 时间：单面板的 datetimerange 起止两段都放在唯一的面板里 -->
          <template v-if="hasTime">
            <RebornTimePicker
              v-for="t in p.times"
              :key="t"
              :model-value="getTime(t)"
              :format="timeFormat"
              :size="size"
              :color="color"
              :disabled-hours="disabledHours"
              :bordered="false"
              :clearable="false"
              :disabled-minutes="disabledMinutes"
              :disabled-seconds="disabledSeconds"
              :disabled-milliseconds="disabledMilliseconds"
              :show-arrow="false"
              :trigger-ui="{ dropdown: DATE_PANEL_NESTED_OVERLAY_CLASS }"
              @update:model-value="setTime(t, $event)"
            >
              <template #default="{ toggle }">
                <div :class="ui.dateTimeHeader()" @click.stop>
                  <div
                    :class="[ui.dateTimeSegment(), ui.dateTimeSegmentDisabled()]"
                    @click="switchView('date')"
                  >
                    {{ getDisplayDate(t) }}
                  </div>
                  <div :class="ui.dateTimeSeparator()">/</div>
                  <div :class="[ui.dateTimeSegment(), ui.dateTimeSegmentActive()]" @click="openTime(toggle)">
                    {{ getTime(t) }}
                  </div>
                </div>
              </template>
            </RebornTimePicker>
          </template>

          <DatePickerHeader
            :panel="p"
            :view="currentView"
            :ui="ui"
            @navigate="(direction, unit) => nav.navigate(p.side, direction, unit)"
            @switch-view="switchView"
          >
            <template v-if="$slots['prev-year']" #prev-year><slot name="prev-year" /></template>
            <template v-if="$slots['next-year']" #next-year><slot name="next-year" /></template>
            <template v-if="$slots['prev-month']" #prev-month><slot name="prev-month" /></template>
            <template v-if="$slots['next-month']" #next-month><slot name="next-month" /></template>
          </DatePickerHeader>

          <!-- 年 / 月 / 季度视图：翻页单位为十年或一年，按钮走 prev-year / next-year 插槽；单元格状态由 panels 预先算好 -->
          <DatePickerUnitGrid
            v-if="isUnitView"
            :kind="unitKind"
            :cells="p.units"
            :ui="ui"
            :highlight-today="highlightToday"
            @select="(cell) => selectUnit(p, cell)"
            @hover="(date) => onCellHover(date, p.side)"
          >
            <!-- 未传 default 插槽时由网格显示「2026」「3月」「第1季度」这类默认文本 -->
            <template v-if="$slots.default" #default="cell">
              <slot v-bind="cell" />
            </template>
          </DatePickerUnitGrid>

          <!-- 日期视图：外侧双箭头跨年、内侧单箭头跨月 -->
          <DatePickerDateGrid
            v-else
            :rows="p.rows"
            :show-week="showWeek"
            :ui="ui"
            :highlight-today="highlightToday"
            @select="(day) => selectDay(day, p.side)"
            @hover="(date) => onCellHover(date, p.side)"
          >
            <template #default="cell">
              <slot v-bind="cell">{{ cell.text }}</slot>
            </template>
          </DatePickerDateGrid>
        </div>
      </div>
    </div>

    <!-- 底部「今天」栏：禁用样式作为 footer 的 class 传入，与 color 变体的主题色在同一次调用里合并 -->
    <div
      v-if="showToday"
      :class="ui.footer({ class: isTodayDisabled ? ui.footerDisabled() : '' })"
      @click.stop="selectToday"
    >
      {{ todayText }}
    </div>
  </div>
</template>
