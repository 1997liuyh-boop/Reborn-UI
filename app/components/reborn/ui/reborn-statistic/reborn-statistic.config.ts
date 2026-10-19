import type { ClassValue } from 'tailwind-variants';
import { tv } from '~/lib/tv';

/** 统计数值和倒计时共用结构，等宽数字避免计时过程中相邻内容抖动。 */
export const statisticTheme = tv({
  slots: {
    root: 'reborn-statistic flex min-w-0 flex-col gap-1',
    title: 'text-base text-gray-8',
    content: 'flex flex-wrap items-baseline gap-x-1 text-2xl font-medium text-gray-10 tabular-nums',
    prefix: 'inline-flex shrink-0 items-center',
    value: 'break-all',
    suffix: 'inline-flex shrink-0 items-center',
  },
});

/** 按内部节点覆盖类名，Countdown 沿用相同的结构键。 */
export interface StatisticUI {
  /** 根容器 */
  root?: ClassValue;
  /** 标题，仅在传入 title 或标题插槽时渲染 */
  title?: ClassValue;
  /** 数值区，包含前缀、数值和后缀 */
  content?: ClassValue;
  /** 前缀 */
  prefix?: ClassValue;
  /** 格式化后的数值文本 */
  value?: ClassValue;
  /** 后缀 */
  suffix?: ClassValue;
}

export default statisticTheme;
