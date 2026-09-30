/**
 * 浮层类组件（tooltip / popconfirm / dropdown / guide 等）共用的方位定义。
 * 各组件的 placement 参数一律从这里取类型，只接受「方向-对齐」的连字符写法，
 * 保证同一个写法在不同浮层组件上取值完全一致。
 */

/** 浮层出现的方向 */
export type PlacementSide = 'top' | 'bottom' | 'left' | 'right';

/** 浮层沿方向轴的对齐方式 */
export type PlacementAlign = 'center' | 'start' | 'end';

/** 方向与对齐方式的连字符写法 */
export type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

/** 全部连字符写法，按方向分组排列，供 demo 下拉、文档枚举使用 */
export const placements: Placement[] = [
  'top',
  'top-start',
  'top-end',
  'bottom',
  'bottom-start',
  'bottom-end',
  'left',
  'left-start',
  'left-end',
  'right',
  'right-start',
  'right-end',
];

/** 把 placement 拆分为方向与对齐方式；缺省对齐方式按 center 处理 */
export function resolvePlacement(placement: Placement): { side: PlacementSide; align: PlacementAlign } {
  const [side, rawAlign] = placement.split('-') as [PlacementSide, PlacementAlign | undefined];

  return { side, align: rawAlign ?? 'center' };
}
