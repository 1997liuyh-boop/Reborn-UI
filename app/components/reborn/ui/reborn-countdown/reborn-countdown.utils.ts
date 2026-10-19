/** 倒计时从大到小分配单位，未出现在格式中的单位会累计到下一层。 */
const timeUnits = [
  ['D', 86400000],
  ['H', 3600000],
  ['m', 60000],
  ['s', 1000],
  ['S', 1],
] as const;

/** 格式中的方括号是原样输出的文字，不参与单位识别。 */
export function formatCountdown(milliseconds: number, format = 'HH:mm:ss'): string {
  let remaining = Number.isFinite(milliseconds) ? Math.max(0, Math.floor(milliseconds)) : 0;
  const unitsFormat = format.replace(/\[[^\]]*\]/g, '');
  const values = new Map<string, number>();
  for (const [unit, size] of timeUnits) {
    if (unitsFormat.includes(unit)) {
      values.set(unit, Math.floor(remaining / size));
      remaining %= size;
    }
  }
  return format.replace(/\[([^\]]*)\]|D+|H+|m+|s+|S+/g, (token, literal: string | undefined) => {
    if (literal !== undefined) return literal;
    return String(values.get(token[0]!) ?? 0).padStart(token.length, '0');
  });
}
