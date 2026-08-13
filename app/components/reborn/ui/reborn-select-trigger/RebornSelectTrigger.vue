<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import type { ClassValue } from "clsx";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import RebornTransition from "../reborn-transition/RebornTransition.vue";
import theme, { selectColors, selectSizes } from "./reborn-select-trigger.config";

defineOptions({ inheritAttrs: false });

export interface SelectTriggerProps {
  displayText?: string;
  placeholder?: string;
  isOpen?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  size?: (typeof selectSizes)[number];
  color?: (typeof selectColors)[number];
  icon?: string;
  class?: any;
  ui?: Partial<{
    wrapper: ClassValue;
    trigger: ClassValue;
    triggerText: ClassValue;
    triggerIconWrapper: ClassValue;
    placeholder: ClassValue;
    clearBtn: ClassValue;
    arrow: ClassValue;
    dropdown: ClassValue;
    dropdownInner: ClassValue;
  }>;
  bordered?: boolean;
  /** 是否显示箭头 */
  showArrow?: boolean;
  /** 展开时箭头是否旋转 */
  arrowAnimation?: boolean;
  /**
   * 关闭下拉的时机：
   * - 'click'：在触发器（含下拉面板）外完成一次点击后才收起（默认）
   * - 'mousedown'：在触发器（含下拉面板）外发生任意按下类鼠标事件（左键/右键/中键按下）立即收起
   */
  closeOn?: "click" | "mousedown";
  scrollToActive?: (instant?: boolean) => void;
  error?: boolean;
  /**
   * 是否把浮层传送到 body。
   * 默认开启：浮层留在触发器内时会被任意祖先的 overflow 裁掉
   * （典型场景：RebornDialog 的 panel 恒为 overflow-hidden，scrollable 时 body 还叠一层 overflow-y-auto），
   * 而 z-index 只决定绘制顺序、无法突破裁剪。
   * 开启后浮层传送到 body，并使用文档坐标锚定触发器，页面滚动时不依赖 JS 每帧重算。
   * 仅当调用方确实需要浮层随父容器一起滚动、一起被裁剪时才关掉。
   */
  portal?: boolean;
}

const props = withDefaults(defineProps<SelectTriggerProps>(), {
  displayText: "",
  placeholder: "",
  isOpen: false,
  disabled: false,
  clearable: true,
  size: "md",
  color: "primary",
  icon: "lucide:chevron-down",
  bordered: true,
  showArrow: true,
  arrowAnimation: true,
  closeOn: "click",
  portal: true
});

const emit = defineEmits<{
  (e: "toggle"): void;
  (e: "clear", event: Event): void;
  (e: "keydown", event: KeyboardEvent): void;
  (e: "enter"): void;
  (e: "afterEnter"): void;
  /** 在触发器外发生了 closeOn 指定的鼠标事件，请求父组件收起下拉 */
  (e: "close"): void;
}>();

const isOpening = ref(false);
const transitionRef = ref<any>(null);
const transitionElRef = ref<HTMLElement | null>(null);
const dropdownInnerRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);
const isUpward = ref(false);

/** 浮层与触发器的间距，与行内模式的 mt-1 / mb-1 (4px) 对齐 */
const GAP = 4;
/** 传送模式下浮层右侧保留的视口边距，避免内容撑宽后溢出屏幕 */
const VIEWPORT_MARGIN = 8;
/** 下方剩余空间低于此值且上方更宽裕时改为向上展开 */
const UPWARD_THRESHOLD = 280;

/** 浮层实际的过渡元素，传送后它已不是 wrapper 的 DOM 后代 */
function floatingEl(): HTMLElement | null {
  const exposed = transitionRef.value?.el;
  return transitionElRef.value ?? exposed?.value ?? exposed ?? null;
}

/** 依据触发器在视口中的余量判断该向上还是向下展开 */
function resolvePlacement(rect: DOMRect) {
  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  return spaceBelow < UPWARD_THRESHOLD && spaceAbove > spaceBelow;
}

/**
 * 决策展开方向。只在「展开瞬间」与「视口尺寸变化」时调用，滚动过程中不重算：
 * 方向翻转会让浮层在触发器上方与下方之间瞬移，正是滚动时浮层脱离触发器的主因。
 * 同时它影响的是类名（要走 Vue 渲染），必须在浮层插入 DOM 前定下来，否则首帧用错变体。
 */
function lockPlacement() {
  const anchor = wrapperRef.value;
  if (!anchor) return;
  isUpward.value = resolvePlacement(anchor.getBoundingClientRect());
}

/**
 * 把浮层锚定到触发器。
 *
 * 两个定位选择都是为了「零测量」，让浏览器在同一帧内自行代入几何量：
 * 1. absolute + 文档坐标（而非 fixed + 视口坐标）：页面滚动时浮层与触发器处于同一
 *    坐标系，浏览器自然同步，不靠 scroll 回调补位；
 * 2. 向上展开用 translateY(-100%)（而非 top 减去浮层高度）：高度每帧由浏览器代入，
 *    展开动画期间（height 0 → auto）浮层底边始终贴住触发器，不会出现「动画结束才回正」。
 */
function syncFloating() {
  const anchor = wrapperRef.value;
  if (!anchor) return;
  if (!props.portal) return;

  const el = floatingEl();
  if (!el) return;

  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  const style = el.style;

  style.setProperty("--rb-trigger-width", `${rect.width}px`);
  style.left = `${rect.left + scrollX}px`;
  style.right = "auto";
  style.bottom = "auto";
  style.marginTop = "0px";
  style.marginBottom = "0px";
  style.maxWidth = `${Math.max(0, window.innerWidth - rect.left - VIEWPORT_MARGIN)}px`;

  if (isUpward.value) {
    style.top = `${rect.top + scrollY - GAP}px`;
    style.transform = "translateY(-100%) translateZ(0)";
  } else {
    style.top = `${rect.bottom + scrollY + GAP}px`;
    style.transform = "translateZ(0)";
  }
}

/** 滚动补位合批到下一帧，避免一次滚动手势内多次强制同步布局 */
let syncFrame = 0;

function scheduleSync() {
  if (syncFrame) return;
  syncFrame = requestAnimationFrame(() => {
    syncFrame = 0;
    syncFloating();
  });
}

function cancelSync() {
  if (!syncFrame) return;
  cancelAnimationFrame(syncFrame);
  syncFrame = 0;
}

/** 当前绑定在 document 上的外部关闭事件名，用于 closeOn 变化时正确解绑 */
let boundCloseEvent: "click" | "mousedown" | null = null;

/**
 * 判断节点是否属于本组件的交互范围。
 * 传送模式下浮层已不是 wrapper 的后代，只判 wrapper 会把「点击选项」误判成外部点击，
 * 单选看不出来（本来就要收起），多选则表现为选一项就立刻收起。
 */
function containsNode(node: Node | null) {
  if (!node) return false;
  return !!wrapperRef.value?.contains(node) || !!floatingEl()?.contains(node);
}

/** 触发器（含下拉面板）外发生 closeOn 指定的鼠标事件时，请求父组件收起 */
function onOutsideEvent(event: Event) {
  if (!props.isOpen) return;
  if (!containsNode(event.target as Node)) {
    emit("close");
  }
}

function bindOutsideListener() {
  unbindOutsideListener();
  boundCloseEvent = props.closeOn === "mousedown" ? "mousedown" : "click";
  document.addEventListener(boundCloseEvent, onOutsideEvent);
}

function unbindOutsideListener() {
  if (boundCloseEvent) {
    document.removeEventListener(boundCloseEvent, onOutsideEvent);
    boundCloseEvent = null;
  }
}

watch(
  () => props.closeOn,
  () => bindOutsideListener(),
);

onMounted(() => {
  window.addEventListener("scroll", onViewportScroll, { capture: true, passive: true });
  window.addEventListener("resize", onViewportResize, { passive: true });
  bindOutsideListener();
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", onViewportScroll, true);
  window.removeEventListener("resize", onViewportResize);
  unbindOutsideListener();
  cancelSync();
});

/**
 * 以浮层是否在 DOM 中为准，而不是 props.isOpen：
 * 收起动画期间（leave，200ms）浮层仍然可见，此时滚动同样需要跟随。
 *
 * 捕获阶段监听是为了同时覆盖祖先滚动容器：页面级滚动本身由文档坐标兜住，
 * 但触发器被放进 overflow 容器（或 fixed 祖先）时文档坐标会变，需要补位。
 */
function onViewportScroll() {
  if (!floatingEl()) return;
  scheduleSync();
}

/** 视口尺寸变化会改变上下余量，此时才允许重新决策展开方向 */
function onViewportResize() {
  if (!floatingEl()) return;
  lockPlacement();
  scheduleSync();
}

watch(
  () => props.isOpen,
  (v) => {
    if (v) {
      isOpening.value = true;
      // 浮层此刻还未插入 DOM，先把展开方向定下来，保证首帧类名正确；
      // 坐标写入交给 before-enter，那时元素已存在。
      lockPlacement();
    }
  },
);

const b = tv(theme);

const uiOverrides = computed(() => props.ui || {});
const ui = computed(() => {
  const styles = b({
    size: props.size,
    color: props.color,
    open: props.isOpen && props.arrowAnimation,
    disabled: props.disabled,
    placement: isUpward.value ? "top" : "bottom",
    bordered: props.bordered,
    error: props.error,
    portal: props.portal
  });

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    trigger: (opts?: { class?: any }) =>
      styles.trigger({ class: cn(opts?.class, uiOverrides.value.trigger) }),
    triggerText: (opts?: { class?: any }) =>
      styles.triggerText({ class: cn(opts?.class, uiOverrides.value.triggerText) }),
    triggerIconWrapper: (opts?: { class?: any }) =>
      styles.triggerIconWrapper({ class: cn(opts?.class, uiOverrides.value.triggerIconWrapper) }),
    placeholder: (opts?: { class?: any }) =>
      styles.placeholder({ class: cn(opts?.class, uiOverrides.value.placeholder) }),
    clearBtn: (opts?: { class?: any }) =>
      styles.clearBtn({ class: cn(opts?.class, uiOverrides.value.clearBtn) }),
    arrow: (opts?: { class?: any }) =>
      styles.arrow({ class: cn(opts?.class, uiOverrides.value.arrow) }),
    dropdown: (opts?: { class?: any }) =>
      styles.dropdown({ class: cn(opts?.class, uiOverrides.value.dropdown) }),
    dropdownInner: (opts?: { class?: any }) =>
      styles.dropdownInner({ class: cn(opts?.class, uiOverrides.value.dropdownInner) }),
  };
});

function handleClear(event: Event) {
  emit("clear", event);
}

/** 把已选项对齐到可视区域，父组件通过 scrollToActive 下发具体实现 */
function alignActive() {
  try {
    props.scrollToActive?.(true);
  } catch (e) {
    console.error("[RebornSelectTrigger] Error in scrollToActive:", e);
  }
}

/**
 * before-enter：浮层刚插入 DOM、动画尚未开始，此刻写坐标可保证首帧就贴合触发器
 */
function onBeforeEnter(el?: Element) {
  if (el instanceof HTMLElement) transitionElRef.value = el;
  syncFloating();
  nextTick(alignActive);
}

/**
 * enter：外层高度已展开，内层列表可测量，在此同步定位已选项（首帧即正确）
 */
function onEnter() {
  emit("enter");
  nextTick(() => {
    alignActive();
    requestAnimationFrame(alignActive);
  });
}

function onAfterEnter() {
  syncFloating();
  isOpening.value = false;
  emit("afterEnter");
}

function onAfterLeave() {
  transitionElRef.value = null;
  isOpening.value = false;
}

defineExpose({
  dropdownRef: computed(() => dropdownInnerRef.value),
  /** 浮层的滚动容器；传送后它是 body 的子节点，不能再从组件根节点里找 */
  dropdownScrollRef: computed(() => transitionElRef.value),
  isOpening,
  /** 供外部做「点击是否落在触发器或浮层内」的判定，传送后不能只判组件根节点 */
  contains: containsNode,
});
</script>

<template>
  <div ref="wrapperRef" :class="ui.wrapper({ class: props.class })" tabindex="0" @keydown="emit('keydown', $event)">
    <div :class="ui.trigger()" :data-state="isOpen ? 'open' : 'closed'" @click="emit('toggle')">
      <slot name="cover" :displayText="displayText" :placeholder="placeholder" :isOpen="isOpen" :ui="ui"
        v-if="$slots.cover" />
      <template v-else>
        <slot :displayText="displayText" :placeholder="placeholder" :isOpen="isOpen" :ui="ui">
          <span v-if="displayText" :class="ui.triggerText()">{{ displayText }}</span>
          <span v-else :class="ui.placeholder()">
            {{ placeholder }}
          </span>
        </slot>

        <div :class="ui.triggerIconWrapper()">
          <span v-if="clearable" :class="ui.clearBtn()" @click.stop="handleClear">
            <Icon name="lucide:x" class="size-full" />
          </span>
          <Icon v-else-if="showArrow" :name="icon" :class="ui.arrow()" />
        </div>
      </template>
    </div>

    <!--
      浮层只渲染一份：Teleport 的 disabled 已经覆盖了「留在原地」的场景。
      此前 portal 模式下同时存在行内与传送两份实例，且共用同一个 ref，
      导致行内那份变成视口外的幽灵节点，afterEnter 也永远由错误的实例发出。

      浮层内不再 stop 冒泡：外部点击判定由 containsNode（wrapper + 浮层双边界）负责，
      截断冒泡会让页面上其他依赖 document 点击流的浮层（popover / tooltip / 右键菜单）无法收起。
    -->
    <Teleport to="body" :disabled="!portal">
      <RebornTransition ref="transitionRef" :show="isOpen" :duration="{ enter: 300, leave: 200 }"
        @before-enter="onBeforeEnter" @enter="onEnter" @after-enter="onAfterEnter" @after-leave="onAfterLeave"
        :custom-class="ui.dropdown()" name="select-collapse">
        <div ref="dropdownInnerRef" :class="ui.dropdownInner()">
          <slot name="content" />
        </div>
      </RebornTransition>
    </Teleport>
  </div>
</template>
