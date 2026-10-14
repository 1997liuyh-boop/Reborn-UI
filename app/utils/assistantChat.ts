/**
 * AI 助手抽屉共用的时间格式化
 *
 * 聊天场景里多数记录发生在当天，只显示「时:分」最省地方；
 * 跨天补月日、跨年补年份，避免不同日期的同一时刻看起来一样。
 */
export function formatChatTime(timestamp: number, now = Date.now()): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const today = new Date(now);
  const pad = (n: number) => String(n).padStart(2, "0");
  const hm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;

  if (date.toDateString() === today.toDateString()) return hm;
  const md = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  if (date.getFullYear() === today.getFullYear()) return `${md} ${hm}`;
  return `${date.getFullYear()}-${md} ${hm}`;
}
