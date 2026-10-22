<script setup lang="ts" generic="T extends Record<string, any> | string | number">
import { onBeforeUnmount, ref, watch } from 'vue';
import { useMotionList } from '@/composables/useMotionList';
import { runMotion, stopMotion } from '@/lib/motion';
import theme from './reborn-draggable.config';

const props = withDefaults(defineProps<{ modelValue?: T[]; disabled?: boolean; className?: string; }>(), { modelValue: () => [], disabled: false, className: '' });
const emit = defineEmits(['update:modelValue', 'change', 'start', 'end']);
const list = ref<T[]>([...props.modelValue]);
const dragIndex = ref(-1);
const isDragging = ref(false);
const listMotion = useMotionList();
const vMotionList = listMotion.directive;
let draggedElement: HTMLElement | null = null;
const dragStyles = new Map<HTMLElement, { inline: string; base: string }>();
const itemKeys = new WeakMap<object, symbol>();

watch(() => props.modelValue, (v) => {
  if (!isDragging.value) {
    list.value = [...v];
  }
}, { deep: true });

const isItemDisabled = (item: any) => props.disabled || (item && typeof item === 'object' && item.disabled === true);

const onDragStart = (e: DragEvent, index: number, item: any) => {
  if (isItemDisabled(item)) return e.preventDefault();
  isDragging.value = true;
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
    next.splice(index, 0, draggedItem as any);
  }
  list.value = next;
  dragIndex.value = index;
};

const onDrop = () => {
  emit('update:modelValue', list.value);
  emit('change', list.value);
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
  emit('end');
};

onBeforeUnmount(() => {
  for (const [element, style] of dragStyles) {
    stopMotion(element);
    element.style.scale = style.inline;
  }
  dragStyles.clear();
});

const getItemKey = (item: any) => {
  if (!item || typeof item !== 'object') return item;
  const key = item.id ?? item.key ?? item.name;
  if (key != null) return key;
  // 没有业务 key 的对象保留引用身份，重排时不复用其他项的 DOM。
  if (!itemKeys.has(item)) itemKeys.set(item, Symbol('draggable-item'));
  return itemKeys.get(item);
};
</script>

<template>
  <TransitionGroup
    v-motion-list tag="div" :class="`${theme.root} relative ${props.className}`" :css="false"
    @enter="listMotion.enter" @leave="listMotion.leave"
    @enter-cancelled="listMotion.cancel" @leave-cancelled="listMotion.cancel"
  >
    <div
      v-for="(item, index) in list" :key="getItemKey(item)" :class="[
        theme.item,
        isItemDisabled(item) ? 'cursor-not-allowed opacity-50' : 'cursor-move',
        dragIndex === index ? 'opacity-90 relative z-10' : ''
      ]" :draggable="!isItemDisabled(item)" @dragstart="onDragStart($event, index, item)"
      @dragenter="onDragEnter($event, index)" @dragover.prevent @drop="onDrop" @dragend="onDragEnd"
    >
      <div class="min-w-0"><slot name="item" :item="item" :index="index" :dragging="dragIndex === index">{{ item }}</slot></div>
    </div>
  </TransitionGroup>
</template>
