<script setup lang="ts">
import type { ToastOptions } from './index';
import { computed, inject, ref, watch } from 'vue';
import RebornOverlay from '../reborn-overlay/RebornOverlay.vue';
import RebornTransition from '../reborn-transition/RebornTransition.vue';
import { defaultOptions, getToastOptionKey } from './index';
import { toastTheme } from './reborn-toast.config';

const props = withDefaults(defineProps<{ selector?: string }>(), { selector: '' });
const key = getToastOptionKey(props.selector);
const optionRef = inject(key, ref<ToastOptions>(defaultOptions));
const state = ref<ToastOptions>({ ...defaultOptions });
watch(() => optionRef.value, (v) => { state.value = { ...v }; }, { immediate: true, deep: true });

const rootClass = computed(() => {
  const base = toastTheme.root;
  const pos = toastTheme.positions[state.value.position || 'top'];
  const customConfigColor = state.value.color ? toastTheme.colors[state.value.color as keyof typeof toastTheme.colors] : '';
  const finalBase = customConfigColor ? base.replace('bg-black/80', '').replace('text-white', '') + ` ${customConfigColor}` : base;
  return `${finalBase} ${pos}`;
});

const getIconName = (name: string) => {
  if (name === 'loading') return 'lucide:loader-2';
  if (name === 'success') return 'lucide:circle-check';
  if (name === 'error') return 'lucide:circle-x';
  if (name === 'warning') return 'lucide:triangle-alert';
  if (name === 'info') return 'lucide:info';
  return name;
};
</script>
<template>
  <RebornOverlay v-if="state.cover" :model-value="!!state.show" :z-index="state.zIndex || 100"
    custom-style="background-color:transparent;pointer-events:auto;" />
  <RebornTransition name="fade" :show="!!state.show"
    :custom-style="`z-index:${state.zIndex || 100};position:fixed;left:0;top:50%;width:100%;transform:translateY(-50%);text-align:center;pointer-events:none;`">
    <div :class="rootClass">
      <Transition name="fade-content" mode="out-in">
        <div :key="state.msg + (state.iconName || '') + (state.color || '')"
          class="flex items-center justify-center transition-all duration-300"
          :class="{ 'flex-col': state.direction === 'vertical' }">
          <Icon v-if="state.iconName" :name="getIconName(state.iconName)" :class="[
            state.iconName === 'loading' ? 'animate-spin' : '',
            state.iconName === 'success' ? 'text-success' : '',
            state.iconName === 'error' ? 'text-error' : '',
            state.iconName === 'warning' ? 'text-warning' : '',
            state.iconName === 'info' ? 'text-info' : '',
            state.direction === 'vertical' ? 'mb-2 text-3xl' : 'mr-2 text-xl'
          ]" />
          <span :class="toastTheme.msg">{{ state.msg }}</span>
        </div>
      </Transition>
    </div>
  </RebornTransition>
</template>

<style scoped>
.fade-content-enter-active,
.fade-content-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-content-enter-from,
.fade-content-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
