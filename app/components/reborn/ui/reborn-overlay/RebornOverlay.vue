<script setup lang="ts">
import { computed, watch } from 'vue';
import RebornTransition from '../reborn-transition/RebornTransition.vue';
import theme from './reborn-overlay.config';

const props = withDefaults(defineProps<{ modelValue?: boolean; duration?: number; lockScroll?: boolean; zIndex?: number; closeOnClickOverlay?: boolean; customClass?: string; customStyle?: string; }>(), { modelValue: false, duration: 300, lockScroll: true, zIndex: 10, closeOnClickOverlay: true, customClass: '', customStyle: '' });
const emit = defineEmits(['update:modelValue', 'close']);

watch(() => props.modelValue && props.lockScroll, (locked) => {
  if (typeof document !== 'undefined') document.body.style.overflow = locked ? 'hidden' : '';
}, { immediate: true });

const overlayClass = computed(() => `${theme.base} ${props.customClass}`);
const overlayStyle = computed(() => `z-index:${props.zIndex};${props.customStyle}`);
const onClick = () => { if (props.closeOnClickOverlay) { emit('update:modelValue', false); emit('close'); } };
</script>
<template>
  <RebornTransition :show="props.modelValue" name="fade" :duration="props.duration" :custom-class="overlayClass" :custom-style="overlayStyle" :disable-touch-move="props.lockScroll" @click="onClick">
    <slot />
  </RebornTransition>
</template>
