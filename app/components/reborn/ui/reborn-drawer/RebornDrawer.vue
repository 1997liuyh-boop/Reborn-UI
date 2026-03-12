<script setup lang="ts">
import { computed } from 'vue';
import RebornOverlay from '../reborn-overlay/RebornOverlay.vue';
import RebornTransition from '../reborn-transition/RebornTransition.vue';

const props = withDefaults(defineProps<{ modelValue?: boolean; placement?: 'left'|'right'|'top'|'bottom'; size?: string; zIndex?: number; closeOnClickOverlay?: boolean; lockScroll?: boolean; }>(), { modelValue: false, placement: 'right', size: '320px', zIndex: 20, closeOnClickOverlay: true, lockScroll: true });
const emit = defineEmits(['update:modelValue', 'close', 'open']);

const transitionName = computed(() => ({ left:'slide-right', right:'slide-right', top:'fade-down', bottom:'slide-up' }[props.placement] as any));
const panelStyle = computed(() => {
  if (props.placement === 'left' || props.placement === 'right') return `${props.placement}:0;top:0;height:100%;width:${props.size};`;
  return `${props.placement}:0;left:0;width:100%;height:${props.size};`;
});
</script>
<template>
  <RebornOverlay :model-value="props.modelValue" :z-index="props.zIndex" :close-on-click-overlay="props.closeOnClickOverlay" :lock-scroll="props.lockScroll" @update:model-value="emit('update:modelValue', $event)">
    <RebornTransition :show="props.modelValue" :name="transitionName" custom-class="pointer-events-auto fixed bg-white dark:bg-gray-900 shadow-xl" :custom-style="`z-index:${props.zIndex + 1};${panelStyle}`" @after-enter="emit('open')" @after-leave="emit('close')">
      <slot />
    </RebornTransition>
  </RebornOverlay>
</template>
