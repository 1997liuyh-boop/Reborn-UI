<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, inject, onMounted, onUnmounted, provide, ref, useSlots, watch } from "vue";
import { cn } from "~/lib/utils";
import theme, {
  contextMenuColors,
  contextMenuSizes,
  contextMenuTriggers,
} from "./reborn-context-menu.config";
import RebornTransition from "../reborn-transition/RebornTransition.vue";
import {
  createRootId,
  setActiveRootMenu,
  clearActiveRootMenu,
  lockDocumentScroll,
  unlockDocumentScroll,
} from "./context-menu-singleton";

defineOptions({
  name: "RebornContextMenu",
});

type ContextMenuSize = (typeof contextMenuSizes)[number];
type ContextMenuTrigger = (typeof contextMenuTriggers)[number];
type ContextMenuColor = (typeof contextMenuColors)[number];
type ContextMenuSide = "top" | "right" | "bottom" | "left";
type ContextMenuAlign = "start" | "center" | "end";

export interface RebornContextMenuItem {
  id?: string | number;
  label?: string;
  description?: string;
  icon?: string;
  kbds?: string[];
  type?: "item" | "separator";
  disabled?: boolean;
  color?: ContextMenuColor;
  children?: RebornContextMenuItems;
  onSelect?: (event: MouseEvent) => void;
  class?: any;
}

export type RebornContextMenuItemGroup = RebornContextMenuItem[];
export type RebornContextMenuItems = RebornContextMenuItem[] | RebornContextMenuItem[][];

export interface RebornContextMenuContentProps {
  side?: ContextMenuSide;
  align?: ContextMenuAlign;
  sideOffset?: number;
}

export interface RebornContextMenuProps {
  items?: RebornContextMenuItems;
  size?: ContextMenuSize;
  trigger?: ContextMenuTrigger;
  content?: RebornContextMenuContentProps;
  open?: boolean;
  defaultOpen?: boolean;
  portal?: boolean | string;
  dismissible?: boolean;
  modal?: boolean;
  disabled?: boolean;
  openDelay?: number;
  closeDelay?: number;
  /** 是否为嵌套子菜单实例（组件递归渲染 children 时内部使用，默认贴右侧展开且不锁滚动，业务侧一般无需设置） */
  nested?: boolean;
  /** 追加到根容器（wrapper）的自定义类名 */
  class?: any;
  ui?: Partial<{
    wrapper: ClassValue;
    trigger: ClassValue;
    contentWrapper: ClassValue;
    content: ClassValue;
    group: ClassValue;
    separator: ClassValue;
    item: ClassValue;
    itemLeading: ClassValue;
    itemBody: ClassValue;
    itemLabel: ClassValue;
    itemDescription: ClassValue;
    itemTrailing: ClassValue;
    itemKbd: ClassValue;
    itemArrow: ClassValue;
    empty: ClassValue;
    bridge: ClassValue;
    mask: ClassValue;
  }>;
}

interface ContextMenuRootController {
  rootId: string;
  closeAll: () => void;
}

const CONTEXT_MENU_ROOT_KEY = Symbol("reborn-context-menu-root");
const ROOT_MENU_OPEN_EVENT = "reborn-context-menu:root-open";
const VIEWPORT_OFFSET = 8;

function isGroupedItems(items?: RebornContextMenuItems): items is RebornContextMenuItem[][] {
  return Array.isArray(items) && items.length > 0 && Array.isArray(items[0]);
}

function normalizeItems(items?: RebornContextMenuItems): RebornContextMenuItem[][] {
  if (!items || items.length === 0) return [];
  if (isGroupedItems(items)) {
    return items.filter((group) => group.length > 0);
  }

  return [items];
}

const props = withDefaults(defineProps<RebornContextMenuProps>(), {
  items: () => [],
  size: "md",
  trigger: "contextmenu",
  content: () => ({
    side: "bottom",
    align: "start",
    sideOffset: 8,
  }),
  portal: true,
  dismissible: true,
  modal: false,
  disabled: false,
  openDelay: 40,
  closeDelay: 120,
  nested: false,
  class: undefined,
  ui: () => ({}),
});

const emit = defineEmits<{
  (e: "update:open", value: boolean): void;
  (e: "select", item: RebornContextMenuItem, event: MouseEvent): void;
}>();

const slots = useSlots();
const groupedItems = computed(() => normalizeItems(props.items));
const hasCustomContent = computed(() => !!slots.content);

const internalOpen = ref(props.defaultOpen ?? props.open ?? false);

watch(
  () => props.open,
  (value) => {
    if (value !== undefined) internalOpen.value = value;
  },
);

const open = computed({
  get: () => internalOpen.value,
  set: (value) => {
    internalOpen.value = value;
    emit("update:open", value);
  },
});

function updateOpen(value: boolean) {
  if (!props.nested) {
    if (value) {
      if (typeof document !== "undefined") {
        document.dispatchEvent(
          new CustomEvent(ROOT_MENU_OPEN_EVENT, {
            detail: { rootId: rootController.rootId },
          }),
        );
      }

      setActiveRootMenu(rootController.rootId, () => {
        updateOpen(false);
      });
    } else {
      clearActiveRootMenu(rootController.rootId);
    }
  }

  open.value = value;
}

const injectedRoot = inject<ContextMenuRootController | null>(CONTEXT_MENU_ROOT_KEY, null);
const rootController =
  injectedRoot ??
  ({
    rootId: createRootId(),
    closeAll: () => {
      updateOpen(false);
    },
  } satisfies ContextMenuRootController);

provide(CONTEXT_MENU_ROOT_KEY, rootController);

const triggerRef = ref<HTMLElement>();
const contentRefComponent = ref<any>();
const contentRef = computed(() => contentRefComponent.value?.el as HTMLElement | undefined);

const pointer = ref({ x: 0, y: 0 });
const style = ref<Record<string, string>>({
  left: "0px",
  top: "0px",
});
const resolvedSide = ref<ContextMenuSide>(props.content.side ?? (props.nested ? "right" : "bottom"));

let hoverCount = 0;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;
let frame: number | null = null;
let resizeObserver: ResizeObserver | null = null;

function getHorizontalPosition(
  rect: DOMRect,
  width: number,
  height: number,
  side: ContextMenuSide,
  align: ContextMenuAlign,
  offset: number,
) {
  let x = rect.left;
  let y = rect.bottom + offset;

  if (side === "top") {
    y = rect.top - height - offset;
  }

  if (side === "left") {
    x = rect.left - width - offset;
    y = rect.top + rect.height / 2 - height / 2;
  }

  if (side === "right") {
    x = rect.right + offset;
    y = rect.top + rect.height / 2 - height / 2;
  }

  if (side === "top" || side === "bottom") {
    if (align === "center") {
      x = rect.left + rect.width / 2 - width / 2;
    } else if (align === "end") {
      x = rect.right - width;
    }
  }

  if (side === "left" || side === "right") {
    if (align === "start") {
      y = rect.top;
    } else if (align === "end") {
      y = rect.bottom - height;
    }
  }

  return { x, y };
}

function getOverflow(x: number, y: number, width: number, height: number) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = document.documentElement.clientHeight;

  return {
    top: y < VIEWPORT_OFFSET,
    bottom: y + height > viewportHeight - VIEWPORT_OFFSET,
    left: x < VIEWPORT_OFFSET,
    right: x + width > viewportWidth - VIEWPORT_OFFSET,
  };
}

function clampPosition(x: number, y: number, width: number, height: number) {
  const viewportWidth = window.innerWidth;
  const viewportHeight = document.documentElement.clientHeight;

  return {
    x: Math.min(Math.max(x, VIEWPORT_OFFSET), viewportWidth - width - VIEWPORT_OFFSET),
    y: Math.min(Math.max(y, VIEWPORT_OFFSET), viewportHeight - height - VIEWPORT_OFFSET),
  };
}

function calculatePosition(contentElement?: HTMLElement) {
  const currentContent = contentElement ?? contentRef.value;
  if (!currentContent) return;

  const contentBox = currentContent.firstElementChild as HTMLElement | null;
  if (!contentBox) return;

  const width = contentBox.offsetWidth;
  const height = contentBox.offsetHeight;

  if (props.trigger === "contextmenu") {
    const clamped = clampPosition(pointer.value.x, pointer.value.y, width, height);
    style.value = {
      left: `${clamped.x}px`,
      top: `${clamped.y}px`,
    };
    return;
  }

  if (!triggerRef.value) return;

  const rect = triggerRef.value.getBoundingClientRect();
  const offset = props.content.sideOffset ?? 8;
  let side: ContextMenuSide = props.content.side ?? (props.nested ? "right" : "bottom");
  let align: ContextMenuAlign = props.content.align ?? "start";

  let position = getHorizontalPosition(rect, width, height, side, align, offset);
  let overflow = getOverflow(position.x, position.y, width, height);

  if (side === "bottom" && overflow.bottom) {
    side = "top";
    position = getHorizontalPosition(rect, width, height, side, align, offset);
    overflow = getOverflow(position.x, position.y, width, height);
  } else if (side === "top" && overflow.top) {
    side = "bottom";
    position = getHorizontalPosition(rect, width, height, side, align, offset);
    overflow = getOverflow(position.x, position.y, width, height);
  } else if (side === "right" && overflow.right) {
    side = "left";
    position = getHorizontalPosition(rect, width, height, side, align, offset);
    overflow = getOverflow(position.x, position.y, width, height);
  } else if (side === "left" && overflow.left) {
    side = "right";
    position = getHorizontalPosition(rect, width, height, side, align, offset);
    overflow = getOverflow(position.x, position.y, width, height);
  }

  if ((side === "left" || side === "right") && overflow.bottom) {
    align = "end";
    position = getHorizontalPosition(rect, width, height, side, align, offset);
  } else if ((side === "left" || side === "right") && overflow.top) {
    align = "start";
    position = getHorizontalPosition(rect, width, height, side, align, offset);
  }

  const clamped = clampPosition(position.x, position.y, width, height);
  resolvedSide.value = side;
  style.value = {
    left: `${clamped.x}px`,
    top: `${clamped.y}px`,
  };
}

function schedulePositionUpdate() {
  if (typeof window === "undefined") return;
  if (frame) return;

  frame = window.requestAnimationFrame(() => {
    calculatePosition();
    frame = null;
  });
}

function clearHoverTimer() {
  if (!hoverTimer) return;
  clearTimeout(hoverTimer);
  hoverTimer = null;
}

function onMouseEnter() {
  if (props.trigger !== "hover" || props.disabled) return;

  hoverCount += 1;
  clearHoverTimer();

  hoverTimer = setTimeout(() => {
    updateOpen(true);
  }, props.openDelay);
}

function onMouseLeave() {
  if (props.trigger !== "hover") return;

  hoverCount = Math.max(hoverCount - 1, 0);
  clearHoverTimer();

  hoverTimer = setTimeout(() => {
    if (hoverCount <= 0) updateOpen(false);
  }, props.closeDelay);
}

function onClickTrigger(event: MouseEvent) {
  if (props.disabled || props.trigger !== "click") return;

  event.stopPropagation();
  updateOpen(!open.value);
  if (open.value) schedulePositionUpdate();
}

function onContextMenuTrigger(event: MouseEvent) {
  if (props.trigger !== "contextmenu") return;

  event.preventDefault();
  if (props.disabled) return;

  pointer.value = {
    x: event.clientX,
    y: event.clientY,
  };
  updateOpen(true);
  schedulePositionUpdate();
}

function isItemDisabled(item: RebornContextMenuItem) {
  return props.disabled || !!item.disabled;
}

function getItemColor(item: RebornContextMenuItem) {
  return item.color ?? "neutral";
}

function getItemChildren(item: RebornContextMenuItem) {
  return normalizeItems(item.children);
}

function getItemKey(item: RebornContextMenuItem, groupIndex: number, itemIndex: number) {
  return item.id ?? `${groupIndex}-${itemIndex}-${item.label ?? item.type ?? "item"}`;
}

function handleItemSelect(item: RebornContextMenuItem, event: MouseEvent) {
  if (isItemDisabled(item) || getItemChildren(item).length > 0) return;

  item.onSelect?.(event);
  emit("select", item, event);
  rootController.closeAll();
}

function handleNestedSelect(item: RebornContextMenuItem, event: MouseEvent) {
  emit("select", item, event);
}

function onClickOutside(event: MouseEvent) {
  if (!open.value || !props.dismissible) return;
  if (!(event.target instanceof HTMLElement)) return;

  if (event.target.closest(`[data-reborn-context-menu-root="${rootController.rootId}"]`)) {
    return;
  }

  updateOpen(false);
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === "Escape" && open.value) {
    rootController.closeAll();
  }
}

function onDocumentClick(event: MouseEvent) {
  if (!open.value || props.trigger !== "contextmenu") return;
  if (event.button !== 0) return;

  rootController.closeAll();
}

function onRootMenuOpen(event: Event) {
  if (props.nested || !open.value) return;

  const detail = (event as CustomEvent<{ rootId?: string }>).detail;
  if (!detail?.rootId || detail.rootId === rootController.rootId) return;

  updateOpen(false);
}

const onBeforeEnter = (element: Element) => {
  calculatePosition(element as HTMLElement);
};

const onEnter = (element: Element) => {
  calculatePosition(element as HTMLElement);
};

watch(open, (value) => {
  if (typeof window === "undefined") return;

  if (!props.nested) {
    if (value) {
      lockDocumentScroll();
    } else {
      unlockDocumentScroll();
    }
  }

  if (!value) return;

  requestAnimationFrame(() => {
    requestAnimationFrame(() => calculatePosition());
  });
});

watch(
  () => props.content,
  () => {
    if (open.value) schedulePositionUpdate();
  },
  { deep: true },
);

watch(
  groupedItems,
  () => {
    if (open.value) schedulePositionUpdate();
  },
  { deep: true },
);

watch(
  contentRef,
  (element) => {
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (!element) return;

    resizeObserver = new ResizeObserver(() => {
      if (open.value) schedulePositionUpdate();
    });
    resizeObserver.observe(element);
  },
  { immediate: true },
);

onMounted(() => {
  document.addEventListener("mousedown", onClickOutside);
  document.addEventListener("click", onDocumentClick);
  document.addEventListener("keydown", onKeydown);
  document.addEventListener(ROOT_MENU_OPEN_EVENT, onRootMenuOpen as EventListener);
  window.addEventListener("resize", schedulePositionUpdate);
  window.addEventListener("scroll", schedulePositionUpdate, true);
});

onUnmounted(() => {
  if (!props.nested) {
    clearActiveRootMenu(rootController.rootId);
  }

  if (open.value && !props.nested) {
    unlockDocumentScroll();
  }

  document.removeEventListener("mousedown", onClickOutside);
  document.removeEventListener("click", onDocumentClick);
  document.removeEventListener("keydown", onKeydown);
  document.removeEventListener(ROOT_MENU_OPEN_EVENT, onRootMenuOpen as EventListener);
  window.removeEventListener("resize", schedulePositionUpdate);
  window.removeEventListener("scroll", schedulePositionUpdate, true);
  clearHoverTimer();
  if (resizeObserver) resizeObserver.disconnect();
  if (frame) window.cancelAnimationFrame(frame);
});

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
  const styles = theme({
    size: props.size,
    nested: props.nested,
    disabled: props.disabled,
  });

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper, props.class) }),
    trigger: (opts?: { class?: any }) =>
      styles.trigger({ class: cn(opts?.class, uiOverrides.value.trigger) }),
    contentWrapper: (opts?: { class?: any }) =>
      styles.contentWrapper({ class: cn(opts?.class, uiOverrides.value.contentWrapper) }),
    content: (opts?: { class?: any }) =>
      styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
    group: (opts?: { class?: any }) =>
      styles.group({ class: cn(opts?.class, uiOverrides.value.group) }),
    separator: (opts?: { class?: any }) =>
      styles.separator({ class: cn(opts?.class, uiOverrides.value.separator) }),
    item: (opts?: { class?: any; disabled?: boolean; itemColor?: ContextMenuColor }) =>
      styles.item({
        disabled: opts?.disabled,
        itemColor: opts?.itemColor,
        class: cn(opts?.class, uiOverrides.value.item),
      }),
    itemLeading: (opts?: { class?: any }) =>
      styles.itemLeading({ class: cn(opts?.class, uiOverrides.value.itemLeading) }),
    itemBody: (opts?: { class?: any }) =>
      styles.itemBody({ class: cn(opts?.class, uiOverrides.value.itemBody) }),
    itemLabel: (opts?: { class?: any }) =>
      styles.itemLabel({ class: cn(opts?.class, uiOverrides.value.itemLabel) }),
    itemDescription: (opts?: { class?: any }) =>
      styles.itemDescription({ class: cn(opts?.class, uiOverrides.value.itemDescription) }),
    itemTrailing: (opts?: { class?: any }) =>
      styles.itemTrailing({ class: cn(opts?.class, uiOverrides.value.itemTrailing) }),
    itemKbd: (opts?: { class?: any }) =>
      styles.itemKbd({ class: cn(opts?.class, uiOverrides.value.itemKbd) }),
    itemArrow: (opts?: { class?: any }) =>
      styles.itemArrow({ class: cn(opts?.class, uiOverrides.value.itemArrow) }),
    empty: (opts?: { class?: any }) =>
      styles.empty({ class: cn(opts?.class, uiOverrides.value.empty) }),
    bridge: (opts?: { class?: any }) =>
      styles.bridge({ class: cn(opts?.class, uiOverrides.value.bridge) }),
    mask: (opts?: { class?: any }) =>
      styles.mask({ class: cn(opts?.class, uiOverrides.value.mask) }),
  };
});

const bridgeStyle = computed(() => {
  const gap = `${Math.max(props.content.sideOffset ?? 0, 0)}px`;

  if (resolvedSide.value === "right") {
    return {
      left: `-${gap}`,
      width: `calc(100% + ${gap})`,
    };
  }

  if (resolvedSide.value === "left") {
    return {
      right: `-${gap}`,
      width: `calc(100% + ${gap})`,
    };
  }

  if (resolvedSide.value === "top") {
    return {
      bottom: `-${gap}`,
      height: `calc(100% + ${gap})`,
    };
  }

  return {
    top: `-${gap}`,
    height: `calc(100% + ${gap})`,
  };
});

defineExpose({
  /** 手动关闭当前菜单（同步更新受控/非受控展开状态并触发 update:open） */
  close: () => {
    updateOpen(false);
  },
});
</script>

<template>
  <div
    :class="ui.wrapper()"
    :data-reborn-context-menu-root="rootController.rootId"
    @contextmenu="onContextMenuTrigger"
    @mouseenter="onMouseEnter"
    @mouseleave="onMouseLeave"
  >
    <div
      ref="triggerRef"
      :class="ui.trigger()"
      :data-reborn-context-menu-root="rootController.rootId"
      @click="onClickTrigger"
    >
      <slot :open="open" />
    </div>

    <Teleport :to="typeof props.portal === 'string' ? props.portal : 'body'" :disabled="!props.portal">
      <div
        v-if="open && props.modal && !props.nested"
        :class="ui.mask()"
        :data-reborn-context-menu-root="rootController.rootId"
        @click="props.dismissible && rootController.closeAll()"
      />

      <RebornTransition
        ref="contentRefComponent"
        :show="open"
        name="zoom-in"
        :duration="{ enter: 180, leave: 120 }"
        :custom-class="ui.contentWrapper()"
        :custom-style="style"
        @before-enter="onBeforeEnter"
        @enter="onEnter"
        @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave"
      >
        <div
          :class="ui.content()"
          :data-reborn-context-menu-root="rootController.rootId"
          role="menu"
        >
          <slot v-if="hasCustomContent" name="content" :close="rootController.closeAll" />

          <template v-else-if="groupedItems.length">
            <div
              v-for="(group, groupIndex) in groupedItems"
              :key="`group-${groupIndex}`"
              :class="ui.group()"
            >
              <template v-for="(item, itemIndex) in group" :key="getItemKey(item, groupIndex, itemIndex)">
                <div v-if="item.type === 'separator'" :class="ui.separator()" role="separator" />

                <RebornContextMenu
                  v-else-if="getItemChildren(item).length"
                  nested
                  trigger="hover"
                  :items="item.children"
                  :size="props.size"
                  :disabled="isItemDisabled(item)"
                  :portal="props.portal"
                  :dismissible="props.dismissible"
                  :content="{ side: 'right', align: 'start', sideOffset: 6 }"
                  @select="handleNestedSelect"
                >
                  <template #default>
                    <button
                      type="button"
                      :class="ui.item({
                        disabled: isItemDisabled(item),
                        itemColor: getItemColor(item),
                        class: item.class,
                      })"
                      :disabled="isItemDisabled(item)"
                    >
                      <span :class="ui.itemLeading()">
                        <Icon v-if="item.icon" :name="item.icon" class="size-4" />
                      </span>

                      <span :class="ui.itemBody()">
                        <span :class="ui.itemLabel()">{{ item.label }}</span>
                        <span v-if="item.description" :class="ui.itemDescription()">
                          {{ item.description }}
                        </span>
                      </span>

                      <span :class="ui.itemTrailing()">
                        <span v-for="kbd in item.kbds ?? []" :key="kbd" :class="ui.itemKbd()">{{ kbd }}</span>
                        <Icon name="lucide:chevron-right" class="size-4" :class="ui.itemArrow()" />
                      </span>
                    </button>
                  </template>
                </RebornContextMenu>

                <button
                  v-else
                  type="button"
                  :class="ui.item({
                    disabled: isItemDisabled(item),
                    itemColor: getItemColor(item),
                    class: item.class,
                  })"
                  :disabled="isItemDisabled(item)"
                  @click.stop="handleItemSelect(item, $event)"
                >
                  <span :class="ui.itemLeading()">
                    <Icon v-if="item.icon" :name="item.icon" class="size-4" />
                  </span>

                  <span :class="ui.itemBody()">
                    <span :class="ui.itemLabel()">{{ item.label }}</span>
                    <span v-if="item.description" :class="ui.itemDescription()">
                      {{ item.description }}
                    </span>
                  </span>

                  <span v-if="item.kbds?.length" :class="ui.itemTrailing()">
                    <span v-for="kbd in item.kbds" :key="kbd" :class="ui.itemKbd()">{{ kbd }}</span>
                  </span>
                </button>
              </template>
            </div>
          </template>

          <div v-else :class="ui.empty()">暂无可用操作</div>

          <div
            v-if="props.trigger === 'hover'"
            :class="ui.bridge()"
            :style="bridgeStyle"
            aria-hidden="true"
          />
        </div>
      </RebornTransition>
    </Teleport>
  </div>
</template>
