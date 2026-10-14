<script setup lang="ts">
import type { VNodeChild } from 'vue';
import type { TableCellScope, TableColumn, TableEmits, TableExpose, TableKey, TableModels, TableOrder, TableProps, TableRow, TableScrollToOptions, TableTooltipScope } from './table.types';
import { h, ref, useAttrs, useSlots } from 'vue';
import { collectColumns } from './table.columns';
import TableView from './TableView';

defineOptions({ name: 'RebornTable', inheritAttrs: false });
const props = withDefaults(defineProps<TableProps>(), {
  data: () => [], rowKey: 'id', size: 'md', border: false, stripe: false,
  showHeader: true, headerBackground: false, hover: true, loading: false,
  emptyText: '暂无数据', highlightCurrentRow: false, remote: false, pagination: false,
  defaultExpandAll: false, treeProps: () => ({ children: 'children', hasChildren: 'hasChildren' }), indent: 16,
  fixedHeader: true, tableLayout: 'fixed', lazy: false, showOverflowTooltip: false,
  showSummary: false, sumText: '合计', ariaLabel: '数据表格', ui: () => ({}),
});
const emit = defineEmits<TableEmits>();
defineSlots<{
  /** 声明式列，仅在未传 columns 时生效。 */
  default?: () => VNodeChild;
  /** 所有列的默认表头。 */
  header?: (scope: { column: TableColumn; $index: number }) => VNodeChild;
  /** 所有普通列的默认单元格。 */
  cell?: (scope: TableCellScope) => VNodeChild;
  /** 溢出提示内容，优先于 tooltipFormatter。 */
  tooltip?: (scope: TableTooltipScope) => VNodeChild;
  /** 展开内容。 */
  expand?: (scope: { row: TableRow; $index: number }) => VNodeChild;
  /** 空数据展示。 */
  empty?: () => VNodeChild;
  /** 加载遮罩内容。 */
  loading?: () => VNodeChild;
  /** 与滚动区域同级的底部操作区。 */
  footer?: (scope: { data: TableRow[]; selection: TableRow[] }) => VNodeChild;
  /** 滚动内容之后的追加区域。 */
  append?: () => VNodeChild;
}>();
/** 选中行键，支持跨页保留。 */
const selectedKeys = defineModel<TableKey[]>('selectedKeys', { default: () => [] });
/** 展开行键。 */
const expandedRowKeys = defineModel<TableKey[]>('expandedRowKeys', { default: () => [] });
/** 当前行的唯一键。 */
const currentRowKey = defineModel<TableKey>('currentRowKey');
/** 当前页，从 1 开始。 */
const currentPage = defineModel<number>('currentPage', { default: 1 });
/** 每页根节点条数。 */
const pageSize = defineModel<number>('pageSize', { default: 10 });
const slots = useSlots();
const attrs = useAttrs();
const view = ref<TableExpose>();
const models: TableModels = { selectedKeys, expandedRowKeys, currentRowKey, currentPage, pageSize };

/** 在真正的渲染上下文求值列插槽，保证条件列与 SSR 首屏都可用。 */
const RenderTable = () => h(TableView, {
  ...attrs, ref: view, table: props, models, notify: emit,
  columns: props.columns ?? collectColumns(slots.default?.(), props.data[0]),
}, Object.fromEntries(Object.entries(slots).filter(([name]) => name !== 'default')));

function clearSelection() { view.value?.clearSelection(); }
function getSelectionRows() { return view.value?.getSelectionRows() ?? []; }
function toggleRowSelection(row: TableRow, selected?: boolean) { view.value?.toggleRowSelection(row, selected); }
function toggleAllSelection() { view.value?.toggleAllSelection(); }
function setCurrentRow(row?: TableRow) { view.value?.setCurrentRow(row); }
function toggleRowExpansion(row: TableRow, expanded?: boolean) { view.value?.toggleRowExpansion(row, expanded); }
function clearSort() { view.value?.clearSort(); }
function sort(prop: string, order: TableOrder) { view.value?.sort(prop, order); }
function clearFilter(columnKeys?: string[]) { view.value?.clearFilter(columnKeys); }
function doLayout() { view.value?.doLayout(); }
function scrollTo(options: TableScrollToOptions) { return view.value?.scrollTo(options) ?? Promise.resolve(); }
function setScrollTop(value: number) { view.value?.setScrollTop(value); }
function setScrollLeft(value: number) { view.value?.setScrollLeft(value); }
defineExpose({ clearSelection, getSelectionRows, toggleRowSelection, toggleAllSelection, setCurrentRow, toggleRowExpansion, clearSort, sort, clearFilter, doLayout, scrollTo, setScrollTop, setScrollLeft });
</script>

<template>
  <RenderTable />
</template>
