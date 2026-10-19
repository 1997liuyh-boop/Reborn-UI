/** 按精度四舍五入后替换数字分隔符，不依赖用户设备的地区设置。 */
export function formatStatistic(value: number, precision = 0, decimalSeparator = '.', groupSeparator = ','): string {
  const digits = Number.isFinite(precision) ? Math.min(20, Math.max(0, Math.trunc(precision))) : 0;
  const number = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
    useGrouping: true,
  }).formatToParts(number).map((part) => {
    if (part.type === 'decimal') return decimalSeparator;
    if (part.type === 'group') return groupSeparator;
    return part.value;
  }).join('');
}
