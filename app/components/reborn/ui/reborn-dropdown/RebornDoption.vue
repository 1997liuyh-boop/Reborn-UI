<script setup lang="ts">
import type { DropdownValue } from './reborn-dropdown.config';
import { computed, inject, toValue, useSlots } from 'vue';
import { cn } from '~/lib/utils';
import { DROPDOWN_INJECTION_KEY } from './reborn-dropdown.config';

defineOptions({ name: 'RebornDoption' });

const props = withDefaults(defineProps<DoptionProps>(), {
  value: '',
  disabled: false,
});

export interface DoptionProps {
  /** 选项值，被选中时通过 Dropdown 的 select 事件回传 */
  value?: DropdownValue;
  /**
   * 是否禁用
   * @defaultValue false
   */
  disabled?: boolean;
  class?: any;
}

const slots = useSlots();

const dropdown = inject(DROPDOWN_INJECTION_KEY, null);

/** 脱离 Dropdown 单独使用时退化为无样式节点 */
const fallbackUi = {
  item: (opts?: { class?: any }) => cn(opts?.class),
  itemIcon: (opts?: { class?: any }) => cn(opts?.class),
  itemLabel: (opts?: { class?: any }) => cn(opts?.class),
};

/** 上下文里的 ui 可以是 ref、getter 或普通对象（Breadcrumb 等宿主），toValue 统一解包；缺的键退化为无样式 */
const ui = computed(() => ({ ...fallbackUi, ...toValue(dropdown?.ui) }));

function onClick(ev: MouseEvent) {
  if (props.disabled || !dropdown) return;
  dropdown.select(props.value, ev);
}
</script>

<template>
  <div :class="ui.item({ class: props.class })" :data-disabled="disabled" role="menuitem" @click="onClick">
    <span v-if="slots.icon" :class="ui.itemIcon()">
      <slot name="icon" />
    </span>
    <span :class="ui.itemLabel()">
      <slot />
    </span>
  </div>
</template>
