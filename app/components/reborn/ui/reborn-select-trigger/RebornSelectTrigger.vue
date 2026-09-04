<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import RebornTransition from "../reborn-transition/RebornTransition.vue";
import theme, { selectTriggerSizes } from "./reborn-select-trigger.config";
import type { SelectTriggerAlign, SelectTriggerSide, SelectTriggerUI } from "./reborn-select-trigger.config";

defineOptions({ inheritAttrs: false });

export interface SelectTriggerProps {
  /** 浮层是否展开 */
  isOpen?: boolean;
  /**
   * 是否禁用。禁用时容器不再可聚焦（tabindex -1），
   * 触发器盒子的置灰样式由 RebornFieldTrigger 等具体触发器组件自行处理。
   */
  disabled?: boolean;
  /** 尺寸，此处仅决定浮层圆角 */
  size?: (typeof selectTriggerSizes)[number];
  class?: any;
  ui?: SelectTriggerUI;
  /**
   * 关闭下拉的时机：
   * - 'click'：在触发器（含下拉面板）外完成一次点击后才收起（默认）
   * - 'mousedown'：外部一有动静就收起——在触发器（含下拉面板）外按下任意鼠标键
   *   （左键 / 右键 / 中键）立即收起，面板外的滚动同样收起；
   *   面板内部的列表滚动不算外部动静，不会误收。
   */
  closeOn?: "click" | "mousedown";
  scrollToActive?: (instant?: boolean) => void;
  /**
   * 是否把浮层传送到 body。
   * 默认开启：浮层留在触发器内时会被任意祖先的 overflow 裁掉
   * （典型场景：RebornDialog 的 panel 恒为 overflow-hidden，scrollable 时 body 还叠一层 overflow-y-auto），
   * 而 z-index 只决定绘制顺序、无法突破裁剪。
   * 开启后浮层传送到 body，并使用文档坐标锚定触发器，页面滚动时不依赖 JS 每帧重算。
   * 仅当调用方确实需要浮层随父容器一起滚动、一起被裁剪时才关掉。
   */
  portal?: boolean;
  /**
   * 浮层展开方向：
   * - 'auto'（默认）：向下展开，下方空间不足且上方更宽裕时自动向上
   * - 显式 top / bottom / left / right：按指定方向展开，该侧空间不足且对侧更宽裕时翻转
   */
  side?: SelectTriggerSide;
  /** 浮层在交叉轴上的对齐：start 与触发器起点对齐（默认）、center 居中、end 与终点对齐；仅传送模式生效 */
  align?: SelectTriggerAlign;
  /** 浮层与触发器的间距（px） */
  offset?: number;
  /** 是否显示指向触发器的小箭头 */
  arrow?: boolean;
  /**
   * 下拉框是否自动调整位置：目标侧空间不足时翻转到对侧（auto 方向下即「下方不足改向上」）。
   * 关闭后严格按 side 展开（auto 视为 bottom），不再依据视口余量翻转。
   */
  autoAdjustOverflow?: boolean;
}

const props = withDefaults(defineProps<SelectTriggerProps>(), {
  isOpen: false,
  disabled: false,
  size: "md",
  closeOn: "click",
  portal: true,
  side: "auto",
  align: "start",
  offset: 4,
  arrow: false,
  autoAdjustOverflow: true,
});

const emit = defineEmits<{
  (e: "keydown", event: KeyboardEvent): void;
  (e: "enter"): void;
  (e: "afterEnter"): void;
  /** 在触发器外发生了 closeOn 指定的鼠标事件，请求父组件收起下拉；附带原始事件供父组件二次判定 */
  (e: "close", event?: Event): void;
}>();

const isOpening = ref(false);
const transitionRef = ref<any>(null);
const transitionElRef = ref<HTMLElement | null>(null);
const dropdownInnerRef = ref<HTMLElement | null>(null);
const wrapperRef = ref<HTMLElement | null>(null);

/** 实际展开方向：auto 在展开瞬间解析为 top / bottom，显式方向空间不足时翻转到对侧 */
type ResolvedSide = Exclude<SelectTriggerSide, "auto">;
const resolvedSide = ref<ResolvedSide>("bottom");
/** 箭头中心点坐标（传送模式为文档坐标，行内模式相对 wrapper），与浮层坐标一样在 syncFloating 中写入 */
const arrowPoint = ref({ x: 0, y: 0 });

/** 传送模式下浮层与视口边缘保留的边距，避免内容撑宽后溢出屏幕 */
const VIEWPORT_MARGIN = 8;
/** 上下展开：目标侧剩余空间低于此值且对侧更宽裕时翻转 */
const UPWARD_THRESHOLD = 280;
/** 左右展开：目标侧剩余空间低于此值且对侧更宽裕时翻转 */
const SIDEWAYS_THRESHOLD = 200;

/** 浮层实际的过渡元素，传送后它已不是 wrapper 的 DOM 后代 */
function floatingEl(): HTMLElement | null {
  const exposed = transitionRef.value?.el;
  return transitionElRef.value ?? exposed?.value ?? exposed ?? null;
}

/** 依据触发器在视口中的余量解析实际展开方向；关闭自动调整时严格按 side 展开 */
function resolvePlacement(rect: DOMRect): ResolvedSide {
  if (!props.autoAdjustOverflow) {
    return props.side === "auto" ? "bottom" : props.side;
  }

  const spaceBelow = window.innerHeight - rect.bottom;
  const spaceAbove = rect.top;
  const spaceLeft = rect.left;
  const spaceRight = window.innerWidth - rect.right;

  switch (props.side) {
    case "top":
      return spaceAbove < UPWARD_THRESHOLD && spaceBelow > spaceAbove ? "bottom" : "top";
    case "left":
      return spaceLeft < SIDEWAYS_THRESHOLD && spaceRight > spaceLeft ? "right" : "left";
    case "right":
      return spaceRight < SIDEWAYS_THRESHOLD && spaceLeft > spaceRight ? "left" : "right";
    // bottom 与 auto 同规则：下方不足且上方更宽裕时向上
    default:
      return spaceBelow < UPWARD_THRESHOLD && spaceAbove > spaceBelow ? "top" : "bottom";
  }
}

/**
 * 决策展开方向。只在「展开瞬间」与「视口尺寸变化」时调用，滚动过程中不重算：
 * 方向翻转会让浮层在触发器两侧之间瞬移，正是滚动时浮层脱离触发器的主因。
 * 同时它影响的是类名（要走 Vue 渲染），必须在浮层插入 DOM 前定下来，否则首帧用错变体。
 */
function lockPlacement() {
  const anchor = wrapperRef.value;
  if (!anchor) return;
  resolvedSide.value = resolvePlacement(anchor.getBoundingClientRect());
}

/**
 * 把浮层锚定到触发器。
 *
 * 两个定位选择都是为了「零测量」，让浏览器在同一帧内自行代入几何量：
 * 1. absolute + 文档坐标（而非 fixed + 视口坐标）：页面滚动时浮层与触发器处于同一
 *    坐标系，浏览器自然同步，不靠 scroll 回调补位；
 * 2. 向上 / 向左 / 居中 / 末端对齐一律用百分比 translate（而非 top 减去浮层尺寸）：
 *    尺寸每帧由浏览器代入，展开动画期间（height 0 → auto）浮层始终贴住触发器，
 *    不会出现「动画结束才回正」。
 */
function syncFloating() {
  const anchor = wrapperRef.value;
  if (!anchor) return;

  const rect = anchor.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  syncArrow(rect, scrollX, scrollY);

  if (!props.portal) return;

  const el = floatingEl();
  if (!el) return;

  const style = el.style;
  const side = resolvedSide.value;
  const align = props.align;
  const gap = props.offset;
  const viewportWidth = window.innerWidth;

  let left = rect.left;
  let top = rect.bottom + gap;
  let translateX = "0";
  let translateY = "0";
  let maxWidth = viewportWidth - rect.left - VIEWPORT_MARGIN;

  if (side === "top" || side === "bottom") {
    if (align === "center") {
      left = rect.left + rect.width / 2;
      translateX = "-50%";
      maxWidth = viewportWidth - VIEWPORT_MARGIN * 2;
    } else if (align === "end") {
      left = rect.right;
      translateX = "-100%";
      maxWidth = rect.right - VIEWPORT_MARGIN;
    }
    if (side === "top") {
      top = rect.top - gap;
      translateY = "-100%";
    }
  } else {
    top = rect.top;
    if (align === "center") {
      top = rect.top + rect.height / 2;
      translateY = "-50%";
    } else if (align === "end") {
      top = rect.bottom;
      translateY = "-100%";
    }
    if (side === "right") {
      left = rect.right + gap;
      maxWidth = viewportWidth - rect.right - gap - VIEWPORT_MARGIN;
    } else {
      left = rect.left - gap;
      translateX = "-100%";
      maxWidth = rect.left - gap - VIEWPORT_MARGIN;
    }
  }

  style.setProperty("--rb-trigger-width", `${rect.width}px`);
  style.left = `${left + scrollX}px`;
  style.top = `${top + scrollY}px`;
  style.right = "auto";
  style.bottom = "auto";
  style.marginTop = "0px";
  style.marginBottom = "0px";
  style.maxWidth = `${Math.max(0, maxWidth)}px`;
  style.transform = `translate(${translateX}, ${translateY}) translateZ(0)`;
}

/**
 * 箭头中心点：落在浮层朝向触发器的那条边上、对准触发器中心，只由触发器几何与间距决定，
 * 不需要测量浮层。传送模式换算成文档坐标（与浮层同一坐标系），行内模式相对 wrapper。
 */
function syncArrow(rect: DOMRect, scrollX: number, scrollY: number) {
  const gap = props.offset;
  let x = rect.width / 2;
  let y = rect.height / 2;

  switch (resolvedSide.value) {
    case "bottom":
      y = rect.height + gap;
      break;
    case "top":
      y = -gap;
      break;
    case "right":
      x = rect.width + gap;
      break;
    default:
      x = -gap;
  }

  if (props.portal) {
    x += rect.left + scrollX;
    y += rect.top + scrollY;
  }
  arrowPoint.value = { x, y };
}

/**
 * 箭头样式：以中心点定位并旋转 45°，只保留朝外两条边的描边，
 * 探进浮层内的那一半用同底色盖住浮层描边，看起来与面板连成一体。
 */
const ARROW_BORDER_WIDTH: Record<ResolvedSide, string> = {
  bottom: "1px 0 0 1px",
  top: "0 1px 1px 0",
  left: "1px 1px 0 0",
  right: "0 0 1px 1px",
};

const arrowStyle = computed<Record<string, string>>(() => ({
  left: `${arrowPoint.value.x}px`,
  top: `${arrowPoint.value.y}px`,
  transform: "translate(-50%, -50%) rotate(45deg)",
  borderWidth: ARROW_BORDER_WIDTH[resolvedSide.value],
}));

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
    emit("close", event);
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
function onViewportScroll(event: Event) {
  if (!floatingEl()) return;

  // mousedown 时机的语义是「外部只要有动静就立刻收起」，页面滚动同样计入。
  // 但下拉面板内部的列表滚动属于组件自身的交互，必须排除，
  // 否则用滚轮翻选项会当场把面板关掉。
  if (props.closeOn === "mousedown" && props.isOpen && !containsNode(event.target as Node)) {
    emit("close");
    return;
  }

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
    placement: resolvedSide.value,
    align: props.align,
    portal: props.portal
  });

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    dropdown: (opts?: { class?: any }) =>
      styles.dropdown({ class: cn(opts?.class, uiOverrides.value.dropdown) }),
    dropdownInner: (opts?: { class?: any }) =>
      styles.dropdownInner({ class: cn(opts?.class, uiOverrides.value.dropdownInner) }),
    arrow: (opts?: { class?: any }) =>
      styles.arrow({ class: cn(opts?.class, uiOverrides.value.arrow) }),
  };
});

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
  <div ref="wrapperRef" :class="ui.wrapper({ class: props.class })" :tabindex="disabled ? -1 : 0"
    @keydown="emit('keydown', $event)">
    <!--
      触发器的结构与样式全部交由调用方决定（表单类组件可直接放 RebornFieldTrigger），
      本组件只负责提供定位锚点、聚焦分组（group）与外部点击边界。
    -->
    <slot name="trigger" :isOpen="isOpen" />

    <!--
      浮层只渲染一份：Teleport 的 disabled 已经覆盖了「留在原地」的场景。
      此前 portal 模式下同时存在行内与传送两份实例，且共用同一个 ref，
      导致行内那份变成视口外的幽灵节点，afterEnter 也永远由错误的实例发出。

      浮层内不再 stop 冒泡：外部点击判定由 containsNode（wrapper + 浮层双边界）负责，
      截断冒泡会让页面上其他依赖 document 点击流的浮层（popover / tooltip / 右键菜单）无法收起。

      收起动画期间（200ms）浮层仍占着原来的尺寸，只是透明度渐隐，
      若不摘掉 pointer-events，这块「看不见的板子」会吃掉落在它下方的点击，
      表现就是「点了下一个选择器却没反应、要点第二次才展开」，故非展开态一律 pointer-events-none。
    -->
    <Teleport to="body" :disabled="!portal">
      <RebornTransition ref="transitionRef" :show="isOpen" :duration="{ enter: 300, leave: 200 }"
        @before-enter="onBeforeEnter" @enter="onEnter" @after-enter="onAfterEnter" @after-leave="onAfterLeave"
        :custom-class="ui.dropdown({ class: isOpen ? undefined : 'pointer-events-none' })" name="select-collapse">
        <div ref="dropdownInnerRef" :class="ui.dropdownInner()">
          <slot name="content" />
        </div>
      </RebornTransition>

      <!-- 箭头与浮层同级、同时长淡入淡出，避免被浮层展开 / 收起期间的 overflow-hidden 裁掉 -->
      <RebornTransition
        v-if="arrow" :show="isOpen" :duration="{ enter: 300, leave: 200 }" name="fade"
        :custom-class="ui.arrow()" :custom-style="arrowStyle"
      />
    </Teleport>
  </div>
</template>
