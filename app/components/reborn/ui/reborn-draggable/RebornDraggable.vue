<script setup lang="ts" generic="T extends Record<string, any> | string | number">
import { ref, watch } from 'vue';
import theme from './reborn-draggable.config';

const props = withDefaults(defineProps<{ modelValue?: T[]; disabled?: boolean; className?: string; }>(), { modelValue: () => [], disabled: false, className: '' });
const emit = defineEmits(['update:modelValue', 'change', 'start', 'end']);
const list = ref<T[]>([...props.modelValue]);
const dragIndex = ref(-1);
const isDragging = ref(false);

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
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move';
  }
  emit('start', { index, item });
};

const onDragEnter = (e: DragEvent, index: number, item: any) => {
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

const onDrop = (index: number) => {
  emit('update:modelValue', list.value);
  emit('change', list.value);
};

const onDragEnd = () => {
  dragIndex.value = -1;
  isDragging.value = false;
  emit('end');
};

const getItemKey = (item: any, index: number) => {
  return (item && typeof item === 'object' && (item.id || item.key || item.name)) || item || index;
};
</script>

<template>
  <TransitionGroup tag="div" :class="`${theme.root} ${props.className}`" name="reborn-drag">
    <div v-for="(item, index) in list" :key="getItemKey(item, index)" :class="[
      theme.item,
      isItemDisabled(item) ? 'cursor-not-allowed opacity-50' : 'cursor-move',
      dragIndex === index ? 'opacity-90 scale-105 shadow-md relative z-10' : ''
    ]" :draggable="!isItemDisabled(item)" @dragstart="onDragStart($event, index, item)"
      @dragenter="onDragEnter($event, index, item)" @dragover.prevent @drop="onDrop(index)" @dragend="onDragEnd">
      <slot name="item" :item="item" :index="index" :dragging="dragIndex === index">{{ item }}</slot>
    </div>
  </TransitionGroup>
</template>

<style scoped>
.reborn-drag-move {
  transition: transform 0.3s ease;
}

.reborn-drag-enter-active,
.reborn-drag-leave-active {
  transition: all 0.3s ease;
}

.reborn-drag-enter-from,
.reborn-drag-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
