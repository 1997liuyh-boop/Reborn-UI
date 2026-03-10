<script setup lang="ts" generic="T">
import { ref, watch } from 'vue';
import theme from './reborn-draggable.config';

const props = withDefaults(defineProps<{ modelValue?: T[]; disabled?: boolean; className?: string; }>(), { modelValue: () => [], disabled: false, className: '' });
const emit = defineEmits(['update:modelValue', 'change', 'start', 'end']);
const list = ref<T[]>([...props.modelValue]);
const dragIndex = ref(-1);
watch(() => props.modelValue, (v) => { list.value = [...v]; }, { deep: true });

const onDragStart = (index: number) => { if (props.disabled) return; dragIndex.value = index; emit('start', { index, item: list.value[index] }); };
const onDrop = (index: number) => {
  if (dragIndex.value < 0 || dragIndex.value === index) return;
  const next = [...list.value];
  const [item] = next.splice(dragIndex.value, 1);
  next.splice(index, 0, item);
  list.value = next;
  emit('update:modelValue', next);
  emit('change', next);
};
</script>
<template>
  <div :class="`${theme.root} ${props.className}`">
    <div v-for="(item, index) in list" :key="index" :class="theme.item" :draggable="!props.disabled" @dragstart="onDragStart(index)" @dragover.prevent @drop="onDrop(index)" @dragend="emit('end')">
      <slot name="item" :item="item" :index="index" :dragging="dragIndex === index">{{ item }}</slot>
    </div>
  </div>
</template>
