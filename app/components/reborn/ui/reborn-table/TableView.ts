import type { ClassValue } from 'tailwind-variants';
import type { ComponentPublicInstance, CSSProperties, PropType, VNodeChild } from 'vue';
import type { TableCellScope, TableColumn, TableHeaderCell, TableKey, TableModels, TableNotify, TableProps, TableScrollToOptions, TableUi, TableVisibleRow } from './table.types';
import { computed, defineComponent, h, nextTick, onBeforeUnmount, onMounted, onUpdated, provide, shallowRef, watch } from 'vue';
import { tv } from '~/lib/tv';
import { cn } from '~/lib/utils';
import RebornCheckbox from '../reborn-checkbox/RebornCheckbox.vue';
import RebornEmpty from '../reborn-empty/RebornEmpty.vue';
import RebornLoading from '../reborn-loading/RebornLoading.vue';
import RebornPagination from '../reborn-pagination/RebornPagination.vue';
import RebornRadio from '../reborn-radio/RebornRadio.vue';
import RebornScrollbar from '../scrollbar/RebornScrollbar.vue';
import theme, { tableFixedStyles } from './reborn-table.config';
import { useTableDrag } from './table.drag';
import { TABLE_OVERFLOW_KEY } from './table.overflow';
import { useTableState } from './table.state';
import { getColumnKey, getColumnWidth, getHeaderRows, getSpan, getValue, toCssSize } from './table.utils';
import TableFilter from './TableFilter';
import TableOverflowTooltip from './TableOverflowTooltip';

const styles = tv(theme);
const alignClasses = { left: 'text-left', center: 'text-center', right: 'text-right' };
const justifyClasses = { left: 'justify-start', center: 'justify-center', right: 'justify-end' };
const defaultSpan = { rowspan: 1, colspan: 1 };
const emptySpans: ReturnType<typeof getSpan>[][] = [];

interface RowView {
  selected: boolean;
  current: boolean;
  dragging: boolean;
  expanded: boolean;
  hoverRange: string;
}

/** 每行接收自己的状态；勾选及当前行变化只重建相关行的单元格。 */
const TableBodyRow = defineComponent({
  name: 'RebornTableBodyRow',
  props: {
    item: { type: Object as PropType<TableVisibleRow>, required: true },
    position: { type: Number, required: true },
    selected: Boolean, current: Boolean, dragging: Boolean, expanded: Boolean,
    hoverRange: { type: String, default: '' },
    slotRevision: Number,
    render: { type: Function as PropType<(item: TableVisibleRow, position: number, view: RowView) => VNodeChild>, required: true },
  },
  setup(props) { return () => props.render(props.item, props.position, props); },
});

/** 排序使用 bxs:up-arrow / bxs:down-arrow 的路径，无需额外安装图标库。 */
function chevron(direction: 'up' | 'down', active = false) {
  return h('svg', { viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': 'true', class: ['size-2.5 shrink-0', active ? 'text-primary' : 'text-gray-5 group-hover/sort:text-gray-8'] }, [
    h('path', { d: direction === 'up' ? 'M3 19h18a1.002 1.002 0 0 0 .823-1.569l-9-13c-.373-.539-1.271-.539-1.645 0l-9 13A.999.999 0 0 0 3 19' : 'M11.178 19.569a.998.998 0 0 0 1.644 0l9-13A.999.999 0 0 0 21 5H3a1.002 1.002 0 0 0-.822 1.569z' }),
  ]);
}

/** 展开使用 Lucide plus / minus 的路径，图标保持 8px，不依赖外部图标加载。 */
function expandIcon(expanded: boolean) {
  return h('svg', {
    viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2,
    'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true',
    class: 'size-2 text-gray-9',
  }, [h('path', { d: 'M5 12h14' }), expanded ? null : h('path', { d: 'M12 5v14' })]);
}

/** 拖拽手柄的六点图标，同样内联绘制。 */
function grip() {
  return h('svg', { width: 14, height: 14, viewBox: '0 0 16 16', fill: 'currentColor', 'aria-hidden': 'true' },
    [5, 8, 11].flatMap(y => [h('circle', { cx: 6, cy: y, r: 1.2 }), h('circle', { cx: 10, cy: y, r: 1.2 })]));
}

/**
 * 滚动条每次滚动都会更新滑块并重绘自身，插槽函数随之重新执行。
 * 表格内容放进独立组件：props 恒为同一个渲染函数，滚动条重绘时跳过它，
 * 只有表格自己读到的状态变化才重绘，横向拖动不再每帧重建整张表。
 */
const TableScrollContent = defineComponent({
  name: 'RebornTableScrollContent',
  props: {
    render: { type: Function as PropType<() => VNodeChild>, required: true },
    /** 内容自身重绘后回调，用于重新测量列宽与表头高度。 */
    afterRender: { type: Function as PropType<() => void>, required: true },
    slotRevision: Number,
  },
  setup(props) {
    onUpdated(() => props.afterRender());
    return () => props.render();
  },
});

/** 公开属性由 RebornTable 声明；本层只负责渲染、布局测量和 DOM 生命周期。 */
export default defineComponent({
  name: 'RebornTableView', inheritAttrs: false,
  props: {
    table: { type: Object as PropType<Readonly<TableProps>>, required: true },
    columns: { type: Array as PropType<TableColumn[]>, required: true },
    models: { type: Object as PropType<TableModels>, required: true },
    notify: { type: Function as PropType<TableNotify>, required: true },
    /**
     * 使用方插槽的版本号，由 RebornTable 按原始插槽判断后传入。
     * 本层收到的是模板转发生成的插槽，函数身份每次渲染都变，不能据此判断内容是否需要整表重绘
     */
    slotRevision: { type: Number, default: 0 },
  },
  setup(props, { slots, attrs, expose }) {
    const state = useTableState(props.table, computed(() => props.columns), props.models, props.notify);
    const tableElement = shallowRef<HTMLTableElement>();
    const rowElements = new Map<TableKey, HTMLTableRowElement>();
    const scrollbar = shallowRef<InstanceType<typeof RebornScrollbar>>();
    const widths = shallowRef<number[]>([]);
    const headHeights = shallowRef<number[]>([]);
    const horizontalOverflow = shallowRef({ left: false, right: false });
    const fixedEdges = computed(() => ({
      left: state.leaves.value.findLastIndex(column => fixedSide(column) === 'left'),
      right: state.leaves.value.findIndex(column => fixedSide(column) === 'right'),
    }));
    const headerRows = computed(() => getHeaderRows(props.columns));
    const ui = computed(() => styles({ size: props.table.size, border: props.table.border, hover: props.table.hover, headerBackground: props.table.headerBackground }));
    const firstDataIndex = computed(() => state.leaves.value.findIndex(column => !column.type || column.type === 'default'));
    const hasTree = computed(() => state.sourceRows.value.some(row => row.hasChildren));
    const expandColumn = computed(() => state.leaves.value.find(column => column.type === 'expand'));
    const cellSpans = computed(() => props.table.spanMethod
      ? state.visibleRows.value.map(item => state.leaves.value.map((column, columnIndex) => getSpan(props.table.spanMethod!({ row: item.row, column, $index: item.index, columnIndex }))))
      : emptySpans);
    /** 只有存在纵向合并格时才需要脚本接管悬停；否则交给行自身的 hover: 类，指针划过单元格不触发重绘。 */
    const hasRowMerge = computed(() => cellSpans.value.some(row => row.some(span => span.rowspan > 1)));
    /** 悬停的行范围，记作「起始行:结束行」，空串表示无悬停。 */
    const hoverState = shallowRef('');
    /**
     * 渲染只读这个计算属性：它返回字符串，离开一格又进入同一行的另一格时值不变，
     * 计算属性不通知更新，整张表不必重绘。
     */
    const hoveredRange = computed(() => props.table.hover ? hoverState.value : '');
    // 只在行序或跨度改变时清除位置；相同行键的数据刷新不应丢失仍在格内的悬停。
    watch([() => state.visibleRows.value.map(item => item.key), cellSpans], ([keys, spans], [previousKeys, previousSpans]) => {
      const sameKeys = keys.length === previousKeys.length && keys.every((key, index) => key === previousKeys[index]);
      const sameSpans = spans === previousSpans || (spans.length === previousSpans.length && spans.every((row, index) =>
        row.length === previousSpans[index]?.length && row.every((span, column) => span.rowspan === previousSpans[index]?.[column]?.rowspan && span.colspan === previousSpans[index]?.[column]?.colspan)));
      if (!sameKeys || !sameSpans) hoverState.value = '';
    });
    const fixedHeader = computed(() => props.table.fixedHeader !== false && (props.table.height !== undefined || props.table.maxHeight !== undefined));
    const baseHeight = computed(() => ({ sm: 36, md: 48, lg: 56 })[props.table.size ?? 'md']);
    // 多级表头按实际行高累加；SSR 和首次测量前使用尺寸档位，关闭固定时不占轨道。
    const headerOffset = computed(() => fixedHeader.value && props.table.showHeader !== false
      ? headerRows.value.reduce((sum, _row, index) => sum + (headHeights.value[index] || baseHeight.value), 0)
      : 0);
    /**
     * 固定列的 sticky 偏移一次算好：左侧是左固定列宽度的前缀和，右侧是右固定列宽度的后缀和。
     * 单元格按下标直接取值，不再每格遍历全部列。
     */
    const fixedOffsets = computed(() => {
      const leaves = state.leaves.value;
      const left = Array.from<number>({ length: leaves.length + 1 }).fill(0);
      const right = Array.from<number>({ length: leaves.length + 1 }).fill(0);
      const width = (index: number) => widths.value[index] || getColumnWidth(leaves[index]!);
      for (let i = 0; i < leaves.length; i++) left[i + 1] = left[i]! + (fixedSide(leaves[i]!) === 'left' ? width(i) : 0);
      for (let i = leaves.length - 1; i >= 0; i--) right[i] = right[i + 1]! + (fixedSide(leaves[i]!) === 'right' ? width(i) : 0);
      return { left, right };
    });
    /** 各级表头的吸顶位置：上方各级表头高度的累加。 */
    const headerTops = computed(() => headerRows.value.reduce<number[]>((tops, _row, index) => [...tops, tops[index]! + (headHeights.value[index] || baseHeight.value)], [0]));
    /** 拖拽指示线的定位容器与线本身；线的位置由拖拽逻辑直接写样式。 */
    const frameElement = shallowRef<HTMLElement>();
    const indicatorElement = shallowRef<HTMLElement>();
    const drag = useTableDrag({
      props: props.table, notify: props.notify, rowElements,
      visibleRows: () => state.visibleRows.value,
      sorted: () => !!state.sorting.value.order,
      originOf: state.originOf,
      wrap: () => scrollbar.value?.wrapRef,
      frame: () => frameElement.value,
      indicator: () => indicatorElement.value,
      headerOffset: () => headerOffset.value,
    });
    let observer: ResizeObserver | undefined;
    let overflowObserver: ResizeObserver | undefined;
    let overflowContentObserver: MutationObserver | undefined;
    const overflowMeasures = new Map<Element, () => void>();
    /**
     * 整表共用的内容观察器，只测量文本变化的溢出格子，保留动态插槽的键盘入口。
     * 跟随溢出提示按需创建：首个溢出格子登记时才开始观察，最后一个注销时断开，
     * 没开 showOverflowTooltip 的表格不必为每次重绘的大量变更记录逐条查找格子
     */
    function syncContentObserver() {
      if (!overflowMeasures.size) {
        overflowContentObserver?.disconnect();
        overflowContentObserver = undefined;
        return;
      }
      if (overflowContentObserver || typeof MutationObserver === 'undefined' || !tableElement.value) return;
      overflowContentObserver = new MutationObserver(records => {
        const pending = new Set<() => void>();
        for (const record of records) {
          const target = record.target instanceof Element ? record.target : record.target.parentElement;
          const element = target?.closest('[data-table-overflow]');
          const callback = element && overflowMeasures.get(element);
          if (callback) pending.add(callback);
        }
        for (const callback of pending) callback();
      });
      overflowContentObserver.observe(tableElement.value, { childList: true, characterData: true, subtree: true });
    }
    provide(TABLE_OVERFLOW_KEY, {
      observe(element, measure) {
        if (!overflowObserver && typeof ResizeObserver !== 'undefined') {
          overflowObserver = new ResizeObserver(entries => {
            for (const entry of entries) overflowMeasures.get(entry.target)?.();
          });
        }
        overflowMeasures.set(element, measure);
        overflowObserver?.observe(element);
        syncContentObserver();
        return () => {
          overflowObserver?.unobserve(element);
          overflowMeasures.delete(element);
          syncContentObserver();
        };
      },
    });
    let frame: number | undefined;

    function cls(key: keyof TableUi, extra?: ClassValue) {
      return cn(ui.value[key](), extra, props.table.ui?.[key]);
    }
    function rightBorderClass(start: number, span = 1) {
      // 跨行表头使 DOM 的 last-child 不等于逻辑末列，必须按列跨度判断右边界。
      return props.table.border && start + span >= state.leaves.value.length ? 'border-r-0' : undefined;
    }
    function isHovered(start: number, span = 1, range = hoveredRange.value) {
      if (!range) return false;
      const [from, to] = range.split(':').map(Number) as [number, number];
      return start < to && start + span > from;
    }
    /** 进入单元格时记录它覆盖的行范围；范围没变就不写，避免同一行内横向移动时重绘。 */
    function hoverCell(position: number, columnIndex: number) {
      if (!props.table.hover || !hasRowMerge.value) return;
      const next = `${position}:${position + (cellSpans.value[position]?.[columnIndex]?.rowspan ?? 1)}`;
      if (hoverState.value !== next) hoverState.value = next;
    }
    function leaveCell() {
      if (hoverState.value) hoverState.value = '';
    }
    function isCurrentRow(item: TableVisibleRow) {
      return props.table.highlightCurrentRow && props.models.currentRowKey.value === item.key;
    }
    /** 仅跨过滚动边界时更新状态，避免拖拽每一帧都重渲染整张表。 */
    function updateHorizontalOverflow() {
      const wrap = scrollbar.value?.wrapRef;
      if (!wrap) return;
      const max = Math.max(0, wrap.scrollWidth - wrap.clientWidth);
      const left = Math.max(0, Math.min(wrap.scrollLeft, max));
      const next = { left: left > 1, right: max - left > 1 };
      if (next.left !== horizontalOverflow.value.left || next.right !== horizontalOverflow.value.right) horizontalOverflow.value = next;
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
      updateHorizontalOverflow();
    }
    function doLayout() {
      if (typeof requestAnimationFrame === 'undefined') return;
      if (frame !== undefined) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { frame = undefined; measure(); });
    }
    onMounted(() => {
      nextTick(doLayout);
      // 单元格先于本组件挂载，登记时表格元素可能尚未就绪，挂载后补建一次
      syncContentObserver();
      if (typeof ResizeObserver !== 'undefined' && tableElement.value) {
        observer = new ResizeObserver(doLayout);
        observer.observe(tableElement.value);
        if (scrollbar.value?.wrapRef) observer.observe(scrollbar.value.wrapRef);
      }
    });
    onUpdated(doLayout);
    onBeforeUnmount(() => { observer?.disconnect(); overflowObserver?.disconnect(); overflowContentObserver?.disconnect(); overflowMeasures.clear(); rowElements.clear(); if (frame !== undefined) cancelAnimationFrame(frame); });

    function fixedSide(column: TableColumn) { return column.fixed === true ? 'left' : column.fixed || undefined; }
    /** 跨列表头和合并格按覆盖范围判断边缘，多列固定时不在区域内部重复画阴影。 */
    function fixedEdge(column: TableColumn, index: number, span = 1) {
      const side = fixedSide(column);
      if (side && fixedEdges.value[side] >= index && fixedEdges.value[side] < index + span) return side;
    }
    function fixedClass(column: TableColumn, index: number, span = 1) {
      const edge = fixedEdge(column, index, span);
      return edge && [tableFixedStyles.edge, tableFixedStyles[edge], horizontalOverflow.value[edge] ? 'after:opacity-100' : 'after:opacity-0'];
    }
    function cellStyle(column: TableColumn, index: number, span = 1, headerLevel?: number): CSSProperties {
      const side = fixedSide(column);
      const style: CSSProperties = {};
      if (side) {
        // 左固定累加左侧的左固定列，右固定累加跨度之后的右固定列。
        const offsets = fixedOffsets.value;
        style[side] = `${side === 'left' ? offsets.left[index] : offsets.right[Math.min(index + span, offsets.right.length - 1)]}px`;
        style.position = 'sticky';
        style.zIndex = headerLevel === undefined ? 10 : 30;
      }
      if (headerLevel !== undefined && fixedHeader.value) {
        style.position = 'sticky';
        style.top = `${headerTops.value[headerLevel] ?? 0}px`;
        style.zIndex = side ? 30 : 20;
      }
      return style;
    }
    function expandableButton(item: TableVisibleRow, expanded: boolean) {
      const loading = item.loading;
      return h('button', {
        type: 'button', disabled: props.table.loading, 'aria-expanded': expanded, 'aria-busy': loading,
        'aria-label': `${expanded ? '收起' : '展开'}第 ${item.index + 1} 行`,
        // 懒加载子行期间显示等待光标；整表加载时按钮被禁用，同样是等待（加载遮罩也盖在上面）
        class: ['box-border inline-flex size-4 shrink-0 items-center justify-center rounded-[2px] border border-gray-3 p-0 enabled:hover:bg-gray-3 enabled:active:bg-gray-3 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-wait', loading ? 'cursor-wait' : 'cursor-pointer'],
        onClick: (event: MouseEvent) => { event.stopPropagation(); state.toggleRowExpansion(item.row); },
      }, [loading ? h(RebornLoading, { size: 12, 'aria-hidden': true }) : expandIcon(expanded)]);
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
    /** 拖拽手柄：按住拖动或用上下方向键移动；点击不冒泡，不会触发行点击与当前行切换。 */
    function dragHandle(item: TableVisibleRow) {
      const enabled = drag.canDrag(item);
      return h('button', {
        type: 'button', 'data-table-drag-handle': '', disabled: !enabled,
        'aria-label': `拖动排序第 ${item.index + 1} 行，可用上下方向键移动`,
        // touch-none 让触屏按住手柄时不触发页面滚动，指针事件才能完整收到
        class: 'inline-flex size-6 shrink-0 cursor-grab touch-none items-center justify-center rounded-sm text-gray-6 hover:bg-gray-3 hover:text-gray-9 focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:text-gray-4 disabled:hover:bg-transparent',
        onPointerdown: (event: PointerEvent) => drag.start(event, item),
        onKeydown: (event: KeyboardEvent) => drag.keydown(event, item),
        onClick: (event: MouseEvent) => event.stopPropagation(),
      }, [grip()]);
    }
    /** 选择列与拖拽列只放一个控件，表头和单元格都水平垂直居中、收窄内边距。 */
    function isCentered(column: TableColumn) {
      return column.type === 'selection' || column.type === 'drag';
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
              class: 'group/sort inline-flex min-w-0 items-center gap-1 rounded-sm text-inherit focus-visible:outline-2 focus-visible:outline-primary',
              onClick: () => state.sortColumn(column),
            }, [header, h('span', { class: 'inline-flex shrink-0 flex-col -space-y-0.5' }, [chevron('up', order === 'ascending'), chevron('down', order === 'descending')])])
            : h('span', { class: 'min-w-0' }, header),
          column.filters?.length ? h(TableFilter, { column, values: state.filters.value[key] ?? [], disabled: props.table.loading, onApply: (values: typeof column.filteredValue) => state.setFilter(key, values ?? []) }) : null,
        ]);
      }
      return h('th', {
        key: `${key}@${start}`, scope: cell.colSpan > 1 ? 'colgroup' : 'col', colspan: cell.colSpan, rowspan: cell.rowSpan,
        'data-column-key': key,
        'data-fixed-edge': fixedEdge(column, start, cell.colSpan),
        'aria-sort': column.sortable ? order ?? 'none' : undefined,
        class: cls('headerCell', [fixedClass(column, start, cell.colSpan), rightBorderClass(start, cell.colSpan), isCentered(column) ? 'px-2 text-center' : alignClasses[column.headerAlign ?? column.align ?? 'left'], column.labelClassName]),
        style: cellStyle(column, start, cell.colSpan, level),
      }, [h('div', { class: cls('cellContent', isCentered(column) && 'flex items-center justify-center') }, content)]);
    }
    function renderCell(item: TableVisibleRow, column: TableColumn, columnIndex: number, view: RowView) {
      const key = getColumnKey(column, columnIndex);
      const scope: TableCellScope = { row: item.row, column, $index: item.index, columnIndex };
      const span = cellSpans.value[item.index]?.[columnIndex] ?? defaultSpan;
      if (!span.rowspan || !span.colspan) return null;
      let content: VNodeChild;
      const value = getValue(item.row, column.prop);
      if (column.type === 'selection' || column.type === 'radio') {
        const checked = view.selected;
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
      } else if (column.type === 'expand') content = expandableButton(item, view.expanded);
      else if (column.type === 'drag') content = dragHandle(item);
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
        class: cls('cellContent', ['break-words', isCentered(column) && 'flex items-center justify-center']),
      }, content);
      return h('td', {
        key: `${key}@${columnIndex}`, rowspan: span.rowspan, colspan: span.colspan,
        'data-fixed-edge': fixedEdge(column, columnIndex, span.colspan),
        class: cls('cell', [
          'bg-inherit', fixedClass(column, columnIndex, span.colspan), rightBorderClass(columnIndex, span.colspan),
          // 合并格属于首行 DOM，但覆盖任一行悬停时都应亮起；当前行的品牌底色优先。
          span.rowspan > 1 && isHovered(item.index, span.rowspan, view.hoverRange) && !view.current && 'bg-[color-mix(in_srgb,var(--color-gray-2)_30%,var(--color-gray-1))]',
          isCentered(column) ? 'px-2 text-center' : alignClasses[column.align ?? 'left'], column.className, typeof props.table.cellClassName === 'function' ? props.table.cellClassName(scope) : props.table.cellClassName,
        ]),
        style: cellStyle(column, columnIndex, span.colspan),
        onMouseenter: () => hoverCell(item.index, columnIndex),
        onMouseleave: leaveCell,
        onClick: (event: MouseEvent) => {
          if (props.table.loading) return;
          props.notify('cell-click', item.row, column, event.currentTarget as HTMLElement, event);
          props.notify('row-click', item.row, column, event);
          if (props.table.highlightCurrentRow) state.setCurrentRow(item.row);
        },
        onDblclick: (event: MouseEvent) => { if (!props.table.loading) props.notify('row-dblclick', item.row, column, event); },
      }, tree ? h('div', { class: 'flex min-w-0 items-center gap-1', style: { paddingLeft: `${item.level * (props.table.indent ?? 16)}px` } }, [
        item.hasChildren ? expandableButton(item, view.expanded) : h('span', { class: 'inline-block size-4 shrink-0' }),
        h('div', { class: 'min-w-0 flex-1' }, [text]),
      ]) : [text]);
    }
    function renderRow(item: TableVisibleRow, position: number, view: RowView) {
      const { selected, current, dragging } = view;
      return h('tr', {
        ref: (node: Element | ComponentPublicInstance | null) => { if (node) rowElements.set(item.key, node as HTMLTableRowElement); else rowElements.delete(item.key); },
        key: `${typeof item.key}:${item.key}`, 'data-row-key': item.key, 'data-selected': selected || undefined,
        'data-dragging': dragging || undefined,
        class: cls('row', [
          ((props.table.stripe && position % 2 === 1) || selected) && 'bg-gray-2',
          isHovered(position, 1, view.hoverRange) && 'bg-[color-mix(in_srgb,var(--color-gray-2)_30%,var(--color-gray-1))]',
          // 表格默认语义色为品牌色，color-2 对应品牌二阶；悬停不能盖掉当前行高亮。
          current && 'bg-brand-2 hover:bg-brand-2',
          // 拖动中的行淡出，落点由指示线标出
          dragging && 'opacity-50',
          typeof props.table.rowClassName === 'function' ? props.table.rowClassName({ row: item.row, rowIndex: item.index }) : props.table.rowClassName,
        ]),
      }, state.leaves.value.map((column, index) => renderCell(item, column, index, view)));
    }
    function renderExpanded(item: TableVisibleRow) {
      const column = expandColumn.value!;
      const scope = { row: item.row, column, $index: item.index, columnIndex: state.leaves.value.indexOf(column) };
      // data-table-expand 供拖拽计算落点块的底边：展开详情跟随所属行一起移动。
      return h('tr', { 'data-table-expand': '', onMouseenter: leaveCell }, [h('td', { colspan: Math.max(1, state.leaves.value.length), class: cls('expand') }, [slots.expand?.(scope) ?? column.cellRender?.(scope)])]);
    }
    function renderBody() {
      const result: VNodeChild[] = [];
      const details: VNodeChild[] = [];
      let mergeEnd = -1;
      state.visibleRows.value.forEach((item, position) => {
        const spans = cellSpans.value[position] ?? [];
        mergeEnd = Math.max(mergeEnd, ...spans.map(span => span.colspan ? position + span.rowspan - 1 : position));
        const rowProps = { item, position, slotRevision: props.slotRevision,
          selected: state.selectedSet.value.has(item.key), current: !!isCurrentRow(item), dragging: drag.draggingKey.value === item.key,
          expanded: state.expandedSet.value.has(item.key),
          hoverRange: isHovered(position, Math.max(1, ...spans.map(span => span.rowspan))) ? hoveredRange.value : '',
        };
        result.push(h(TableBodyRow, { ...rowProps, key: `${typeof item.key}:${item.key}`, render: renderRow }));
        if (expandColumn.value && rowProps.expanded) details.push(h(TableBodyRow, { ...rowProps, key: `expand-${typeof item.key}:${item.key}`, render: renderExpanded }));
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
    /** 滚动区内的全部内容；由 TableScrollContent 渲染，依赖只记在它自己身上。 */
    function renderScrollContent(): VNodeChild {
      return [
        h('table', { ref: tableElement, class: cls('table', props.table.tableLayout === 'auto' && 'table-auto'), 'aria-label': props.table.ariaLabel, style: { minWidth: `${state.leaves.value.reduce((sum, column) => sum + getColumnWidth(column), 0)}px` } }, [
          h('colgroup', state.leaves.value.map((column, index) => h('col', { key: `${getColumnKey(column, index)}@${index}`, style: { width: `${getColumnWidth(column)}px` } }))),
          props.table.showHeader === false ? null : h('thead', { class: cls('thead') }, headerRows.value.map((row, level) => h('tr', { key: level }, row.map(cell => renderHeader(cell, level))))),
          h('tbody', { class: '[&>tr:first-child>td]:border-t-0' }, state.visibleRows.value.length ? renderBody() : [h('tr', [h('td', { colspan: Math.max(1, state.leaves.value.length), class: cls('empty') }, slots.empty?.() ?? (props.table.loading ? '加载中' : h(RebornEmpty, { description: props.table.emptyText })))])]),
          props.table.showSummary ? h('tfoot', { class: cls('summary') }, [h('tr', state.leaves.value.map((column, index) => h('td', { key: `${getColumnKey(column, index)}@${index}`, 'data-fixed-edge': fixedEdge(column, index), class: cls('cell', ['bg-gray-2', fixedClass(column, index), rightBorderClass(index), alignClasses[column.align ?? 'left']]), style: cellStyle(column, index) }, [h('div', { class: cls('cellContent') }, state.summary.value[index] ?? '')])))]) : null,
        ]),
        slots.append?.(),
      ];
    }
    return () => h('div', { ...attrs, class: cls('root', [props.table.class, attrs.class as ClassValue]), 'data-reborn-table': '', 'data-size': props.table.size, 'aria-busy': props.table.loading }, [
      h('div', { ref: frameElement, class: 'relative' }, [
        h(RebornScrollbar, {
          ref: scrollbar, class: cls('scrollbar'), style: { height: toCssSize(props.table.height), maxHeight: toCssSize(props.table.maxHeight) },
          verticalOffset: headerOffset.value,
          // 固定表头不参与边缘回弹，只让当前表格的表体产生轻微位移。
          bounceTarget: headerOffset.value > 0 ? ':scope > table > tbody' : undefined,
          onScroll: updateHorizontalOverflow,
          // 固定列的层级留在内容区内，避免覆盖同级轨道并拦截滚动条拖拽。
          wrapClass: 'isolate max-h-[inherit]', contentClass: 'min-w-full',
        }, () => [h(TableScrollContent, { render: renderScrollContent, afterRender: doLayout, slotRevision: props.slotRevision })]),
        // 拖拽落点指示线：横跨可视宽度，位置由拖拽逻辑直接写入，平时隐藏
        h('div', { ref: indicatorElement, 'aria-hidden': 'true', class: 'pointer-events-none absolute inset-x-0 z-20 hidden h-0.5 -translate-y-1/2 bg-primary' }),
        props.table.loading ? h('div', { class: cls('loading'), role: 'status', 'aria-live': 'polite' }, slots.loading?.() ?? [h(RebornLoading, { size: 20 }), h('span', '加载中')]) : null,
      ]),
      slots.footer ? h('div', { class: cls('footer') }, slots.footer({ data: state.processed.value, selection: state.getSelectionRows() })) : null,
      props.table.pagination ? h('div', { class: cls('pagination') }, [h(RebornPagination, {
        ...state.paginationOptions.value, total: state.total.value, modelValue: state.page.value, pageSize: state.pageSize.value, size: props.table.size,
        disabled: props.table.loading, 'onUpdate:modelValue': state.setPage, 'onUpdate:pageSize': state.setPageSize,
      })]) : null,
    ]);
  },
});
