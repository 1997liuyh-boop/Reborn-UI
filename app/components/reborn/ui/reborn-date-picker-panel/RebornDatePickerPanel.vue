<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { TimeRangeRole } from "../reborn-time-picker/reborn-time-panel.config";
import type {
  CalDay,
  DatePickerActiveType,
  DatePickerCell,
  datePickerPanelColors,
  datePickerPanelSizes,
  DatePickerType,
  ViewType,
} from "./reborn-date-picker-panel.config";
import dayjs from "dayjs";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import { computed, ref, watch } from "vue";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import { RebornTimePicker } from "../reborn-time-picker";
import theme, { DATE_PANEL_NESTED_OVERLAY_CLASS } from "./reborn-date-picker-panel.config";

const props = withDefaults(defineProps<DatePickerPanelProps>(), {
  modelValue: "",
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
  valueFormat: "",
  showWeekNumber: false,
  unlinkPanels: false,
  singlePanel: false,
  showToday: false,
});
const emit = defineEmits<{
  (e: "update:modelValue", value: any): void;
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
}>();
dayjs.extend(customParseFormat);
// 季度类型的 valueFormat 支持 Q 令牌（如 YYYY-[Q]Q），Q 由 advancedFormat 提供
dayjs.extend(advancedFormat);

const b = tv(theme);

/**
 * 组件属性定义
 */
export interface DatePickerPanelProps {
  modelValue?: any; // 绑定值
  type?: DatePickerType; // 选择器类型：date, datetime, year, month 等
  start?: string; // 可选范围开始时间
  end?: string; // 可选范围结束时间
  disabledMethod?: (date: Date, unit: "year" | "month" | "quarter" | "week" | "date") => boolean; // 逐项判定是否禁用，返回 true 即不可选；unit 标识当前判定粒度——日期格传 date（week 类型传 week），年 / 月 / 季度视图分别传 year / month / quarter，同一个方法可按粒度限制任意档位
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
  showWeekNumber?: boolean; // 日期视图左侧显示 ISO 周数（week 类型本身按周选择，不生效）
  unlinkPanels?: boolean; // 范围选择时取消两个面板之间的联动，左右面板各自翻页
  singlePanel?: boolean; // 范围选择时只显示一个面板
  showToday?: boolean; // 面板底部显示「今天」按钮：点击选中当前时间所在的日 / 周 / 月 / 季度 / 年，文案随类型变为今天、此刻（datetime）、本周、本月、本季度、今年
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

// --- 组件状态标识 ---
const isMultiple = computed(() =>
  ["years", "months", "quarters", "dates"].includes(props.type as string),
); // 是否为多选模式
const isRange = computed(() =>
  ["yearrange", "monthrange", "quarterrange", "daterange", "datetimerange", "week"].includes(
    props.type as string,
  ),
); // 是否为范围选择模式
const isDual = computed(() =>
  ["yearrange", "monthrange", "quarterrange", "daterange", "datetimerange"].includes(
    props.type as string,
  ),
); // 是否显示双面板
const isQuarterType = computed(() =>
  ["quarter", "quarters", "quarterrange"].includes(props.type as string),
); // 是否为季度类型
const hasTime = computed(() => ["datetime", "datetimerange"].includes(props.type as string)); // 是否包含时间选择
const showDual = computed(() => isDual.value && !props.singlePanel); // 实际是否渲染双面板：singlePanel 时范围类型也只出一个面板
const isUnlinked = computed(() => showDual.value && props.unlinkPanels); // 左右面板是否各自翻页
const showWeek = computed(() => props.showWeekNumber && props.type !== "week"); // 是否显示周数列

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
  const styles = b({
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
const today = new Date();
const viewYear = ref(today.getFullYear()); // 当前视觉年份
const viewMonth = ref(today.getMonth()); // 当前视觉月份 (0-11)

// 第二面板取消联动时的独立状态：仅 unlinkPanels 生效时读取，联动时由左侧推算
const rightYear = ref(viewYear.value);
const rightMonth = ref(viewMonth.value);

// 联动时右面板紧跟左面板：日期类型隔一个月，月 / 季度类型隔一年
function linkedYear2(): number {
  if (props.type === "monthrange" || props.type === "quarterrange") return viewYear.value + 1;
  if (viewMonth.value === 11) return viewYear.value + 1;
  return viewYear.value;
}
function linkedMonth2(): number {
  if (props.type === "monthrange") return viewMonth.value;
  if (viewMonth.value === 11) return 0;
  return viewMonth.value + 1;
}

// 第二面板状态：联动时推算，取消联动时读独立状态
const viewYear2 = computed(() => (isUnlinked.value ? rightYear.value : linkedYear2()));
const viewMonth2 = computed(() => (isUnlinked.value ? rightMonth.value : linkedMonth2()));

const currentView = ref<ViewType>("date"); // 当前视图：year, month, date, time

// 获取初始视图类型
function getInitialView(): ViewType {
  if (["year", "years", "yearrange"].includes(props.type)) return "year";
  if (["month", "months", "monthrange"].includes(props.type)) return "month";
  if (isQuarterType.value) return "quarter";
  return "date";
}
currentView.value = getInitialView();

// 选中的数据状态
const selectedDate = ref<Date | null>(null); // 单个选中日期
const selectedDates = ref<Date[]>([]); // 多个选中日期
const rangeStart = ref<Date | null>(null); // 范围开始
const rangeEnd = ref<Date | null>(null); // 范围结束
/** 范围预览：已选起点、尚未选终点时，鼠标悬停的那一格 */
const hoverDate = ref<Date | null>(null);
/**
 * 用于绘制范围带子的终点：已选终点优先；只选了起点时取悬停格，
 * 让用户在点下终点之前就能看到这次会覆盖哪些格子。选中态（isXxxActive）仍只认真实终点。
 */
const previewEnd = computed<Date | null>(() => {
  if (rangeEnd.value) return rangeEnd.value;
  if (!isRange.value || props.type === "week" || !rangeStart.value) return null;
  return hoverDate.value;
});

const selectedHour = ref(today.getHours()); // 选中的小时
const selectedMinute = ref(today.getMinutes()); // 选中的分钟
const selectedSecond = ref(0); // 选中的秒

const timeFormat = computed(() => {
  if (props.valueFormat.includes("SSS")) return "HH:mm:ss.SSS";
  return "HH:mm:ss";
});

const displayDate1 = computed(() => {
  const d = isRange.value ? rangeStart.value : selectedDate.value;
  return d ? dayjs(d).format("YYYY-MM-DD") : "选择日期";
});

const displayTime1 = computed(() => {
  const d = isRange.value ? rangeStart.value : selectedDate.value;
  if (!d) return "选择时间";
  return dayjs(d)
    .hour(selectedHour.value)
    .minute(selectedMinute.value)
    .second(selectedSecond.value)
    .format(timeFormat.value);
});

const displayDate2 = computed(() => {
  if (!isRange.value) return "";
  return rangeEnd.value ? dayjs(rangeEnd.value).format("YYYY-MM-DD") : "选择日期";
});

const displayTime2 = computed(() => {
  if (!isRange.value) return "";
  if (!rangeEnd.value) return "选择时间";
  return dayjs(rangeEnd.value)
    .hour(selectedHour2.value)
    .minute(selectedMinute2.value)
    .second(selectedSecond2.value)
    .format(timeFormat.value);
});

const selectedHour2 = ref(today.getHours());
const selectedMinute2 = ref(today.getMinutes());
const selectedSecond2 = ref(0);

const timeModel1 = computed({
  get: () => displayTime1.value,
  set: (val) => {
    const d = dayjs(val, timeFormat.value);
    if (d.isValid()) {
      selectedHour.value = d.hour();
      selectedMinute.value = d.minute();
      selectedSecond.value = d.second();

      if (isRange.value) {
        if (!rangeStart.value) {
          const today = new Date();
          rangeStart.value = today;
          rangeEnd.value = today;
          selectedHour2.value = d.hour();
          selectedMinute2.value = d.minute();
          selectedSecond2.value = d.second();
        }
        const newVal = [formatDate(rangeStart.value), formatDate(rangeEnd.value, "end")];
        emit("update:modelValue", newVal);
      } else {
        if (!selectedDate.value) {
          selectedDate.value = new Date();
        }
        emit("update:modelValue", formatDate(selectedDate.value));
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
        if (!rangeStart.value) {
          rangeStart.value = new Date();
        }
        if (!rangeEnd.value) {
          rangeEnd.value = new Date();
        }
        const newVal = [formatDate(rangeStart.value), formatDate(rangeEnd.value, "end")];
        emit("update:modelValue", newVal);
      }
    }
  },
});

const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

/**
 * 解析输入值为 Date 对象
 */
function parseValue(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v;

  // dayjs 的 customParseFormat 不认 Q 令牌，季度值（如 "2024-Q2"）自行取出年份与季号
  if (props.valueFormat && props.valueFormat.includes("Q")) {
    const m = String(v).match(/(\d{4})\D*([1-4])/);
    if (m) return quarterStartDate(Number(m[1]), Number(m[2]));
  }

  const d = props.valueFormat ? dayjs(v, props.valueFormat) : dayjs(v);
  return d.isValid() ? d.toDate() : null;
}

/** 季度的起始日期：第 q 季度从 (q-1)*3 月 1 号开始 */
function quarterStartDate(year: number, q: number): Date {
  return new Date(year, (q - 1) * 3, 1);
}

/** 日期落在第几季度（1 ~ 4） */
function quarterOf(d: Date): number {
  return Math.floor(d.getMonth() / 3) + 1;
}

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

const hours = Array.from({ length: 24 }, (_, i) => i);
const minutes = Array.from({ length: 60 }, (_, i) => i);

const hourRef = ref<HTMLElement | null>(null);
const minuteRef = ref<HTMLElement | null>(null);

/**
 * 滚动时间列表到选中值
 */
function scrollToSelectedTime() {
  setTimeout(() => {
    if (hourRef.value) {
      const active = hourRef.value.querySelector(".bg-primary") as HTMLElement;
      if (active) hourRef.value.scrollTop = active.offsetTop - 100;
    }
    if (minuteRef.value) {
      const active = minuteRef.value.querySelector(".bg-primary") as HTMLElement;
      if (active) minuteRef.value.scrollTop = active.offsetTop - 100;
    }
  }, 0);
}

/**
 * 确认选中的时间
 */
function confirmTime() {
  currentView.value = "date";
}

/**
 * 生成日历日期列表
 */
function getCalendarDays(y: number, m: number): CalDay[] {
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

  const startLimit = props.start ? new Date(props.start) : null;
  const endLimit = props.end ? new Date(props.end) : null;

  for (let i = 0; i < totalCells; i++) {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);

    const isCurrentMonth = d.getMonth() === m && d.getFullYear() === y;
    const isToday = d.toDateString() === today.toDateString();
    const isSelected = selectedDate.value
      ? d.toDateString() === selectedDate.value.toDateString()
      : false;

    // 被规则排除：越界或 disabledMethod 命中（week 类型按 week 粒度询问）
    let isBlocked = false;
    if (startLimit && d < startLimit) isBlocked = true;
    if (endLimit && d > endLimit) isBlocked = true;
    if (
      !isBlocked &&
      props.disabledMethod?.(new Date(d), props.type === "week" ? "week" : "date")
    ) {
      isBlocked = true;
    }

    // 整面板禁用：每一格都视为被排除，统一走禁用样式与灰带
    if (props.disabled) isBlocked = true;

    // ⚠️ 根因：此前非本月的补位格也算作禁用，灰带 + 禁用光标 + 拦截点击，与真正被规则排除的日期无从区分。
    // ✅ 修复：只有被规则排除的格子才禁用；补位格只调淡文字（dayOutside），照常可点。
    const isDisabled = isBlocked;

    // 范围端点按天比较：终点可能是悬停预览格且早于起点，先排序；
    // 起止带时分（datetimerange）时也不会因 00:00 早于起点而把首格漏出带子
    const dayKey = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const t = dayKey(d);
    const a = rangeStart.value ? dayKey(rangeStart.value) : null;
    const b = previewEnd.value ? dayKey(previewEnd.value) : null;
    const lo = a !== null && b !== null ? Math.min(a, b) : a;
    const hi = a !== null && b !== null ? Math.max(a, b) : null;
    const isRangeStart = lo !== null && t === lo;
    const isRangeEnd = hi !== null && t === hi;
    const isInRange = lo !== null && hi !== null && t >= lo && t <= hi;

    days.push({
      date: d,
      day: d.getDate(),
      isCurrentMonth,
      isToday,
      isSelected,
      isDisabled,
      isBlocked,
      isInRange,
      isRangeStart,
      isRangeEnd,
      // 禁用灰带：只有被规则排除的格子进灰带，连续格子的底色自然连成一条
      isDisabledBand: isBlocked,
    });
  }
  return days;
}

const calendarDays = computed(() => getCalendarDays(viewYear.value, viewMonth.value));
const calendarDays2 = computed(() => getCalendarDays(viewYear2.value, viewMonth2.value));

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

const currentYearDecade = computed(() => Math.floor(viewYear.value / 10) * 10);
const viewYearPageStart = ref(currentYearDecade.value);

// 右侧年份面板取消联动时的独立十年页起点；联动时恒为左侧 + 10
const rightYearPageStart = ref(viewYearPageStart.value + 10);
const viewYearPageStart2 = computed(() =>
  isUnlinked.value ? rightYearPageStart.value : viewYearPageStart.value + 10,
);

/** 年份是否禁用：start / end 越界，或 disabledMethod 按 year 粒度命中（以当年 1 月 1 日询问） */
function isYearDisabled(y: number): boolean {
  const start = props.start ? new Date(props.start).getFullYear() : 1970;
  const end = props.end ? new Date(props.end).getFullYear() : 2099;
  if (props.disabled) return true;
  return y < start || y > end || !!props.disabledMethod?.(new Date(y, 0, 1), "year");
}

/** 月份是否禁用：disabledMethod 按 month 粒度命中（以当月 1 日询问） */
function isMonthDisabled(m: number, yearContext?: number): boolean {
  if (props.disabled) return true;
  const y = yearContext ?? viewYear.value;
  return !!props.disabledMethod?.(new Date(y, m - 1, 1), "month");
}

/** 季度是否禁用：disabledMethod 按 quarter 粒度命中（以季度首日询问） */
function isQuarterDisabled(q: number, yearContext?: number): boolean {
  if (props.disabled) return true;
  const y = yearContext ?? viewYear.value;
  return !!props.disabledMethod?.(quarterStartDate(y, q), "quarter");
}

function getYearList(pageStart: number) {
  const years: { year: number; isDisabled: boolean }[] = [];

  for (let i = -1; i <= 10; i++) {
    const y = pageStart + i;
    years.push({
      year: y,
      isDisabled: isYearDisabled(y),
    });
  }
  return years;
}

const yearList = computed(() => getYearList(viewYearPageStart.value));
const yearList2 = computed(() => getYearList(viewYearPageStart2.value));

const monthList = computed(() => Array.from({ length: 12 }, (_, i) => i + 1));

const headerTitle = computed(() => {
  if (props.type === "yearrange")
    return `${viewYearPageStart.value} - ${viewYearPageStart.value + 9}`;
  return `${viewYearPageStart.value} - ${viewYearPageStart.value + 9}`; // Single panel or base
});
const headerTitle2 = computed(() => {
  return `${viewYearPageStart2.value} - ${viewYearPageStart2.value + 9}`;
});

// --- 翻页 ---
type PanelSide = "left" | "right";

/** 以「年」为最小单位的范围类型：左右面板各显示一整年 */
const isYearUnitRange = computed(() => ["monthrange", "quarterrange"].includes(props.type));

/**
 * 联动双面板的翻页步长倍数：两块面板一起平移一整屏，
 * 年视图 20 年、月 / 季度视图 2 年、日期视图 2 个月；
 * daterange 切到月 / 季度视图时左右同年，只平移 1 年，否则会跳过中间一年。
 * 单面板与取消联动时每次只走 1 个单位。
 */
function linkedStep(): number {
  if (!showDual.value || isUnlinked.value) return 1;
  if (
    (currentView.value === "month" || currentView.value === "quarter") &&
    !isYearUnitRange.value
  ) {
    return 1;
  }
  return 2;
}

/** 左面板按月平移，自动跨年 */
function shiftLeftMonth(delta: number) {
  const d = new Date(viewYear.value, viewMonth.value + delta, 1);
  viewYear.value = d.getFullYear();
  viewMonth.value = d.getMonth();
}

/** 右面板（取消联动时）按月平移，自动跨年 */
function shiftRightMonth(delta: number) {
  const d = new Date(rightYear.value, rightMonth.value + delta, 1);
  rightYear.value = d.getFullYear();
  rightMonth.value = d.getMonth();
}

/** 年月折算成连续序号，便于比较左右面板的先后与间距 */
function monthIndex(y: number, m: number): number {
  return y * 12 + m;
}

/**
 * 取消联动时左右面板能否再相互靠拢一步：靠拢后左侧仍须严格早于右侧。
 * unit 为 page 时按当前视图的翻页单位判断，为 year 时按跨年按钮判断（日期视图下间距须超过 12 个月）。
 */
function canConverge(unit: "page" | "year" = "page"): boolean {
  if (currentView.value === "year") return viewYearPageStart.value + 10 < rightYearPageStart.value;
  if (isYearUnitRange.value) return viewYear.value + 1 < rightYear.value;
  const gap = currentView.value === "date" && unit === "page" ? 1 : 12;
  return (
    monthIndex(viewYear.value, viewMonth.value) + gap <
    monthIndex(rightYear.value, rightMonth.value)
  );
}

/**
 * 取消联动时保证左面板严格早于右面板：以 fixed 一侧为准，把另一侧推到紧邻位置。
 * 下钻选年 / 选月会直接改写某一侧，可能越过另一侧，需要在改写后调用。
 */
function ensureOrder(fixed: PanelSide) {
  if (!isUnlinked.value) return;
  if (currentView.value === "year") {
    if (viewYearPageStart.value < rightYearPageStart.value) return;
    if (fixed === "left") rightYearPageStart.value = viewYearPageStart.value + 10;
    else viewYearPageStart.value = rightYearPageStart.value - 10;
    return;
  }
  if (isYearUnitRange.value) {
    if (viewYear.value < rightYear.value) return;
    if (fixed === "left") rightYear.value = viewYear.value + 1;
    else viewYear.value = rightYear.value - 1;
    return;
  }
  if (monthIndex(viewYear.value, viewMonth.value) < monthIndex(rightYear.value, rightMonth.value)) {
    return;
  }
  if (fixed === "left") {
    const d = new Date(viewYear.value, viewMonth.value + 1, 1);
    rightYear.value = d.getFullYear();
    rightMonth.value = d.getMonth();
  } else {
    const d = new Date(rightYear.value, rightMonth.value - 1, 1);
    viewYear.value = d.getFullYear();
    viewMonth.value = d.getMonth();
  }
}

/** 面板当前所示时间：年视图取十年页首年，其余取所示年月的 1 号 */
function panelDate(side: PanelSide): Date {
  if (side === "left") {
    if (currentView.value === "year") return new Date(viewYearPageStart.value, 0, 1);
    return new Date(viewYear.value, viewMonth.value, 1);
  }
  if (currentView.value === "year") return new Date(viewYearPageStart2.value, 0, 1);
  return new Date(viewYear2.value, viewMonth2.value, 1);
}

/** 抛出 panel-change：双面板回传左右两个日期，单面板回传一个 */
function emitPanelChange(mode: "month" | "year") {
  const date = showDual.value
    ? ([panelDate("left"), panelDate("right")] as [Date, Date])
    : panelDate("left");
  emit("panel-change", date, mode, currentView.value);
}

/**
 * 按方向平移一侧面板。unit 为 page 时按当前视图的翻页单位（十年 / 年 / 月），
 * 为 year 时固定跨一年（日期视图的双箭头）。
 */
function movePanel(side: PanelSide, dir: 1 | -1, unit: "page" | "year" = "page") {
  const step = unit === "year" || side === "right" ? dir : linkedStep() * dir;
  const view = currentView.value;
  if (view === "year") {
    if (side === "right") rightYearPageStart.value += 10 * step;
    else viewYearPageStart.value += 10 * step;
  } else if (view !== "date" || unit === "year") {
    if (side === "right") rightYear.value += step;
    else viewYear.value += step;
  } else if (side === "right") {
    shiftRightMonth(step);
  } else {
    shiftLeftMonth(step);
  }
  emitPanelChange(view === "date" && unit === "page" ? "month" : "year");
}

/**
 * 上一页。联动时两侧一起走；取消联动时右侧的后退受「不得追上左侧」约束。
 */
function prevPage(side: PanelSide = "left") {
  if (props.disabled) return;
  if (side === "right" && isUnlinked.value) {
    if (canConverge()) movePanel("right", -1);
    return;
  }
  movePanel("left", -1);
}

/**
 * 下一页。联动时两侧一起走；取消联动时左侧的前进受「不得追上右侧」约束。
 */
function nextPage(side: PanelSide = "left") {
  if (props.disabled) return;
  if (side === "right" && isUnlinked.value) {
    movePanel("right", 1);
    return;
  }
  if (isUnlinked.value && !canConverge()) return;
  movePanel("left", 1);
}

/** 日期视图的跨年翻页：联动时两个月份一起平移，月份不变只改年份 */
function prevYear(side: PanelSide = "left") {
  if (props.disabled) return;
  if (side === "right" && isUnlinked.value) {
    if (canConverge("year")) movePanel("right", -1, "year");
    return;
  }
  movePanel("left", -1, "year");
}

function nextYear(side: PanelSide = "left") {
  if (props.disabled) return;
  if (side === "right" && isUnlinked.value) {
    movePanel("right", 1, "year");
    return;
  }
  if (isUnlinked.value && !canConverge("year")) return;
  movePanel("left", 1, "year");
}

/** 范围类型点选后抛出 calendar-change：只选了起点时终点为 null；week 类型一次点选即成整周，不抛 */
function emitCalendarChange() {
  if (props.type === "week" || !rangeStart.value) return;
  emit("calendar-change", [
    new Date(rangeStart.value),
    rangeEnd.value ? new Date(rangeEnd.value) : null,
  ]);
}

/**
 * 选中某个日期
 */
function selectDay(day: CalDay, panel: "left" | "right" = "left") {
  if (day.isDisabled) return;

  // 单面板点中补位格时翻到该日期所在月份，选中结果才看得见（双面板的真实格子在另一侧，不翻页）
  if (!day.isCurrentMonth && !showDual.value) {
    viewYear.value = day.date.getFullYear();
    viewMonth.value = day.date.getMonth();
  }

  if (props.type === "week") {
    // 周选择模式：选中整周
    const d = new Date(day.date);
    const dayOfWeek = d.getDay();
    const start = new Date(d);
    start.setDate(d.getDate() - dayOfWeek);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    rangeStart.value = start;
    rangeEnd.value = end;
    const val = [formatDate(start), formatDate(end)];
    emit("update:modelValue", val);
    emit("change", val);
  } else if (props.type === "dates") {
    // 多选模式
    const current = (props.modelValue as any[]) || [];
    const idx = current.findIndex((v) => isSameDate(v, day.date));
    const newVal = [...current];
    if (idx > -1) newVal.splice(idx, 1);
    else newVal.push(formatDate(day.date));
    emit("update:modelValue", newVal);
  } else if (isRange.value) {
    // 范围选择模式
    if (panel === "right") {
      if (!rangeStart.value) {
        rangeStart.value = new Date();
      }
      rangeEnd.value = day.date;
      if (rangeEnd.value < rangeStart.value) {
        const temp = rangeStart.value;
        rangeStart.value = rangeEnd.value;
        rangeEnd.value = temp;
      }
    } else {
      if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
        rangeStart.value = day.date;
        rangeEnd.value = null;
      } else {
        if (day.date < rangeStart.value) {
          rangeEnd.value = rangeStart.value;
          rangeStart.value = day.date;
        } else {
          rangeEnd.value = day.date;
        }
      }
    }

    const val = [
      formatDate(rangeStart.value),
      rangeEnd.value ? formatDate(rangeEnd.value, "end") : "",
    ];
    emit("update:modelValue", val);
    emitCalendarChange();
    if (rangeStart.value && rangeEnd.value) emit("change", val);
  } else {
    // 单选模式
    selectedDate.value = day.date;
    const val = formatDate(day.date);
    emit("update:modelValue", val);
    emit("change", val);
  }
}

/**
 * 选中某个年份
 */
function selectYear(year: number, panel: "left" | "right" = "left") {
  // 禁用格不再靠 pointer-events-none 拦截（要显示 cursor-not-allowed），点击在此守卫
  if (isYearDisabled(year)) return;
  const d = new Date(year, 0, 1);

  if (props.type === "year") {
    selectedDate.value = d;
    const val = formatDate(d);
    emit("update:modelValue", val);
    emit("change", val);
    return;
  }

  if (props.type === "years") {
    const current = (props.modelValue as any[]) || [];
    const valStr = formatDate(d);
    const idx = current.findIndex((v) => {
      const dv = dayjs(v);
      return dv.isValid() && dv.year() === year;
    });
    const newVal = [...current];
    if (idx > -1) newVal.splice(idx, 1);
    else newVal.push(valStr);
    emit("update:modelValue", newVal);
    return;
  }

  if (props.type === "yearrange") {
    if (panel === "right") {
      if (!rangeStart.value) rangeStart.value = new Date();
      rangeEnd.value = d;
      if (rangeEnd.value < rangeStart.value) {
        const temp = rangeStart.value;
        rangeStart.value = rangeEnd.value;
        rangeEnd.value = temp;
      }
    } else {
      if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
        rangeStart.value = d;
        rangeEnd.value = null;
      } else {
        if (d < rangeStart.value) {
          rangeEnd.value = rangeStart.value;
          rangeStart.value = d;
        } else {
          rangeEnd.value = d;
        }
      }
    }
    const val = [
      formatDate(rangeStart.value),
      rangeEnd.value ? formatDate(rangeEnd.value, "end") : "",
    ];
    emit("update:modelValue", val);
    emitCalendarChange();
    if (rangeStart.value && rangeEnd.value) emit("change", val);
    return;
  }

  // 下钻到月 / 季度视图：取消联动时只改被点的那一侧
  currentView.value = isQuarterType.value ? "quarter" : "month";
  if (panel === "right" && isUnlinked.value) {
    rightYear.value = year;
    rightYearPageStart.value = Math.floor(year / 10) * 10;
    ensureOrder("right");
  } else {
    // 联动的月 / 季度范围右侧恒比左侧晚一年，点右侧的年份时左侧落到前一年
    viewYear.value =
      panel === "right" && showDual.value && isYearUnitRange.value ? year - 1 : year;
    viewYearPageStart.value = Math.floor(viewYear.value / 10) * 10;
    ensureOrder("left");
  }
  emitPanelChange("year");
}

/**
 * 选中某个月份
 */
function selectMonth(month: number, yearContext?: number, panel: "left" | "right" = "left") {
  if (isMonthDisabled(month, yearContext)) return;
  const targetYear = yearContext ?? viewYear.value;
  const d = new Date(targetYear, month - 1, 1);

  if (props.type === "month") {
    selectedDate.value = d;
    const val = formatDate(d);
    emit("update:modelValue", val);
    emit("change", val);
    return;
  }

  if (props.type === "months") {
    const current = (props.modelValue as any[]) || [];
    const valStr = formatDate(d);
    const idx = current.findIndex((v) => {
      const dv = dayjs(v);
      return dv.isValid() && dv.year() === targetYear && dv.month() === month - 1;
    });
    const newVal = [...current];
    if (idx > -1) newVal.splice(idx, 1);
    else newVal.push(valStr);
    emit("update:modelValue", newVal);
    return;
  }

  if (props.type === "monthrange") {
    if (panel === "right") {
      if (!rangeStart.value) rangeStart.value = new Date();
      rangeEnd.value = d;
      if (rangeEnd.value < rangeStart.value) {
        const temp = rangeStart.value;
        rangeStart.value = rangeEnd.value;
        rangeEnd.value = temp;
      }
    } else {
      if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
        rangeStart.value = d;
        rangeEnd.value = null;
      } else {
        if (d < rangeStart.value) {
          rangeEnd.value = rangeStart.value;
          rangeStart.value = d;
        } else {
          rangeEnd.value = d;
        }
      }
    }
    const val = [
      formatDate(rangeStart.value),
      rangeEnd.value ? formatDate(rangeEnd.value, "end") : "",
    ];
    emit("update:modelValue", val);
    emitCalendarChange();
    if (rangeStart.value && rangeEnd.value) emit("change", val);
    return;
  }

  // 下钻到日期视图：取消联动时只改被点的那一侧
  currentView.value = "date";
  if (panel === "right" && isUnlinked.value) {
    rightYear.value = targetYear;
    rightMonth.value = month - 1;
    ensureOrder("right");
  } else {
    // 联动的日期范围右侧恒比左侧晚一个月，点右侧的月份时左侧落到前一个月
    const leftDate = new Date(
      targetYear,
      panel === "right" && showDual.value ? month - 2 : month - 1,
      1,
    );
    viewYear.value = leftDate.getFullYear();
    viewMonth.value = leftDate.getMonth();
    ensureOrder("left");
  }
  emitPanelChange("month");
}

const quarterList = [1, 2, 3, 4];

/**
 * 选中某个季度。单选直接提交，多选按已选集合增删，范围按首尾两端记录。
 */
function selectQuarter(q: number, yearContext?: number, panel: "left" | "right" = "left") {
  if (isQuarterDisabled(q, yearContext)) return;
  const targetYear = yearContext ?? viewYear.value;
  const d = quarterStartDate(targetYear, q);

  if (props.type === "quarter") {
    selectedDate.value = d;
    const val = formatDate(d);
    emit("update:modelValue", val);
    emit("change", val);
    return;
  }

  if (props.type === "quarters") {
    const current = (props.modelValue as any[]) || [];
    const valStr = formatDate(d);
    const idx = current.findIndex((v) => {
      const dv = v instanceof Date ? v : parseValue(v);
      return !!dv && dv.getFullYear() === targetYear && quarterOf(dv) === q;
    });
    const newVal = [...current];
    if (idx > -1) newVal.splice(idx, 1);
    else newVal.push(valStr);
    emit("update:modelValue", newVal);
    return;
  }

  // quarterrange：与月份范围同一套首尾判定
  if (panel === "right") {
    if (!rangeStart.value) rangeStart.value = new Date();
    rangeEnd.value = d;
    if (rangeEnd.value < rangeStart.value) {
      const temp = rangeStart.value;
      rangeStart.value = rangeEnd.value;
      rangeEnd.value = temp;
    }
  } else {
    if (!rangeStart.value || (rangeStart.value && rangeEnd.value)) {
      rangeStart.value = d;
      rangeEnd.value = null;
    } else if (d < rangeStart.value) {
      rangeEnd.value = rangeStart.value;
      rangeStart.value = d;
    } else {
      rangeEnd.value = d;
    }
  }
  const val = [
    formatDate(rangeStart.value),
    rangeEnd.value ? formatDate(rangeEnd.value, "end") : "",
  ];
  emit("update:modelValue", val);
  emitCalendarChange();
  if (rangeStart.value && rangeEnd.value) emit("change", val);
}

/** 该季度是否为选中项（范围模式下仅首尾两端为选中项） */
function isQuarterActive(q: number, yearContext?: number) {
  // 整面板禁用：不显示选中 / 范围高亮，所有格统一走禁用样式
  if (props.disabled) return false;
  const targetYear = yearContext ?? viewYear.value;
  const hit = (d: Date | null) => !!d && d.getFullYear() === targetYear && quarterOf(d) === q;

  if (props.type === "quarter") return hit(selectedDate.value);
  if (props.type === "quarters") {
    return ((props.modelValue as any[]) || []).some((v) =>
      hit(v instanceof Date ? v : parseValue(v)),
    );
  }
  return hit(rangeStart.value) || hit(rangeEnd.value);
}

/** 该季度是否落在范围内（含首尾，首尾由模板优先取选中样式） */
function isQuarterInRange(q: number, yearContext?: number) {
  if (props.disabled) return false;
  const end = previewEnd.value;
  if (props.type !== "quarterrange" || !rangeStart.value || !end) return false;
  const targetYear = yearContext ?? viewYear.value;
  const t = quarterStartDate(targetYear, q).getTime();
  const min = Math.min(rangeStart.value.getTime(), end.getTime());
  const max = Math.max(rangeStart.value.getTime(), end.getTime());
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
  yearContext?: number,
): "start" | "end" | "both" | null {
  if (props.disabled) return null;
  const end = previewEnd.value;
  if (!rangeStart.value || !end) return null;
  const targetYear = yearContext ?? viewYear.value;
  let t: number;
  let a: number;
  let b: number;
  if (kind === "year") {
    if (props.type !== "yearrange") return null;
    t = value;
    a = rangeStart.value.getFullYear();
    b = end.getFullYear();
  } else if (kind === "month") {
    if (props.type !== "monthrange") return null;
    t = new Date(targetYear, value - 1, 1).getTime();
    a = new Date(rangeStart.value.getFullYear(), rangeStart.value.getMonth(), 1).getTime();
    b = new Date(end.getFullYear(), end.getMonth(), 1).getTime();
  } else {
    if (props.type !== "quarterrange") return null;
    t = quarterStartDate(targetYear, value).getTime();
    a = quarterStartDate(rangeStart.value.getFullYear(), quarterOf(rangeStart.value)).getTime();
    b = quarterStartDate(end.getFullYear(), quarterOf(end)).getTime();
  }
  const min = Math.min(a, b);
  const max = Math.max(a, b);
  if (t === min && t === max) return "both";
  if (t === min) return "start";
  if (t === max) return "end";
  return null;
}

/**
 * 根据 modelValue 初始化状态
 */
function initFromValue() {
  if (props.modelValue) {
    if (isRange.value && Array.isArray(props.modelValue)) {
      const [start, end] = props.modelValue;
      if (start) {
        const d1 = parseValue(start);
        if (d1) {
          rangeStart.value = d1;
          viewYear.value = d1.getFullYear();
          viewMonth.value = d1.getMonth();
        }
      }
      if (end) {
        const d2 = parseValue(end);
        if (d2) {
          rangeEnd.value = d2;
          selectedHour2.value = d2.getHours();
          selectedMinute2.value = d2.getMinutes();
          selectedSecond2.value = d2.getSeconds();
        }
      }
    } else if (isMultiple.value && Array.isArray(props.modelValue)) {
      const first = parseValue(props.modelValue[0]);
      if (first) {
        viewYear.value = first.getFullYear();
        viewMonth.value = first.getMonth();
      }
    } else if (props.modelValue) {
      const d = parseValue(props.modelValue);
      if (d) {
        selectedDate.value = d;
        viewYear.value = d.getFullYear();
        viewMonth.value = d.getMonth();
        selectedHour.value = d.getHours();
        selectedMinute.value = d.getMinutes();
        selectedSecond.value = d.getSeconds();
      }
    }
  } else {
    selectedDate.value = null;
    selectedDates.value = [];
    rangeStart.value = null;
    rangeEnd.value = null;
  }
  viewYearPageStart.value = Math.floor(viewYear.value / 10) * 10;
  syncRightPanel();
}

/** 右面板回到紧跟左面板的位置（联动时的相对关系） */
function resetRightPanel() {
  rightYear.value = linkedYear2();
  rightMonth.value = linkedMonth2();
  rightYearPageStart.value = viewYearPageStart.value + 10;
}

// 取消联动后右面板是否已有独立位置：首次进入取消联动时需要先对齐到左侧
let rightPanelInited = false;

/**
 * 绑定值变化后同步右面板：联动时恒紧跟左侧；
 * 取消联动时保留用户翻到的位置，仅当终点落在右面板之后才翻过去，保证选中的终点看得见。
 */
function syncRightPanel() {
  if (!isUnlinked.value || !rightPanelInited) {
    resetRightPanel();
    rightPanelInited = isUnlinked.value;
  }
  if (isUnlinked.value && rangeEnd.value) {
    const endYear = rangeEnd.value.getFullYear();
    const endMonth = rangeEnd.value.getMonth();
    const beyond = isYearUnitRange.value
      ? endYear > rightYear.value
      : monthIndex(endYear, endMonth) > monthIndex(rightYear.value, rightMonth.value);
    if (beyond) {
      rightYear.value = endYear;
      rightMonth.value = endMonth;
    }
    const endPage = Math.floor(endYear / 10) * 10;
    if (endPage > rightYearPageStart.value) rightYearPageStart.value = endPage;
  }
  ensureOrder("left");
}

function isYearActive(y: number) {
  // 整面板禁用：不显示选中 / 范围高亮，所有格统一走禁用样式
  if (props.disabled) return false;
  if (props.type === "year") return selectedDate.value?.getFullYear() === y;
  if (props.type === "years") {
    return ((props.modelValue as any[]) || []).some((v) => {
      const date = v instanceof Date ? v : parseValue(v);
      return date?.getFullYear() === y;
    });
  }
  if (props.type === "yearrange")
    return rangeStart.value?.getFullYear() === y || rangeEnd.value?.getFullYear() === y;
  return false;
}

function isYearInRange(y: number) {
  if (props.disabled) return false;
  if (props.type === "yearrange" && rangeStart.value && previewEnd.value) {
    const start = rangeStart.value.getFullYear();
    const end = previewEnd.value.getFullYear();
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    return y >= min && y <= max;
  }
  return false;
}

function isMonthActive(m: number, yearContext?: number) {
  // 整面板禁用：不显示选中 / 范围高亮，所有格统一走禁用样式
  if (props.disabled) return false;
  const targetYear = yearContext ?? viewYear.value;
  if (props.type === "month") {
    return (
      selectedDate.value?.getFullYear() === targetYear && selectedDate.value?.getMonth() === m - 1
    );
  }
  if (props.type === "months") {
    return ((props.modelValue as any[]) || []).some((v) => {
      const date = v instanceof Date ? v : parseValue(v);
      return date?.getFullYear() === targetYear && date?.getMonth() === m - 1;
    });
  }
  if (props.type === "monthrange") {
    return (
      isSameDate(rangeStart.value, new Date(targetYear, m - 1, 1)) ||
      isSameDate(rangeEnd.value, new Date(targetYear, m - 1, 1))
    );
  }
  return false;
}

function isMonthInRange(m: number, yearContext?: number) {
  if (props.disabled) return false;
  const targetYear = yearContext ?? viewYear.value;
  if (props.type === "monthrange" && rangeStart.value && previewEnd.value) {
    const d = new Date(targetYear, m - 1, 1);
    const start = rangeStart.value.getTime();
    const end = previewEnd.value.getTime();
    const min = Math.min(start, end);
    const max = Math.max(start, end);
    return d.getTime() >= min && d.getTime() <= max;
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
    const check = ((props.modelValue as any[]) || []).some((v) => isSameDate(v, d));
    return check;
  }
  if (props.type === "week" || isRange.value) {
    return (
      d.toDateString() === rangeStart.value?.toDateString() ||
      d.toDateString() === rangeEnd.value?.toDateString()
    );
  }
  return false;
}

/** 标题点击切换视图；整面板禁用时不响应 */
function switchView(view: ViewType) {
  if (props.disabled) return;
  hoverDate.value = null;
  if (currentView.value === view) return;
  if (view === "year") {
    // 十年页对齐到各面板当前所示年份；取消联动时右侧十年页须严格晚于左侧
    viewYearPageStart.value = Math.floor(viewYear.value / 10) * 10;
    rightYearPageStart.value = Math.max(
      Math.floor(rightYear.value / 10) * 10,
      viewYearPageStart.value + 10,
    );
  }
  currentView.value = view;
  emitPanelChange(view === "date" ? "month" : "year");
}

/** 记录范围预览的悬停格；传 null（移出网格 / 悬停到禁用格）即收起预览 */
function previewHover(d: Date | null) {
  if (props.disabled || !isRange.value) return;
  hoverDate.value = d;
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
    rangeStart.value = value[0];
    rangeEnd.value = value[1];
    const val = [formatDate(value[0]), formatDate(value[1])];
    emit("update:modelValue", val);
    emitCalendarChange();
    emit("change", val);
  } else {
    selectedDate.value = value;
    viewYear.value = value.getFullYear();
    viewMonth.value = value.getMonth();
    const val = formatDate(value);
    emit("update:modelValue", val);
    emit("change", val);
  }
}

/**
 * 清空选中值：范围与多选类型回到空数组，其余回到空字符串。
 * 清空前本有值才抛 change，最后总会抛 clear。
 */
function clear() {
  const had = isRange.value || isMultiple.value
    ? Array.isArray(props.modelValue) && props.modelValue.some(Boolean)
    : !!props.modelValue;
  selectedDate.value = null;
  selectedDates.value = [];
  rangeStart.value = null;
  rangeEnd.value = null;
  hoverDate.value = null;
  const val = isRange.value || isMultiple.value ? [] : "";
  emit("update:modelValue", val);
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
  if (type === "week") return "本周";
  if (monthTypes.includes(type)) return "本月";
  if (yearTypes.includes(type)) return "今年";
  if (isQuarterType.value) return "本季度";
  return "今天";
});

/** 取当前日期在日历网格中的格子：复用网格的禁用判定（start / end / disabledMethod） */
function todayCell(now: Date): CalDay | undefined {
  return getCalendarDays(now.getFullYear(), now.getMonth()).find(
    (d) => d.isCurrentMonth && d.date.getDate() === now.getDate(),
  );
}

/**
 * 「今天」是否不可点：整面板禁用，或当前时间所在单位被禁用。
 * datetime 另外校验当前时分秒是否落在 disabledHours / disabledMinutes / disabledSeconds 里。
 */
function isTodayDisabledAt(now: Date) {
  if (props.disabled) return true;
  const y = now.getFullYear();
  const type = props.type as string;
  if (yearTypes.includes(type)) return isYearDisabled(y);
  if (monthTypes.includes(type)) return isMonthDisabled(now.getMonth() + 1, y);
  if (isQuarterType.value) return isQuarterDisabled(quarterOf(now), y);
  if (todayCell(now)?.isDisabled ?? true) return true;
  if (type === "datetime") {
    const h = now.getHours();
    const m = now.getMinutes();
    if (props.disabledHours?.()?.includes(h)) return true;
    if (props.disabledMinutes?.(h)?.includes(m)) return true;
    if (props.disabledSeconds?.(h, m)?.includes(now.getSeconds())) return true;
  }
  return false;
}

/** 底部栏的置灰样式；computed 只随 props 重算，点击时另按点击时刻重新判定 */
const isTodayDisabled = computed(() => isTodayDisabledAt(new Date()));

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

  // 视图回到当前年月，选中结果才看得见
  hoverDate.value = null;
  currentView.value = getInitialView();
  viewYear.value = y;
  viewMonth.value = m;
  viewYearPageStart.value = Math.floor(y / 10) * 10;
  // 取消联动时右面板也回到紧跟左侧的位置，不停留在用户翻到的远处
  rightPanelInited = false;
  syncRightPanel();

  if (isDual.value) {
    const unitStart = () => {
      if (type === "yearrange") return new Date(y, 0, 1);
      if (type === "monthrange") return new Date(y, m, 1);
      if (type === "quarterrange") return quarterStartDate(y, q);
      return new Date(y, m, now.getDate());
    };
    rangeStart.value = unitStart();
    rangeEnd.value = unitStart();
    if (hasTime.value) {
      selectedHour.value = 0;
      selectedMinute.value = 0;
      selectedSecond.value = 0;
      selectedHour2.value = 23;
      selectedMinute2.value = 59;
      selectedSecond2.value = 59;
    }
    const val = [formatDate(rangeStart.value), formatDate(rangeEnd.value, "end")];
    emit("update:modelValue", val);
    emitCalendarChange();
    emit("change", val);
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

defineExpose({
  /** 清空选中值，触发 update:modelValue、change（清空前有值时）与 clear */
  clear,
});

// --- 模板辅助 ---
type TimeRole = "start" | "end";

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
function chunkWeeks(days: CalDay[]): CalDay[][] {
  const rows: CalDay[][] = [];
  for (let i = 0; i < days.length; i += 7) rows.push(days.slice(i, i + 7));
  return rows;
}

/** 一行（周日起）的 ISO 周数：以该行的周一为准，按 ISO 8601「周四所在年」规则计算 */
function isoWeek(row: CalDay[]): number {
  const monday = (row[1] ?? row[0])?.date;
  if (!monday) return 0;
  const d = new Date(Date.UTC(monday.getFullYear(), monday.getMonth(), monday.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

// --- default 插槽的单元格数据 ---
function cellYear(item: { year: number; isDisabled: boolean }, pageStart: number): DatePickerCell {
  return {
    type: "year",
    text: item.year,
    date: new Date(item.year, 0, 1),
    disabled: item.isDisabled,
    selected: isYearActive(item.year),
    inRange: isYearInRange(item.year),
    isToday: item.year === today.getFullYear(),
    outside: item.year < pageStart || item.year > pageStart + 9,
  };
}
function cellMonth(m: number, yearContext?: number): DatePickerCell {
  const y = yearContext ?? viewYear.value;
  return {
    type: "month",
    text: m,
    date: new Date(y, m - 1, 1),
    disabled: isMonthDisabled(m, yearContext),
    selected: isMonthActive(m, yearContext),
    inRange: isMonthInRange(m, yearContext),
    isToday: y === today.getFullYear() && m - 1 === today.getMonth(),
    outside: false,
  };
}
function cellQuarter(q: number, yearContext?: number): DatePickerCell {
  const y = yearContext ?? viewYear.value;
  return {
    type: "quarter",
    text: q,
    date: quarterStartDate(y, q),
    disabled: isQuarterDisabled(q, yearContext),
    selected: isQuarterActive(q, yearContext),
    inRange: isQuarterInRange(q, yearContext),
    isToday: y === today.getFullYear() && q === quarterOf(today),
    outside: false,
  };
}
function cellDay(day: CalDay): DatePickerCell {
  return {
    type: "date",
    text: day.day,
    date: new Date(day.date),
    disabled: day.isDisabled,
    selected: !isRangePlaceholder(day) && isDateActive(day.date),
    inRange: showRangeBand(day),
    isToday: day.isToday,
    outside: !day.isCurrentMonth,
  };
}

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

/**
 * 面板描述：单面板只有 left，双面板为 [left, right]。
 * 模板对每一侧渲染同一套结构，差异（数据源、翻页按钮的显隐与禁用、头部时间段）都收在这里。
 */
const panels = computed(() => {
  const list = [
    {
      side: "left" as PanelSide,
      year: viewYear.value,
      month: viewMonth.value,
      pageStart: viewYearPageStart.value,
      headerTitle: headerTitle.value,
      yearContext: undefined as number | undefined,
      days: calendarDays.value,
      years: yearList.value,
      // 单面板的 datetimerange 两段时间都放在唯一的头部里
      times: (showDual.value || !isDual.value || !hasTime.value
        ? ["start"]
        : ["start", "end"]) as TimeRole[],
      // 联动双面板：左侧只保留朝前的按钮，朝后的由右侧承担
      hidePrev: false,
      hideNext: showDual.value && !isUnlinked.value,
      disablePrev: false,
      disablePrevYear: false,
      disableNext: isUnlinked.value && !canConverge(),
      disableNextYear: isUnlinked.value && !canConverge("year"),
    },
  ];
  if (showDual.value) {
    list.push({
      side: "right",
      year: viewYear2.value,
      month: viewMonth2.value,
      pageStart: viewYearPageStart2.value,
      headerTitle: headerTitle2.value,
      yearContext: viewYear2.value,
      days: calendarDays2.value,
      years: yearList2.value,
      times: ["end"],
      hidePrev: !isUnlinked.value,
      hideNext: false,
      disablePrev: isUnlinked.value && !canConverge(),
      disablePrevYear: isUnlinked.value && !canConverge("year"),
      disableNext: false,
      disableNextYear: false,
    });
  }
  return list.map((p) => ({ ...p, rows: chunkWeeks(p.days) }));
});

watch(() => props.modelValue, initFromValue, { immediate: true });
watch(
  () => props.type,
  () => {
    currentView.value = getInitialView();
    rightPanelInited = false;
    syncRightPanel();
  },
);
// 联动方式或面板数量变化：右面板重新对齐到左侧
watch(
  () => [props.unlinkPanels, props.singlePanel],
  () => {
    rightPanelInited = false;
    syncRightPanel();
  },
);
</script>

<template>
  <div :class="ui.wrapper({ class: props.class })">
    <div :class="ui.container()">
      <!-- 快捷选项侧栏 -->
      <div
        v-if="shortcuts.length"
        :class="ui.shortcuts()"
      >
        <div
          v-for="(s, i) in shortcuts"
          :key="i"
          :class="ui.shortcut()"
          @click.stop="handleShortcut(s)"
        >
          {{ s.text }}
        </div>
      </div>

      <!-- 主内容区 -->
      <div :class="ui.content()">
        <!-- 左侧 / 单面板；范围类型双面板时再渲染右侧。两侧结构一致，差异（数据源、翻页按钮）收在 panels 里 -->
        <div
          v-for="p in panels"
          :key="p.side"
          :class="p.side === 'left' ? ui.panelLeft() : ui.panelRight()"
        >
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
                <div
                  :class="ui.dateTimeHeader()"
                  @click.stop
                >
                  <div
                    :class="[ui.dateTimeSegment(), ui.dateTimeSegmentDisabled()]"
                    @click="switchView('date')"
                  >
                    {{ getDisplayDate(t) }}
                  </div>
                  <div :class="ui.dateTimeSeparator()">/</div>
                  <div
                    :class="[ui.dateTimeSegment(), ui.dateTimeSegmentActive()]"
                    @click="openTime(toggle)"
                  >
                    {{ getTime(t) }}
                  </div>
                </div>
              </template>
            </RebornTimePicker>
          </template>

          <!-- 年视图：翻页单位为十年，按钮走 prev-year / next-year 插槽 -->
          <template v-if="currentView === 'year'">
            <div :class="ui.header()">
              <div :class="ui.navGroup()">
                <span
                  :class="[
                    ui.navBtn(),
                    p.hidePrev ? ui.navBtnHidden() : '',
                    p.disablePrev ? ui.navBtnDisabled() : '',
                  ]"
                  @click.stop="prevPage(p.side)"
                >
                  <slot name="prev-year">
                    <Icon
                      name="lucide:chevron-left"
                      :class="ui.icon()"
                    />
                  </slot>
                </span>
              </div>
              <div :class="ui.dateTimeHeader()">
                <span :class="ui.title()">{{ p.headerTitle }}</span>
              </div>
              <div :class="ui.navGroup()">
                <span
                  :class="[
                    ui.navBtn(),
                    p.hideNext ? ui.navBtnHidden() : '',
                    p.disableNext ? ui.navBtnDisabled() : '',
                  ]"
                  @click.stop="nextPage(p.side)"
                >
                  <slot name="next-year">
                    <Icon
                      name="lucide:chevron-right"
                      :class="ui.icon()"
                    />
                  </slot>
                </span>
              </div>
            </div>
            <div
              :class="ui.grid4Year()"
              @mouseleave="previewHover(null)"
            >
              <div
                v-for="item in p.years"
                :key="item.year"
                :class="
                  ui.yearMonthItem({
                    class: [
                      isYearActive(item.year)
                        ? ui.dayActive()
                        : isYearInRange(item.year)
                          ? ui.yearMonthInRange()
                          : '',
                      yearMonthRangeCap('year', item.year) === 'start'
                        ? ui.yearMonthRangeStart()
                        : '',
                      yearMonthRangeCap('year', item.year) === 'end' ? ui.yearMonthRangeEnd() : '',
                      item.year === today.getFullYear() && !isYearActive(item.year)
                        ? ui.dayToday()
                        : '',
                      item.isDisabled ? ui.dayDisabled() : '',
                      item.year < p.pageStart || item.year >= p.pageStart + 10
                        ? ui.yearMonthOutside()
                        : '',
                    ],
                  })
                "
                @click.stop="selectYear(item.year, p.side)"
                @mouseenter="previewHover(item.isDisabled ? null : new Date(item.year, 0, 1))"
              >
                <slot v-bind="cellYear(item, p.pageStart)">
                  {{ item.year }}
                </slot>
              </div>
            </div>
          </template>

          <!-- 月视图：翻页单位为一年，按钮走 prev-year / next-year 插槽 -->
          <template v-else-if="currentView === 'month'">
            <div :class="ui.header()">
              <div :class="ui.navGroup()">
                <span
                  :class="[
                    ui.navBtn(),
                    p.hidePrev ? ui.navBtnHidden() : '',
                    p.disablePrev ? ui.navBtnDisabled() : '',
                  ]"
                  @click.stop="prevPage(p.side)"
                >
                  <slot name="prev-year">
                    <Icon
                      name="lucide:chevron-left"
                      :class="ui.icon()"
                    />
                  </slot>
                </span>
              </div>
              <div :class="ui.dateTimeHeader()">
                <span
                  :class="ui.title()"
                  @click.stop="switchView('year')"
                >{{ p.year }}年</span>
              </div>
              <div :class="ui.navGroup()">
                <span
                  :class="[
                    ui.navBtn(),
                    p.hideNext ? ui.navBtnHidden() : '',
                    p.disableNext ? ui.navBtnDisabled() : '',
                  ]"
                  @click.stop="nextPage(p.side)"
                >
                  <slot name="next-year">
                    <Icon
                      name="lucide:chevron-right"
                      :class="ui.icon()"
                    />
                  </slot>
                </span>
              </div>
            </div>
            <div
              :class="ui.grid4Month()"
              @mouseleave="previewHover(null)"
            >
              <div
                v-for="m in monthList"
                :key="m"
                :class="
                  ui.yearMonthItem({
                    class: [
                      isMonthActive(m, p.yearContext)
                        ? ui.dayActive()
                        : isMonthInRange(m, p.yearContext)
                          ? ui.yearMonthInRange()
                          : '',
                      yearMonthRangeCap('month', m, p.yearContext) === 'start'
                        ? ui.yearMonthRangeStart()
                        : '',
                      yearMonthRangeCap('month', m, p.yearContext) === 'end'
                        ? ui.yearMonthRangeEnd()
                        : '',
                      isMonthDisabled(m, p.yearContext) ? ui.dayDisabled() : '',
                      p.year === today.getFullYear() &&
                        m === today.getMonth() + 1 &&
                        !isMonthActive(m, p.yearContext)
                        ? ui.dayToday()
                        : '',
                    ],
                  })
                "
                @click.stop="selectMonth(m, p.yearContext, p.side)"
                @mouseenter="previewHover(isMonthDisabled(m, p.yearContext) ? null : new Date(p.year, m - 1, 1))"
              >
                <slot v-bind="cellMonth(m, p.yearContext)">
                  {{ m }}月
                </slot>
              </div>
            </div>
          </template>

          <!-- 季度视图：翻页单位为一年，四个季度两列排布 -->
          <template v-else-if="currentView === 'quarter'">
            <div :class="ui.header()">
              <div :class="ui.navGroup()">
                <span
                  :class="[
                    ui.navBtn(),
                    p.hidePrev ? ui.navBtnHidden() : '',
                    p.disablePrev ? ui.navBtnDisabled() : '',
                  ]"
                  @click.stop="prevPage(p.side)"
                >
                  <slot name="prev-year">
                    <Icon
                      name="lucide:chevron-left"
                      :class="ui.icon()"
                    />
                  </slot>
                </span>
              </div>
              <div :class="ui.dateTimeHeader()">
                <span
                  :class="ui.title()"
                  @click.stop="switchView('year')"
                >{{ p.year }}年</span>
              </div>
              <div :class="ui.navGroup()">
                <span
                  :class="[
                    ui.navBtn(),
                    p.hideNext ? ui.navBtnHidden() : '',
                    p.disableNext ? ui.navBtnDisabled() : '',
                  ]"
                  @click.stop="nextPage(p.side)"
                >
                  <slot name="next-year">
                    <Icon
                      name="lucide:chevron-right"
                      :class="ui.icon()"
                    />
                  </slot>
                </span>
              </div>
            </div>
            <div
              :class="ui.grid2Quarter()"
              @mouseleave="previewHover(null)"
            >
              <div
                v-for="q in quarterList"
                :key="q"
                :class="
                  ui.yearMonthItem({
                    class: [
                      isQuarterActive(q, p.yearContext)
                        ? ui.dayActive()
                        : isQuarterInRange(q, p.yearContext)
                          ? ui.yearMonthInRange()
                          : '',
                      yearMonthRangeCap('quarter', q, p.yearContext) === 'start'
                        ? ui.yearMonthRangeStart()
                        : '',
                      yearMonthRangeCap('quarter', q, p.yearContext) === 'end'
                        ? ui.yearMonthRangeEnd()
                        : '',
                      isQuarterDisabled(q, p.yearContext) ? ui.dayDisabled() : '',
                      p.year === today.getFullYear() &&
                        q === quarterOf(today) &&
                        !isQuarterActive(q, p.yearContext)
                        ? ui.dayToday()
                        : '',
                    ],
                  })
                "
                @click.stop="selectQuarter(q, p.yearContext, p.side)"
                @mouseenter="previewHover(isQuarterDisabled(q, p.yearContext) ? null : quarterStartDate(p.year, q))"
              >
                <slot v-bind="cellQuarter(q, p.yearContext)">
                  第{{ q }}季度
                </slot>
              </div>
            </div>
          </template>

          <!-- 日期视图：外侧双箭头跨年、内侧单箭头跨月 -->
          <template v-else>
            <div :class="ui.header()">
              <div :class="[ui.navGroup(), p.hidePrev ? ui.navBtnHidden() : '']">
                <span
                  :class="[ui.navBtn(), p.disablePrevYear ? ui.navBtnDisabled() : '']"
                  @click.stop="prevYear(p.side)"
                >
                  <slot name="prev-year">
                    <Icon
                      name="lucide:chevrons-left"
                      :class="ui.icon()"
                    />
                  </slot>
                </span>
                <span
                  :class="[ui.navBtn(), p.disablePrev ? ui.navBtnDisabled() : '']"
                  @click.stop="prevPage(p.side)"
                >
                  <slot name="prev-month">
                    <Icon
                      name="lucide:chevron-left"
                      :class="ui.icon()"
                    />
                  </slot>
                </span>
              </div>
              <div :class="ui.dateTimeHeader()">
                <span
                  :class="ui.title()"
                  @click.stop="switchView('year')"
                >{{ p.year }}年</span>
                <span
                  :class="ui.title()"
                  @click.stop="switchView('month')"
                >{{ p.month + 1 }}月</span>
              </div>
              <div :class="[ui.navGroup(), p.hideNext ? ui.navBtnHidden() : '']">
                <span
                  :class="[ui.navBtn(), p.disableNext ? ui.navBtnDisabled() : '']"
                  @click.stop="nextPage(p.side)"
                >
                  <slot name="next-month">
                    <Icon
                      name="lucide:chevron-right"
                      :class="ui.icon()"
                    />
                  </slot>
                </span>
                <span
                  :class="[ui.navBtn(), p.disableNextYear ? ui.navBtnDisabled() : '']"
                  @click.stop="nextYear(p.side)"
                >
                  <slot name="next-year">
                    <Icon
                      name="lucide:chevrons-right"
                      :class="ui.icon()"
                    />
                  </slot>
                </span>
              </div>
            </div>

            <div :class="ui.weekdays()">
              <!-- 周数列表头：与下方每行开头的周数对齐 -->
              <span
                v-if="showWeek"
                :class="ui.weekNumberHeader()"
              >周</span>
              <span
                v-for="w in weekdays"
                :key="w"
                :class="ui.weekday()"
              >{{ w }}</span>
            </div>

            <div
              :class="ui.days()"
              @mouseleave="previewHover(null)"
            >
              <template
                v-for="(row, ri) in p.rows"
                :key="ri"
              >
                <!-- 周数：按 ISO 8601 计算，以该行的周一为准 -->
                <span
                  v-if="showWeek"
                  :class="ui.weekNumber()"
                >{{ isoWeek(row) }}</span>
                <div
                  v-for="(day, di) in row"
                  :key="di"
                  :class="
                    ui.dayCell({
                      class: [
                        // 带子的取舍见 showRangeBand：起止同一天与双面板补位格都不画
                        showRangeBand(day) ? ui.dayInRange() : '',
                        showRangeBand(day) && day.isRangeStart ? ui.dayRangeStart() : '',
                        showRangeBand(day) && day.isRangeEnd ? ui.dayRangeEnd() : '',
                        // 禁用灰带：范围带子（选中高亮）优先，其余禁用格连成灰带
                        day.isDisabledBand && !showRangeBand(day) ? ui.dayDisabledBand() : '',
                      ],
                    })
                  "
                >
                  <div
                    :class="
                      ui.day({
                        class: [
                          // 补位格不上选中态：真实日期在另一侧面板渲染
                          // 禁用样式排在选中态之前：规则禁用的格若恰为已选值，选中底色胜出以便辨认（整面板禁用时不显示选中态）
                          day.isDisabled ? ui.dayDisabled() : '',
                          !isRangePlaceholder(day) && isDateActive(day.date) ? ui.dayActive() : '',
                          // 补位格淡色文字：未禁用、且没有以选中态显示时才上（双面板补位格不显示选中态）
                          !day.isCurrentMonth
                            && !day.isDisabled
                            && !(!isRangePlaceholder(day) && isDateActive(day.date))
                            ? ui.dayOutside()
                            : '',
                          day.isToday && !isDateActive(day.date) ? ui.dayToday() : '',
                          showRangeBand(day) && !isDateActive(day.date) ? ui.dayInRange() : '',
                        ],
                      })
                    "
                    @click.stop="selectDay(day, p.side)"
                    @mouseenter="previewHover(day.isDisabled ? null : day.date)"
                  >
                    <slot v-bind="cellDay(day)">
                      {{ day.day }}
                    </slot>
                  </div>
                </div>
              </template>
            </div>
          </template>
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
