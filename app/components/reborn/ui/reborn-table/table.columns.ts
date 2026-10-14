import type { Slots, VNode } from 'vue';
import type { TableColumn, TableRow } from './table.types';
import { Fragment, isVNode } from 'vue';

/** 只读取声明列与 Fragment，不执行普通业务组件，避免意外挂载。 */
export function collectColumns(nodes: unknown, sample: TableRow = {}): TableColumn[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.flatMap((node: VNode) => {
    if (!isVNode(node)) return [];
    if (node.type === Fragment) return collectColumns(node.children, sample);
    if (typeof node.type !== 'object' || !('name' in node.type) || node.type.name !== 'RebornTableColumn') return [];
    const column = Object.fromEntries(Object.entries(node.props ?? {}).map(([key, value]) => [key.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase()), value])) as TableColumn;
    // 声明式裸属性为字符串空值，归一化为布尔值才与配置式行为一致。
    for (const key of ['sortable', 'fixed', 'showOverflowTooltip', 'reserveSelection', 'hidden'] as const) {
      if ((column[key] as unknown) === '') Object.assign(column, { [key]: true });
    }
    const slots = (node.children ?? {}) as Slots;
    column.headerRender = scope => slots.header?.(scope);
    if (Array.isArray(node.children)) column.children = collectColumns(node.children, sample);
    else if (!column.prop && !column.type && slots.default) {
      // 分组列没有字段；带字段的业务单元格插槽绝不在收集阶段求值。
      try {
        const children = collectColumns(slots.default({ row: sample, column, $index: 0, columnIndex: 0 }), sample);
        if (children.length) column.children = children;
      } catch {
        // 无数据时无字段的操作列可能访问行字段，此时仍保留为延迟执行的单元格插槽。
      }
    }
    if (!column.children?.length && slots.default) column.cellRender = scope => slots.default?.(scope);
    if (!slots.header) delete column.headerRender;
    return [column];
  });
}
