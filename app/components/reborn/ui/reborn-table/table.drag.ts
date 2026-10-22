import type { TableKey, TableNotify, TableProps, TableRow, TableVisibleRow } from './table.types';
import { computed, nextTick, onBeforeUnmount, shallowRef } from 'vue';
import { locateRows, moveRow } from './table.utils';

/** 拖拽排序依赖的表格状态与 DOM 句柄，全部以函数传入，读取时才求值。 */
export interface TableDragOptions {
  props: Readonly<TableProps>;
  notify: TableNotify;
  /** 当前可见行（已分页、已按展开状态展平）。 */
  visibleRows: () => TableVisibleRow[];
  /** 是否存在生效的排序；排序视图下拖动结果会被排序立刻打回，因此禁用。 */
  sorted: () => boolean;
  /** 筛选、懒树克隆出的行换回 data 里的源对象。 */
  originOf: (row: TableRow) => TableRow;
  /** 行键到数据行元素的映射，用来量每个落点块的位置。 */
  rowElements: Map<TableKey, HTMLTableRowElement>;
  /** 滚动视窗，拖到上下边缘时自动滚动。 */
  wrap: () => HTMLElement | null | undefined;
  /** 指示线的定位容器。 */
  frame: () => HTMLElement | undefined;
  /** 指示线元素，位置直接写行内样式，拖动过程中不触发表格重绘。 */
  indicator: () => HTMLElement | undefined;
  /** 固定表头占用的高度，指示线与自动滚动都不进入表头区域。 */
  headerOffset: () => number;
}

interface DragTarget { item: TableVisibleRow; position: 'before' | 'after' }
interface DragSession {
  item: TableVisibleRow;
  group: TableVisibleRow[];
  /** 拖动开始时的可见行快照，用来找每个同级块的最后一个后代行。 */
  rows: TableVisibleRow[];
  handle: HTMLElement;
  pointerId: number;
  startY: number;
  lastY: number;
  moved: boolean;
  target?: DragTarget;
  frame?: number;
  cursor: string;
}

/** 指针移动不足这个距离（px）时视为点击，不进入拖拽。 */
const DRAG_THRESHOLD = 4;
/** 距视窗上下边缘多近（px）开始自动滚动。 */
const AUTO_SCROLL_EDGE = 32;
/** 自动滚动每帧最多滚动的距离（px）。 */
const AUTO_SCROLL_MAX = 16;

export function useTableDrag(options: TableDragOptions) {
  /** 正在拖动的行键；只在开始与结束各写一次，拖动过程中不触发表格重绘。 */
  const draggingKey = shallowRef<TableKey>();
  const childrenKey = () => options.props.treeProps?.children ?? 'children';
  const located = computed(() => locateRows(options.props.data ?? [], childrenKey()));
  /** 每个可见行的同级可见行：按层级栈还原父子关系，翻页或折叠后看不见的行不参与。 */
  const siblingGroups = computed(() => {
    const byParent = new Map<TableKey | undefined, TableVisibleRow[]>();
    const groups = new Map<TableKey, TableVisibleRow[]>();
    const stack: TableVisibleRow[] = [];
    for (const item of options.visibleRows()) {
      stack.length = item.level;
      const parent = stack[item.level - 1]?.key;
      stack[item.level] = item;
      const group = byParent.get(parent) ?? [];
      if (!byParent.has(parent)) byParent.set(parent, group);
      group.push(item);
      groups.set(item.key, group);
    }
    return groups;
  });
  let session: DragSession | undefined;

  /** 加载中、排序中、行不在 data 里（懒加载子行）或没有可交换的同级行时不可拖动。 */
  function canDrag(item: TableVisibleRow) {
    if (options.props.loading || options.sorted()) return false;
    if (!located.value.has(options.originOf(item.row))) return false;
    return (siblingGroups.value.get(item.key)?.length ?? 0) > 1;
  }

  /** 在源数据上执行移动并派发结果；位置不变时不派发。 */
  function commit(item: TableVisibleRow, target: DragTarget) {
    const row = options.originOf(item.row);
    const targetRow = options.originOf(target.item.row);
    const result = moveRow(options.props.data ?? [], row, targetRow, target.position, childrenKey());
    if (!result) return false;
    options.notify('row-drag-end', { row, targetRow, position: target.position, ...result });
    return true;
  }

  /** 方向键按同级顺序上移、下移一位，焦点留在被移动行的手柄上。 */
  function keydown(event: KeyboardEvent, item: TableVisibleRow) {
    if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
    event.preventDefault();
    event.stopPropagation();
    if (!canDrag(item)) return;
    const group = siblingGroups.value.get(item.key)!;
    const up = event.key === 'ArrowUp';
    const target = group[group.findIndex(sibling => sibling.key === item.key) + (up ? -1 : 1)];
    if (!target || !commit(item, { item: target, position: up ? 'before' : 'after' })) return;
    nextTick(() => options.rowElements.get(item.key)?.querySelector<HTMLElement>('[data-table-drag-handle]')?.focus());
  }

  /** 同级块的视口范围：从该行到它最后一个可见后代行，后面紧跟展开详情时一并算入。 */
  function blockRect(item: TableVisibleRow, rows: TableVisibleRow[]) {
    let end = rows.findIndex(row => row.key === item.key);
    if (end < 0) return;
    while (end + 1 < rows.length && rows[end + 1]!.level > item.level) end++;
    const first = options.rowElements.get(item.key);
    const last = options.rowElements.get(rows[end]!.key);
    if (!first || !last) return;
    const detail = last.nextElementSibling as HTMLElement | null;
    const bottom = (detail?.hasAttribute('data-table-expand') ? detail : last).getBoundingClientRect().bottom;
    return { top: first.getBoundingClientRect().top, bottom };
  }

  function showLine(clientY: number) {
    const indicator = options.indicator();
    const frame = options.frame();
    if (!indicator || !frame) return;
    let y = clientY;
    const wrap = options.wrap();
    if (wrap) {
      const rect = wrap.getBoundingClientRect();
      // 落点块滚出视窗时把线压在可视边缘，不画进固定表头
      y = Math.min(Math.max(y, rect.top + options.headerOffset()), rect.bottom);
    }
    indicator.style.top = `${y - frame.getBoundingClientRect().top}px`;
    indicator.style.display = 'block';
  }
  function hideLine() {
    const indicator = options.indicator();
    if (indicator) indicator.style.display = 'none';
  }

  /** 按指针位置算出插入位置：越过几个同级块的中线就插在第几位，落回原位时不显示指示线。 */
  function updateTarget() {
    const current = session;
    if (!current) return;
    const rects = current.group.map(item => blockRect(item, current.rows));
    const slot = rects.filter(rect => rect && current.lastY > (rect.top + rect.bottom) / 2).length;
    const from = current.group.findIndex(item => item.key === current.item.key);
    if (slot === from || slot === from + 1) {
      current.target = undefined;
      hideLine();
      return;
    }
    const before = slot < current.group.length;
    const index = before ? slot : current.group.length - 1;
    const rect = rects[index];
    current.target = { item: current.group[index]!, position: before ? 'before' : 'after' };
    if (rect) showLine(before ? rect.top : rect.bottom);
  }

  /** 拖拽期间逐帧检查指针是否贴近视窗上下边缘，越近滚得越快。 */
  function autoScroll() {
    const current = session;
    const wrap = options.wrap();
    if (!current || !wrap) return;
    if (wrap.scrollHeight > wrap.clientHeight) {
      const rect = wrap.getBoundingClientRect();
      const top = rect.top + options.headerOffset() + AUTO_SCROLL_EDGE;
      const bottom = rect.bottom - AUTO_SCROLL_EDGE;
      const distance = current.lastY < top ? current.lastY - top : current.lastY > bottom ? current.lastY - bottom : 0;
      const delta = Math.max(-AUTO_SCROLL_MAX, Math.min(AUTO_SCROLL_MAX, Math.round(distance / 2)));
      if (delta) {
        const before = wrap.scrollTop;
        wrap.scrollTop = before + delta;
        if (wrap.scrollTop !== before) updateTarget();
      }
    }
    current.frame = requestAnimationFrame(autoScroll);
  }

  function onMove(event: PointerEvent) {
    const current = session;
    if (!current || event.pointerId !== current.pointerId) return;
    current.lastY = event.clientY;
    if (!current.moved) {
      if (Math.abs(event.clientY - current.startY) < DRAG_THRESHOLD) return;
      current.moved = true;
      draggingKey.value = current.item.key;
      current.cursor = document.body.style.cursor;
      document.body.style.cursor = 'grabbing';
      if (typeof requestAnimationFrame !== 'undefined') current.frame = requestAnimationFrame(autoScroll);
    }
    updateTarget();
  }

  function finish() {
    const current = session;
    if (!current) return;
    session = undefined;
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerup', onUp);
    document.removeEventListener('pointercancel', finish);
    window.removeEventListener('keydown', onEscape, true);
    if (current.frame !== undefined) cancelAnimationFrame(current.frame);
    if (current.handle.hasPointerCapture?.(current.pointerId)) current.handle.releasePointerCapture(current.pointerId);
    if (current.moved) document.body.style.cursor = current.cursor;
    hideLine();
    draggingKey.value = undefined;
  }

  function onUp(event: PointerEvent) {
    const current = session;
    if (!current || event.pointerId !== current.pointerId) return;
    const target = current.moved ? current.target : undefined;
    finish();
    if (target) commit(current.item, target);
  }

  /** Esc 放弃本次拖拽，数据不变。 */
  function onEscape(event: KeyboardEvent) {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    finish();
  }

  /** 按住手柄开始拖拽：捕获指针，后续移动与松开都由文档级监听处理。 */
  function start(event: PointerEvent, item: TableVisibleRow) {
    if (event.button !== 0 || session || !canDrag(item)) return;
    // 阻止按下的默认行为，拖动时不选中文字
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture?.(event.pointerId);
    session = {
      item, group: siblingGroups.value.get(item.key)!, rows: options.visibleRows(), handle,
      pointerId: event.pointerId, startY: event.clientY, lastY: event.clientY, moved: false, cursor: '',
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', finish);
    window.addEventListener('keydown', onEscape, true);
  }

  onBeforeUnmount(finish);

  return { draggingKey, canDrag, start, keydown };
}
