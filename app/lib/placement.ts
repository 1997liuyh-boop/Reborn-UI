/**
 * 浮层类组件（tooltip / popconfirm 等）共用的方位定义。
 * 各组件的 placement 参数一律从这里取类型与别名映射，
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

/** 驼峰风格的方位命名，作为 Placement 的等价别名 */
export type PlacementAlias =
  | 'topLeft'
  | 'topRight'
  | 'bottomLeft'
  | 'bottomRight'
  | 'leftTop'
  | 'leftBottom'
  | 'rightTop'
  | 'rightBottom';

/** 驼峰方位命名 → 内部 side-align 命名 */
export const PLACEMENT_ALIAS_MAP: Record<PlacementAlias, Placement> = {
  topLeft: 'top-start',
  topRight: 'top-end',
  bottomLeft: 'bottom-start',
  bottomRight: 'bottom-end',
  leftTop: 'left-start',
  leftBottom: 'left-end',
  rightTop: 'right-start',
  rightBottom: 'right-end',
};

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

/** 全部驼峰别名，与 placements 一一对应 */
export const placementAliases: PlacementAlias[] = Object.keys(PLACEMENT_ALIAS_MAP) as PlacementAlias[];

/** 解析 placement（兼容驼峰别名），拆分为方向与对齐方式；缺省对齐方式按 center 处理 */
export function resolvePlacement(
  placement: Placement | PlacementAlias,
): { side: PlacementSide; align: PlacementAlign } {
  const normalized = PLACEMENT_ALIAS_MAP[placement as PlacementAlias] ?? (placement as Placement);
  const [side, rawAlign] = normalized.split('-') as [PlacementSide, PlacementAlign | undefined];

  return { side, align: rawAlign ?? 'center' };
}
