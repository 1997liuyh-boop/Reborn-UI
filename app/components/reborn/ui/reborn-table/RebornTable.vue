<script setup lang="ts">
import type { VNodeChild } from 'vue';
import type { TableCellScope, TableColumn, TableEmits, TableExpose, TableKey, TableModels, TableOrder, TableProps, TableRow, TableScrollToOptions, TableTooltipScope } from './table.types';
import { onBeforeUpdate, shallowRef, useSlots, useTemplateRef } from 'vue';
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
  /** 列可以用 slotName 指定任意名称，作用域与默认单元格相同。 */
  [name: string]: ((scope: any) => VNodeChild) | undefined;
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
const view = useTemplateRef<TableExpose>('view');
const models: TableModels = { selectedKeys, expandedRowKeys, currentRowKey, currentPage, pageSize };

const slots = useSlots();
/** 默认插槽只用来声明列，不转发给表格主体，不参与比较 */
function forwardedSlots() {
  return Object.entries(slots).filter(([name]) => name !== 'default');
}
/**
 * 转发给表格主体的插槽版本号，变化时各行才整体重绘单元格。
 * 模板里的动态插槽转发每次渲染都会生成新的函数，所以不能在 TableView 那一层按函数身份判断，
 * 否则受控的 selectedKeys 一变、本组件随之重渲染，就会让所有行重建。
 * 这里比较的是使用方传入的原始插槽：编译期稳定的插槽在父级更新时仍是同一个函数，
 * 它读到的响应式状态由各行渲染自行追踪，不需要整表重绘；只有插槽名增删，
 * 或插槽函数被整体替换（v-if / v-for 生成的动态插槽、渲染函数写法）时才递增。
 */
const slotRevision = shallowRef(0);
let previousSlots = new Map(forwardedSlots());
onBeforeUpdate(() => {
  const entries = forwardedSlots();
  if (entries.length === previousSlots.size && entries.every(([name, slot]) => previousSlots.get(name) === slot)) return;
  previousSlots = new Map(entries);
  slotRevision.value++;
});

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
  <TableView
    ref="view"
    v-bind="$attrs"
    :table="props"
    :models="models"
    :notify="emit"
    :slot-revision="slotRevision"
    :columns="props.columns ?? collectColumns($slots.default?.(), props.data[0])"
  >
    <template v-for="name in Object.keys($slots).filter(name => name !== 'default')" #[name]="scope">
      <slot :name="name" v-bind="scope ?? {}" />
    </template>
  </TableView>
</template>
