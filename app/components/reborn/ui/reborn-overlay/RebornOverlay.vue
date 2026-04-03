<script setup lang="ts">
import { computed, watch } from 'vue';
import RebornTransition from '../reborn-transition/RebornTransition.vue';
import theme from './reborn-overlay.config';

interface Props {
  modelValue?: boolean;
  duration?: number;
  lockScroll?: boolean;
  zIndex?: number;
  closeOnClickOverlay?: boolean;
  absolute?: boolean;
  customClass?: string;
  customStyle?: string;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  duration: 300,
  lockScroll: true,
  zIndex: 100,
  closeOnClickOverlay: true,
  absolute: false,
  customClass: '',
  customStyle: ''
});
const emit = defineEmits(['update:modelValue', 'close', 'afterLeave']);

let initialPaddingState = { right: '', overflow: '' };
let lockTimeout: any;

watch(() => props.modelValue && props.lockScroll, (locked) => {
  if (typeof document === 'undefined') return;
  const body = document.body;
  clearTimeout(lockTimeout);
  if (locked) {
    if (!body.hasAttribute('data-scroll-locked')) {
      const scrollbarWidth = window.innerWidth - body.clientWidth;
      initialPaddingState.right = body.style.paddingRight;
      initialPaddingState.overflow = body.style.overflow;
      if (scrollbarWidth > 0) {
        body.style.paddingRight = `${scrollbarWidth}px`;
      }
      body.style.overflow = 'hidden';
      body.setAttribute('data-scroll-locked', '1');
    } else {
      const lockCount = parseInt(body.getAttribute('data-scroll-locked') || '1', 10);
      body.setAttribute('data-scroll-locked', (lockCount + 1).toString());
    }
  } else {
    lockTimeout = setTimeout(() => {
      if (body.hasAttribute('data-scroll-locked')) {
        const lockCount = parseInt(body.getAttribute('data-scroll-locked') || '1', 10) - 1;
        if (lockCount <= 0) {
          body.style.paddingRight = initialPaddingState.right;
          body.style.overflow = initialPaddingState.overflow;
          body.removeAttribute('data-scroll-locked');
        } else {
          body.setAttribute('data-scroll-locked', lockCount.toString());
        }
      }
    }, props.duration);
  }
}, { immediate: true });

const overlayClass = computed(() => `${props.absolute ? 'absolute' : 'fixed'} ${theme.base} ${props.customClass}`);
const overlayStyle = computed(() => `z-index:${props.zIndex};${props.customStyle}`);
const onClick = () => { if (props.closeOnClickOverlay) { emit('update:modelValue', false); emit('close'); } };
</script>
<template>
  <RebornTransition :show="props.modelValue" :appear="true" name="fade" :duration="props.duration"
    :custom-class="overlayClass" :custom-style="overlayStyle" :disable-touch-move="props.lockScroll" @click="onClick"
    @after-leave="emit('afterLeave')">
    <slot />
  </RebornTransition>
</template>
