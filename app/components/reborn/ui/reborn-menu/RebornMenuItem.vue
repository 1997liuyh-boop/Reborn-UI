<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, inject, type ComputedRef } from "vue";
import { cn } from "~/lib/utils";
import theme from "./reborn-menu.config";

export interface RebornMenuItemProps {
  index: string;
  route?: string | object;
  disabled?: boolean;
  class?: any;
  ui?: Partial<{
    menuItem: ClassValue;
    menuItemContent: ClassValue;
    menuItemTitle: ClassValue;
    menuItemIcon: ClassValue;
  }>;
}

const props = withDefaults(defineProps<RebornMenuItemProps>(), {
  disabled: false,
  class: undefined,
  ui: () => ({}),
});

const emit = defineEmits<{
  (e: "click", index: string): void;
}>();

const menuContext = inject<{
  active: { value: string[] };
  openedMenus: { value: string[] };
  parentIndexPath: ComputedRef<string[]>;
  mode: ComputedRef<"horizontal" | "vertical">;
  collapse: ComputedRef<boolean>;
  color: ComputedRef<any>;
  backgroundColor: ComputedRef<string>;
  textColor: ComputedRef<string>;
  activeTextColor: ComputedRef<string>;
  ui: any;
  handleSelect: (index: string, indexPath: string[]) => void;
}>("reborn-menu");

const isActive = computed(() => menuContext?.active.value.includes(props.index) ?? false);
const indexPath = computed(() => [...(menuContext?.parentIndexPath.value ?? []), props.index]);

const itemStyle = computed(() => {
  if (!menuContext) return undefined;

  return {
    color: isActive.value ? menuContext.activeTextColor.value : menuContext.textColor.value,
  };
});

const itemUi = computed(() => {
  const styles = theme({
    mode: menuContext?.mode.value ?? "vertical",
    collapse: menuContext?.collapse.value ?? false,
    color: menuContext?.color.value ?? "primary",
    active: isActive.value,
    disabled: props.disabled,
  });

  const localOverrides = props.ui || {};

  return {
    menuItem: (opts?: { class?: any }) =>
      cn(
        styles.menuItem?.({
          active: isActive.value,
          color: menuContext?.color.value,
          disabled: props.disabled,
        }),
        opts?.class,
        localOverrides.menuItem
      ),
    menuItemContent: (opts?: { class?: any }) =>
      cn(styles.menuItemContent?.(), opts?.class, localOverrides.menuItemContent),
    menuItemTitle: (opts?: { class?: any }) =>
      cn(styles.menuItemTitle?.(), opts?.class, localOverrides.menuItemTitle),
    menuItemIcon: (opts?: { class?: any }) =>
      cn(styles.menuItemIcon?.(), opts?.class, localOverrides.menuItemIcon),
  };
});

function handleClick() {
  if (props.disabled) return;

  emit("click", props.index);
  menuContext?.handleSelect(props.index, indexPath.value);
}
</script>

<template>
  <li :class="itemUi.menuItem({ class: props.class })" :style="itemStyle" role="menuitem"
    :aria-current="isActive ? 'page' : undefined" @click.stop="handleClick">
    <div :class="itemUi.menuItemContent()">
      <div v-if="$slots.icon" :class="itemUi.menuItemIcon()">
        <slot name="icon" />
      </div>
      <div :class="itemUi.menuItemTitle()">
        <slot />
      </div>
    </div>
  </li>
</template>
