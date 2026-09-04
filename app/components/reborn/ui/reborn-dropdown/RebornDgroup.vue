<script setup lang="ts">
import type { DropdownContext } from './reborn-dropdown.config';
import { computed, inject, useSlots } from 'vue';
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

const parent = inject<DropdownContext | null>(DROPDOWN_INJECTION_KEY, null);

const fallbackUi = {
  group: (opts?: { class?: any }) => cn(opts?.class),
  groupTitle: (opts?: { class?: any }) => cn(opts?.class),
};

const ui = computed(() => {
  const raw = parent?.ui as any;
  return (raw?.value ?? raw) || fallbackUi;
});
</script>

<template>
  <div :class="ui.group({ class: props.class })" role="group">
    <div v-if="title || slots.title" :class="ui.groupTitle()">
      <slot name="title">{{ title }}</slot>
    </div>
    <slot />
  </div>
</template>
