<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, inject, nextTick, onBeforeUnmount, onMounted, provide, ref, watch, type ComputedRef } from "vue";
import { useEventListener } from "@vueuse/core";
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
  ui: () => ({})
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
  color: ComputedRef<any>;
  expandType: ComputedRef<"normal" | "popup">;
  expandMutex: ComputedRef<boolean>;
  ui: any;
  handleSelect: (index: string, indexPath: string[]) => void;
  handleOpen: (index: string, indexPath: string[]) => void;
  handleClose: (index: string, indexPath: string[]) => void;
  toggleSubMenu: (index: string, indexPath: string[]) => void;
  clearCloseTimer?: () => void;
  registerCloseTimer?: (timer: ReturnType<typeof setTimeout>) => void;
  registerPopup?: (el: HTMLElement) => void;
  unregisterPopup?: (el: HTMLElement) => void;
  scheduleCloseAll?: () => void;
  cancelCloseAll?: () => void;
  notifyResize?: () => void;
}>("reborn-menu");

const isActive = computed(() => menuContext?.active.value.includes(props.index) ?? false);
const isOpened = computed(() => menuContext?.openedMenus.value.includes(props.index) ?? false);
const indexPath = computed(() => [...(menuContext?.parentIndexPath.value ?? []), props.index]);

/** 一级水平菜单不显示箭头 */
const isRootHorizontal = computed(() => menuContext?.mode.value === "horizontal" && (menuContext?.parentIndexPath.value ?? []).length === 0);

/** 折叠模式或水平模式下子菜单强制浮层展开，不可平铺 */
const effectiveExpandType = computed(() => {
  if (menuContext?.collapse.value) return "popup";
  if (menuContext?.mode.value === "horizontal") return "popup";
  return menuContext?.expandType.value ?? "popup";
});

// 平铺展开使用 CSS Grid 动画，无需 JS 计算高度

if (menuContext) {
  provide("reborn-menu", {
    ...menuContext,
    parentIndexPath: indexPath,
    collapse: computed(() => false),
    /** 子级通知时，由于使用 CSS Grid 动画，直接向上冒泡即可 */
    notifyResize: () => {
      menuContext?.notifyResize?.();
    }
  });
}

const subMenuUi = computed(() => {
  const styles = theme({
    mode: menuContext?.mode.value ?? "vertical",
    collapse: menuContext?.collapse.value ?? false,
    color: menuContext?.color.value ?? "primary",
    expandType: effectiveExpandType.value,
    opened: isOpened.value,
    active: isActive.value,
    disabled: props.disabled
  });

  const localOverrides = props.ui || {};

  return {
    menuItem: (opts?: { class?: any }) =>
      cn(
        styles.menuItem?.({
          active: isActive.value,
          color: menuContext?.color.value,
          opened: isOpened.value,
          disabled: props.disabled
        }),
        opts?.class,
        localOverrides.menuItem
      ),
    menuItemContent: (opts?: { class?: any }) => cn(styles.menuItemContent?.(), opts?.class, localOverrides.menuItemContent),
    menuItemTitle: (opts?: { class?: any }) => cn(styles.menuItemTitle?.(), opts?.class, localOverrides.menuItemTitle),
    menuItemIcon: (opts?: { class?: any }) => cn(styles.menuItemIcon?.(), opts?.class, localOverrides.menuItemIcon),
    menuItemArrow: (opts?: { class?: any; opened?: boolean }) =>
      cn(styles.menuItemArrow?.({ opened: opts?.opened }), opts?.class, localOverrides.menuItemArrow),
    subMenu: (opts?: { class?: any }) => cn(styles.subMenu?.(), opts?.class, localOverrides.subMenu),
    subMenuPopup: (opts?: { class?: any }) => cn(styles.subMenuPopup?.(), opts?.class, localOverrides.subMenuPopup),
    subMenuContent: (opts?: { class?: any }) => cn(styles.subMenuContent?.(), opts?.class, localOverrides.subMenuContent)
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
  // 任意菜单元素被进入时，取消全局兜底关闭
  menuContext?.cancelCloseAll?.();

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

/**
 * popup 边界离开处理：在每层 close 之外，额外触发全局兜底关闭。
 * 兄弟 li 之间的切换不会触发 popup mouseleave，因此不会误关闭父菜单；
 * 当鼠标真正离开整个菜单体系时，没有任何 mouseenter 会取消该定时器。
 */
function handlePopupMouseLeave() {
  handleMouseLeave();
  menuContext?.scheduleCloseAll?.();
}

onBeforeUnmount(() => {
  if (closeTimer) {
    clearTimeout(closeTimer);
    closeTimer = null;
  }
  if (popupRef.value) {
    menuContext?.unregisterPopup?.(popupRef.value);
  }
});

const popupRef = ref<HTMLElement | null>(null);
const liRef = ref<HTMLElement | null>(null);
const popupStyle = ref<Record<string, string>>({});

watch(popupRef, (newVal, oldVal) => {
  if (oldVal) menuContext?.unregisterPopup?.(oldVal);
  if (newVal) menuContext?.registerPopup?.(newVal);
});

async function updatePopupPosition() {
  if (!popupRef.value || !liRef.value) return;
  // 先重置样式，以便测量真实的 DOM 尺寸
  popupStyle.value = { visibility: "hidden" };
  await nextTick();

  const liRect = liRef.value.getBoundingClientRect();
  const popupRect = popupRef.value.getBoundingClientRect();
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const isRootHoriz = isRootHorizontal.value;

  let top = isRootHoriz ? liRect.bottom + 8 : liRect.top;
  let left = isRootHoriz ? liRect.left : liRect.right + 8;

  // 底部溢出处理
  if (top + popupRect.height > viewportHeight) {
    top = Math.max(8, viewportHeight - popupRect.height - 8);
  }

  // 右侧溢出处理
  if (left + popupRect.width > viewportWidth) {
    if (isRootHoriz) {
      left = Math.max(8, viewportWidth - popupRect.width - 8);
    } else {
      left = liRect.left - popupRect.width - 8;
    }
  }

  popupStyle.value = {
    top: `${top}px`,
    left: `${left}px`,
    visibility: "visible"
  };
}

/** 手动拦截滚轮事件，防止滚动穿透 */
function handleWheel(e: WheelEvent) {
  const el = e.currentTarget as HTMLElement;
  if (!el) return;

  const { deltaY } = e;
  const isScrollable = el.scrollHeight > el.clientHeight;

  // 1. 如果内容没超过最大高度（不可滚动），直接拦截滚轮事件，防止背景页面滚动
  if (!isScrollable) {
    if (e.cancelable) e.preventDefault();
    return;
  }

  // 2. 如果内容可滚动，拦截边界溢出
  // 向上滚动且已达顶部
  if (deltaY < 0 && el.scrollTop <= 0) {
    if (e.cancelable) e.preventDefault();
  }
  // 向下滚动且已达底部
  else if (deltaY > 0 && Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight) {
    if (e.cancelable) e.preventDefault();
  }
}

watch(isOpened, (val) => {
  if (val && effectiveExpandType.value === "popup") {
    updatePopupPosition();
  } else {
    popupStyle.value = {};
  }
});

// 当弹窗打开时，监听滚动事件
// 使用 capture 确保能捕获到局部滚动容器的滚动
useEventListener(window, "scroll", (e) => {
  if (isOpened.value && effectiveExpandType.value === "popup") {
    const target = e.target as HTMLElement;
    if (!popupRef.value) return;

    // 1. 如果是在当前弹出层内部滚动，更新位置并返回
    if (popupRef.value.contains(target)) {
      updatePopupPosition();
      return;
    }

    // 2. 如果是在子级弹出层（已被 Teleport 到 body）内部滚动，也不应该关闭当前层
    // 通过 data-menu-path 属性判断层级关系
    const targetPopup = target.closest?.("[data-menu-path]") as HTMLElement;
    if (targetPopup) {
      const path = targetPopup.getAttribute("data-menu-path")?.split(",") || [];
      const myPath = indexPath.value;
      // 如果目标弹出层的路径包含了当前菜单的完整路径，说明它是当前菜单的后代
      const isDescendant = myPath.length <= path.length && myPath.every((seg, i) => path[i] === seg);
      if (isDescendant) {
        updatePopupPosition();
        return;
      }
    }

    // 3. 否则说明是父级容器或页面其他部分在滚动，关闭当前菜单
    menuContext?.handleClose(props.index, indexPath.value);
  }
}, { capture: true, passive: true });
</script>

<template>
  <li ref="liRef" :class="subMenuUi.subMenu({ class: props.class })" role="menuitem" @click.stop="handleClick"
    @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
    <div :class="subMenuUi.menuItem({
      class: [disabled && 'opacity-50 cursor-not-allowed pointer-events-none']
    })
      ">
      <div :class="subMenuUi.menuItemContent()">
        <div v-if="$slots.icon" :class="subMenuUi.menuItemIcon()">
          <slot name="icon" />
        </div>
        <div :class="subMenuUi.menuItemTitle()">
          <slot name="title">{{ index }}</slot>
        </div>
        <div v-if="!isRootHorizontal" :class="subMenuUi.menuItemArrow({ opened: isOpened })">
          <img src="~/assets/images/icon/right.png" class="size-4" />
        </div>
      </div>
    </div>

    <!-- 浮层展开：保持 v-show -->
    <Teleport to="body" v-if="effectiveExpandType === 'popup'">
      <div v-show="isOpened" ref="popupRef" :class="subMenuUi.subMenuPopup()" :data-menu-path="indexPath.join(',')"
        @mouseenter="handleMouseEnter" @mouseleave="handlePopupMouseLeave" :style="{
          position: 'fixed',
          margin: 0,
          backgroundColor: menuContext?.backgroundColor.value,
          color: menuContext?.textColor.value,
          ...popupStyle
        }">
        <ul :class="subMenuUi.subMenuContent()" role="menu" @wheel="handleWheel">
          <slot />
        </ul>
      </div>
    </Teleport>

    <!-- 平铺展开：CSS Grid 高度动画 -->
    <div v-else :class="subMenuUi.subMenuPopup()" :style="{
      gridTemplateRows: isOpened ? '1fr' : '0fr',
      backgroundColor: menuContext?.backgroundColor.value,
      color: menuContext?.textColor.value
    }">
      <div class="min-h-0">
        <ul :class="subMenuUi.subMenuContent()" role="menu" @wheel="handleWheel">
          <slot />
        </ul>
      </div>
    </div>
  </li>
</template>
