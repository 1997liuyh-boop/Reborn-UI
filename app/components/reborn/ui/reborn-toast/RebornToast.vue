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
const rootClass = computed(() => `${toastTheme.root} ${toastTheme.positions[state.value.position || 'middle-top']}`);
</script>
<template>
  <RebornOverlay v-if="state.cover" :model-value="!!state.show" :z-index="state.zIndex || 100" custom-style="background-color:transparent;pointer-events:auto;" />
  <RebornTransition name="fade" :show="!!state.show" :custom-style="`z-index:${state.zIndex || 100};position:fixed;left:0;top:50%;width:100%;transform:translateY(-50%);text-align:center;pointer-events:none;`">
    <div :class="rootClass">
      <Icon v-if="state.iconName" :name="state.iconName === 'loading' ? 'lucide:loader-2' : (state.iconName === 'success' ? 'lucide:circle-check' : state.iconName === 'error' ? 'lucide:circle-x' : state.iconName === 'warning' ? 'lucide:triangle-alert' : 'lucide:info')" :class="state.iconName === 'loading' ? 'mr-2 animate-spin' : 'mr-2'" />
      <span :class="toastTheme.msg">{{ state.msg }}</span>
    </div>
  </RebornTransition>
</template>
