import type { ComputedRef } from 'vue';
import type { TableKey, TableProps, TableRow, TableVisibleRow } from './table.types';
import { computed, getCurrentInstance, getCurrentScope, onMounted, onScopeDispose, reactive, ref, shallowRef, watch } from 'vue';
import { getRowKey } from './table.utils';

interface LazyEntry {
  key: TableKey;
  source: unknown;
  status: 'loading' | 'loaded' | 'failed';
  children: TableRow[];
}

/** 请求按源对象隔离，派生树只克隆发生变化的祖先，不修改外部数据。 */
export function useTableLazy(props: Readonly<TableProps>, expandedKeys: ComputedRef<TableKey[]>) {
  const entries = shallowRef(new Map<TableRow, LazyEntry>());
  const invalidated = new WeakSet<LazyEntry>();
  const ready = ref(false);
  let disposed = false;
  const childrenKey = computed(() => props.treeProps?.children ?? 'children');
  const hasChildrenKey = computed(() => props.treeProps?.hasChildren ?? 'hasChildren');

  function childrenSource(row: TableRow) {
    // in 追踪尚未添加的字段；自有属性检查仍阻止读取原型链上的内容。
    return childrenKey.value in row && Object.hasOwn(row, childrenKey.value) ? row[childrenKey.value] : undefined;
  }
  function childrenOf(row: TableRow): TableRow[] {
    const value = childrenSource(row);
    return Array.isArray(value) ? value : [];
  }
  function canLoad(row: TableRow) {
    return !!(props.lazy && props.load && hasChildrenKey.value in row && Object.hasOwn(row, hasChildrenKey.value) && row[hasChildrenKey.value] && !childrenOf(row).length);
  }
  function hasUnloadedChildren(row: TableRow) {
    const entry = entries.value.get(row);
    return canLoad(row) && (!entry || !isCurrent(row, entry) || entry.status !== 'loaded');
  }

  const tree = computed(() => {
    const origins = new Map<TableRow, TableRow>();
    const sourceRows: TableVisibleRow[] = [];
    const arrays = new Map<TableRow[], number>();
    const visit = (rows: TableRow[], level: number): TableRow[] => {
      arrays.set(rows, rows.length);
      const result = rows.map((row) => {
        const entry = entries.value.get(row);
        const index = sourceRows.length;
        const key = getRowKey(row, index, props.rowKey ?? 'id');
        const valid = entry && !invalidated.has(entry) && entry.key === key && entry.source === childrenSource(row);
        const original = childrenOf(row);
        const lazy = canLoad(row);
        const nested = lazy && valid && entry.status === 'loaded' ? entry.children : original;
        sourceRows.push({ row, key, index, level,
          hasChildren: !!nested.length || (lazy && (!valid || entry.status !== 'loaded')), loading: !!(lazy && valid && entry.status === 'loading') });
        const children = visit(nested, level + 1);
        if (original.length === children.length && original.every((child, index) => child === children[index])) return row;
        const clone = { ...row, [childrenKey.value]: children };
        origins.set(clone, row);
        return clone;
      });
      return rows.every((row, index) => row === result[index]) ? rows : result;
    };
    return { rows: visit(props.data ?? [], 0), origins, sourceRows, arrays };
  });
  const sourceRows = computed(() => tree.value.sourceRows);
  const sourceByRow = computed(() => new Map(sourceRows.value.map(item => [item.row, item])));
  const loadingKeys = computed(() => new Set(sourceRows.value.filter(item => item.loading).map(item => item.key)));

  function isCurrent(row: TableRow, entry: LazyEntry) {
    return !invalidated.has(entry) && sourceByRow.value.get(row)?.key === entry.key && childrenSource(row) === entry.source && canLoad(row);
  }

  // 数据批次和字段契约变更立即废弃缓存，不能等待下一轮渲染才拦截旧回调。
  watch([() => props.data, () => props.lazy, () => props.load, () => props.rowKey, childrenKey, hasChildrenKey], () => {
    entries.value = new Map();
  }, { flush: 'sync' });
  // 真正缩短数组时立即标记离开的请求；纯重排长度不变，不误判中间缺席。
  watch(() => tree.value.arrays, (next, previous) => {
    if (![...next].some(([rows, length]) => length < (previous.get(rows) ?? length))) return;
    for (const [row, entry] of entries.value) if (!sourceByRow.value.has(row)) invalidated.add(entry);
  }, { flush: 'sync' });
  // 缓存清理使用本轮最终树，避免 reverse / sort 的中间状态丢失孩子和选择。
  watch(sourceRows, () => {
    const next = new Map(entries.value);
    for (const [row, entry] of next) {
      if (!isCurrent(row, entry)) next.delete(row);
    }
    if (next.size !== entries.value.size) entries.value = next;
  });

  // 失败状态阻止自动重试循环；下一次从折叠变为展开时释放，支持同一轮内切换。
  watch(() => new Set(expandedKeys.value), (next, previous) => {
    const retry = new Set(sourceRows.value.filter(item => next.has(item.key) && !previous?.has(item.key)).map(item => item.row));
    const remaining = new Map(entries.value);
    for (const row of retry) if (remaining.get(row)?.status === 'failed') remaining.delete(row);
    if (remaining.size !== entries.value.size) entries.value = remaining;
  }, { flush: 'sync' });

  function loadRow(item: TableVisibleRow) {
    const { row } = item;
    const current = sourceByRow.value.get(row);
    const load = props.load;
    if (!current || disposed || !expandedKeys.value.includes(current.key) || !load || !canLoad(row) || entries.value.has(row)) return;
    const entry: LazyEntry = { key: current.key, source: childrenSource(row), status: 'loading', children: [] };
    entries.value = new Map(entries.value).set(row, entry);
    const active = () => !disposed && entries.value.get(row) === entry && entry.status === 'loading' && isCurrent(row, entry);
    const fail = () => {
      if (!active()) return;
      entry.status = 'failed';
      entries.value = new Map(entries.value);
    };
    const resolve = (children: TableRow[]) => {
      if (!active()) return;
      entry.status = 'loaded';
      // 深层代理与静态树一致；只复制孩子数组，不改写输入数据的 children。
      entry.children = reactive([...children]);
      entries.value = new Map(entries.value);
    };
    try {
      const result = load(row, { level: current.level, expanded: true, loading: true, loaded: false }, resolve);
      // Promise 只报告失败；成功必须由 resolve 明确提供孩子，空数组同样是成功。
      if (result) void Promise.resolve(result).catch(fail);
    }
    catch { fail(); }
  }

  watch([ready, sourceRows, () => [...expandedKeys.value]], () => {
    if (!ready.value || disposed) return;
    const expanded = new Set(expandedKeys.value);
    for (const item of sourceRows.value) if (expanded.has(item.key)) loadRow(item);
  });
  // SSR 不运行 mounted；组件外使用时也仅在浏览器内启动请求。
  if (getCurrentInstance()) onMounted(() => { ready.value = true; });
  else ready.value = typeof globalThis.window !== 'undefined';
  if (getCurrentScope()) onScopeDispose(() => {
    disposed = true;
    entries.value = new Map();
  });

  return { tree, sourceRows, loadingKeys, hasUnloadedChildren };
}
