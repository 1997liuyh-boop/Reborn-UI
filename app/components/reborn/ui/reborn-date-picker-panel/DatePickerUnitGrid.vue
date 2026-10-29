<script setup lang="ts">
import type { ClassValue } from 'clsx';
import type theme from './reborn-date-picker-panel.config';
import type { DatePickerCell } from './reborn-date-picker-panel.config';

/** 年 / 月 / 季度网格的单元格：规则与选中状态都由面板预先算好，网格只读字段 */
export interface UnitCell {
  /** 年份、月份（1~12）或季度（1~4） */
  value: number;
  /** 单元格代表的日期：当年 1 月 1 日、当月 1 日或季度首日 */
  date: Date;
  /** 未自定义插槽时显示的文本 */
  label: string;
  disabled: boolean;
  selected: boolean;
  inRange: boolean;
  /** 范围端点的封口方向，同一格既是起点又是终点时为 both（保留完整圆角） */
  cap: 'start' | 'end' | 'both' | null;
  isToday: boolean;
  /** 年视图里十年页之外的前后补位年份 */
  outside: boolean;
}

interface Props {
  kind: 'year' | 'month' | 'quarter';
  cells: UnitCell[];
  highlightToday?: boolean;
  ui: Record<keyof typeof theme.slots, (options?: { class?: ClassValue }) => string>;
}

const props = defineProps<Props>();

const emit = defineEmits<{ select: [cell: UnitCell]; hover: [date: Date | null] }>();

defineSlots<{ default?: (cell: DatePickerCell) => any }>();

/** 年视图四列、月视图四列、季度视图两列 */
function gridClass() {
  if (props.kind === 'year') return props.ui.grid4Year();
  if (props.kind === 'month') return props.ui.grid4Month();
  return props.ui.grid2Quarter();
}

/**
 * 单元格样式。端点内侧的圆角要压平（yearMonthRangeStart / yearMonthRangeEnd），才能与中间项的直带无缝相接。
 * 年视图历来先「今天」后「禁用」（同时命中时禁用色胜出），月 / 季度视图先「禁用」后「今天」，保持原有层叠顺序
 */
function itemClass(cell: UnitCell) {
  const ui = props.ui;
  const state = cell.selected ? ui.dayActive() : cell.inRange ? ui.yearMonthInRange() : '';
  const capStart = cell.cap === 'start' ? ui.yearMonthRangeStart() : '';
  const capEnd = cell.cap === 'end' ? ui.yearMonthRangeEnd() : '';
  const today = props.highlightToday && cell.isToday && !cell.disabled && !cell.selected ? ui.dayToday() : '';
  const disabled = cell.disabled ? ui.dayDisabled() : '';
  const tail = props.kind === 'year' ? [today, disabled, cell.outside ? ui.yearMonthOutside() : ''] : [disabled, today];
  return ui.yearMonthItem({ class: [state, capStart, capEnd, ...tail] });
}

/** default 插槽的作用域参数，每次渲染给出新的日期对象，使用方改写它不会影响面板状态 */
function slotProps(cell: UnitCell): DatePickerCell {
  return {
    type: props.kind,
    text: cell.value,
    date: new Date(cell.date),
    disabled: cell.disabled,
    selected: cell.selected,
    inRange: cell.inRange,
    isToday: cell.isToday,
    outside: cell.outside,
  };
}
</script>

<template>
  <div :class="gridClass()" @mouseleave="emit('hover', null)">
    <div
      v-for="cell in cells"
      :key="cell.value"
      :class="itemClass(cell)"
      @click.stop="emit('select', cell)"
      @mouseenter="emit('hover', cell.disabled ? null : cell.date)"
    >
      <slot v-bind="slotProps(cell)">{{ cell.label }}</slot>
    </div>
  </div>
</template>
