import type { ComputedRef } from 'vue';
import type { TableColumn, TableFilter, TableFilters, TableKey, TableModels, TableNotify, TableOrder, TableProps, TableRow, TableSort } from './table.types';
import { computed, getCurrentInstance, onMounted, ref, shallowRef, watch } from 'vue';
import { useTableLazy } from './table.lazy';
import { flattenRows, getColumnKey, getLeafColumns, getRowKey, getSummary, processRows } from './table.utils';

/** 表格状态独立于 DOM，数据计算与事件共享同一套管线。 */
export function useTableState(props: Readonly<TableProps>, columns: ComputedRef<TableColumn[]>, models: TableModels, notify: TableNotify) {
  const leaves = computed(() => getLeafColumns(columns.value));
  const childrenKey = computed(() => props.treeProps?.children ?? 'children');
  const initialExpansion = shallowRef<TableKey[]>();
  const expandedKeys = computed(() => initialExpansion.value ?? models.expandedRowKeys.value);
  const lazy = useTableLazy(props, expandedKeys);
  const { sourceRows, loadingKeys } = lazy;
  const sorting = ref<TableSort>({ prop: props.defaultSort?.prop ?? '', order: props.defaultSort?.order ?? null });
  const localFilters = ref<TableFilters>({});
  const filters = computed<TableFilters>(() => Object.fromEntries(leaves.value.map((column, index) => {
    const key = getColumnKey(column, index);
    return [key, column.filteredValue ?? localFilters.value[key] ?? []];
  })));
  const sourceIdentity = computed(() => new Map(sourceRows.value.map(item => [item.row, { key: item.key, index: item.index }])));
  const selectionColumn = computed(() => leaves.value.find(column => column.type === 'selection' || column.type === 'radio'));
  const cache = shallowRef(new Map<TableKey, TableRow>());
  const processing = computed(() => {
    const origins = new Map(lazy.tree.value.origins);
    const rows = processRows(lazy.tree.value.rows, leaves.value, sorting.value, filters.value, { remote: props.remote, children: childrenKey.value, origins });
    // 筛选克隆和懒树克隆都归一到源对象，选择缓存与缺省键继续沿用既有身份。
    for (const [row, original] of origins) origins.set(row, lazy.tree.value.origins.get(original) ?? original);
    return { rows, origins };
  });
  const processed = computed(() => processing.value.rows);
  const paginationOptions = computed(() => typeof props.pagination === 'object' ? props.pagination : {});
  const total = computed(() => props.remote ? Math.max(0, Number(paginationOptions.value.total ?? processed.value.length) || 0) : processed.value.length);
  const pageSize = computed(() => Math.max(1, Math.floor(Number(models.pageSize.value)) || 10));
  const page = computed(() => Math.min(Math.max(1, Math.floor(Number(models.currentPage.value)) || 1), Math.max(1, Math.ceil(total.value / pageSize.value))));
  const pageRows = computed(() => !props.pagination || props.remote ? processed.value : processed.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
  const visibleRows = computed(() => flattenRows(pageRows.value, expandedKeys.value, keyOf, childrenKey.value).map(item => ({
    ...item, hasChildren: item.hasChildren || lazy.hasUnloadedChildren(processing.value.origins.get(item.row) ?? item.row), loading: loadingKeys.value.has(item.key),
  })));
  const visibleIndexes = computed(() => new Map(visibleRows.value.map(item => [item.key, item.index])));
  const selectedSet = computed(() => new Set(models.selectedKeys.value));
  const expandedSet = computed(() => new Set(expandedKeys.value));
  const summary = computed(() => props.summaryMethod?.({ columns: leaves.value, data: processed.value }) ?? getSummary(leaves.value, processed.value, props.sumText ?? '合计'));

  /** 更新缓存只保留有效行或已选记录，避免翻页后无限保留历史数据。 */
  let hasLoadedData = false;
  watch([sourceRows, () => selectionColumn.value?.reserveSelection], ([rows, reserve]) => {
    hasLoadedData ||= rows.length > 0;
    const next = new Map<TableKey, TableRow>();
    if (reserve) for (const key of models.selectedKeys.value) {
      const row = cache.value.get(key);
      if (row) next.set(key, row);
    }
    for (const item of rows) next.set(item.key, item.row);
    cache.value = next;
    // 首次空数据通常表示异步加载，预选键等第一批真实数据到达后再裁剪。
    if (!reserve && hasLoadedData) {
      const keys = models.selectedKeys.value.filter(key => next.has(key));
      if (keys.length !== models.selectedKeys.value.length) models.selectedKeys.value = keys;
    }
  }, { immediate: true });

  watch(() => [...models.selectedKeys.value], () => notify('selection-change', getSelectionRows()));
  watch([page, pageSize, () => models.currentPage.value], () => {
    if (props.pagination && models.currentPage.value !== page.value) {
      const value = page.value;
      models.currentPage.value = value;
      notify('page-change', value);
      publish('paginate', { page: value });
    }
  });
  // 默认展开仅初始化一次；后续数据刷新保留用户已经折叠的状态。
  if (props.defaultExpandAll && !models.expandedRowKeys.value.length) {
    initialExpansion.value = sourceRows.value.map(item => item.key);
    models.expandedRowKeys.value = initialExpansion.value;
  }
  // 受控模型回传要等父级更新；首帧使用同一份种子，避免服务端只输出折叠行。
  watch(() => models.expandedRowKeys.value, () => { initialExpansion.value = undefined; });
  if (getCurrentInstance()) onMounted(() => { initialExpansion.value = undefined; });

  /** 筛选与懒树会克隆行，拖拽等需要回到 data 的操作先换回源对象。 */
  function originOf(row: TableRow): TableRow {
    return processing.value.origins.get(row) ?? row;
  }
  function keyOf(row: TableRow): TableKey {
    const original = originOf(row);
    return sourceIdentity.value.get(original)?.key ?? getRowKey(row, 0, props.rowKey ?? 'id');
  }
  function canSelect(row: TableRow, index: number) {
    return !props.loading && (selectionColumn.value?.selectable?.(row, index) ?? true);
  }
  const selectableRows = computed(() => visibleRows.value.filter(item => canSelect(item.row, item.index)));
  const allSelected = computed(() => !!selectableRows.value.length && selectableRows.value.every(item => selectedSet.value.has(item.key)));
  const indeterminate = computed(() => !allSelected.value && selectableRows.value.some(item => selectedSet.value.has(item.key)));
  function rowsForKeys(keys: TableKey[]) {
    return keys.flatMap(key => { const row = cache.value.get(key); return row ? [row] : []; });
  }
  function getSelectionRows() { return rowsForKeys(models.selectedKeys.value); }
  function clearSelection() { models.selectedKeys.value = []; }
  function toggleRowSelection(row: TableRow, selected?: boolean) {
    const key = keyOf(row);
    const index = visibleIndexes.value.get(key) ?? sourceIdentity.value.get(processing.value.origins.get(row) ?? row)?.index ?? 0;
    if (!canSelect(row, index)) return;
    const next = new Set(models.selectedKeys.value);
    const checked = selected ?? !next.has(key);
    if (selectionColumn.value?.type === 'radio' && checked) next.clear();
    if (checked) next.add(key); else next.delete(key);
    models.selectedKeys.value = [...next];
    notify('select', rowsForKeys([...next]), row);
  }
  function toggleAllSelection() {
    if (props.loading || selectionColumn.value?.type === 'radio') return;
    const next = new Set(models.selectedKeys.value);
    const checked = !allSelected.value;
    for (const item of selectableRows.value) {
      if (checked) next.add(item.key); else next.delete(item.key);
    }
    models.selectedKeys.value = [...next];
    notify('select-all', rowsForKeys([...next]));
  }
  function setCurrentRow(row?: TableRow) {
    const old = sourceRows.value.find(item => item.key === models.currentRowKey.value)?.row;
    const key = row ? keyOf(row) : undefined;
    if (key === models.currentRowKey.value) return;
    models.currentRowKey.value = key;
    notify('current-change', row, old);
  }
  function toggleRowExpansion(row: TableRow, expanded?: boolean) {
    if (props.loading) return;
    const key = keyOf(row);
    const next = new Set(expandedKeys.value);
    if (expanded ?? !next.has(key)) next.add(key); else next.delete(key);
    models.expandedRowKeys.value = [...next];
    initialExpansion.value = undefined;
    notify('expand-change', row, sourceRows.value.filter(item => next.has(item.key)).map(item => item.row));
  }
  function publish(action: 'sort' | 'filter' | 'paginate', overrides: { page?: number; pageSize?: number; filters?: TableFilters } = {}) {
    notify('change', { action, page: page.value, pageSize: pageSize.value, sort: { ...sorting.value }, filters: { ...filters.value }, ...overrides });
  }
  function resetPage() {
    if (models.currentPage.value !== 1) { models.currentPage.value = 1; notify('page-change', 1); }
  }
  function sort(prop: string, order: TableOrder) {
    if (props.loading) return;
    sorting.value = { prop, order };
    resetPage();
    notify('sort-change', { prop, order, column: leaves.value.find(column => column.prop === prop) });
    publish('sort', { page: 1 });
  }
  function sortColumn(column: TableColumn) {
    if (!column.sortable || !column.prop) return;
    const orders = column.sortOrders?.length ? column.sortOrders : ['ascending', 'descending', null] as TableOrder[];
    const current = sorting.value.prop === column.prop ? sorting.value.order : null;
    sort(column.prop, orders[(orders.indexOf(current) + 1) % orders.length] ?? null);
  }
  function clearSort() { sort('', null); }
  function setFilter(key: string, values: TableFilter['value'][]) {
    if (props.loading) return;
    localFilters.value = { ...localFilters.value, [key]: [...values] };
    const next = { ...filters.value, [key]: [...values] };
    resetPage();
    notify('filter-change', next);
    publish('filter', { page: 1, filters: next });
  }
  function clearFilter(keys?: string[]) {
    if (props.loading) return;
    const next = { ...filters.value };
    for (const key of keys ?? Object.keys(next)) next[key] = [];
    localFilters.value = next;
    resetPage();
    notify('filter-change', next);
    publish('filter', { page: 1, filters: next });
  }
  function setPage(value: number) {
    if (props.loading) return;
    const next = Math.min(Math.max(1, Math.floor(value) || 1), Math.max(1, Math.ceil(total.value / pageSize.value)));
    if (next === page.value) return;
    models.currentPage.value = next;
    notify('page-change', next);
    publish('paginate', { page: next });
  }
  function setPageSize(value: number) {
    if (props.loading) return;
    const next = Math.max(1, Math.floor(value) || 10);
    if (next === pageSize.value) return;
    models.pageSize.value = next;
    resetPage();
    notify('page-size-change', next);
    publish('paginate', { page: 1, pageSize: next });
  }
  return { leaves, filters, sorting, sourceRows, processed, visibleRows, loadingKeys, page, pageSize, total, paginationOptions, selectedSet, expandedSet, summary, allSelected, indeterminate, selectableRows, originOf, keyOf, canSelect, getSelectionRows, clearSelection, toggleRowSelection, toggleAllSelection, setCurrentRow, toggleRowExpansion, sort, sortColumn, clearSort, setFilter, clearFilter, setPage, setPageSize };
}
