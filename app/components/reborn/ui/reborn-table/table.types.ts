import type { ClassValue } from 'tailwind-variants';
import type { CSSProperties, Ref, VNodeChild } from 'vue';
import type { TooltipUI } from '../reborn-tooltip/reborn-tooltip.config';
import type { Placement } from '~/lib/placement';

export type TableKey = string | number;
export type TableRow = Record<string, unknown>;
export type TableOrder = 'ascending' | 'descending' | null;
export type TableSize = 'sm' | 'md' | 'lg';
export type TableAlign = 'left' | 'center' | 'right';
export interface TableSort { prop: string; order: TableOrder }
export interface TableFilter { text: string; value: string | number | boolean }
export type TableFilters = Record<string, TableFilter['value'][]>;
export interface TableCellScope { row: TableRow; column: TableColumn; $index: number; columnIndex: number }
export interface TableTooltipScope extends TableCellScope { cellValue: unknown; content: string }
export interface TableTooltipOptions {
  placement?: Placement;
  openDelay?: number;
  closeDelay?: number;
  arrow?: boolean | { pointAtCenter?: boolean };
  disabled?: boolean;
  color?: string;
  ui?: TooltipUI;
}
export type TableTooltipFormatter = (scope: TableTooltipScope) => VNodeChild;
export interface TableColumn {
  /** 字段路径，支持 user.name。 */
  prop?: string;
  /** 表头文字。 */
  label?: string;
  /** 独立列标识，筛选和具名插槽优先使用它。 */
  columnKey?: string;
  /** 列类别；selection 为多选，radio 为单选，drag 渲染行拖拽排序手柄。 */
  type?: 'default' | 'selection' | 'radio' | 'index' | 'expand' | 'drag';
  /** 列宽，数字或 px 字符串。 */
  width?: number | string;
  /** 未指定宽度时的最小列宽。 */
  minWidth?: number | string;
  /** 固定列；true 等价 left。 */
  fixed?: boolean | 'left' | 'right';
  /** 内容水平对齐。 */
  align?: TableAlign;
  /** 表头对齐，默认沿用 align。 */
  headerAlign?: TableAlign;
  /** true 本地排序，custom 仅发送排序事件。 */
  sortable?: boolean | 'custom';
  /** 本地比较函数。 */
  sortMethod?: (a: TableRow, b: TableRow) => number;
  /** 自定义排序周期。 */
  sortOrders?: TableOrder[];
  /** 筛选选项。 */
  filters?: TableFilter[];
  /** 单条筛选规则，同列取或、不同列取且。 */
  filterMethod?: (value: TableFilter['value'], row: TableRow, column: TableColumn) => boolean;
  /** 是否允许多选筛选值。 */
  filterMultiple?: boolean;
  /** 外部受控筛选值，未传则内部维护。 */
  filteredValue?: TableFilter['value'][];
  /** 选择列是否允许选中此行。 */
  selectable?: (row: TableRow, index: number) => boolean;
  /** 数据更新时保留选中键，需要稳定 rowKey。 */
  reserveSelection?: boolean;
  /** 序号起点或生成函数。 */
  index?: number | ((index: number) => number | string);
  /** 单元格格式化；字符串按文本渲染，不注入 HTML。 */
  formatter?: (row: TableRow, column: TableColumn, value: unknown, index: number) => VNodeChild;
  /** 内容真实溢出时省略并显示提示；false 覆盖表级设置。 */
  showOverflowTooltip?: boolean | TableTooltipOptions;
  /** 列级提示配置，覆盖表级同名配置。 */
  tooltipOptions?: TableTooltipOptions;
  /** 列级提示内容，优先于表级格式化。 */
  tooltipFormatter?: TableTooltipFormatter;
  /** 单元格类名。 */
  className?: ClassValue;
  /** 表头类名。 */
  labelClassName?: ClassValue;
  /** 具名内容插槽；默认使用 cell-列标识。 */
  slotName?: string;
  /** 分组表头子列。 */
  children?: TableColumn[];
  /** 是否隐藏该列。 */
  hidden?: boolean;
  /** 声明式列解析后的内容渲染器。 */
  cellRender?: (scope: TableCellScope) => VNodeChild;
  /** 声明式列解析后的表头渲染器。 */
  headerRender?: (scope: { column: TableColumn; $index: number }) => VNodeChild;
}
export interface TablePagination { total?: number; layout?: string; pageSizes?: number[]; background?: boolean; hideOnSinglePage?: boolean }
export interface TableTreeProps { children?: string; hasChildren?: string }
export interface TableTreeNode { level: number; expanded: boolean; loading: boolean; loaded: boolean }
export type TableLoad = (row: TableRow, treeNode: TableTreeNode, resolve: (children: TableRow[]) => void) => void | Promise<void>;
export type TableSpan = [number, number] | { rowspan: number; colspan: number } | undefined;
export type TableUi = Partial<Record<'root' | 'scrollbar' | 'table' | 'thead' | 'headerCell' | 'row' | 'cell' | 'cellContent' | 'expand' | 'empty' | 'loading' | 'summary' | 'footer' | 'pagination', ClassValue>>;
export interface TableProps {
  /** 只读数据源，组件不会原地排序或修改行对象。 */
  data?: TableRow[];
  /** 数据驱动列；提供时优先于声明式列。 */
  columns?: TableColumn[];
  /** 稳定唯一行键，跨页选择和树数据必须提供。 */
  rowKey?: string | ((row: TableRow) => TableKey);
  /** 单行高度档位。 */
  size?: TableSize;
  /** 外框与纵向分隔线。 */
  border?: boolean;
  /** 交替行底色。 */
  stripe?: boolean;
  /** 是否展示表头。 */
  showHeader?: boolean;
  /** 是否为表头设置灰阶背景。 */
  headerBackground?: boolean;
  /** 是否显示整行悬停背景。 */
  hover?: boolean;
  /** 高度；设置后固定表头。 */
  height?: number | string;
  /** 最大高度；超过时滚动并固定表头。 */
  maxHeight?: number | string;
  /** 有 height 或 maxHeight 时是否固定表头，无高度时不固定。 */
  fixedHeader?: boolean;
  /** 原生表格布局算法；fixed 固定列宽，auto 按内容分配。 */
  tableLayout?: 'fixed' | 'auto';
  /** 全表普通列的溢出提示，可被列级设置覆盖。 */
  showOverflowTooltip?: boolean | TableTooltipOptions;
  /** 全表提示配置，复用 RebornTooltip。 */
  tooltipOptions?: TableTooltipOptions;
  /** 全表提示内容格式化，tooltip 插槽优先。 */
  tooltipFormatter?: TableTooltipFormatter;
  /** 加载中覆盖表体并禁用内置操作。 */
  loading?: boolean;
  /** 空数据文案。 */
  emptyText?: string;
  /** 当前行高亮；点击行更新 currentRowKey。 */
  highlightCurrentRow?: boolean;
  /** 首次排序状态。 */
  defaultSort?: TableSort;
  /** 远程模式仅发送筛选、排序、分页事件，不处理数据。 */
  remote?: boolean;
  /** 分页配置，默认不分页。 */
  pagination?: boolean | TablePagination;
  /** 首次渲染时展开所有行。 */
  defaultExpandAll?: boolean;
  /** 树形数据字段映射。 */
  treeProps?: TableTreeProps;
  /** 开启树形子节点按需加载，需稳定 rowKey。 */
  lazy?: boolean;
  /** 首次展开时加载子节点；通过 resolve 返回结果，抛错或拒绝可重试。 */
  load?: TableLoad;
  /** 树节点每级缩进像素。 */
  indent?: number;
  /** 是否显示合计行。 */
  showSummary?: boolean;
  /** 默认合计行首列文字。 */
  sumText?: string;
  /** 合计值，数据为筛选排序后的全部根节点，远程模式为传入数据。 */
  summaryMethod?: (scope: { columns: TableColumn[]; data: TableRow[] }) => VNodeChild[];
  /** 合并单元格；[0,0] 表示被其他单元格覆盖。 */
  spanMethod?: (scope: TableCellScope) => TableSpan;
  /** 行类名。 */
  rowClassName?: ClassValue | ((scope: { row: TableRow; rowIndex: number }) => ClassValue);
  /** 单元格类名。 */
  cellClassName?: ClassValue | ((scope: TableCellScope) => ClassValue);
  /** 表格可访问名称。 */
  ariaLabel?: string;
  /** 根节点附加类名。 */
  class?: ClassValue;
  /** 内部节点样式覆盖。 */
  ui?: TableUi;
}
export interface TableModels {
  selectedKeys: Ref<TableKey[]>;
  expandedRowKeys: Ref<TableKey[]>;
  currentRowKey: Ref<TableKey | undefined>;
  currentPage: Ref<number>;
  pageSize: Ref<number>;
}
export interface TableChange { action: 'sort' | 'filter' | 'paginate'; page: number; pageSize: number; sort: TableSort; filters: TableFilters }
/** 拖拽排序结束时的结果；索引都相对同级数组（根行为 data，子行为父行的 children）。 */
export interface TableRowDragEnd {
  /** 被拖动的行。 */
  row: TableRow;
  /** 落点参照行。 */
  targetRow: TableRow;
  /** 放在参照行之前还是之后。 */
  position: 'before' | 'after';
  /** 移动前在同级数组中的索引。 */
  oldIndex: number;
  /** 移动后在同级数组中的索引。 */
  newIndex: number;
  /** 父行，根级行为 undefined。 */
  parent?: TableRow;
  /** 应用本次移动后的新根数组：沿途父行浅拷贝并替换子数组，原数组与行对象都不改动，直接回写给 data 即可。 */
  data: TableRow[];
}
export interface TableEmits {
  'selection-change': [rows: TableRow[]];
  'select': [selection: TableRow[], row: TableRow];
  'select-all': [selection: TableRow[]];
  'current-change': [row: TableRow | undefined, oldRow: TableRow | undefined];
  'row-click': [row: TableRow, column: TableColumn, event: MouseEvent];
  'row-dblclick': [row: TableRow, column: TableColumn, event: MouseEvent];
  'cell-click': [row: TableRow, column: TableColumn, cell: HTMLElement, event: MouseEvent];
  'sort-change': [sort: TableSort & { column?: TableColumn }];
  'filter-change': [filters: TableFilters];
  'expand-change': [row: TableRow, expandedRows: TableRow[]];
  'page-change': [page: number];
  'page-size-change': [size: number];
  'change': [state: TableChange];
  'row-drag-end': [payload: TableRowDragEnd];
}
export type TableNotify = <K extends keyof TableEmits>(event: K, ...args: TableEmits[K]) => void;
export interface TableScrollToOptions {
  top?: number;
  left?: number;
  /** 默认立即定位，smooth 使用同一动画同步两轴。 */
  behavior?: 'auto' | 'smooth';
  /** 平滑滚动时长，单位毫秒。 */
  duration?: number;
}
export interface TableExpose {
  clearSelection: () => void;
  getSelectionRows: () => TableRow[];
  toggleRowSelection: (row: TableRow, selected?: boolean) => void;
  toggleAllSelection: () => void;
  setCurrentRow: (row?: TableRow) => void;
  toggleRowExpansion: (row: TableRow, expanded?: boolean) => void;
  clearSort: () => void;
  sort: (prop: string, order: TableOrder) => void;
  clearFilter: (columnKeys?: string[]) => void;
  doLayout: () => void;
  scrollTo: (options: TableScrollToOptions) => Promise<void>;
  setScrollTop: (value: number) => void;
  setScrollLeft: (value: number) => void;
}
export interface TableHeaderCell { column: TableColumn; colSpan: number; rowSpan: number; start: number }
export interface TableVisibleRow { row: TableRow; key: TableKey; level: number; hasChildren: boolean; index: number; loading?: boolean }
export type TableCellStyle = CSSProperties;
