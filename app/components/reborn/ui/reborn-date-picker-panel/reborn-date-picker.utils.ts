import dayjs from 'dayjs';
import advancedFormat from 'dayjs/plugin/advancedFormat';
import customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
export { dayjs };

export function quarterStartDate(year: number, quarter: number): Date { return new Date(year, (quarter - 1) * 3, 1); }
export function quarterOf(date: Date): number { return Math.floor(date.getMonth() / 3) + 1; }
export function parseDateValue(value: unknown, format = ''): Date | null {
  if (value === undefined || value === null || value === '') return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (format.includes('Q')) {
    const match = String(value).match(/(\d{4})\D*([1-4])/);
    if (match) return quarterStartDate(Number(match[1]), Number(match[2]));
  }
  const date = format ? dayjs(value as string, format) : dayjs(value as string | number);
  return date.isValid() ? date.toDate() : null;
}
export function dayKey(date: Date): number { return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime(); }
export function weekStartOf(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay()); }
export function weekEndOf(date: Date): Date { return new Date(date.getFullYear(), date.getMonth(), date.getDate() - date.getDay() + 6); }
