/**
 * 日期选择器（reborn-date-picker）与日期面板（reborn-date-picker-panel）两份演示共用的工具。
 *
 * 放在 examples/_shared 而不是任一组件的演示目录里：两个组件的演示都要用，
 * 放进其中一个目录会让另一份演示跨目录引用对方的私有文件。
 */
import type { DatePickerType, ViewType } from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import { readonly, shallowRef } from "vue";

/** 本地时区的 YYYY-MM-DD，用于回显 Date 与比对节假日 */
export function toDateKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** 把绑定值格式化为可读文本：Date 标出类型，字符串原样，数组逐项展开，null 单独标出 */
export function formatDisplay(val: unknown): string {
  if (Array.isArray(val)) return val.length ? `[${val.map(formatDisplay).join(", ")}]` : "[]";
  if (val instanceof Date) return `Date(${toDateKey(val)})`;
  if (val === null || val === undefined) return "null";
  return `"${val}"`;
}

/** 面板演示保留自己的空值措辞，日期和数组格式化共用同一实现。 */
export function formatPanelDisplay(value: unknown): string {
  if (Array.isArray(value) && !value.length) return "空数组";
  return value ? formatDisplay(value) : "未选择";
}

/** 多选、范围与按周类型的绑定值是数组，清空后回到 []；其余类型清空后是空值 */
export const arrayValueTypes: DatePickerType[] = [
  "dates",
  "months",
  "quarters",
  "years",
  "week",
  "weekrange",
  "daterange",
  "monthrange",
  "quarterrange",
  "yearrange",
  "datetimerange",
];

/**
 * 按选择类型推导 value-format：不同类型的取值精度不同，演练场切换类型时格式要随之切换。
 * 季度用 Q 令牌输出（2024-Q2），组件同时支持按该格式回读。
 */
export function valueFormatOf(type: DatePickerType): string {
  if (["year", "years", "yearrange"].includes(type)) return "YYYY";
  if (["month", "months", "monthrange"].includes(type)) return "YYYY-MM";
  if (["quarter", "quarters", "quarterrange"].includes(type)) return "YYYY-[Q]Q";
  if (["datetime", "datetimerange"].includes(type)) return "YYYY-MM-DD HH:mm";
  return "YYYY-MM-DD";
}

/** 事件日志的单条记录 */
export interface EventLog {
  id: number;
  name: string;
  detail: string;
}

/**
 * 事件日志：每个调用方各持一份列表与自增序号，新事件插到最前，只保留最近 limit 条。
 * 序号只用作列表 key，各章节独立计数即可；列表只读，增删都走 push / clear。
 */
export function useEventLog(limit: number) {
  const logs = shallowRef<EventLog[]>([]);
  let seq = 0;

  /** 记录一条事件 */
  function push(name: string, detail: string) {
    logs.value = [{ id: ++seq, name, detail }, ...logs.value].slice(0, limit);
  }

  /** 清空日志 */
  function clear() {
    logs.value = [];
  }

  return { logs: readonly(logs), push, clear };
}

/** 按事件名生成监听函数，演练场与「事件」分组各写各的日志 */
export function createHandlers(log: (name: string, detail: string) => void) {
  return {
    /** 绑定值提交 */
    onChange: (value: unknown) => log("change", formatDisplay(value)),
    /** 下拉框展开 / 收起 */
    onVisibleChange: (visible: boolean) => log("visible-change", String(visible)),
    /** 范围类型点选日期，第一次点选时终点为 null */
    onCalendarChange: (value: [Date, Date | null]) =>
      log("calendar-change", `[${formatDisplay(value[0])}, ${value[1] ? formatDisplay(value[1]) : "null"}]`),
    /** 面板翻页或切换视图 */
    onPanelChange: (date: Date | [Date, Date], mode: "month" | "year", view: ViewType) =>
      log("panel-change", `${formatDisplay(date)}, "${mode}", "${view}"`),
    /** 点击清空按钮或调用 clear() */
    onClear: () => log("clear", "()"),
    /** 多选类型移除单个标签 */
    onRemoveTag: (value: unknown) => log("remove-tag", formatDisplay(value)),
  };
}

/** 从今天出发偏移若干天，快捷项的 value 写成函数才能每次点击都按当天重新计算 */
export function daysFromToday(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

/** 单值类型的快捷项：返回单个日期 */
export const singleShortcuts = [
  { text: "今天", value: () => daysFromToday(0) },
  { text: "昨天", value: () => daysFromToday(-1) },
  { text: "一周前", value: () => daysFromToday(-7) },
  {
    text: "本月 1 号",
    value: () => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1);
    },
  },
];

/** 范围类型的快捷项返回长度为 2 的数组，依次是起点与终点 */
export const rangeShortcuts = [
  { text: "最近 7 天", value: () => [daysFromToday(-6), daysFromToday(0)] },
  { text: "最近 30 天", value: () => [daysFromToday(-29), daysFromToday(0)] },
  {
    text: "本月",
    value: () => {
      const d = new Date();
      return [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 0)];
    },
  },
];

/** 2024 年清明与劳动节的放假、调休安排 */
export const holidayMarks: Record<string, "休" | "班"> = {
  "2024-04-04": "休",
  "2024-04-05": "休",
  "2024-04-06": "休",
  "2024-04-07": "班",
  "2024-04-28": "班",
  "2024-05-01": "休",
  "2024-05-02": "休",
  "2024-05-03": "休",
  "2024-05-04": "休",
  "2024-05-05": "休",
  "2024-05-11": "班",
};

/** 查询某天是放假还是调休上班，无安排返回 undefined */
export function holidayMark(date: Date) {
  return holidayMarks[toDateKey(date)];
}

/** 周末不可选：只在日期粒度判定，否则切到月视图时「1 号恰逢周末」的月份也会被误禁 */
export function disableWeekend(date: Date, unit: "year" | "month" | "quarter" | "week" | "date") {
  const day = date.getDay();
  return unit === "date" && (day === 0 || day === 6);
}

/**
 * 按粒度禁用：同一个方法通过 unit 参数分流——月粒度只开放 3-8 月，
 * 年粒度禁用 2024 年以前；点标题切到年视图时能看到两套规则同时生效
 */
export function disableByUnit(date: Date, unit: "year" | "month" | "quarter" | "week" | "date") {
  if (unit === "year") return date.getFullYear() < 2024;
  if (unit === "month") return date.getMonth() < 2 || date.getMonth() > 7;
  return false;
}
