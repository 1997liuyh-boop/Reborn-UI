<script setup lang="ts">
import type { ClassValue } from "clsx";
import { inject, type ComputedRef } from "vue";
import { cn } from "~/lib/utils";

export interface RebornMenuItemGroupProps {
  /** 组标题 */
  title?: string;
  /** 自定义类名 */
  class?: any;
  /** 内置 UI 部件的类名覆盖 */
  ui?: Partial<{
    menuItemGroup: ClassValue;
    menuItemGroupTitle: ClassValue;
  }>;
}

const props = withDefaults(defineProps<RebornMenuItemGroupProps>(), {
  title: "",
  class: undefined,
  ui: () => ({}),
});

const menuContext = inject<{
  backgroundColor: ComputedRef<string>;
  textColor: ComputedRef<string>;
  ui: any;
}>("reborn-menu");

const b = (opts?: any) => {
  const baseStyles = menuContext?.ui.value || {};
  return {
    menuItemGroup: (opts?: { class?: any }) =>
      cn(baseStyles.menuItemGroup?.(), opts?.class, props.ui?.menuItemGroup),
    menuItemGroupTitle: (opts?: { class?: any }) =>
      cn(baseStyles.menuItemGroupTitle?.(), opts?.class, props.ui?.menuItemGroupTitle),
  };
};
</script>

<template>
  <li :class="b().menuItemGroup({ class: props.class })" role="group">
    <div :class="b().menuItemGroupTitle()">
      <slot name="title">{{ title }}</slot>
    </div>
    <ul role="menu">
      <slot />
    </ul>
  </li>
</template>
