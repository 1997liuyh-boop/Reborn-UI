import type { VNodeChild } from 'vue';
import type { TableColumn, TableFilters, TableHeaderCell, TableKey, TableProps, TableRow, TableSort, TableSpan, TableVisibleRow } from './table.types';

/** 每一段都限制为自有属性，禁止沿原型链读取数据。 */
export function getValue(row: TableRow, prop?: string): unknown {
  if (!prop) return undefined;
  let value: unknown = row;
  for (const key of prop.split('.')) {
    if (!key || ['__proto__', 'prototype', 'constructor'].includes(key)) return undefined;
    if (!value || typeof value !== 'object' || !Object.hasOwn(value, key)) return undefined;
    value = (value as TableRow)[key];
  }
  return value;
}

export function getColumnKey(column: TableColumn, index?: number): string {
  return column.columnKey ?? column.prop ?? `column-${index ?? 0}`;
}

export function getRowKey(row: TableRow, index: number, rowKey: TableProps['rowKey'] = 'id'): TableKey {
  const key = typeof rowKey === 'function' ? rowKey(row) : getValue(row, rowKey);
  return typeof key === 'string' || (typeof key === 'number' && Number.isFinite(key)) ? key : index;
}

const numericSize = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/;

export function getColumnWidth(column: TableColumn): number {
  for (const value of [column.width, column.minWidth]) {
    const text = typeof value === 'string' ? value.trim().replace(/px$/, '') : '';
    const width = typeof value === 'number' ? value : numericSize.test(text) ? Number(text) : undefined;
    if (width !== undefined && Number.isFinite(width) && width > 0) return width;
  }
  return column.type && column.type !== 'default' ? 48 : 120;
}

/** 表头和叶列共用可见树；浅拷贝保留函数及样式对象，显式 fixed 可覆盖继承值。 */
function getVisibleColumns(columns: TableColumn[], fixed?: TableColumn['fixed']): TableColumn[] {
  return columns.flatMap((column) => {
    if (column.hidden) return [];
    const current = column.fixed === undefined && fixed !== undefined ? { ...column, fixed } : column;
    if (!column.children?.length) return [current];
    const children = getVisibleColumns(column.children, current.fixed);
    return children.length ? [{ ...current, children }] : [];
  });
}

export function getLeafColumns(columns: TableColumn[]): TableColumn[] {
  const leaves: TableColumn[] = [];
  const visit = (items: TableColumn[]) => {
    for (const column of items) {
      if (column.children?.length) visit(column.children);
      else leaves.push(column);
    }
  };
  visit(getVisibleColumns(columns));
  return leaves;
}

export function getHeaderRows(columns: TableColumn[]): TableHeaderCell[][] {
  const visible = getVisibleColumns(columns);
  const getDepth = (items: TableColumn[]): number => items.reduce((depth, column) => Math.max(depth, 1 + getDepth(column.children ?? [])), 0);
  const depth = getDepth(visible);
  const rows: TableHeaderCell[][] = Array.from({ length: depth }, () => []);
  let leafIndex = 0;
  const visit = (items: TableColumn[], level: number) => {
    for (const column of items) {
      const start = leafIndex;
      const grouped = !!column.children?.length;
      if (grouped) visit(column.children!, level + 1);
      else leafIndex++;
      rows[level]!.push({ column, start, colSpan: leafIndex - start, rowSpan: grouped ? 1 : depth - level });
    }
  };
  visit(visible, 0);
  return rows;
}

/** children 是字段映射而非表达式，不读取继承的树节点。 */
function getChildren(row: TableRow, field: string): TableRow[] {
  const value = Object.hasOwn(row, field) ? row[field] : undefined;
  return Array.isArray(value) ? value : [];
}

function compareValues(a: unknown, b: unknown): number {
  if (a === b || (a == null && b == null)) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a)) return Number.isNaN(b) ? 0 : 1;
    if (Number.isNaN(b)) return -1;
    return a - b;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

export function processRows(
  data: TableRow[],
  columns: TableColumn[],
  sort: TableSort,
  filters: TableFilters,
  options: { remote?: boolean; children?: string; origins?: Map<TableRow, TableRow> } = {},
): TableRow[] {
  if (options.remote) return data;
  const leaves = getLeafColumns(columns);
  const activeFilters = leaves.map((column, index) => {
    const key = getColumnKey(column, index);
    const values = column.filteredValue ?? (Object.hasOwn(filters, key) ? filters[key] : undefined) ?? [];
    return { column, values };
  }).filter(({ values }) => values.length > 0);
  const sortColumn = sort.order ? leaves.find(column => column.prop === sort.prop && column.sortable === true) : undefined;
  const direction = sort.order === 'descending' ? -1 : 1;
  const children = options.children ?? 'children';

  const visit = (rows: TableRow[]): TableRow[] => {
    const entries = rows.map((row, index) => {
      const original = getChildren(row, children);
      const nested = original.length ? visit(original) : original;
      return { row, index, original, nested };
    }).filter(({ row, nested }) => {
      const matches = activeFilters.every(({ column, values }) => values.some(value => column.filterMethod
        ? column.filterMethod(value, row, column)
        : getValue(row, column.prop) === value));
      return matches || nested.length > 0;
    });

    if (sortColumn) {
      entries.sort((a, b) => {
        const compared = sortColumn.sortMethod
          ? sortColumn.sortMethod(a.row, b.row)
          : compareValues(getValue(a.row, sortColumn.prop), getValue(b.row, sortColumn.prop));
        // 降序也保持相等项的原始先后；无效比较结果按相等处理。
        return compared * direction || a.index - b.index;
      });
    }
    return entries.map(({ row, original, nested }) => {
      const changed = original.length !== nested.length || original.some((child, index) => child !== nested[index]);
      if (!changed) return row;
      const result = { ...row, [children]: nested };
      // 筛选树会克隆祖先，保留外部身份映射供选择和展开沿用源行键。
      options.origins?.set(result, row);
      return result;
    });
  };
  return visit(data);
}

export function flattenRows(
  data: TableRow[],
  expanded: TableKey[],
  rowKey?: TableProps['rowKey'],
  children = 'children',
  includeCollapsed = false,
): TableVisibleRow[] {
  const expandedKeys = new Set(expanded);
  const result: TableVisibleRow[] = [];
  const visit = (rows: TableRow[], level: number) => {
    for (const row of rows) {
      const index = result.length;
      const key = getRowKey(row, index, rowKey);
      const nested = getChildren(row, children);
      result.push({ row, key, index, level, hasChildren: nested.length > 0 });
      if (nested.length && (includeCollapsed || expandedKeys.has(key))) visit(nested, level + 1);
    }
  };
  visit(data, 0);
  return result;
}

/** 只接受数字和非空数字串，避免 Number(null/false/'') 被误计为零。 */
function getNumber(value: unknown): number | undefined {
  if (typeof value !== 'number' && (typeof value !== 'string' || !value.trim())) return undefined;
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

export function getSummary(columns: TableColumn[], data: TableRow[], sumText: string): VNodeChild[] {
  return columns.map((column, index) => {
    if (index === 0) return sumText;
    if (!column.prop || (column.type && column.type !== 'default')) return '';
    let total = 0;
    let hasNumber = false;
    for (const row of data) {
      const value = getNumber(getValue(row, column.prop));
      if (value !== undefined) {
        total += value;
        hasNumber = true;
      }
    }
    return hasNumber ? total : '';
  });
}

export function getSpan(result: TableSpan): { rowspan: number; colspan: number } {
  const rowspan = Array.isArray(result) ? result[0] : result?.rowspan;
  const colspan = Array.isArray(result) ? result[1] : result?.colspan;
  const normalize = (value?: number) => value !== undefined && Number.isInteger(value) && value >= 0 ? value : 1;
  return { rowspan: normalize(rowspan), colspan: normalize(colspan) };
}

export function toCssSize(value?: number | string): string | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? `${value}px` : undefined;
  const text = value?.trim();
  if (!text) return undefined;
  return numericSize.test(text) ? `${text}px` : text;
}
