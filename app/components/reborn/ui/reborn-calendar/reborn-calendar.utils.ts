import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

/**
 * 日历的纯日期计算：不依赖组件实例，单测直接覆盖。
 * 一周固定从周日开始（表头「日 一 二 … 六」），周首周尾都手算，
 * 不走 dayjs 的 startOf('week')——那个结果随全局 locale 变化（zh-cn 下是周一）。
 *
 * 内部一律用「本地零点的 Date」表示一个日历日（只读年月日，不代表某个时刻）；
 * 与外部交换时才按时区换算：传入的时刻用 toDay 落到日，向外派发的 Date 用 zonedMidnight 还原成时刻。
 */

/** 单元格相对所在月份的位置：上月补位 / 当月 / 下月补位 */
export type CalendarCellType = "prev-month" | "current-month" | "next-month";

/** selectDate 可选的跳转目标 */
export type CalendarDateType = "prev-month" | "next-month" | "prev-year" | "next-year" | "today";

/** 日期单元格的基础数据 */
export interface CalendarDayCell {
  /** 相对所在月份的位置 */
  type: CalendarCellType;
  /** 格式化日期，形如 2026-10-20 */
  day: string;
  /** 当天零点的 Date */
  date: Date;
}

/** 表头星期，顺序与周日开头的网格一致 */
export const CALENDAR_WEEK_DAYS = ["日", "一", "二", "三", "四", "五", "六"] as const;

/** 结尾带 Z 或 ±08:00 偏移的字符串表示一个确定时刻，其余字符串是不带时区的墙上日期 / 时间 */
const HAS_OFFSET = /\d:\d{2}(?::\d{2}(?:\.\d+)?)?\s*(?:z|[+-]\d{2}:?\d{2})$/i;

const zoneFormats = new Map<string, Intl.DateTimeFormat>();

/** 某一时刻在指定 IANA 时区里的年月日时分秒 */
function zoneParts(instant: number, timeZone: string) {
  let format = zoneFormats.get(timeZone);
  if (!format) {
    format = new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", second: "numeric",
    });
    zoneFormats.set(timeZone, format);
  }
  const parts = Object.fromEntries(format.formatToParts(instant).map(part => [part.type, Number(part.value)]));
  return { year: parts.year!, month: parts.month!, day: parts.day!, hour: parts.hour! % 24, minute: parts.minute!, second: parts.second! };
}

/** 时区名是否可用；非法名称会让 Intl 抛错 */
export function isValidTimeZone(timeZone: string): boolean {
  try {
    zoneParts(0, timeZone);
    return true;
  }
  catch {
    return false;
  }
}

/** 某一时刻在指定时区里是哪一天；不传时区按运行环境的本地时区 */
export function dayInZone(instant: Date, timeZone?: string): Date {
  if (!timeZone)
    return new Date(instant.getFullYear(), instant.getMonth(), instant.getDate());
  const parts = zoneParts(instant.getTime(), timeZone);
  return new Date(parts.year, parts.month - 1, parts.day);
}

/** 时区相对 UTC 的偏移（毫秒）：把该时刻在时区里的墙上时间当成 UTC 解读，减去真实时刻 */
function zoneOffset(instant: number, timeZone: string): number {
  const parts = zoneParts(instant, timeZone);
  const floored = instant - (((instant % 1000) + 1000) % 1000);
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - floored;
}

/**
 * 日历日在指定时区的零点时刻；不传时区即本地零点。
 * 先按 UTC 零点处的偏移回推一次，再用回推结果处的偏移校正一次，跨夏令时切换日也落在当天零点
 */
export function zonedMidnight(day: Date, timeZone?: string): Date {
  if (!timeZone)
    return new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const target = Date.UTC(day.getFullYear(), day.getMonth(), day.getDate());
  const guess = target - zoneOffset(target, timeZone);
  return new Date(target - zoneOffset(guess, timeZone));
}

/**
 * 把 Date / 时间戳 / 字符串统一成日历日（本地零点的 Date）；无法解析时返回 null。
 * 不带偏移的字符串（'2026-10-20'、'2026-10-20 18:00'）直接取日期部分，与时区无关；
 * Date、时间戳与带 Z / 偏移的字符串是确定时刻，按 timeZone（缺省为本地时区）换算成当天
 */
export function toDay(input: unknown, timeZone?: string): Date | null {
  if (input === null || input === undefined || input === "")
    return null;
  if (typeof input === "string" && !HAS_OFFSET.test(input.trim())) {
    const value = dayjs(input.trim());
    return value.isValid() ? new Date(value.year(), value.month(), value.date()) : null;
  }
  const instant = input instanceof Date ? input : dayjs(input as string | number).toDate();
  if (Number.isNaN(instant.getTime()))
    return null;
  return dayInZone(instant, timeZone);
}

/** 按 dayjs 格式串输出日历日，如 'YYYY-MM-DD'；只用年月日，结果与时区无关 */
export function formatValue(day: Date, valueFormat: string): string {
  return dayjs(day).format(valueFormat);
}

/** 解析绑定值：给了 valueFormat 的字符串先按格式严格解析，失败再按通用规则 */
export function parseValue(value: unknown, valueFormat?: string, timeZone?: string): Date | null {
  if (typeof value === "string" && valueFormat) {
    const parsed = dayjs(value, valueFormat, true);
    if (parsed.isValid())
      return new Date(parsed.year(), parsed.month(), parsed.date());
  }
  return toDay(value, timeZone);
}

/** 距离指定时区下一个零点还有多少毫秒，用来在跨天时刷新「今天」 */
export function msUntilNextDay(timeZone?: string, now = new Date()): number {
  const today = dayInZone(now, timeZone);
  const next = zonedMidnight(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1), timeZone);
  return Math.max(1000, next.getTime() - now.getTime());
}

/** 补零到两位 */
function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** 格式化为 YYYY-MM-DD，作为单元格与事项按天分组的键 */
export function formatDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 格式化为 YYYY-MM，作为年视图按月分组的键 */
export function formatMonth(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** 往后（负数往前）挪若干天，用构造函数进位，跨月跨年与夏令时都不会错 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** 当周周日 */
export function weekStart(date: Date): Date {
  return addDays(date, -date.getDay());
}

/** 当周周六 */
export function weekEnd(date: Date): Date {
  return addDays(date, 6 - date.getDay());
}

/** 当月 1 号 */
export function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** 当月最后一天 */
export function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

/** 是否同一天 */
export function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** 是否同年同月 */
export function isSameMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** 两个日期相差的自然月数（只看年月，不看日） */
function monthDiff(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

/**
 * 把日期挪到指定的年、月（month 从 0 开始），日保持不变；
 * 目标月没有这一天时收到月末（1 月 31 日挪到 2 月得 2 月 28/29 日），不会溢出到下个月
 */
export function setYearMonth(date: Date, year: number, month: number): Date {
  const last = new Date(year, month + 1, 0).getDate();
  return new Date(year, month, Math.min(date.getDate(), last));
}

/** 按自然月前后平移，月末同样收口 */
export function shiftMonth(date: Date, months: number): Date {
  return setYearMonth(date, date.getFullYear(), date.getMonth() + months);
}

/** 生成从 start 到 end（含）的连续日期，type 按与 anchor 的月份关系判定 */
function collectDays(start: Date, end: Date, anchor: Date): CalendarDayCell[] {
  const cells: CalendarDayCell[] = [];
  for (let cursor = start; cursor.getTime() <= end.getTime(); cursor = addDays(cursor, 1)) {
    const diff = monthDiff(anchor, cursor);
    const type: CalendarCellType = diff < 0 ? "prev-month" : diff > 0 ? "next-month" : "current-month";
    cells.push({ type, day: formatDay(cursor), date: cursor });
  }
  return cells;
}

/**
 * 月视图的全部单元格：从当月 1 号所在周的周日，到月末所在周的周六。
 * 行数随月份在 4 ~ 6 行之间变化，不强行补满 6 行
 */
export function buildMonthCells(viewDate: Date): CalendarDayCell[] {
  return collectDays(weekStart(startOfMonth(viewDate)), weekEnd(endOfMonth(viewDate)), viewDate);
}

/**
 * 跨相邻两个月的区间拆段：第一段到首月月末为止（末行由下月补位填满），
 * 第二段从末月第一个不与首段共周的周日开始，保证两段拼起来是连续且不重复的整周
 */
function splitAdjacent(start: Date, end: Date): [Date, Date][] {
  const firstMonthLastDay = endOfMonth(start);
  const lastMonthFirstDay = startOfMonth(end);
  const sharedWeek = isSameDay(weekStart(firstMonthLastDay), weekStart(lastMonthFirstDay));
  const lastMonthStart = sharedWeek ? addDays(lastMonthFirstDay, 7) : lastMonthFirstDay;
  return [
    [start, firstMonthLastDay],
    [weekStart(lastMonthStart), end],
  ];
}

/** 补成整周后横跨三个月时（如 1 月 30 日到 2 月 28 日）拆三段，规则同 splitAdjacent */
function splitThree(start: Date, end: Date): [Date, Date][] {
  const firstMonthLastDay = endOfMonth(start);
  const secondMonthFirstDay = startOfMonth(addDays(firstMonthLastDay, 1));
  const secondMonthStart = isSameDay(weekStart(firstMonthLastDay), weekStart(secondMonthFirstDay))
    ? addDays(secondMonthFirstDay, 7)
    : secondMonthFirstDay;
  const secondMonthLastDay = endOfMonth(secondMonthFirstDay);
  const lastMonthFirstDay = startOfMonth(end);
  const lastMonthStart = isSameDay(weekStart(secondMonthLastDay), weekStart(lastMonthFirstDay))
    ? addDays(lastMonthFirstDay, 7)
    : lastMonthFirstDay;
  return [
    [start, firstMonthLastDay],
    [weekStart(secondMonthStart), secondMonthLastDay],
    [weekStart(lastMonthStart), end],
  ];
}

/**
 * 根据开始与结束日期计算验证后的日期区间：先补成整周（开始挪到周日、结束挪到周六），
 * 再按月份拆成若干段，每段的首尾都在同一个月内。补周后跨度超过三个月返回空数组。
 * 被上一段补位行完全覆盖的段（起点晚于终点）会被丢掉，不产生空行
 */
export function calculateValidatedDateRange(start: Date, end: Date): [Date, Date][] {
  const firstDay = weekStart(start);
  const lastDay = weekEnd(end);
  const diff = monthDiff(firstDay, lastDay);
  let segments: [Date, Date][];
  if (diff === 0)
    segments = [[firstDay, lastDay]];
  else if (diff === 1)
    segments = splitAdjacent(firstDay, lastDay);
  else if (diff === 2)
    segments = splitThree(firstDay, lastDay);
  else
    return [];
  return segments.filter(([from, to]) => from.getTime() <= to.getTime());
}

/** range 校验失败的原因；null 表示通过 */
export type CalendarRangeError = "invalid" | "reversed" | "too-long" | null;

/**
 * 校验 range 并拆段：必须是两个可解析的日期、开始不晚于结束、且同月或相邻月。
 * 失败时 segments 为空数组，由组件退回普通月视图
 */
export function resolveRange(range: unknown, timeZone?: string): { segments: [Date, Date][]; error: CalendarRangeError } {
  if (!Array.isArray(range) || range.length !== 2)
    return { segments: [], error: range === undefined || range === null ? null : "invalid" };
  const start = toDay(range[0], timeZone);
  const end = toDay(range[1], timeZone);
  if (!start || !end)
    return { segments: [], error: "invalid" };
  if (start.getTime() > end.getTime())
    return { segments: [], error: "reversed" };
  if (monthDiff(start, end) > 1)
    return { segments: [], error: "too-long" };
  return { segments: calculateValidatedDateRange(start, end), error: null };
}

/**
 * 区间视图的全部单元格：各段首尾相接拼成一张连续的周网格。
 * 每段从段首的周日起、补到段尾所在周的周六，type 相对该段所在月份判定
 */
export function buildRangeCells(segments: [Date, Date][]): CalendarDayCell[] {
  return segments.flatMap(([from, to]) => collectDays(from, weekEnd(to), from));
}

/** 按 key 函数把事项分组，组内保持传入顺序；日期无法解析的事项直接跳过 */
export function groupEvents<T extends { date: unknown }>(events: T[], key: (date: Date) => string, timeZone?: string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const event of events) {
    const date = toDay(event.date, timeZone);
    if (!date)
      continue;
    const k = key(date);
    const list = groups.get(k);
    if (list)
      list.push(event);
    else
      groups.set(k, [event]);
  }
  return groups;
}

/** 区间视图的标题：同月写「2026 年 10 月」，跨月写「2026 年 10 月 - 2026 年 11 月」 */
export function formatRangeTitle(segments: [Date, Date][]): string {
  const first = segments[0]?.[0];
  const last = segments.at(-1)?.[1];
  if (!first || !last)
    return "";
  const label = (date: Date) => `${date.getFullYear()} 年 ${date.getMonth() + 1} 月`;
  return isSameMonth(first, last) ? label(first) : `${label(first)} - ${label(last)}`;
}
