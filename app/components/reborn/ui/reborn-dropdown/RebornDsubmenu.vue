<script setup lang="ts">
import type { DropdownContext, DropdownPosition, DropdownTrigger } from './reborn-dropdown.config';
import { computed, inject, useSlots } from 'vue';
import { cn } from '~/lib/utils';
import { DROPDOWN_INJECTION_KEY, SUBMENU_POPUP_OFFSET } from './reborn-dropdown.config';
import RebornDropdown from './RebornDropdown.vue';

defineOptions({ name: 'RebornDsubmenu' });

const props = withDefaults(defineProps<DsubmenuProps>(), {
  disabled: false,
  trigger: 'hover',
  position: 'rightTop',
});

export interface DsubmenuProps {
  /** 子菜单入口的文字（也可用 title 插槽） */
  title?: string;
  /**
   * 是否禁用
   * @defaultValue false
   */
  disabled?: boolean;
  /**
   * 子菜单的触发方式
   * @defaultValue 'hover'
   */
  trigger?: DropdownTrigger;
  /**
   * 子菜单弹出位置
   * @defaultValue 'rightTop'
   */
  position?: DropdownPosition;
  class?: any;
}

const slots = useSlots();

/** 入口行的样式取自父级 Dropdown，与普通选项保持一致 */
const parent = inject<DropdownContext | null>(DROPDOWN_INJECTION_KEY, null);

const fallbackUi = {
  item: (opts?: { class?: any }) => cn(opts?.class),
  itemIcon: (opts?: { class?: any }) => cn(opts?.class),
  itemLabel: (opts?: { class?: any }) => cn(opts?.class),
  submenuIcon: (opts?: { class?: any }) => cn(opts?.class),
};

const ui = computed(() => {
  const raw = parent?.ui as any;
  return (raw?.value ?? raw) || fallbackUi;
});
</script>

<template>
  <!--
    子菜单就是一个嵌套的 Dropdown：入口行作为它的触发器铺满整行，面板默认从右上角弹出。
    悬停链路维持、子面板内点击不算外部、选中向上冒泡，均由 RebornDropdown 的嵌套逻辑处理。
  -->
  <RebornDropdown
    :trigger="trigger" :position="position" :disabled="disabled" :popup-offset="SUBMENU_POPUP_OFFSET"
    class="w-full" :ui="{ trigger: 'w-full' }"
  >
    <div :class="ui.item({ class: props.class })" :data-disabled="disabled" role="menuitem" aria-haspopup="menu">
      <span v-if="slots.icon" :class="ui.itemIcon()">
        <slot name="icon" />
      </span>
      <span :class="ui.itemLabel()">
        <slot name="title">{{ title }}</slot>
      </span>
      <Icon name="lucide:chevron-right" :class="ui.submenuIcon()" />
    </div>

    <template #content>
      <slot />
    </template>
  </RebornDropdown>
</template>
