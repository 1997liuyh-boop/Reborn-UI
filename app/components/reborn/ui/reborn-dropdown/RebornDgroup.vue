<script setup lang="ts">
import { computed, inject, toValue, useSlots } from 'vue';
import { cn } from '~/lib/utils';
import { DROPDOWN_INJECTION_KEY } from './reborn-dropdown.config';

defineOptions({ name: 'RebornDgroup' });

const props = defineProps<DgroupProps>();

export interface DgroupProps {
  /** 选项组标题（也可用 title 插槽） */
  title?: string;
  class?: any;
}

const slots = useSlots();

const parent = inject(DROPDOWN_INJECTION_KEY, null);

const fallbackUi = {
  group: (opts?: { class?: any }) => cn(opts?.class),
  groupTitle: (opts?: { class?: any }) => cn(opts?.class),
};

/** 宿主只提供了部分样式键时，缺的键退化为无样式 */
const ui = computed(() => ({ ...fallbackUi, ...toValue(parent?.ui) }));
</script>

<template>
  <div :class="ui.group({ class: props.class })" role="group">
    <div v-if="title || slots.title" :class="ui.groupTitle()">
      <slot name="title">{{ title }}</slot>
    </div>
    <slot />
  </div>
</template>
