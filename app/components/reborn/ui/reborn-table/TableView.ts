import type { ClassValue } from 'tailwind-variants';
import type { ComponentPublicInstance, CSSProperties, PropType, VNodeChild } from 'vue';
import type { TableCellScope, TableColumn, TableHeaderCell, TableKey, TableModels, TableNotify, TableProps, TableScrollToOptions, TableUi, TableVisibleRow } from './table.types';
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, onUpdated, ref, shallowRef, watch } from 'vue';
import { tv } from '~/lib/tv';
import { cn } from '~/lib/utils';
import RebornCheckbox from '../reborn-checkbox/RebornCheckbox.vue';
import RebornEmpty from '../reborn-empty/RebornEmpty.vue';
import RebornLoading from '../reborn-loading/RebornLoading.vue';
import RebornPagination from '../reborn-pagination/RebornPagination.vue';
import RebornRadio from '../reborn-radio/RebornRadio.vue';
import RebornScrollbar from '../scrollbar/RebornScrollbar.vue';
import theme from './reborn-table.config';
import { useTableState } from './table.state';
import { getColumnKey, getColumnWidth, getHeaderRows, getSpan, getValue, toCssSize } from './table.utils';
import TableFilter from './TableFilter';
import TableOverflowTooltip from './TableOverflowTooltip';

const styles = tv(theme);
const alignClasses = { left: 'text-left', center: 'text-center', right: 'text-right' };
const justifyClasses = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };

/** 展开和排序使用内联图标，不要求安装额外图标库。 */
function chevron(direction: 'up' | 'down' | 'right', active = false) {
  return h('svg', { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', stroke: 'currentColor', 'stroke-width': 1.5, 'aria-hidden': 'true', class: active ? 'text-primary' : '' }, [
    h('path', { d: direction === 'up' ? 'm4 10 4-4 4 4' : direction === 'down' ? 'm4 6 4 4 4-4' : 'm6 4 4 4-4 4' }),
  ]);
}

/** 公开属性由 RebornTable 声明；本层只负责渲染、布局测量和 DOM 生命周期。 */
export default defineComponent({
  name: 'RebornTableView', inheritAttrs: false,
  props: {
    table: { type: Object as PropType<Readonly<TableProps>>, required: true },
    columns: { type: Array as PropType<TableColumn[]>, required: true },
    models: { type: Object as PropType<TableModels>, required: true },
    notify: { type: Function as PropType<TableNotify>, required: true },
  },
  setup(props, { slots, attrs, expose }) {
    const state = useTableState(props.table, computed(() => props.columns), props.models, props.notify);
    const tableElement = ref<HTMLTableElement>();
    const rowElements = new Map<TableKey, HTMLTableRowElement>();
    const scrollbar = ref<InstanceType<typeof RebornScrollbar>>();
    const widths = shallowRef<number[]>([]);
    const headHeights = shallowRef<number[]>([]);
    const headerRows = computed(() => getHeaderRows(props.columns));
    const ui = computed(() => styles({ size: props.table.size, border: props.table.border, hover: props.table.hover, headerBackground: props.table.headerBackground }));
    const firstDataIndex = computed(() => state.leaves.value.findIndex(column => !column.type || column.type === 'default'));
    const hasTree = computed(() => state.sourceRows.value.some(row => row.hasChildren));
    const cellSpans = computed(() => state.visibleRows.value.map(item => state.leaves.value.map((column, columnIndex) => getSpan(props.table.spanMethod?.({ row: item.row, column, $index: item.index, columnIndex })))));
    const hoveredCell = shallowRef<{ key: TableKey; columnIndex: number }>();
    const hoveredRange = computed(() => {
      if (!props.table.hover || !hoveredCell.value) return;
      const start = state.visibleRows.value.findIndex(item => item.key === hoveredCell.value!.key);
      if (start < 0) return;
      const span = cellSpans.value[start]?.[hoveredCell.value.columnIndex];
      return { start, end: start + (span?.rowspan ?? 1) };
    });
    // 只在行序或跨度改变时清除位置；相同行键的数据刷新不应丢失仍在格内的悬停。
    watch(() => JSON.stringify([state.visibleRows.value.map(item => item.key), cellSpans.value]), () => { hoveredCell.value = undefined; });
    const fixedHeader = computed(() => props.table.fixedHeader !== false && (props.table.height !== undefined || props.table.maxHeight !== undefined));
    const baseHeight = computed(() => ({ sm: 36, md: 48, lg: 56 })[props.table.size ?? 'md']);
    // 多级表头按实际行高累加；SSR 和首次测量前使用尺寸档位，关闭固定时不占轨道。
    const headerOffset = computed(() => fixedHeader.value && props.table.showHeader !== false
      ? headerRows.value.reduce((sum, _row, index) => sum + (headHeights.value[index] || baseHeight.value), 0)
      : 0);
    let observer: ResizeObserver | undefined;
    let frame: number | undefined;

    function cls(key: keyof TableUi, extra?: ClassValue) {
      return cn(ui.value[key](), extra, props.table.ui?.[key]);
    }
    function rightBorderClass(start: number, span = 1) {
      // 跨行表头使 DOM 的 last-child 不等于逻辑末列，必须按列跨度判断右边界。
      return props.table.border && start + span >= state.leaves.value.length ? 'border-r-0' : undefined;
    }
    function isHovered(start: number, span = 1) {
      const range = hoveredRange.value;
      return !!range && start < range.end && start + span > range.start;
    }
    function isCurrentRow(item: TableVisibleRow) {
      return props.table.highlightCurrentRow && props.models.currentRowKey.value === item.key;
    }
    function measure() {
      const el = tableElement.value;
      if (!el) return;
      const nextWidths = Array.from(el.querySelectorAll('col')).map(col => col.getBoundingClientRect().width);
      const nextHeights = Array.from(el.tHead?.rows ?? []).map(row => row.getBoundingClientRect().height);
      // 只在实际尺寸变化时写状态，避免 ResizeObserver 与渲染互相触发循环。
      if (nextWidths.some((width, index) => width !== widths.value[index]) || nextWidths.length !== widths.value.length) widths.value = nextWidths;
      if (nextHeights.some((height, index) => height !== headHeights.value[index]) || nextHeights.length !== headHeights.value.length) headHeights.value = nextHeights;
      scrollbar.value?.update();
    }
    function doLayout() {
      if (typeof requestAnimationFrame === 'undefined') return;
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = undefined; measure(); });
    }
    onMounted(() => {
      nextTick(doLayout);
      if (typeof ResizeObserver !== 'undefined' && tableElement.value) {
        observer = new ResizeObserver(doLayout);
        observer.observe(tableElement.value);
      }
    });
    onUpdated(doLayout);
    onBeforeUnmount(() => { observer?.disconnect(); rowElements.clear(); if (frame !== undefined) cancelAnimationFrame(frame); });

    function fixedSide(column: TableColumn) { return column.fixed === true ? 'left' : column.fixed || undefined; }
    function cellStyle(column: TableColumn, index: number, span = 1, headerLevel?: number): CSSProperties {
      const side = fixedSide(column);
      const style: CSSProperties = {};
      if (side) {
        let offset = 0;
        for (let i = 0; i < state.leaves.value.length; i++) {
          const leaf = state.leaves.value[i]!;
          if (fixedSide(leaf) === side && (side === 'left' ? i < index : i >= index + span)) offset += widths.value[i] || getColumnWidth(leaf);
        }
        style[side] = `${offset}px`;
        style.position = 'sticky';
        style.zIndex = headerLevel === undefined ? 10 : 30;
      }
      if (headerLevel !== undefined && fixedHeader.value) {
        style.position = 'sticky';
        style.top = `${Array.from({ length: headerLevel }, (_, i) => headHeights.value[i] || baseHeight.value).reduce((sum, value) => sum + value, 0)}px`;
        style.zIndex = side ? 30 : 20;
      }
      return style;
    }
    function expandableButton(item: TableVisibleRow) {
      const expanded = state.expandedSet.value.has(item.key);
      const loading = state.loadingKeys.value.has(item.key);
      return h('button', {
        type: 'button', disabled: props.table.loading, 'aria-expanded': expanded, 'aria-busy': loading,
        'aria-label': `${expanded ? '收起' : '展开'}第 ${item.index + 1} 行`,
        class: 'inline-flex size-6 shrink-0 items-center justify-center rounded-sm hover:bg-gray-3 focus-visible:outline-2 focus-visible:outline-primary',
        onClick: (event: MouseEvent) => { event.stopPropagation(); state.toggleRowExpansion(item.row); },
      }, [loading ? h(RebornLoading, { size: 12, type: 'ring', 'aria-hidden': true }) : chevron(expanded ? 'down' : 'right')]);
    }
    function radioKeydown(event: KeyboardEvent, item: TableVisibleRow) {
      if (!state.canSelect(item.row, item.index)) return;
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault(); event.stopPropagation(); state.toggleRowSelection(item.row, true);
      } else if (['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
        const choices = state.selectableRows.value;
        const index = choices.findIndex(row => row.key === item.key);
        const direction = ['ArrowDown', 'ArrowRight'].includes(event.key) ? 1 : -1;
        const next = choices[(index + direction + choices.length) % choices.length];
        if (!next) return;
        state.toggleRowSelection(next.row, true);
        nextTick(() => {
          // DOM 属性会把 1 与 "1" 都序列化为字符串，使用保留类型的元素映射定位焦点。
          rowElements.get(next.key)?.querySelector<HTMLElement>('[role="radio"]')?.focus();
        });
      }
    }
    function renderHeader(cell: TableHeaderCell, level: number) {
      const { column, start } = cell;
      const key = getColumnKey(column, start);
      const order = state.sorting.value.prop === column.prop ? state.sorting.value.order : null;
      const scope = { column, $index: start };
      const header = column.headerRender?.(scope) ?? slots[`header-${key}`]?.(scope) ?? slots.header?.(scope) ?? column.label ?? '';
      let content: VNodeChild = header;
      if (column.type === 'selection') {
        content = h(RebornCheckbox, {
          modelValue: state.allSelected.value, indeterminate: state.indeterminate.value,
          disabled: props.table.loading || !state.selectableRows.value.length,
          'aria-label': '选择当前页可选行',
          'onUpdate:modelValue': state.toggleAllSelection,
        });
      } else if (!column.children?.length) {
        content = h('div', { class: ['flex min-w-0 items-center gap-1', justifyClasses[column.headerAlign ?? column.align ?? 'left']] }, [
          column.sortable && column.prop
            ? h('button', {
              type: 'button', disabled: props.table.loading, 'aria-label': `排序${column.label ?? column.prop}`,
              class: 'inline-flex min-w-0 items-center gap-1 rounded-sm text-inherit focus-visible:outline-2 focus-visible:outline-primary',
              onClick: () => state.sortColumn(column),
            }, [header, h('span', { class: 'inline-flex flex-col text-gray-5' }, [chevron('up', order === 'ascending'), chevron('down', order === 'descending')])])
            : h('span', { class: 'min-w-0' }, header),
          column.filters?.length ? h(TableFilter, { column, values: state.filters.value[key] ?? [], disabled: props.table.loading, onApply: (values: typeof column.filteredValue) => state.setFilter(key, values ?? []) }) : null,
        ]);
      }
      return h('th', {
        key, scope: cell.colSpan > 1 ? 'colgroup' : 'col', colspan: cell.colSpan, rowspan: cell.rowSpan,
        'data-column-key': key,
        'aria-sort': column.sortable ? order ?? 'none' : undefined,
        class: cls('headerCell', [rightBorderClass(start, cell.colSpan), column.type === 'selection' ? 'px-2 text-center' : alignClasses[column.headerAlign ?? column.align ?? 'left'], column.labelClassName]),
        style: cellStyle(column, start, cell.colSpan, level),
      }, [h('div', { class: cls('cellContent', column.type === 'selection' && 'flex items-center justify-center') }, content)]);
    }
    function renderCell(item: TableVisibleRow, column: TableColumn, columnIndex: number) {
      const key = getColumnKey(column, columnIndex);
      const scope: TableCellScope = { row: item.row, column, $index: item.index, columnIndex };
      const span = cellSpans.value[item.index]![columnIndex]!;
      if (!span.rowspan || !span.colspan) return null;
      let content: VNodeChild;
      const value = getValue(item.row, column.prop);
      if (column.type === 'selection' || column.type === 'radio') {
        const checked = state.selectedSet.value.has(item.key);
        const common = { disabled: !state.canSelect(item.row, item.index), 'aria-label': `选择第 ${item.index + 1} 行` };
        content = h('span', { class: 'inline-flex align-middle', onClick: (event: MouseEvent) => event.stopPropagation() }, [column.type === 'radio'
          ? h(RebornRadio, {
              ...common, modelValue: checked ? item.key : undefined, value: item.key,
              tabindex: common.disabled ? -1 : 0, 'aria-disabled': common.disabled,
              class: 'rounded-sm focus-visible:outline-2 focus-visible:outline-primary',
              onKeydown: (event: KeyboardEvent) => radioKeydown(event, item),
              'onUpdate:modelValue': () => state.toggleRowSelection(item.row, true),
            })
          : h(RebornCheckbox, { ...common, modelValue: checked, 'onUpdate:modelValue': (checked: unknown) => state.toggleRowSelection(item.row, Boolean(checked)) })]);
      } else if (column.type === 'index') {
        const offset = props.table.pagination ? (state.page.value - 1) * state.pageSize.value : 0;
        content = typeof column.index === 'function' ? column.index(item.index + offset) : item.index + offset + (column.index ?? 1);
      } else if (column.type === 'expand') content = expandableButton(item);
      else content = column.cellRender?.(scope) ?? slots[column.slotName ?? `cell-${key}`]?.(scope) ?? slots.cell?.(scope) ?? column.formatter?.(item.row, column, value, item.index) ?? (value == null ? '' : String(value));
      const tree = columnIndex === firstDataIndex.value && (item.level > 0 || hasTree.value);
      const overflowTooltip = column.showOverflowTooltip ?? props.table.showOverflowTooltip;
      const text = overflowTooltip && (!column.type || column.type === 'default') ? h(TableOverflowTooltip, {
        scope, cellValue: value, disabled: props.table.loading,
        options: {
          ...props.table.tooltipOptions,
          ...(typeof props.table.showOverflowTooltip === 'object' ? props.table.showOverflowTooltip : {}),
          ...column.tooltipOptions,
          ...(typeof column.showOverflowTooltip === 'object' ? column.showOverflowTooltip : {}),
        },
        formatter: column.tooltipFormatter ?? props.table.tooltipFormatter,
        contentClass: cls('cellContent'),
      }, { default: () => content, ...(slots.tooltip ? { content: slots.tooltip } : {}) }) : h('div', {
        // 复选框脱离文字基线布局，与表头共用双向居中；不改变普通列的文字对齐。
        class: cls('cellContent', ['break-words', column.type === 'selection' && 'flex items-center justify-center']),
      }, content);
      return h('td', {
        key, rowspan: span.rowspan, colspan: span.colspan,
        class: cls('cell', [
          'bg-inherit', rightBorderClass(columnIndex, span.colspan),
          // 合并格属于首行 DOM，但覆盖任一行悬停时都应亮起；当前行的品牌底色优先。
          span.rowspan > 1 && isHovered(item.index, span.rowspan) && !isCurrentRow(item) && 'bg-gray-2',
          column.type === 'selection' ? 'px-2 text-center' : alignClasses[column.align ?? 'left'], column.className, typeof props.table.cellClassName === 'function' ? props.table.cellClassName(scope) : props.table.cellClassName,
        ]),
        style: cellStyle(column, columnIndex, span.colspan),
        onMouseenter: () => { hoveredCell.value = { key: item.key, columnIndex }; },
        onMouseleave: () => { hoveredCell.value = undefined; },
        onClick: (event: MouseEvent) => {
          if (props.table.loading) return;
          props.notify('cell-click', item.row, column, event.currentTarget as HTMLElement, event);
          props.notify('row-click', item.row, column, event);
          if (props.table.highlightCurrentRow) state.setCurrentRow(item.row);
        },
        onDblclick: (event: MouseEvent) => { if (!props.table.loading) props.notify('row-dblclick', item.row, column, event); },
      }, tree ? h('div', { class: 'flex min-w-0 items-center gap-1', style: { paddingLeft: `${item.level * (props.table.indent ?? 16)}px` } }, [
        item.hasChildren ? expandableButton(item) : h('span', { class: 'inline-block size-6 shrink-0' }),
        h('div', { class: 'min-w-0 flex-1' }, [text]),
      ]) : [text]);
    }
    function renderRow(item: TableVisibleRow, position: number) {
      const selected = state.selectedSet.value.has(item.key);
      const current = isCurrentRow(item);
      const row = h('tr', {
        ref: (node: Element | ComponentPublicInstance | null) => { if (node) rowElements.set(item.key, node as HTMLTableRowElement); else rowElements.delete(item.key); },
        key: `${typeof item.key}:${item.key}`, 'data-row-key': item.key, 'data-selected': selected || undefined,
        class: cls('row', [
          ((props.table.stripe && position % 2 === 1) || selected || isHovered(position)) && 'bg-gray-2',
          // 表格默认语义色为品牌色，color-2 对应品牌二阶；悬停不能盖掉当前行高亮。
          current && 'bg-brand-2 hover:bg-brand-2',
          typeof props.table.rowClassName === 'function' ? props.table.rowClassName({ row: item.row, rowIndex: item.index }) : props.table.rowClassName,
        ]),
      }, state.leaves.value.map((column, index) => renderCell(item, column, index)));
      const expandColumn = state.leaves.value.find(column => column.type === 'expand');
      if (!expandColumn || !state.expandedSet.value.has(item.key)) return [row];
      const scope = { row: item.row, column: expandColumn, $index: item.index, columnIndex: state.leaves.value.indexOf(expandColumn) };
      return [row, h('tr', { key: `expand-${typeof item.key}:${item.key}` }, [h('td', { colspan: Math.max(1, state.leaves.value.length), class: cls('expand') }, [slots.expand?.(scope) ?? expandColumn.cellRender?.(scope)])])];
    }
    function renderBody() {
      const result: VNodeChild[] = [];
      const details: VNodeChild[] = [];
      let mergeEnd = -1;
      state.visibleRows.value.forEach((item, position) => {
        const spans = cellSpans.value[position] ?? [];
        mergeEnd = Math.max(mergeEnd, ...spans.map(span => span.colspan ? position + span.rowspan - 1 : position));
        const [row, expanded] = renderRow(item, position);
        result.push(row);
        if (expanded) details.push(expanded);
        // 详情不能插进原生 rowspan 中间，否则会占掉数据行的合并格；统一放在合并块末尾。
        if (position >= mergeEnd) result.push(...details.splice(0));
      });
      result.push(...details);
      return result;
    }
    expose({
      clearSelection: state.clearSelection, getSelectionRows: state.getSelectionRows, toggleRowSelection: state.toggleRowSelection,
      toggleAllSelection: state.toggleAllSelection, setCurrentRow: state.setCurrentRow, toggleRowExpansion: state.toggleRowExpansion,
      clearSort: state.clearSort, sort: state.sort, clearFilter: state.clearFilter, doLayout,
      scrollTo: (options: TableScrollToOptions) => scrollbar.value?.scrollTo(
        { top: options.top, left: options.left },
        { animated: options.behavior === 'smooth', duration: options.duration },
      ) ?? Promise.resolve(),
      // 两轴定位可能在同一事件内连续调用；立即写入，避免滚动条共用动画互相取消。
      setScrollTop: (value: number) => scrollbar.value?.setScrollTop(value, { animated: false }),
      setScrollLeft: (value: number) => scrollbar.value?.setScrollLeft(value, { animated: false }),
    });
    return () => h('div', { ...attrs, class: cls('root', [props.table.class, attrs.class as ClassValue]), 'data-reborn-table': '', 'data-size': props.table.size, 'aria-busy': props.table.loading }, [
      h('div', { class: 'relative' }, [
        h(RebornScrollbar, {
          ref: scrollbar, class: cls('scrollbar'), style: { height: toCssSize(props.table.height), maxHeight: toCssSize(props.table.maxHeight) },
          verticalOffset: headerOffset.value,
          // 固定列的层级留在内容区内，避免覆盖同级轨道并拦截滚动条拖拽。
          wrapClass: 'isolate max-h-[inherit]', contentClass: 'min-w-full',
        }, () => [
          h('table', { ref: tableElement, class: cls('table', props.table.tableLayout === 'auto' && 'table-auto'), 'aria-label': props.table.ariaLabel, style: { minWidth: `${state.leaves.value.reduce((sum, column) => sum + getColumnWidth(column), 0)}px` } }, [
            h('colgroup', state.leaves.value.map((column, index) => h('col', { key: getColumnKey(column, index), style: { width: `${getColumnWidth(column)}px` } }))),
            props.table.showHeader === false ? null : h('thead', { class: cls('thead') }, headerRows.value.map((row, level) => h('tr', { key: level }, row.map(cell => renderHeader(cell, level))))),
            h('tbody', { class: '[&>tr:first-child>td]:border-t-0' }, state.visibleRows.value.length ? renderBody() : [h('tr', [h('td', { colspan: Math.max(1, state.leaves.value.length), class: cls('empty') }, slots.empty?.() ?? (props.table.loading ? '加载中' : h(RebornEmpty, { description: props.table.emptyText })))])]),
            props.table.showSummary ? h('tfoot', { class: cls('summary') }, [h('tr', state.leaves.value.map((column, index) => h('td', { key: getColumnKey(column, index), class: cls('cell', ['bg-gray-2', rightBorderClass(index), alignClasses[column.align ?? 'left']]), style: cellStyle(column, index) }, [h('div', { class: cls('cellContent') }, state.summary.value[index] ?? '')])))]) : null,
          ]),
          slots.append?.(),
        ]),
        props.table.loading ? h('div', { class: cls('loading'), role: 'status', 'aria-live': 'polite' }, slots.loading?.() ?? [h(RebornLoading, { size: 20, type: 'ring' }), h('span', '加载中')]) : null,
      ]),
      slots.footer ? h('div', { class: cls('footer') }, slots.footer({ data: state.processed.value, selection: state.getSelectionRows() })) : null,
      props.table.pagination ? h('div', { class: cls('pagination') }, [h(RebornPagination, {
        ...state.paginationOptions.value, total: state.total.value, modelValue: state.page.value, pageSize: state.pageSize.value, size: props.table.size,
        disabled: props.table.loading, 'onUpdate:modelValue': state.setPage, 'onUpdate:pageSize': state.setPageSize,
      })]) : null,
    ]);
  },
});
