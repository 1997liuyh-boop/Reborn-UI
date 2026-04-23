<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, inject, onBeforeUnmount, provide, type ComputedRef } from "vue";
import { cn } from "~/lib/utils";
import theme from "./reborn-menu.config";

export interface RebornSubMenuProps {
  index: string;
  disabled?: boolean;
  popperOffset?: number;
  class?: any;
  ui?: Partial<{
    menuItem: ClassValue;
    menuItemContent: ClassValue;
    menuItemTitle: ClassValue;
    menuItemIcon: ClassValue;
    menuItemArrow: ClassValue;
    subMenu: ClassValue;
    subMenuPopup: ClassValue;
    subMenuContent: ClassValue;
  }>;
}

const props = withDefaults(defineProps<RebornSubMenuProps>(), {
  disabled: false,
  popperOffset: 6,
  class: undefined,
  ui: () => ({}),
});

const menuContext = inject<{
  active: { value: string[] };
  openedMenus: { value: string[] };
  parentIndexPath: ComputedRef<string[]>;
  mode: ComputedRef<"horizontal" | "vertical">;
  collapse: ComputedRef<boolean>;
  menuTrigger: ComputedRef<"hover" | "click">;
  backgroundColor: ComputedRef<string>;
  textColor: ComputedRef<string>;
  activeTextColor: ComputedRef<string>;
  color: ComputedRef<string>;
  ui: any;
  handleSelect: (index: string, indexPath: string[]) => void;
  handleOpen: (index: string, indexPath: string[]) => void;
  handleClose: (index: string, indexPath: string[]) => void;
  toggleSubMenu: (index: string, indexPath: string[]) => void;
  clearCloseTimer?: () => void;
  registerCloseTimer?: (timer: ReturnType<typeof setTimeout>) => void;
}>("reborn-menu");

const isActive = computed(() => menuContext?.active.value.includes(props.index) ?? false);
const isOpened = computed(() => menuContext?.openedMenus.value.includes(props.index) ?? false);
const indexPath = computed(() => [...(menuContext?.parentIndexPath.value ?? []), props.index]);

if (menuContext) {
  provide("reborn-menu", {
    ...menuContext,
    parentIndexPath: indexPath,
    collapse: computed(() => false),
  });
}

const subMenuUi = computed(() => {
  const styles = theme({
    mode: menuContext?.mode.value ?? "vertical",
    collapse: false,
    color: menuContext?.color.value ?? "primary",
  });

  const localOverrides = props.ui || {};

  return {
    menuItem: (opts?: { class?: any }) =>
      cn(
        styles.menuItem?.({
          active: isActive.value,
          color: menuContext?.color.value,
          opened: isOpened.value,
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
    menuItemArrow: (opts?: { class?: any; opened?: boolean }) =>
      cn(styles.menuItemArrow?.({ opened: opts?.opened }), opts?.class, localOverrides.menuItemArrow),
    subMenu: (opts?: { class?: any }) =>
      cn(styles.subMenu?.(), opts?.class, localOverrides.subMenu),
    subMenuPopup: (opts?: { class?: any }) =>
      cn(styles.subMenuPopup?.(), opts?.class, localOverrides.subMenuPopup),
    subMenuContent: (opts?: { class?: any }) =>
      cn(styles.subMenuContent?.(), opts?.class, localOverrides.subMenuContent),
  };
});

let closeTimer: ReturnType<typeof setTimeout> | null = null;

function handleClick() {
  if (props.disabled) return;

  if (menuContext?.menuTrigger.value === "click") {
    menuContext.toggleSubMenu(props.index, indexPath.value);
  }
}

function handleMouseEnter() {
  if (props.disabled) return;

  menuContext?.clearCloseTimer?.();

  if (menuContext?.menuTrigger.value === "hover") {
    menuContext.handleOpen(props.index, indexPath.value);
  }
}

function handleMouseLeave() {
  if (props.disabled) return;

  if (menuContext?.menuTrigger.value === "hover") {
    closeTimer = setTimeout(() => {
      menuContext.handleClose(props.index, indexPath.value);
      closeTimer = null;
    }, 150);

    menuContext?.registerCloseTimer?.(closeTimer);
  }
}

onBeforeUnmount(() => {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
});
</script>

<template>
  <li
    :class="subMenuUi.subMenu({ class: props.class })"
    role="menuitem"
    @click="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <div
      :class="subMenuUi.menuItem({
        class: [
          disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        ]
      })"
    >
      <div :class="subMenuUi.menuItemContent()">
        <div v-if="$slots.icon" :class="subMenuUi.menuItemIcon()">
          <slot name="icon" />
        </div>
        <div :class="subMenuUi.menuItemTitle()">
          <slot name="title">{{ index }}</slot>
        </div>
        <div :class="subMenuUi.menuItemArrow({ opened: isOpened })">
          <Icon
            :name="menuContext?.mode.value === 'horizontal' ? 'lucide:chevron-down' : 'lucide:chevron-right'"
            class="size-4"
          />
        </div>
      </div>
    </div>

    <div
      v-show="isOpened"
      :class="subMenuUi.subMenuPopup()"
      :style="{
        backgroundColor: menuContext?.backgroundColor.value,
        color: menuContext?.textColor.value,
      }"
    >
      <ul :class="subMenuUi.subMenuContent()" role="menu">
        <slot />
      </ul>
    </div>
  </li>
</template>
