<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, provide, ref } from "vue";
import { cn } from "~/lib/utils";
import theme from "./reborn-menu.config";

type MenuMode = "horizontal" | "vertical";
type MenuTrigger = "hover" | "click";
type MenuColor = "primary" | "secondary" | "success" | "info" | "warning" | "error" | "neutral";

export interface RebornMenuProps {
  mode?: MenuMode;
  collapse?: boolean;
  defaultOpeneds?: string[];
  uniqueOpened?: boolean;
  menuTrigger?: MenuTrigger;
  router?: boolean;
  collapseTransition?: boolean;
  color?: MenuColor;
  backgroundColor?: string;
  textColor?: string;
  activeTextColor?: string;
  class?: any;
  ui?: Partial<{
    root: ClassValue;
    menu: ClassValue;
    menuItem: ClassValue;
    menuItemContent: ClassValue;
    menuItemTitle: ClassValue;
    menuItemIcon: ClassValue;
    menuItemArrow: ClassValue;
    subMenu: ClassValue;
    subMenuPopup: ClassValue;
    subMenuContent: ClassValue;
    menuItemGroup: ClassValue;
    menuItemGroupTitle: ClassValue;
  }>;
}

const active = defineModel<string[]>("active", {
  default: () => [],
});

const props = withDefaults(defineProps<RebornMenuProps>(), {
  mode: "vertical",
  collapse: false,
  defaultOpeneds: () => [],
  uniqueOpened: false,
  menuTrigger: "hover",
  router: false,
  collapseTransition: true,
  color: "primary",
  backgroundColor: "",
  textColor: "",
  activeTextColor: "",
  class: undefined,
  ui: () => ({}),
});

const emit = defineEmits<{
  (e: "select", index: string, indexPath: string[]): void;
  (e: "open", index: string, indexPath: string[]): void;
  (e: "close", index: string, indexPath: string[]): void;
}>();

const b = theme;
const appRouter = useRouter();

const openedMenus = ref<string[]>([...props.defaultOpeneds]);
const openedMenuPaths = ref<Record<string, string[]>>({});
const closeTimers = ref<Set<ReturnType<typeof setTimeout>>>(new Set());

function clearCloseTimers() {
  closeTimers.value.forEach((timer) => clearTimeout(timer));
  closeTimers.value.clear();
}

function registerCloseTimer(timer: ReturnType<typeof setTimeout>) {
  closeTimers.value.add(timer);
}

function isPathPrefix(parentPath: string[], targetPath: string[]) {
  if (parentPath.length > targetPath.length) return false;

  return parentPath.every((segment, index) => targetPath[index] === segment);
}

const overrides = computed(() => props.ui || {});

const ui = computed(() => {
  const styles = b({
    mode: props.mode,
    collapse: props.collapse,
    color: props.color,
  });

  return {
    root: (opts?: { class?: any }) =>
      styles.root({ class: cn(opts?.class, overrides.value.root) }),
    menu: (opts?: { class?: any }) =>
      styles.menu({ class: cn(opts?.class, overrides.value.menu) }),
    menuItem: (opts?: {
      class?: any;
      active?: boolean;
      color?: MenuColor;
      opened?: boolean;
      disabled?: boolean;
    }) =>
      styles.menuItem({
        active: opts?.active,
        color: opts?.color,
        opened: opts?.opened,
        disabled: opts?.disabled,
        class: cn(opts?.class, overrides.value.menuItem),
      }),
    menuItemContent: (opts?: { class?: any }) =>
      styles.menuItemContent({ class: cn(opts?.class, overrides.value.menuItemContent) }),
    menuItemTitle: (opts?: { class?: any }) =>
      styles.menuItemTitle({ class: cn(opts?.class, overrides.value.menuItemTitle) }),
    menuItemIcon: (opts?: { class?: any }) =>
      styles.menuItemIcon({ class: cn(opts?.class, overrides.value.menuItemIcon) }),
    menuItemArrow: (opts?: { class?: any; opened?: boolean }) =>
      styles.menuItemArrow({
        opened: opts?.opened,
        class: cn(opts?.class, overrides.value.menuItemArrow),
      }),
    subMenu: (opts?: { class?: any }) =>
      styles.subMenu({ class: cn(opts?.class, overrides.value.subMenu) }),
    subMenuPopup: (opts?: { class?: any }) =>
      styles.subMenuPopup({ class: cn(opts?.class, overrides.value.subMenuPopup) }),
    subMenuContent: (opts?: { class?: any }) =>
      styles.subMenuContent({ class: cn(opts?.class, overrides.value.subMenuContent) }),
    menuItemGroup: (opts?: { class?: any }) =>
      styles.menuItemGroup({ class: cn(opts?.class, overrides.value.menuItemGroup) }),
    menuItemGroupTitle: (opts?: { class?: any }) =>
      styles.menuItemGroupTitle({ class: cn(opts?.class, overrides.value.menuItemGroupTitle) }),
  };
});

const menuStyle = computed(() => ({
  backgroundColor: props.backgroundColor,
  color: props.textColor,
}));

function handleSelect(index: string, indexPath: string[]) {
  active.value = [...indexPath];
  clearCloseTimers();
  openedMenus.value = [];
  openedMenuPaths.value = {};
  emit("select", index, indexPath);

  if (props.router && index) {
    void appRouter.push(index);
  }
}

function handleOpen(index: string, indexPath: string[]) {
  openedMenuPaths.value[index] = [...indexPath];

  if (props.menuTrigger === "hover" || props.uniqueOpened) {
    openedMenus.value = [...indexPath];
  } else {
    openedMenus.value = Array.from(new Set([...openedMenus.value, ...indexPath]));
  }

  emit("open", index, indexPath);
}

function handleClose(index: string, indexPath: string[]) {
  const currentPath = openedMenuPaths.value[index] ?? indexPath;

  openedMenus.value = openedMenus.value.filter((openedIndex) => {
    const openedPath = openedMenuPaths.value[openedIndex] ?? [openedIndex];
    return !isPathPrefix(currentPath, openedPath);
  });

  Object.keys(openedMenuPaths.value).forEach((openedIndex) => {
    const openedPath = openedMenuPaths.value[openedIndex];
    if (openedPath && isPathPrefix(currentPath, openedPath)) {
      delete openedMenuPaths.value[openedIndex];
    }
  });

  emit("close", index, indexPath);
}

function toggleSubMenu(index: string, indexPath: string[]) {
  if (openedMenus.value.includes(index)) {
    handleClose(index, indexPath);
  } else {
    handleOpen(index, indexPath);
  }
}

provide("reborn-menu", {
  active,
  openedMenus,
  parentIndexPath: computed(() => [] as string[]),
  mode: computed(() => props.mode),
  collapse: computed(() => props.collapse),
  menuTrigger: computed(() => props.menuTrigger),
  color: computed(() => props.color),
  backgroundColor: computed(() => props.backgroundColor),
  textColor: computed(() => props.textColor),
  activeTextColor: computed(() => props.activeTextColor),
  ui,
  handleSelect,
  handleOpen,
  handleClose,
  toggleSubMenu,
  clearCloseTimer: clearCloseTimers,
  registerCloseTimer,
});

defineExpose({
  open: (index: string) => {
    handleOpen(index, [index]);
  },
  close: (index: string) => {
    handleClose(index, [index]);
  },
  updateActive: (indexPath: string[]) => {
    active.value = [...indexPath];
  },
});
</script>

<template>
  <div :class="ui.root({ class: props.class })">
    <ul :class="ui.menu()" :style="menuStyle" role="menu">
      <slot />
    </ul>
  </div>
</template>
