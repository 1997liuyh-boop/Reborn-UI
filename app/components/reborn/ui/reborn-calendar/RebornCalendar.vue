<script setup lang="ts">
import type { CalendarColor, CalendarControllerType, CalendarMode, CalendarTitleAlign, CalendarUI } from "./reborn-calendar.config";
import type { CalendarLunar } from "./reborn-calendar.lunar";
import type { CalendarCellType, CalendarDateType, CalendarDayCell } from "./reborn-calendar.utils";
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";
import { motionPresets, runMotion, stopMotion } from "@/lib/motion";
import { cn } from "~/lib/utils";
import RebornButton from "../reborn-button/RebornButton.vue";
import RebornRadioGroup from "../reborn-radio/RebornRadioGroup.vue";
import RebornSelect from "../reborn-select/RebornSelect.vue";
import { calendarDotTheme, calendarTheme } from "./reborn-calendar.config";
import { getLunar } from "./reborn-calendar.lunar";
import {
  buildMonthCells,
  buildRangeCells,
  calculateValidatedDateRange,
  CALENDAR_WEEK_DAYS,
  dayInZone,
  formatDay,
  formatMonth,
  formatRangeTitle,
  formatValue,
  groupEvents,
  isSameDay,
  isSameMonth,
  isValidTimeZone,
  msUntilNextDay,
  parseValue,
  resolveRange,
  setYearMonth,
  shiftMonth,
  toDay,
  zonedMidnight,
} from "./reborn-calendar.utils";

/** 日历上的一条事项 */
export interface CalendarEvent {
  /**
   * 事项所在日期：'2026-10-20' 这类不带时区的字符串直接按日期落格；
   * Date、时间戳与带 Z / 偏移的字符串是确定时刻，按 timezone（缺省本地时区）换算成当天
   */
  date: Date | string | number;
  /** 事项标题，单行显示，超长省略 */
  title: string;
  /** 圆点颜色；不传时跟随日历的 color */
  color?: CalendarColor;
  /** 其他自定义字段，原样出现在 date-cell 插槽里 */
  [key: string]: any;
}

/** date-cell 插槽的 data 参数，前四个字段与 Element Plus 的 el-calendar 对齐 */
export interface CalendarDateCellData {
  /** 相对当前月份的位置：prev-month 上月补位 / current-month 当月 / next-month 下月补位 */
  type: CalendarCellType;
  /** 是否为选中日期 */
  isSelected: boolean;
  /** 格式化日期，形如 2026-10-20，与时区无关 */
  day: string;
  /** 单元格日期：timezone 时区（缺省本地时区）当天零点的时刻 */
  date: Date;
  /** 农历信息，仅开启 lunar 时提供 */
  lunar?: CalendarLunar;
}

/** 下拉选项文案的格式化函数：value 是年份或 1~12 的月份 */
export type CalendarFormatter = (value: number, type: "year" | "month") => string | number;

export interface CalendarProps {
  /**
   * 只显示一段日期：[开始, 结束]。开始会补到所在周的周日、结束补到所在周的周六，
   * 两者须同月或相邻月；不合法时在控制台警告并退回普通月视图
   */
  range?: [Date, Date];
  /**
   * 工具栏左侧的切换控件：select 年份 / 月份下拉，button 前后翻页按钮 + 年月标题
   * @defaultValue 'select'
   */
  controllerType?: CalendarControllerType;
  /** 年份、月份下拉选项的文案；不传时为「2026 年」「10 月」 */
  formatter?: CalendarFormatter;
  /**
   * 事项数据，按 date 落到对应的日期格；年视图里按月汇总
   * @defaultValue []
   */
  events?: CalendarEvent[];
  /**
   * 语义色：有事项日期的浅底、顶边与日期文字，选中实底与今天描边，事项圆点的默认色；
   * 同时传给工具栏的年月下拉与月 / 年切换
   * @defaultValue 'primary'
   */
  color?: CalendarColor;
  /**
   * 表头星期与日期标题的水平对齐
   * @defaultValue 'right'
   */
  titleAlign?: CalendarTitleAlign;
  /**
   * 边框模式：主体加外框，日期格之间画分隔线，整体成网格
   * @defaultValue false
   */
  border?: boolean;
  /**
   * 农历模式：公历日期下方显示较小的农历日，节日、节气优先，初一显示月名；工具栏显示干支年与生肖
   * @defaultValue false
   */
  lunar?: boolean;
  /**
   * 时区（IANA 名称，如 'Asia/Shanghai'）。决定「今天」是哪天、带时区的时刻落在哪天，
   * 以及向外派发的 Date 取哪个时区的零点；不传时用运行环境的本地时区
   */
  timezone?: string;
  /**
   * 绑定值格式（dayjs 格式串，如 'YYYY-MM-DD'）。设置后 v-model 收发字符串，
   * 不再经过 Date 的时区换算，提交给接口不会差一天
   */
  valueFormat?: string;
  /** 追加到根容器的类名 */
  class?: any;
  /** 按结构键覆盖各节点样式 */
  ui?: CalendarUI;
}

defineOptions({
  name: "RebornCalendar",
});

const props = withDefaults(defineProps<CalendarProps>(), {
  controllerType: "select",
  events: () => [],
  color: "primary",
  titleAlign: "right",
  border: false,
  lunar: false,
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 显示的月份、年份或视图模式变化时触发，参数为新的视图基准日与模式，常用来按需拉取事项；模板里写 @panel-change */
  panelChange: [date: Date, mode: CalendarMode];
}>();

defineSlots<{
  /** 整个工具栏；date 是当前标题文案（如「2026 年 10 月」） */
  "header"?: (props: { date: string; value: Date; mode: CalendarMode; selectDate: (type: CalendarDateType) => void }) => any;
  /** 月视图（含区间视图）里单个日期格的内容，替换日期标题与事项区 */
  "date-cell"?: (props: { data: CalendarDateCellData; events: CalendarEvent[] }) => any;
}>();
/** 选中日期：默认是 Date；设置 valueFormat 后是对应格式的字符串。未绑定时由组件内部维护 */
const model = defineModel<Date | string>();
/** 视图模式：month 月视图 / year 年视图 */
const mode = defineModel<CalendarMode>("mode", { default: "month" });
const bodyRef = shallowRef<HTMLElement | null>(null);

// ─── 时区与「今天」 ─────────────────────────────────────────────

watch(() => props.timezone, (timezone) => {
  if (timezone && !isValidTimeZone(timezone))
    console.warn(`[RebornCalendar] 无法识别时区「${timezone}」，已改用本地时区`);
}, { immediate: true });

/** 生效的时区；非法名称退回本地时区 */
const zone = computed(() => props.timezone && isValidTimeZone(props.timezone) ? props.timezone : undefined);

/** 今天（日历日）。客户端挂载后重新取一次，并在时区内的下一个零点自动刷新 */
const today = shallowRef(dayInZone(new Date(), zone.value));
let todayTimer: ReturnType<typeof setTimeout> | undefined;
function refreshToday() {
  const next = dayInZone(new Date(), zone.value);
  if (!isSameDay(next, today.value))
    today.value = next;
  clearTimeout(todayTimer);
  todayTimer = setTimeout(refreshToday, msUntilNextDay(zone.value));
}
// 服务端可能处在别的时区，客户端接管后以用户所在时区为准
onMounted(refreshToday);
watch(zone, () => {
  if (todayTimer !== undefined)
    refreshToday();
});

/** 日历日换成向外派发的 Date：所在时区当天零点 */
function toOutput(day: Date) {
  return zonedMidnight(day, zone.value);
}

// ─── 日期状态 ───────────────────────────────────────────────────

const rangeResult = computed(() => resolveRange(props.range, zone.value));
const segments = computed(() => rangeResult.value.segments);
/** 是否处于区间视图：range 合法时生效，此时不显示年视图与切换控件 */
const inRange = computed(() => segments.value.length > 0);

const RANGE_WARNINGS = {
  "invalid": "range 必须是两个可解析的日期",
  "reversed": "range 的结束日期不能早于开始日期",
  "too-long": "range 的开始与结束日期必须同月或相邻月",
} as const;

watch(
  () => rangeResult.value.error,
  (error) => {
    if (error)
      console.warn(`[RebornCalendar] ${RANGE_WARNINGS[error]}，已退回普通月视图`);
  },
  { immediate: true },
);

/** 选中的日历日 */
const selected = computed(() => parseValue(model.value, props.valueFormat, zone.value) ?? undefined);
/** 当前已选日期：所在时区当天零点；没有选中时为 undefined */
const selectedDay = computed(() => selected.value && toOutput(selected.value));

/** 视图基准日：选中日期 > 区间起点 > 今天。翻页、改年月都是在挪选中日期，视图随之跟过去 */
const viewDate = computed(() => selected.value ?? segments.value[0]?.[0] ?? today.value);
const viewYear = computed(() => viewDate.value.getFullYear());
const viewMonth = computed(() => viewDate.value.getMonth());

/** 实际渲染的视图：区间视图恒为月视图 */
const isYearView = computed(() => mode.value === "year" && !inRange.value);

/** 把日历日写回绑定值：有 valueFormat 时写字符串，否则写时区零点的 Date */
function commit(day: Date) {
  model.value = props.valueFormat ? formatValue(day, props.valueFormat) : toOutput(day);
}

/** 选择一个具体日期；字符串按 valueFormat 或通用规则解析，Date 按 timezone 换算到当天 */
function pickDay(day: Date | string) {
  const next = parseValue(day, props.valueFormat, zone.value);
  if (next)
    commit(next);
}

/** 选择日期：前后一月 / 一年保持日不变（目标月没有这一天时取月末），today 选中今天 */
function selectDate(type: CalendarDateType) {
  const base = viewDate.value;
  const targets: Record<CalendarDateType, Date> = {
    "prev-month": shiftMonth(base, -1),
    "next-month": shiftMonth(base, 1),
    "prev-year": shiftMonth(base, -12),
    "next-year": shiftMonth(base, 12),
    "today": today.value,
  };
  commit(targets[type]);
}

// 换月、换年、换视图后通知外部，方便按可见范围拉取事项；首次渲染不派发
const panelKey = computed(() => {
  if (inRange.value)
    return `range:${formatDay(segments.value[0]![0])}`;
  return isYearView.value ? `year:${viewYear.value}` : `month:${formatMonth(viewDate.value)}`;
});
watch(panelKey, () => emit("panelChange", toOutput(viewDate.value), mode.value));

// ─── 工具栏 ─────────────────────────────────────────────────────

/** 工具栏标题，同时作为 header 插槽的 date 参数 */
const titleText = computed(() => {
  if (inRange.value)
    return formatRangeTitle(segments.value);
  return isYearView.value ? `${viewYear.value} 年` : `${viewYear.value} 年 ${viewMonth.value + 1} 月`;
});

/** 农历模式下工具栏显示的干支年：月视图取当月 15 日，年视图取年中，避开年初两个月的农历跨年 */
const lunarYearText = computed(() => {
  if (!props.lunar)
    return "";
  const lunar = getLunar(isYearView.value ? new Date(viewYear.value, 6, 1) : new Date(viewYear.value, viewMonth.value, 15));
  return lunar ? `${lunar.yearName}${lunar.zodiac}年` : "";
});

function formatOption(value: number, type: "year" | "month") {
  return String(props.formatter ? props.formatter(value, type) : `${value} ${type === "year" ? "年" : "月"}`);
}

/** 年份下拉：以当前年份为中心前后各 10 年 */
const yearOptions = computed(() =>
  Array.from({ length: 21 }, (_, i) => viewYear.value - 10 + i).map(year => ({ label: formatOption(year, "year"), value: year })),
);
/** 月份下拉：值为 1~12，与 formatter 收到的月份一致 */
const monthOptions = computed(() =>
  Array.from({ length: 12 }, (_, i) => ({ label: formatOption(i + 1, "month"), value: i + 1 })),
);

function onYearChange(year: number) {
  commit(setYearMonth(viewDate.value, year, viewMonth.value));
}
function onMonthChange(month: number) {
  commit(setYearMonth(viewDate.value, viewYear.value, month - 1));
}

/** 只对新视图做轻微入场，保留日期 DOM 的即时更新与键盘焦点。 */
watch([viewYear, viewMonth, mode], ([year, month, nextMode], [previousYear, previousMonth, previousMode]) => {
  const body = bodyRef.value;
  if (!body) return;
  const direction = year * 12 + month >= previousYear * 12 + previousMonth ? 1 : -1;
  runMotion(body, {
    opacity: [0.5, 1],
    translate: nextMode === previousMode ? [`${direction * 8}px 0px`, '0px 0px'] : ['0px 6px', '0px 0px'],
  }, motionPresets.base);
}, { flush: 'post' });
watch(bodyRef, (body, previousBody) => {
  if (previousBody && previousBody !== body) stopMotion(previousBody);
});
onBeforeUnmount(() => stopMotion(bodyRef.value));

const modeOptions = [
  { label: "月", value: "month" },
  { label: "年", value: "year" },
];

// ─── 单元格 ─────────────────────────────────────────────────────

const eventsByDay = computed(() => groupEvents(props.events, formatDay, zone.value));
const eventsByMonth = computed(() => groupEvents(props.events, formatMonth, zone.value));

interface DayCellState extends CalendarDayCell {
  isSelected: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  lunar?: CalendarLunar;
}

const dayCells = computed<DayCellState[]>(() => {
  const base = inRange.value ? buildRangeCells(segments.value) : buildMonthCells(viewDate.value);
  const current = selected.value;
  return base.map(cell => ({
    ...cell,
    isSelected: !!current && isSameDay(cell.date, current),
    isToday: isSameDay(cell.date, today.value),
    events: eventsByDay.value.get(cell.day) ?? [],
    lunar: props.lunar ? getLunar(cell.date) : undefined,
  }));
});

/** 区间视图里今天不在可见范围时，「今天」按钮置灰 */
const todayVisible = computed(() =>
  !inRange.value || dayCells.value.some(cell => cell.isToday),
);

/** 按周切行 */
const weeks = computed(() => {
  const rows: DayCellState[][] = [];
  for (let i = 0; i < dayCells.value.length; i += 7)
    rows.push(dayCells.value.slice(i, i + 7));
  return rows;
});

interface MonthCellState {
  key: string;
  /** 0~11 */
  month: number;
  isSelected: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

/** 年视图：12 个月排成 3 行 4 列 */
const quarters = computed(() => {
  const current = selected.value;
  const months: MonthCellState[] = Array.from({ length: 12 }, (_, month) => {
    const first = new Date(viewYear.value, month, 1);
    const key = formatMonth(first);
    return {
      key,
      month,
      isSelected: !!current && isSameMonth(first, current),
      isToday: isSameMonth(first, today.value),
      events: eventsByMonth.value.get(key) ?? [],
    };
  });
  return [months.slice(0, 4), months.slice(4, 8), months.slice(8, 12)];
});

function toCellData(cell: DayCellState): CalendarDateCellData {
  return { type: cell.type, isSelected: cell.isSelected, day: cell.day, date: toOutput(cell.date), lunar: cell.lunar };
}

/** 年视图点月份：选中该月的同一天并下钻到月视图 */
function pickMonth(month: number) {
  commit(setYearMonth(viewDate.value, viewYear.value, month));
  mode.value = "month";
}

function eventKey(event: CalendarEvent, index: number) {
  return `${index}-${event.title}`;
}

/**
 * 年视图每条事项补上所属日期；与分组共用 toDay，
 * 不带偏移的日期保持原日，确定时刻则按日历时区换算，避免标题与月份归属不一致。
 */
function yearEventTitle(event: CalendarEvent) {
  const day = toDay(event.date, zone.value);
  return day ? `${formatDay(day)}：${event.title}` : event.title;
}

onBeforeUnmount(() => {
  clearTimeout(todayTimer);
});

// ─── 样式 ───────────────────────────────────────────────────────

/** 单元格的样式状态，相同状态共用同一份类名 */
interface CellStyleState { hasEvents: boolean; inMonth: boolean; today: boolean; selected: boolean }

const ui = computed(() => {
  const o = props.ui;
  const theme = calendarTheme({
    color: props.color,
    view: isYearView.value ? "year" : "month",
    titleAlign: props.titleAlign,
    border: props.border,
    lunar: props.lunar,
  });
  // 每格的类名只由几个布尔状态决定，同一次渲染里按状态缓存，几十个格子不必逐个合并类名
  const memo = new Map<string, string>();
  const cached = (key: string, make: () => string) => {
    let value = memo.get(key);
    if (value === undefined) {
      value = make();
      memo.set(key, value);
    }
    return value;
  };
  return {
    root: () => theme.root({ class: cn(o.root, props.class) }),
    header: () => theme.header({ class: o.header }),
    controller: () => theme.controller({ class: o.controller }),
    title: () => theme.title({ class: o.title }),
    lunarYear: () => theme.lunarYear({ class: o.lunarYear }),
    select: (width: string) => cached(`select:${width}`, () => theme.select({ class: cn(width, o.select) })),
    navButton: () => theme.navButton({ class: o.navButton }),
    body: () => theme.body({ class: o.body }),
    row: () => cached("row", () => theme.row({ class: o.row })),
    weekday: () => cached("weekday", () => theme.weekday({ class: o.weekday })),
    cell: (hasEvents: boolean, selected: boolean) =>
      cached(`cell:${hasEvents}${selected}`, () => theme.cell({ hasEvents, selected, class: o.cell })),
    cellHeader: () => cached("cellHeader", () => theme.cellHeader({ class: o.cellHeader })),
    date: (state: CellStyleState) =>
      cached(`date:${state.hasEvents}${state.inMonth}${state.today}${state.selected}`, () => theme.date({ ...state, class: o.date })),
    lunar: (lunar: CalendarLunar) => cached(`lunar:${!!(lunar.festival || lunar.term)}`, () => theme.lunar({ festival: !!(lunar.festival || lunar.term), class: o.lunar })),
    content: () => cached("content", () => theme.content({ class: o.content })),
    eventList: () => cached("eventList", () => theme.eventList({ class: o.eventList })),
    event: () => cached("event", () => theme.event({ class: o.event })),
    eventDot: (color?: CalendarColor) => cached(`dot:${color ?? ""}`, () => theme.eventDot({ class: cn(calendarDotTheme({ color: color ?? props.color }), o.eventDot) })),
    eventTitle: () => cached("eventTitle", () => theme.eventTitle({ class: o.eventTitle })),
  };
});

defineExpose({
  /** 当前已选日期 */
  selectedDay,
  /** 选择一个具体日期 */
  pickDay,
  /** 选择日期：prev-month / next-month / prev-year / next-year / today */
  selectDate,
  /** 根据开始与结束日期计算验证后的日期区间 */
  calculateValidatedDateRange,
});
</script>

<template>
  <div :class="ui.root()">
    <div :class="ui.header()">
      <slot name="header" :date="titleText" :value="toOutput(viewDate)" :mode="mode" :select-date="selectDate">
        <div :class="ui.controller()">
          <span v-if="inRange" :class="ui.title()">{{ titleText }}</span>

          <template v-else-if="controllerType === 'select'">
            <RebornSelect
              :model-value="viewYear" :options="yearOptions" size="md" :color="color" :clearable="false"
              :class="ui.select('w-28')" @update:model-value="onYearChange"
            />
            <RebornSelect
              v-if="!isYearView" :model-value="viewMonth + 1" :options="monthOptions" size="md" :color="color" :clearable="false"
              :class="ui.select('w-24')" @update:model-value="onMonthChange"
            />
          </template>

          <template v-else>
            <RebornButton
              size="md" color="neutral" variant="outlined" :class="ui.navButton()"
              :aria-label="isYearView ? '上一年' : '上个月'" @click="selectDate(isYearView ? 'prev-year' : 'prev-month')"
            >
              <Icon name="lucide:chevron-left" />
            </RebornButton>
            <span :class="ui.title()">{{ titleText }}</span>
            <RebornButton
              size="md" color="neutral" variant="outlined" :class="ui.navButton()"
              :aria-label="isYearView ? '下一年' : '下个月'" @click="selectDate(isYearView ? 'next-year' : 'next-month')"
            >
              <Icon name="lucide:chevron-right" />
            </RebornButton>
          </template>

          <RebornRadioGroup v-if="!inRange" v-model="mode" type="pure-button" size="md" :color="color" :options="modeOptions" />
          <span v-if="lunarYearText" :class="ui.lunarYear()">{{ lunarYearText }}</span>
        </div>

        <RebornButton
          size="md" color="neutral" variant="outlined" border-style="solid" :disabled="!todayVisible"
          @click="selectDate('today')"
        >
          今天
        </RebornButton>
      </slot>
    </div>

    <!-- 年视图：12 个月，每格汇总当月事项 -->
    <div v-if="isYearView" ref="bodyRef" role="grid" :aria-label="titleText" :class="ui.body()">
      <div v-for="(quarter, index) in quarters" :key="index" role="row" :class="ui.row()">
        <div
          v-for="cell in quarter" :key="cell.key" role="gridcell" :aria-selected="cell.isSelected"
          :class="ui.cell(cell.events.length > 0, cell.isSelected)" @click="pickMonth(cell.month)"
        >
          <div :class="ui.cellHeader()">
            <button
              type="button" :aria-current="cell.isToday ? 'date' : undefined"
              :class="ui.date({ hasEvents: cell.events.length > 0, inMonth: true, today: cell.isToday, selected: cell.isSelected })"
            >
              {{ cell.month + 1 }} 月
            </button>
          </div>
          <div :class="ui.content()">
            <ul v-if="cell.events.length" :class="ui.eventList()">
              <li v-for="(event, i) in cell.events" :key="eventKey(event, i)" :class="ui.event()" :title="yearEventTitle(event)">
                <span :class="ui.eventDot(event.color)" />
                <span :class="ui.eventTitle()">{{ yearEventTitle(event) }}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <!-- 月视图 / 区间视图 -->
    <div v-else ref="bodyRef" role="grid" :aria-label="titleText" :class="ui.body()">
      <div role="row" :class="ui.row()">
        <div v-for="weekday in CALENDAR_WEEK_DAYS" :key="weekday" role="columnheader" :class="ui.weekday()">
          <!-- 与日期胶囊同宽，三种对齐下都和日期上下对齐 -->
          <span class="inline-block min-w-6 text-center">{{ weekday }}</span>
        </div>
      </div>
      <div v-for="week in weeks" :key="week[0]!.day" role="row" :class="ui.row()">
        <div
          v-for="cell in week" :key="cell.day" role="gridcell" :aria-selected="cell.isSelected"
          :data-type="cell.type" :class="ui.cell(cell.events.length > 0, cell.isSelected)" @click="commit(cell.date)"
        >
          <slot name="date-cell" :data="toCellData(cell)" :events="cell.events">
            <div :class="ui.cellHeader()">
              <button
                type="button" :aria-label="cell.lunar ? `${cell.day} 农历${cell.lunar.monthName}${cell.lunar.dayName}` : cell.day"
                :aria-current="cell.isToday ? 'date' : undefined"
                :class="ui.date({
                  hasEvents: cell.events.length > 0,
                  inMonth: cell.type === 'current-month',
                  today: cell.isToday,
                  selected: cell.isSelected,
                })"
              >
                {{ cell.date.getDate() }}
              </button>
              <span v-if="cell.lunar" aria-hidden="true" :class="ui.lunar(cell.lunar)">{{ cell.lunar.text }}</span>
            </div>
            <div :class="ui.content()">
              <ul v-if="cell.events.length" :class="ui.eventList()">
                <li v-for="(event, i) in cell.events" :key="eventKey(event, i)" :class="ui.event()" :title="event.title">
                  <span :class="ui.eventDot(event.color)" />
                  <span :class="ui.eventTitle()">{{ event.title }}</span>
                </li>
              </ul>
            </div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>
