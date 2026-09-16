import type { ClassValue } from 'tailwind-variants';

/** 进度条形态，配置步骤数后启用对应的步骤模式。 */
export const progressTypes = ['line', 'circle', 'dashboard'] as const;
export const progressSizes = ['sm', 'md', 'lg'] as const;
export const progressStatuses = ['default', 'success', 'error'] as const;
/** 条纹流动方向，normal 与进度增长方向一致。 */
export const progressFlowDirections = ['normal', 'reverse'] as const;
export type ProgressType = typeof progressTypes[number];
export type ProgressSize = typeof progressSizes[number];
export type ProgressStatus = typeof progressStatuses[number];
export type ProgressFlowDirection = typeof progressFlowDirections[number];

/** 渐变色标位置使用 0–100 的百分比，角度遵循 CSS 渐变方向。 */
export interface ProgressGradient {
  stops: { offset: number; color: string }[];
  angle?: number;
}
export type ProgressStrokeColor = string | string[] | ProgressGradient;

/** 分段使用累计终点；未配置的剩余区间使用默认颜色。 */
export interface ProgressSegment {
  percentage: number;
  color: string;
}
export type ProgressUi = Partial<Record<'root' | 'track' | 'step' | 'fill' | 'stripes' | 'circle' | 'text' | 'icon', ClassValue>>;

/** SVG 使用真实像素坐标，避免 viewBox 缩放改变描边宽度。 */
export const progressMetrics = {
  sm: { diameter: 48, strokeWidth: 4, stepWidth: 6 },
  md: { diameter: 76, strokeWidth: 6, stepWidth: 8 },
  lg: { diameter: 114, strokeWidth: 6, stepWidth: 16 },
} as const;

export default {
  slots: {
    root: 'relative inline-flex items-center gap-[8px] text-primary',
    track: 'relative flex min-w-0 flex-1 gap-[2px]',
    step: 'relative min-w-0 flex-1 overflow-hidden rounded-full bg-gray-3',
    fill: 'absolute inset-y-0 overflow-hidden bg-current transition-[width] duration-300 ease-out motion-reduce:transition-none',
    // 条纹作为独立覆盖层叠在填充之上，不干扰纯色、渐变与分段背景。
    stripes: 'pointer-events-none absolute inset-y-0 left-0 bg-[length:1.25em_1.25em] bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] transition-[width] duration-300 ease-out motion-reduce:transition-none',
    circle: 'block size-full overflow-visible',
    // 百分比文字：字号走令牌，但行高保留 leading-none。
    // root 是 inline-flex items-center，谁高谁撑高整条进度条；令牌自带的 22px 行高会让 line 型平白长高 8px。
    text: 'shrink-0 whitespace-nowrap text-center tabular-nums text-default text-base leading-none',
    icon: 'block size-[18px] shrink-0 text-primary',
  },
  variants: {
    type: {
      line: { root: 'w-full', fill: 'rounded-full' },
      circle: { root: 'shrink-0', text: 'absolute inset-0 flex items-center justify-center whitespace-normal break-words' },
      dashboard: { root: 'shrink-0', text: 'absolute inset-0 flex items-center justify-center whitespace-normal break-words' },
    },
    status: {
      default: { root: 'text-primary', icon: 'text-primary' },
      success: { root: 'text-success', icon: 'text-success' },
      error: { root: 'text-error', icon: 'text-error' },
    },
    size: {
      sm: { step: 'h-[6px]' },
      md: { step: 'h-[8px]' },
      lg: { step: 'h-[16px]' },
    },
    stepped: {
      true: { step: 'shrink-0 flex-none rounded-none', fill: 'rounded-none' },
      false: {},
    },
    textInside: { true: {}, false: {} },
    // reverse 方向让步骤节点从右往左排列，连续进度只有单节点不受影响。
    reversed: { true: { track: 'flex-row-reverse' }, false: {} },
    // 时长与方向通过 CSS 变量注入，动画停留在类里以便 motion-reduce 关闭。
    stripedFlow: {
      true: { stripes: 'animate-[reborn-progress-stripes_var(--reborn-progress-duration,3s)_linear_infinite] [animation-direction:var(--reborn-progress-flow,normal)] motion-reduce:animate-none' },
      false: {},
    },
  },
  compoundVariants: [
    { type: 'line' as const, stepped: true, size: 'sm' as const, class: { root: 'w-fit max-w-full', track: 'overflow-x-auto', step: 'w-[2px]' } },
    // 中号和大号节点带 2px 圆角，小号节点仅 2px 宽保持直角。
    { type: 'line' as const, stepped: true, size: 'md' as const, class: { root: 'w-fit max-w-full', track: 'overflow-x-auto', step: 'w-[32px] rounded-[2px]' } },
    { type: 'line' as const, stepped: true, size: 'lg' as const, class: { root: 'w-fit max-w-full', track: 'overflow-x-auto', step: 'w-[32px] rounded-[2px]' } },
    // 环形中心文字按直径分档：48/76/114px 对应 14/16/24px 字号，均取自 7 级字号令牌。
    { type: ['circle', 'dashboard'] as ('circle' | 'dashboard')[], size: 'sm' as const, class: { root: 'size-[48px]', text: 'text-base', icon: 'size-[18px]' } },
    { type: ['circle', 'dashboard'] as ('circle' | 'dashboard')[], size: 'md' as const, class: { root: 'size-[76px]', text: 'text-lg', icon: 'size-[20px]' } },
    { type: ['circle', 'dashboard'] as ('circle' | 'dashboard')[], size: 'lg' as const, class: { root: 'size-[114px]', text: 'text-2xl', icon: 'size-[28px]' } },
    // 内嵌文字不改变设计高度；极细进度条允许字形溢出，避免文字被裁掉。
    // 10px 低于 7 级字号令牌的下限（--text-sm 12px），无对应档位，只能写字面量。
    { type: 'line' as const, textInside: true, class: { text: 'pointer-events-none absolute inset-y-0 left-0 flex min-w-max items-center justify-end px-[4px] text-[10px] text-white' } },
  ],
  defaultVariants: { type: 'line' as const, size: 'md' as const, status: 'default' as const, stepped: false, textInside: false, reversed: false, stripedFlow: false },
};
