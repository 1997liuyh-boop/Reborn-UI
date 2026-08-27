<script setup lang="ts">
import { computed, inject } from "vue";

export interface DropdownItemProps {
  /** 点击时传递给 command 事件的标识 */
  command?: string;
  /** 是否在该项上方显示分隔线 */
  divided?: boolean;
  /** 是否禁用该项 */
  disabled?: boolean;
  /** 自定义类名 */
  class?: any;
}

const props = withDefaults(defineProps<DropdownItemProps>(), {
  divided: false,
  disabled: false,
});

const dropdownCtx = inject<{
  handleItemClick: (command: string) => void;
  ui: {
    item: (opts?: { class?: any }) => string;
    divider: (opts?: { class?: any }) => string;
    label: (opts?: { class?: any }) => string;
  };
} | null>("reborn-dropdown", null);

const fallbackUi = {
  item: (opts?: { class?: any }) => opts?.class || '',
  divider: (opts?: { class?: any }) => opts?.class || '',
  label: (opts?: { class?: any }) => opts?.class || '',
};

const ui = computed(() => {
  const ctxUi = dropdownCtx?.ui as any;
  // 父组件的 ui 是 ComputedRef，需要 .value 解包
  const raw = ctxUi?.value ?? ctxUi;
  return raw || fallbackUi;
});

function onClick() {
  if (props.disabled || !dropdownCtx) return;
  dropdownCtx.handleItemClick(props.command || "");
}
</script>

<template>
  <template v-if="divided">
    <div :class="ui.divider()" />
  </template>
  <div :class="ui.item({ class: props.class })" :data-disabled="disabled" role="menuitem" @click="onClick">
    <slot name="icon" />
    <span :class="ui.label()">
      <slot />
    </span>
  </div>
</template>
