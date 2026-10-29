import type { DatePickerType } from '../reborn-date-picker-panel/reborn-date-picker-panel.config';
import type { DatePickerPanelProps } from '../reborn-date-picker-panel/RebornDatePickerPanel.vue';
import { dayjs, quarterStartDate, weekEndOf, weekStartOf } from '../reborn-date-picker-panel/reborn-date-picker.utils';

type InputRules = Pick<DatePickerPanelProps, 'start' | 'end' | 'disabledMethod' | 'disabledHours' | 'disabledMinutes' | 'disabledSeconds' | 'disabledMilliseconds'>;

/** 编辑格式独立于展示格式与绑定格式，避免自定义文案参与解析。 */
export function pickerInputFormat(type: DatePickerType): string {
  if (type.startsWith('year')) return 'YYYY';
  if (type.startsWith('month')) return 'YYYY-MM';
  if (type.startsWith('quarter')) return 'YYYY-[Q]Q';
  if (type.startsWith('datetime')) return 'YYYY-MM-DD HH:mm:ss';
  return 'YYYY-MM-DD';
}

/** 严格校验每种粒度；季度显式解析，避免解析插件版本差异。 */
export function parsePickerInput(text: string, type: DatePickerType): Date | null {
  if (type.startsWith('quarter')) {
    const match = /^(\d{4})-Q([1-4])$/.exec(text);
    return match ? quarterStartDate(Number(match[1]), Number(match[2])) : null;
  }
  const date = dayjs(text, pickerInputFormat(type), true);
  return date.isValid() ? date.toDate() : null;
}

/** 范围按时间排序；周类型统一折算为周日至周六。 */
export function normalizePickerDates(dates: Date[], type: DatePickerType): Date[] {
  if (type === 'week') return [weekStartOf(dates[0]!), weekEndOf(dates[0]!)];
  if (!type.endsWith('range')) return dates;
  const sorted = [...dates].sort((a, b) => a.getTime() - b.getTime());
  return type === 'weekrange' ? [weekStartOf(sorted[0]!), weekEndOf(sorted[1]!)] : sorted;
}

/** 年月季度按整个单位与边界的交集判定，日期时间再检查时分秒。 */
export function isPickerInputBlocked(date: Date, type: DatePickerType, rules: InputRules, role: 'start' | 'end' = 'start', comparing: Date | null = null): boolean {
  const unit = type.startsWith('year') ? 'year' : type.startsWith('month') ? 'month' : type.startsWith('quarter') ? 'quarter' : type.startsWith('week') ? 'week' : 'date';
  const value = dayjs(date);
  const first = unit === 'year' || unit === 'month' ? value.startOf(unit) : value;
  const last = unit === 'quarter' ? value.add(3, 'month').subtract(1, 'day') : unit === 'year' || unit === 'month' ? value.endOf(unit) : value;
  if (rules.start && last.isBefore(dayjs(rules.start), 'day')) return true;
  if (rules.end && first.isAfter(dayjs(rules.end), 'day')) return true;
  if (rules.disabledMethod?.(new Date(date), unit)) return true;
  if (!type.startsWith('datetime')) return false;
  const other = comparing ? dayjs(comparing).format('HH:mm:ss') : null;
  const h = date.getHours();
  const m = date.getMinutes();
  const s = date.getSeconds();
  return !!(rules.disabledHours?.(role, other)?.includes(h)
    || rules.disabledMinutes?.(h, role, other)?.includes(m)
    || rules.disabledSeconds?.(h, m, role, other)?.includes(s)
    || rules.disabledMilliseconds?.(h, m, s, role, other)?.includes(date.getMilliseconds()));
}
