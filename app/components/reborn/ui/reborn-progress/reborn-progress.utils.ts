import type { ProgressFlowDirection, ProgressGradient, ProgressSegment, ProgressSize, ProgressStrokeColor, ProgressType } from './reborn-progress.config';
import { progressMetrics } from './reborn-progress.config';

export interface ProgressRange { from: number; to: number }
export interface ProgressColorRange extends ProgressRange { color: string }
export interface ProgressArcGeometry {
  diameter: number;
  strokeWidth: number;
  radius: number;
  start: number;
  sweep: number;
  length: number;
  /** 1 为顺时针，-1 为逆时针（reverse 方向）。 */
  direction: 1 | -1;
}

/** 无效数字回退为零，防止尺寸与无障碍属性出现非有限值。 */
export function normalizePercent(value: number): number {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}

/** 限制节点数量，避免外部数据意外创建大量 DOM。 */
export function normalizeSteps(value: number): number {
  return Number.isFinite(value) ? Math.min(1000, Math.max(0, Math.floor(value))) : 0;
}

/** 仅对象形式表示渐变，数组保留给步骤颜色。 */
export function getGradientStops(color?: ProgressStrokeColor): ProgressGradient['stops'] {
  if (!color || typeof color === 'string' || Array.isArray(color)) return [];
  const stops = color.stops.filter(stop => Number.isFinite(stop.offset) && stop.color)
    .map(stop => ({ offset: normalizePercent(stop.offset), color: stop.color }))
    .sort((a, b) => a.offset - b.offset);
  // CSS 渐变至少需要两个色标，单色标退化为纯色。
  return stops.length === 1 ? [{ offset: 0, color: stops[0]!.color }, { offset: 100, color: stops[0]!.color }] : stops;
}

/** 分段按累计终点排序，同终点采用最后配置，不改写调用方数组。 */
export function getColorRanges(segments: ProgressSegment[], fallback: string): ProgressColorRange[] {
  const endpoints = new Map<number, string>();
  for (const segment of segments) {
    if (Number.isFinite(segment.percentage) && segment.percentage > 0 && segment.color) {
      endpoints.set(normalizePercent(segment.percentage), segment.color);
    }
  }
  const ranges: ProgressColorRange[] = [];
  let from = 0;
  for (const [to, color] of [...endpoints].sort((a, b) => a[0] - b[0])) {
    ranges.push({ from, to, color });
    from = to;
  }
  if (from < 100) ranges.push({ from, to: 100, color: fallback });
  return ranges;
}

/** 仪表盘从左下方顺时针绘制 270 度，保留底部缺口；reverse 方向镜像为右下方逆时针起笔。 */
export function getArcGeometry(type: ProgressType, size: ProgressSize, stepped: boolean, flow: ProgressFlowDirection = 'normal'): ProgressArcGeometry {
  const metrics = progressMetrics[size];
  const strokeWidth = stepped ? metrics.stepWidth : metrics.strokeWidth;
  const radius = (metrics.diameter - strokeWidth) / 2;
  const sweep = type === 'dashboard' ? 270 : 360;
  const direction: 1 | -1 = flow === 'reverse' ? -1 : 1;
  const start = type === 'dashboard' ? (direction === 1 ? 135 : 45) : -90;
  return { diameter: metrics.diameter, strokeWidth, radius, sweep, start, length: 2 * Math.PI * radius * sweep / 360, direction };
}

/** 环形步骤按弧长留出 2px，过密时最多使用半个节点的弧长作为间距。 */
export function getStepRanges(steps: number, geometry?: ProgressArcGeometry): ProgressRange[] {
  const count = normalizeSteps(steps) || 1;
  const gap = steps > 0 && geometry ? Math.min(2 / geometry.length * 100, 50 / count) : 0;
  return Array.from({ length: count }, (_, index) => ({
    from: index * 100 / count + (geometry?.sweep === 360 || index > 0 ? gap / 2 : 0),
    to: (index + 1) * 100 / count - (geometry?.sweep === 360 || index < count - 1 ? gap / 2 : 0),
  }));
}

/** 完整圆拆成两条弧，解决 SVG 单弧首尾相同时不显示的问题；direction 为 -1 时逆时针绘制。 */
export function getArcPath(geometry: ProgressArcGeometry, from: number, to: number): string {
  if (to <= from) return '';
  const center = geometry.diameter / 2;
  const point = (percent: number) => {
    const angle = (geometry.start + geometry.direction * geometry.sweep * percent / 100) * Math.PI / 180;
    return `${center + geometry.radius * Math.cos(angle)} ${center + geometry.radius * Math.sin(angle)}`;
  };
  const middle = (from + to) / 2;
  const sweepFlag = geometry.direction === 1 ? 1 : 0;
  const arc = (end: number, sweep: number) => ` A ${geometry.radius} ${geometry.radius} 0 ${sweep > 180 ? 1 : 0} ${sweepFlag} ${point(end)}`;
  const sweep = geometry.sweep * (to - from) / 100;
  return sweep >= 359.999 ? `M ${point(from)}${arc(middle, sweep / 2)}${arc(to, sweep / 2)}` : `M ${point(from)}${arc(to, sweep)}`;
}
