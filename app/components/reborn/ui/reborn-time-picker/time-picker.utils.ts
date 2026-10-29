import type { TimeUnit } from "./reborn-time-panel.config";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

export interface TimeState {
  hour: number;
  minute: number;
  second: number;
  millisecond: number;
}

/** 方括号内是展示文字，不参与时间列的判定。 */
export function getTimeUnits(format: string): TimeUnit[] {
  const tokens = format.replace(/\[[^\]]*\]/g, "");
  const units: TimeUnit[] = [];
  if (/H/i.test(tokens)) units.push("hour");
  if (/m/.test(tokens)) units.push("minute");
  if (/s/.test(tokens)) units.push("second");
  if (/S/.test(tokens)) units.push("millisecond");
  return units;
}

/** 严格解析输入；未展示的单位归零，避免继承系统时刻。 */
export function parseTimeValue(value: string, format: string): TimeState | null {
  if (!value || !getTimeUnits(format).length) return null;
  const parsed = dayjs(value, format, true);
  if (!parsed.isValid()) return null;
  const units = getTimeUnits(format);
  return {
    hour: units.includes("hour") ? parsed.hour() : 0,
    minute: units.includes("minute") ? parsed.minute() : 0,
    second: units.includes("second") ? parsed.second() : 0,
    millisecond: units.includes("millisecond") ? parsed.millisecond() : 0,
  };
}

export function formatTimeValue(state: TimeState, format: string): string {
  return dayjs()
    .hour(state.hour)
    .minute(state.minute)
    .second(state.second)
    .millisecond(state.millisecond)
    .format(format);
}

/** 单组选项配合首尾留白定位，边界停留在首项或末项，不再循环。 */
export function getCenteredScrollTop(
  value: number,
  count: number,
  rowHeight: number,
): number {
  return Math.max(0, Math.min(value, count - 1)) * rowHeight;
}

export function getScrollValue(
  scrollTop: number,
  count: number,
  rowHeight: number,
): number {
  return Math.max(0, Math.min(Math.round(scrollTop / rowHeight), count - 1));
}
