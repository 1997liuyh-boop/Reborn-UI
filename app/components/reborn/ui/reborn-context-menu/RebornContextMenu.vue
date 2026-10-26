<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { ContextMenuRootController } from "./context-menu-singleton";
import type { FloatingRect } from "~/lib/floating";
import type { Placement } from "~/lib/placement";
import { computed, getCurrentInstance, inject, onDeactivated, onMounted, onUnmounted, provide, shallowRef, useId, useSlots, useTemplateRef, watch } from "vue";
import { useFloatingDismiss } from "~/composables/useFloatingDismiss";
import { FLOATING_VIEWPORT_PADDING, resolveFloatingPosition } from "~/lib/floating";
import { resolvePlacement as splitPlacement } from "~/lib/placement";
import { cn } from "~/lib/utils";
import theme, {
  contextMenuColors,
  contextMenuSizes,
  contextMenuTriggers,
} from "./reborn-context-menu.config";
import RebornTransition from "../reborn-transition/RebornTransition.vue";
import {
  CONTEXT_MENU_ROOT_KEY,
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
  /** 点击该项时的回调；selection 触发方式下 context.selectionText 为当前划选的文字 */
  onSelect?: (event: MouseEvent, context: RebornContextMenuSelectContext) => void;
  class?: any;
}

/** select 事件与 onSelect 回调的附加上下文 */
export interface RebornContextMenuSelectContext {
  /** 划词触发时当前选中的文字；其他触发方式为空串 */
  selectionText: string;
}

export type RebornContextMenuItemGroup = RebornContextMenuItem[];
export type RebornContextMenuItems = RebornContextMenuItem[] | RebornContextMenuItem[][];

/** 旧的定位对象写法，等价于 placement + sideOffset，仅为兼容保留 */
export interface RebornContextMenuContentProps {
  side?: ContextMenuSide;
  align?: ContextMenuAlign;
  sideOffset?: number;
}

export interface RebornContextMenuProps {
  items?: RebornContextMenuItems;
  size?: ContextMenuSize;
  /** 触发方式；selection 为划词触发：在触发区内选中文字后，菜单在选区上方弹出 */
  trigger?: ContextMenuTrigger;
  /**
   * 弹出方向与对齐，「方向-对齐」写法，与 reborn-popover、reborn-popconfirm 一致；
   * 未传时右键 / 点击 / 悬浮为 bottom-start，划词为 top（选区上方居中），子菜单为 right-start
   */
  placement?: Placement;
  /**
   * 菜单与锚点的间距（px）
   * @defaultValue 8
   */
  sideOffset?: number;
  /**
   * 旧的定位对象写法（side / align / sideOffset），等价于 placement + sideOffset，仅为兼容保留
   * @deprecated 请改用 placement / sideOffset
   */
  content?: RebornContextMenuContentProps;
  /** 非受控时的初始展开状态；绑定了 v-model:open 时以绑定值为准 */
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

/** 展开 / 收起动画时长，与 select-collapse 过渡类的 duration-300 / duration-200 一致 */
const ENTER_DURATION = 300;
const LEAVE_DURATION = 200;
/** 换位重开要等上一次收起动画完全走完（含过渡结束回调），再在新位置展开 */
const REOPEN_DELAY = LEAVE_DURATION + 30;

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
  // 方向 / 对齐按触发方式取默认值（见 resolvePlacement），这里不预填以便区分「用户显式传入」
  placement: undefined,
  sideOffset: undefined,
  content: () => ({}),
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
  /** 点击叶子菜单项时触发；context.selectionText 为划词触发时选中的文字 */
  (e: "select", item: RebornContextMenuItem, event: MouseEvent, context: RebornContextMenuSelectContext): void;
}>();

const slots = useSlots();
const appProperties = getCurrentInstance()?.appContext.config.globalProperties;
const groupedItems = computed(() => normalizeItems(props.items));
/** 插槽对象不是响应式的，不能缓存进 computed；渲染时求值，动态增删 content 插槽才能切换 */
const hasCustomContent = () => !!slots.content;

/**
 * 受控展开状态（v-model:open）。类型含 Boolean，必须写 default: undefined，
 * 否则未传时被强转成 false，分不出「受控为 false」和「非受控」
 */
const openModel = defineModel<boolean | undefined>("open", { default: undefined });

/**
 * 实际展开状态：绑定了 v-model:open 时以绑定值为准，否则以 defaultOpen 为初值、由组件自己维护。
 * 受控时赋值后要等父组件回流才变，需要新值的地方用本地算出的值，不要赋值后立刻回读
 */
const open = computed<boolean>({
  get: () => openModel.value ?? props.defaultOpen ?? false,
  set: (value) => {
    openModel.value = value;
  },
});

function updateOpen(value: boolean) {
  open.value = value;
}

// 只有递归渲染的子菜单接入根控制器；放在别的菜单触发区或面板里的独立菜单仍是各自的根
const injectedRoot = props.nested ? inject(CONTEXT_MENU_ROOT_KEY, null) : null;
const rootController: ContextMenuRootController =
  injectedRoot ??
  {
    // useId() 在服务端与客户端生成一致的 id；模块级计数器跨请求累加，水合后 data-* 属性与客户端对不上
    rootId: `reborn-context-menu-${useId()}`,
    closeAll: () => {
      updateOpen(false);
    },
    isOpen: () => open.value,
  };

provide(CONTEXT_MENU_ROOT_KEY, rootController);

const wrapperRef = useTemplateRef<HTMLElement>("wrapperRef");
const triggerRef = useTemplateRef<HTMLElement>("triggerRef");
const contentRefComponent = useTemplateRef<any>("contentRefComponent");
const contentRef = computed(() => contentRefComponent.value?.el as HTMLElement | undefined);

const pointer = shallowRef({ x: 0, y: 0 });
const style = shallowRef<Record<string, string>>({
  left: "0px",
  top: "0px",
});

/** 划词触发：当前选区的矩形（作为定位锚点）与文字 */
const selectionRect = shallowRef<DOMRect | null>(null);
const selectionText = shallowRef("");

/** 按触发方式解析默认的弹出方向与对齐：划词在选区上方居中，子菜单贴右侧，其余在下方起点对齐 */
function resolvePlacement() {
  const defaultSide: ContextMenuSide = props.nested ? "right" : props.trigger === "selection" ? "top" : "bottom";
  const defaultAlign: ContextMenuAlign = props.trigger === "selection" ? "center" : "start";
  // placement 优先，未传时回落到旧的 content 对象，都没有再按触发方式取默认值
  const explicit = props.placement ? splitPlacement(props.placement) : undefined;
  return {
    side: explicit?.side ?? props.content.side ?? defaultSide,
    align: explicit?.align ?? props.content.align ?? defaultAlign,
    // 右键以指针为锚点，未显式传间距时贴住指针（与系统右键菜单一致）；其余默认 8px
    offset: props.sideOffset ?? props.content.sideOffset ?? (props.trigger === "contextmenu" && !props.nested ? 0 : 8),
  };
}

const resolvedSide = shallowRef<ContextMenuSide>(resolvePlacement().side);

let hoverCount = 0;
let hoverTimer: ReturnType<typeof setTimeout> | null = null;
let reopenTimer: ReturnType<typeof setTimeout> | null = null;
let selectionTimer: ReturnType<typeof setTimeout> | null = null;
let frame: number | null = null;
/** 展开后等两帧再定位（等内容与过渡类就位）的句柄，收起与卸载时取消 */
let openFrame: number | null = null;
let resizeObserver: ResizeObserver | null = null;

function clearReopenTimer() {
  if (!reopenTimer) return;
  clearTimeout(reopenTimer);
  reopenTimer = null;
}

/**
 * 在新的锚点位置展开：菜单已经打开时先收起，等收起动画走完再在新位置展开，
 * 而不是让面板从旧位置平移过去（右键换位、换一段划词都走这里）。
 */
function reopenAtAnchor() {
  clearReopenTimer();
  if (open.value) {
    updateOpen(false);
    reopenTimer = setTimeout(() => {
      reopenTimer = null;
      updateOpen(true);
      schedulePositionUpdate();
    }, REOPEN_DELAY);
    return;
  }
  updateOpen(true);
  schedulePositionUpdate();
}

/** 定位锚点：右键为指针坐标（0×0 的矩形），划词为选区矩形，其余为触发器 */
function getAnchorRect(): FloatingRect | null {
  if (props.trigger === "contextmenu" && !props.nested) {
    const { x, y } = pointer.value;
    return { top: y, bottom: y, left: x, right: x, width: 0, height: 0 };
  }
  if (props.trigger === "selection") return selectionRect.value;
  return triggerRef.value?.getBoundingClientRect() ?? null;
}

/**
 * 按锚点计算面板位置：翻转与交叉轴贴边交给共享的 resolveFloatingPosition（与 Popover / Tooltip 同一套口径），
 * 最后整体钳进视口——根菜单展开期间页面滚动被锁住，面板溢出视口就再也看不到了
 */
function calculatePosition(contentElement?: HTMLElement) {
  const currentContent = contentElement ?? contentRef.value;
  if (!currentContent) return;

  const contentBox = currentContent.firstElementChild as HTMLElement | null;
  if (!contentBox) return;

  const anchor = getAnchorRect();
  if (!anchor) return;

  const width = contentBox.offsetWidth;
  const height = contentBox.offsetHeight;
  const placement = resolvePlacement();
  const { side, position } = resolveFloatingPosition({
    triggerRect: anchor,
    size: { width, height },
    side: placement.side,
    align: placement.align,
    offset: placement.offset,
  });

  const padding = FLOATING_VIEWPORT_PADDING;
  const left = Math.min(Math.max(position.left, padding), window.innerWidth - width - padding);
  const top = Math.min(Math.max(position.top, padding), window.innerHeight - height - padding);
  resolvedSide.value = side;
  style.value = {
    left: `${left}px`,
    top: `${top}px`,
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

function clearSelectionTimer() {
  if (!selectionTimer) return;
  clearTimeout(selectionTimer);
  selectionTimer = null;
}

/** 路由复用或缓存停用不会卸载菜单，关闭浮层时也取消可能再次打开它的延迟任务。 */
function dismissPageMenu() {
  clearHoverTimer();
  clearReopenTimer();
  clearSelectionTimer();
  hoverCount = 0;
  selectionRect.value = null;
  selectionText.value = "";
  if (open.value) updateOpen(false);
}

// 可选读取 Vue Router 提供的响应式路由；普通 Vue 页面无需安装路由也能使用菜单。
watch(() => appProperties?.$route?.fullPath, dismissPageMenu);
onDeactivated(dismissPageMenu);

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
  // 受控时赋值后 open.value 要等父组件回流才变，用本地算出的新值判断
  const next = !open.value;
  updateOpen(next);
  if (next) schedulePositionUpdate();
}

function onContextMenuTrigger(event: MouseEvent) {
  // 禁用时不拦截右键，让浏览器显示默认的上下文菜单
  if (props.trigger !== "contextmenu" || props.disabled) return;

  event.preventDefault();

  pointer.value = {
    x: event.clientX,
    y: event.clientY,
  };
  reopenAtAnchor();
}

/**
 * 划词触发：鼠标 / 键盘完成选择后读取 Selection API。
 * 选区落在触发区内且有文字时，以选区矩形为锚点弹出；选区取消（折叠）时收起。
 * 监听挂在 document 上：拖选过程中鼠标可能在触发区外松开。
 */
function onSelectionEnd() {
  if (props.trigger !== "selection" || props.disabled || props.nested) return;

  // 松开鼠标的瞬间选区尚未最终确定，延后一拍再读
  clearSelectionTimer();
  selectionTimer = setTimeout(() => {
    selectionTimer = null;
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    const anchor = selection?.anchorNode ?? null;
    const insideTrigger = !!anchor && !!triggerRef.value?.contains(anchor);

    if (!selection || selection.isCollapsed || !text || !selection.rangeCount || !insideTrigger) {
      if (open.value && !contentRef.value?.contains(anchor)) {
        selectionText.value = "";
        updateOpen(false);
      }
      return;
    }

    selectionRect.value = selection.getRangeAt(0).getBoundingClientRect();
    selectionText.value = text;
    reopenAtAnchor();
  }, 0);
}

/** 划词模式下点击菜单不能让浏览器清掉选区，否则回调里拿不到选中的文字 */
function onContentMouseDown(event: MouseEvent) {
  if (props.trigger === "selection") event.preventDefault();
}

/** 传给 select 事件与 onSelect 回调的上下文 */
function getSelectContext(): RebornContextMenuSelectContext {
  return { selectionText: selectionText.value };
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

  const context = getSelectContext();
  item.onSelect?.(event, context);
  emit("select", item, event, context);
  rootController.closeAll();
}

function handleNestedSelect(item: RebornContextMenuItem, event: MouseEvent, context: RebornContextMenuSelectContext) {
  emit("select", item, event, context);
}

/**
 * 点击外部关闭交给共享的 useFloatingDismiss：全局监听只在展开期间挂载；
 * 嵌套登记让子菜单（传送到 body 后不是根菜单的 DOM 后代）里的点击不算根菜单的外部，
 * 菜单放进 Popover 等浮层时也会向外层登记，点菜单不会关掉外层。
 * 根菜单展开期间页面滚动被锁住，残余的容器滚动只重新定位、不关闭；
 * 重新定位复用它在展开期间挂的捕获阶段滚动监听，不再自己另挂一份
 */
useFloatingDismiss({
  open: () => open.value,
  elements: () => [wrapperRef.value, contentRef.value],
  anchor: () => triggerRef.value,
  closeOnClickOutside: () => props.dismissible,
  closeOnScroll: false,
  onViewportScroll: schedulePositionUpdate,
  onDismiss: () => {
    updateOpen(false);
  },
});

// 子菜单跟随根菜单收起：根菜单因外部点击、Esc、选中叶子项等任何原因收起时，子菜单一并收起
if (injectedRoot) {
  watch(injectedRoot.isOpen, (value) => {
    if (!value && open.value) updateOpen(false);
  });
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

const onBeforeEnter = (element: Element) => {
  calculatePosition(element as HTMLElement);
};

const onEnter = (element: Element) => {
  calculatePosition(element as HTMLElement);
};

let scrollLocked = false;
function syncScrollLock(value: boolean) {
  if (props.nested || scrollLocked === value) return;
  scrollLocked = value;
  if (value) lockDocumentScroll();
  else unlockDocumentScroll();
}

/** 展开期间才需要的全局监听：Esc 关闭、右键模式下左键点击任意处关闭、视口尺寸变化时重新定位（滚动见 useFloatingDismiss） */
let openListenersBound = false;
function syncOpenListeners(value: boolean) {
  if (typeof window === "undefined" || openListenersBound === value) return;
  openListenersBound = value;
  if (value) {
    document.addEventListener("click", onDocumentClick);
    document.addEventListener("keydown", onKeydown);
    window.addEventListener("resize", schedulePositionUpdate);
  } else {
    document.removeEventListener("click", onDocumentClick);
    document.removeEventListener("keydown", onKeydown);
    window.removeEventListener("resize", schedulePositionUpdate);
  }
}

/** 划词触发需要常驻监听 document 的 mouseup / keyup（拖选过程中鼠标可能在触发区外松开）；其他触发方式不挂 */
const listensSelection = computed(() => props.trigger === "selection" && !props.nested);
let selectionListenersBound = false;
function syncSelectionListeners(value: boolean) {
  if (typeof document === "undefined" || selectionListenersBound === value) return;
  selectionListenersBound = value;
  if (value) {
    document.addEventListener("mouseup", onSelectionEnd);
    document.addEventListener("keyup", onSelectionEnd);
  } else {
    document.removeEventListener("mouseup", onSelectionEnd);
    document.removeEventListener("keyup", onSelectionEnd);
  }
}

function cancelOpenFrame() {
  if (openFrame === null) return;
  window.cancelAnimationFrame(openFrame);
  openFrame = null;
}

/**
 * 展开状态的副作用集中在这里，受控（父组件直接改 v-model:open）与组件内部打开走同一条路：
 * 根菜单登记为当前唯一打开的根菜单（新开会关掉其他实例）、锁页面滚动、挂展开期监听、等两帧后定位
 */
watch(
  open,
  (value) => {
    if (typeof window === "undefined") return;

    if (!props.nested) {
      if (value) setActiveRootMenu(rootController.rootId, () => updateOpen(false));
      else clearActiveRootMenu(rootController.rootId);
    }
    syncScrollLock(value);
    syncOpenListeners(value);
    cancelOpenFrame();

    if (!value) return;

    openFrame = window.requestAnimationFrame(() => {
      openFrame = window.requestAnimationFrame(() => {
        openFrame = null;
        calculatePosition();
      });
    });
  },
  { immediate: true },
);

watch(listensSelection, syncSelectionListeners);

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
  syncSelectionListeners(listensSelection.value);
});

onUnmounted(() => {
  if (!props.nested) {
    clearActiveRootMenu(rootController.rootId);
  }

  // 缓存组件销毁时可能先停用并关闭，不能依赖已停止的 watch 释放滚动锁与全局监听。
  syncScrollLock(false);
  syncOpenListeners(false);
  syncSelectionListeners(false);
  clearHoverTimer();
  clearReopenTimer();
  clearSelectionTimer();
  if (resizeObserver) resizeObserver.disconnect();
  if (frame) window.cancelAnimationFrame(frame);
  cancelOpenFrame();
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

/** 根菜单自顶向下展开（下拉样式），子菜单贴右侧弹出仍用缩放淡入 */
const transitionName = computed(() => (props.nested ? "zoom-in" : "select-collapse"));

const bridgeStyle = computed(() => {
  // 与定位共用同一份间距解析：只读已废弃的 content.sideOffset 时，按推荐写法传 sideOffset 桥接宽度为 0
  const gap = `${Math.max(resolvePlacement().offset, 0)}px`;

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
    ref="wrapperRef"
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
      <slot :open="open" :selection-text="selectionText" />
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
        :name="transitionName"
        :duration="{ enter: ENTER_DURATION, leave: LEAVE_DURATION }"
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
          @mousedown="onContentMouseDown"
        >
          <slot v-if="hasCustomContent()" name="content" :close="rootController.closeAll" :selection-text="selectionText" />

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
                  placement="right-start"
                  :side-offset="6"
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
