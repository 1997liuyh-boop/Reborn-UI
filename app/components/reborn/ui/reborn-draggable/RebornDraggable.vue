<script setup lang="ts" generic="T extends Record<string, any> | string | number">
import { computed, nextTick, onBeforeUnmount, shallowRef, watch } from 'vue';
import { useMotionList } from '@/composables/useMotionList';
import { runMotion, stopMotion } from '@/lib/motion';
import theme from './reborn-draggable.config';

export interface DraggableProps {
  /**
   * 是否禁用整体拖拽
   * @defaultValue false
   */
  disabled?: boolean;
  /** 追加到根节点的类名，多列 / 网格布局通过它传入（如 grid-cols-2） */
  className?: string;
}

const props = withDefaults(defineProps<DraggableProps>(), { disabled: false, className: '' });
const emit = defineEmits<{
  /** 在列表项上松手、排序完成时触发，回调为新的列表 */
  change: [list: T[]];
  /** 开始拖拽时触发 */
  start: [payload: { index: number; item: T }];
  /** 拖拽结束时触发（无论是否完成排序） */
  end: [];
}>();
defineSlots<{
  /** 自定义列表项内容；dragging 表示该项是否正在被拖动 */
  item?: (props: { item: T; index: number; dragging: boolean }) => any;
}>();

/** 绑定的数据列表（v-model），排序结果以它为准 */
const model = defineModel<T[]>({ default: () => [] });

/** 拖拽过程中的草稿顺序：dragenter 时即时重排用于展示，结束后再以 model 为准回读 */
const list = shallowRef<T[]>([...model.value]);
const dragIndex = shallowRef(-1);
const isDragging = shallowRef(false);
const listMotion = useMotionList();
const vMotionList = listMotion.directive;
let draggedElement: HTMLElement | null = null;
/** 本次拖拽是否落在了列表项上；没有 drop 只有 dragend 时视为取消 */
let dropped = false;
const dragStyles = new Map<HTMLElement, { inline: string; base: string }>();
const itemKeys = new WeakMap<object, symbol>();

watch(model, (v) => {
  if (!isDragging.value) {
    list.value = [...v];
  }
}, { deep: true });

const isItemDisabled = (item: any) => props.disabled || (item && typeof item === 'object' && item.disabled === true);

const onDragStart = (e: DragEvent, index: number, item: T) => {
  if (isItemDisabled(item)) return e.preventDefault();
  isDragging.value = true;
  dropped = false;
  dragIndex.value = index;
  if (e.currentTarget instanceof HTMLElement) {
    // 补位与抬升分属两层，避免同一节点上的运动互相中断。
    draggedElement = e.currentTarget.firstElementChild as HTMLElement;
    const original = dragStyles.get(draggedElement);
    const computed = getComputedStyle(draggedElement).scale;
    const style = { inline: original?.inline ?? draggedElement.style.scale, base: original?.base ?? (computed && computed !== 'none' ? computed : '1') };
    dragStyles.set(draggedElement, style);
    const lifted = style.base.split(' ').map(value => `${Number.parseFloat(value) * 1.04}${value.endsWith('%') ? '%' : ''}`).join(' ');
    runMotion(draggedElement, { scale: lifted }, { duration: 0.15 });
  }
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
  }
  emit('start', { index, item });
};

const onDragEnter = (e: DragEvent, index: number) => {
  e.preventDefault();
  if (dragIndex.value < 0 || dragIndex.value === index) return;

  const next = [...list.value];
  const [draggedItem] = next.splice(dragIndex.value, 1);
  if (draggedItem !== undefined) {
    next.splice(index, 0, draggedItem);
  }
  list.value = next;
  dragIndex.value = index;
};

const onDrop = () => {
  dropped = true;
  const next = list.value;
  model.value = next;
  emit('change', next);
};

const onDragEnd = () => {
  if (draggedElement) {
    const element = draggedElement;
    const style = dragStyles.get(element)!;
    const animation = runMotion(element, { scale: style.base }, { duration: 0.18 });
    void animation.finished.then(() => {
      if (dragStyles.get(element) !== style) return;
      element.style.scale = style.inline;
      dragStyles.delete(element);
    });
    draggedElement = null;
  }
  dragIndex.value = -1;
  isDragging.value = false;
  if (!dropped) {
    // 在间隙、列表外松手或按 Esc 取消：只有 dragend 没有 drop，显示顺序回滚到 modelValue
    list.value = [...model.value];
  }
  else {
    // 已提交新顺序：等父组件处理完 update:modelValue 再回读，父组件拒绝（未更新绑定值）时同样回滚
    nextTick(() => {
      if (!isDragging.value) list.value = [...model.value];
    });
  }
  dropped = false;
  emit('end');
};

onBeforeUnmount(() => {
  for (const [element, style] of dragStyles) {
    stopMotion(element);
    element.style.scale = style.inline;
  }
  dragStyles.clear();
});

/**
 * 每一项的渲染 key。
 * 原始值按「类型 + 值 + 第几次出现」区分，['a', 'a'] 这类重复值不会产生重复 key；
 * 对象只认 id / key 字段，没有时按引用身份分配，不再用 name 兜底（name 常有重复）。
 */
const renderKeys = computed(() => {
  const seen = new Map<string, number>();
  return list.value.map((item) => {
    if (item && typeof item === 'object') {
      const key = item.id ?? item.key;
      if (key != null) return key;
      // 没有业务 key 的对象保留引用身份，重排时不复用其他项的 DOM。
      if (!itemKeys.has(item)) itemKeys.set(item, Symbol('draggable-item'));
      return itemKeys.get(item);
    }
    const base = `${typeof item}:${String(item)}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return `${base}#${count}`;
  });
});
</script>

<template>
  <TransitionGroup
    v-motion-list tag="div" :class="`${theme.root} relative ${props.className}`" :css="false"
    @enter="listMotion.enter" @leave="listMotion.leave"
    @enter-cancelled="listMotion.cancel" @leave-cancelled="listMotion.cancel"
  >
    <div
      v-for="(item, index) in list" :key="renderKeys[index]" :class="[
        theme.item,
        isItemDisabled(item) ? 'cursor-not-allowed opacity-50' : 'cursor-move',
        dragIndex === index ? 'opacity-90 relative z-10' : '',
      ]" :draggable="!isItemDisabled(item)" @dragstart="onDragStart($event, index, item)"
      @dragenter="onDragEnter($event, index)" @dragover.prevent @drop="onDrop" @dragend="onDragEnd"
    >
      <div class="min-w-0"><slot name="item" :item="item" :index="index" :dragging="dragIndex === index">{{ item }}</slot></div>
    </div>
  </TransitionGroup>
</template>
