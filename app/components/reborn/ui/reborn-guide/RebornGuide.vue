<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { Component, CSSProperties } from "vue";
import type { ButtonProps } from "../reborn-button/RebornButton.vue";
import type { Placement, PlacementSide } from "~/lib/placement";
import { computed, nextTick, onBeforeUnmount, onMounted, shallowRef, toRaw, useTemplateRef, watch } from "vue";
import { prefersReducedMotion, runMotion, stopMotion } from "@/lib/motion";
import { getArrowCenter, resolveFloatingPosition } from "~/lib/floating";
import { resolvePlacement } from "~/lib/placement";
import { tv } from "~/lib/tv";
import { cn } from "~/lib/utils";
import RebornButton from "../reborn-button/RebornButton.vue";
import theme from "./reborn-guide.config";

/** 子步骤按父步骤在前的深度优先顺序展开 */
export interface GuideStep {
  /** 高亮节点；子步骤省略时继承父步骤的目标 */
  element?: string | (() => Element | null);
  title?: string;
  body?: string;
  /** 可选封面图及替代文本 */
  cover?: string;
  coverAlt?: string;
  /** 正文插槽名，保留默认标题、关闭按钮与底部操作 */
  content?: string;
  /** 整步内容组件，接收步骤信息与导航方法 */
  component?: Component;
  componentProps?: Record<string, unknown>;
  children?: GuideStep[];
  /** children 的兼容别名，同时提供时优先使用 children */
  chidren?: GuideStep[];
  highlightContent?: string;
  /** 高亮框内边距，不改变面板与目标边缘的定位 */
  highlightPadding?: number;
  mode?: "popup" | "dialog";
  nextButtonProps?: ButtonProps;
  prevButtonProps?: ButtonProps;
  skipButtonProps?: ButtonProps;
  finishButtonProps?: ButtonProps;
  /** 面板在水平、垂直方向上的额外偏移 */
  offset?: [number | string, number | string];
  placement?: Placement | "center";
  /** 保留字段，当前没有接入 Popup 属性透传 */
  popupProps?: Record<string, unknown>;
  showOverlay?: boolean;
  stepOverlayClass?: string;
}

export interface RebornGuideProps {
  defaultCurrent?: number;
  steps: GuideStep[];
  mode?: "popup" | "dialog";
  indicator?: "counter" | "dots";
  hideCounter?: boolean;
  hidePrev?: boolean;
  hideSkip?: boolean;
  finishButtonProps?: ButtonProps;
  nextButtonProps?: ButtonProps;
  prevButtonProps?: ButtonProps;
  skipButtonProps?: ButtonProps;
  showOverlay?: boolean;
  highlightPadding?: number;
  zIndex?: number;
  class?: ClassValue;
  ui?: Partial<Record<
    | "overlay" | "highlightMask" | "guideBox" | "guideArrow"
    | "guideHeader" | "guideTitle" | "guideBody" | "guideFooter"
    | "counter" | "buttonGroup" | "dialogOverlay" | "dialogBox"
    | "closeRow" | "closeButton" | "cover" | "indicators" | "indicatorDot",
    ClassValue
  >>;
}

interface GuideEventContext { e: MouseEvent; current: number; total: number }

/** 插槽与自定义组件拿到的步骤上下文；current 从 1 开始 */
export interface GuideStepContext {
  step: GuideStep | null;
  current: number;
  total: number;
  next: (event?: MouseEvent) => void;
  prev: (event?: MouseEvent) => void;
  finish: (event?: MouseEvent) => void;
  close: (event?: MouseEvent) => void;
}

const props = withDefaults(defineProps<RebornGuideProps>(), {
  defaultCurrent: -1,
  mode: "popup",
  indicator: "counter",
  hideCounter: false,
  hidePrev: false,
  hideSkip: true,
  showOverlay: true,
  highlightPadding: 4,
  zIndex: 999999,
});
const emit = defineEmits<{
  (e: "change", current: number, context?: { e: MouseEvent; total: number }): void;
  (e: "finish", context: GuideEventContext): void;
  /** 进入下一步；模板中写作 @next-step-click */
  (e: "nextStepClick", context: GuideEventContext & { next: number }): void;
  /** 返回上一步；模板中写作 @prev-step-click */
  (e: "prevStepClick", context: GuideEventContext & { prev: number }): void;
  (e: "skip", context: GuideEventContext): void;
  (e: "close", context: GuideEventContext): void;
}>();
defineSlots<{
  /** 替换默认步骤指示 */
  counter?: (props: GuideStepContext) => any;
  /** 步骤 content / highlightContent 指定的动态插槽，接收相同的步骤上下文 */
  [name: string]: ((props: GuideStepContext) => any) | undefined;
}>();
/** 扁平步骤索引，从 0 开始，-1 关闭；支持 v-model:current，未绑定时由 defaultCurrent 决定初始步骤 */
const model = defineModel<number>("current");
const localCurrent = shallowRef(props.defaultCurrent);
const currentStep = computed({
  get: () => model.value ?? localCurrent.value,
  set: (value: number) => {
    localCurrent.value = value;
    model.value = value;
  },
});

const flatSteps = computed(() => {
  const result: GuideStep[] = [];
  function append(steps: GuideStep[], parentElement?: GuideStep["element"]) {
    for (const step of steps) {
      const element = step.element ?? parentElement;
      result.push({ ...step, element });
      append(step.children ?? step.chidren ?? [], element);
    }
  }
  append(props.steps);
  return result;
});
const total = computed(() => flatSteps.value.length);
const requestedStep = computed(() => flatSteps.value[currentStep.value] ?? null);
/** 显示快照在旧内容淡出后更新，避免新文案先出现在旧目标旁。 */
const displayed = shallowRef<{
  step: GuideStep;
  index: number;
  steps: GuideStep[];
  mode: "popup" | "dialog";
} | null>(null);
const activeStep = computed(() => displayed.value?.step ?? null);
const displayedCurrent = computed(() => displayed.value?.index ?? -1);
const displayedSteps = computed(() => displayed.value?.steps ?? []);
const displayedTotal = computed(() => displayedSteps.value.length);
const actualMode = computed(() => displayed.value?.mode ?? props.mode);
const actualShowOverlay = computed(() => activeStep.value?.showOverlay ?? props.showOverlay);
const isLastStep = computed(() => displayedCurrent.value === displayedTotal.value - 1);
const stepComponent = computed(() => activeStep.value?.component ? toRaw(activeStep.value.component) : undefined);
const mounted = shallowRef(false);
const ready = shallowRef(false);
const motionDirection = shallowRef(1);
const layerRef = useTemplateRef<HTMLElement>("layerRef");
const guideBoxRef = useTemplateRef<HTMLElement>("guideBoxRef");
const highlightRef = useTemplateRef<HTMLElement>("highlightRef");
const targetElement = shallowRef<Element | null>(null);
const targetRect = shallowRef<DOMRect | null>(null);
// 定位样式每次整体替换，不需要深层响应
const guideBoxStyle = shallowRef<CSSProperties>({});
const guideArrowStyle = shallowRef<CSSProperties>({});
let positionFrame = 0;
let revision = 0;
/** 最近一次完成切步、可以就地刷新内容的请求号；与 revision 不等说明正在切步 */
let settledRevision = -1;
let resizeObserver: ResizeObserver | undefined;
let cancelTransition: (() => void) | undefined;

const highlightStyle = computed<CSSProperties>(() => {
  const rect = targetRect.value;
  if (!rect) return { display: "none" };
  const padding = activeStep.value?.highlightPadding ?? props.highlightPadding;
  return {
    left: `${rect.left - padding}px`, top: `${rect.top - padding}px`,
    width: `${rect.width + padding * 2}px`, height: `${rect.height + padding * 2}px`,
  };
});
let previousHighlight: CSSProperties | undefined;
let previousHighlightElement: HTMLElement | undefined;
let highlightAnimation: ReturnType<typeof runMotion> | undefined;
watch([highlightStyle, highlightRef], ([style, element]) => {
  if (!element) {
    highlightAnimation?.stop();
    previousHighlight = undefined;
    previousHighlightElement = undefined;
    return;
  }
  if (previousHighlight && previousHighlightElement === element) {
    // 动画途中再次定位时读取当前画面，避免高亮框跳回上一个目标。
    const from = highlightAnimation ? getComputedStyle(element) : previousHighlight;
    const animation = runMotion(element, {
      left: [String(from.left), String(style.left)],
      top: [String(from.top), String(style.top)],
      width: [String(from.width), String(style.width)],
      height: [String(from.height), String(style.height)],
    }, { duration: 0.25, ease: [0.22, 1, 0.36, 1] });
    highlightAnimation = animation;
    void animation.finished.then(() => { if (highlightAnimation === animation) highlightAnimation = undefined; });
  }
  previousHighlight = style;
  previousHighlightElement = element;
}, { flush: "post" });
const mergedNextProps = computed<ButtonProps>(() => ({
  label: "下一步", color: "primary", variant: "filled", size: "sm",
  ...props.nextButtonProps, ...activeStep.value?.nextButtonProps,
}));
const mergedPrevProps = computed<ButtonProps>(() => ({
  label: "上一步", color: "neutral", variant: "outlined", size: "sm",
  ...props.prevButtonProps, ...activeStep.value?.prevButtonProps,
}));
const mergedSkipProps = computed<ButtonProps>(() => ({
  label: "跳过", color: "neutral", variant: "text", size: "sm",
  ...props.skipButtonProps, ...activeStep.value?.skipButtonProps,
}));
const mergedFinishProps = computed<ButtonProps>(() => ({
  label: "完成", color: "primary", variant: "filled", size: "sm",
  ...props.finishButtonProps, ...activeStep.value?.nextButtonProps, ...activeStep.value?.finishButtonProps,
}));
function eventContext(event?: MouseEvent, index = currentStep.value, count = total.value): GuideEventContext {
  return { e: event ?? new MouseEvent("click"), current: index, total: count };
}
function onNext(event?: MouseEvent, index = currentStep.value, count = total.value) {
  if (!requestedStep.value) return;
  if (index >= count - 1) return onFinish(event, index, count);
  const next = index + 1;
  emit("nextStepClick", { ...eventContext(event, index, count), next });
  currentStep.value = next;
}
function onPrev(event?: MouseEvent, index = currentStep.value, count = total.value) {
  if (!requestedStep.value || index <= 0) return;
  const prev = index - 1;
  emit("prevStepClick", { ...eventContext(event, index, count), prev });
  currentStep.value = prev;
}
function onFinish(event?: MouseEvent, index = currentStep.value, count = total.value) {
  if (!requestedStep.value) return;
  emit("finish", eventContext(event, index, count));
  currentStep.value = -1;
}
function onSkip(event?: MouseEvent, index = currentStep.value, count = total.value) {
  if (!requestedStep.value) return;
  emit("skip", eventContext(event, index, count));
  currentStep.value = -1;
}
function onClose(event?: MouseEvent, index = currentStep.value, count = total.value) {
  if (!requestedStep.value) return;
  emit("close", eventContext(event, index, count));
  currentStep.value = -1;
}
const stepContext = computed<GuideStepContext>(() => {
  const index = displayedCurrent.value;
  const count = displayedTotal.value;
  return {
    step: activeStep.value, current: index + 1, total: count,
    next: (event?: MouseEvent) => onNext(event, index, count),
    prev: (event?: MouseEvent) => onPrev(event, index, count),
    finish: (event?: MouseEvent) => onFinish(event, index, count),
    close: (event?: MouseEvent) => onClose(event, index, count),
  };
});
const componentBindings = computed(() => ({ ...activeStep.value?.componentProps, ...stepContext.value }));

/** 背景不可交互；保存原始状态，关闭或卸载后完整恢复 */
let releasePage: (() => void) | undefined;
function blockScroll(event: Event) {
  event.preventDefault();
}
function keepFocus(event: FocusEvent) {
  if (layerRef.value && !layerRef.value.contains(event.target as Node)) {
    guideBoxRef.value?.focus({ preventScroll: true });
  }
}
function onKeydown(event: KeyboardEvent) {
  const panel = guideBoxRef.value;
  if (!panel) return;
  if (event.key === "Escape") {
    event.preventDefault();
    onClose();
    return;
  }
  if (event.key === "Tab") {
    const controls = Array.from(panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    )).filter(element => element.getClientRects().length > 0 && !element.closest("[inert]"));
    const first = controls[0];
    const last = controls.at(-1);
    if (!first || (event.shiftKey && (document.activeElement === first || document.activeElement === panel))) {
      event.preventDefault();
      (last ?? panel).focus({ preventScroll: true });
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    }
    return;
  }
  const element = event.target;
  const editable = element instanceof HTMLElement
    && (element.isContentEditable || /^(?:INPUT|TEXTAREA|SELECT)$/.test(element.tagName));
  const buttonSpace = event.key === " " && element instanceof HTMLElement && element.closest("button");
  if (!editable && !buttonSpace && [" ", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "PageUp", "PageDown", "Home", "End"].includes(event.key)) event.preventDefault();
}
function lockPage() {
  if (releasePage || !layerRef.value) return;
  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const inertElements = Array.from(document.body.children)
    .filter((element): element is HTMLElement => element instanceof HTMLElement && element !== layerRef.value)
    .map(element => ({ element, inert: element.inert }));
  // 只锁根滚动容器，避免 body 的 overflow 改变两侧 sticky 内容的定位参照。
  const scrollRoot = document.scrollingElement instanceof HTMLElement ? document.scrollingElement : document.documentElement;
  const styles = [scrollRoot].map(element => ({
    element, overflow: element.style.getPropertyValue("overflow"), priority: element.style.getPropertyPriority("overflow"),
  }));
  for (const { element } of inertElements) element.inert = true;
  for (const { element } of styles) element.style.setProperty("overflow", "hidden", "important");
  window.addEventListener("wheel", blockScroll, { passive: false, capture: true });
  window.addEventListener("touchmove", blockScroll, { passive: false, capture: true });
  window.addEventListener("keydown", onKeydown, true);
  document.addEventListener("focusin", keepFocus, true);
  releasePage = () => {
    window.removeEventListener("wheel", blockScroll, true);
    window.removeEventListener("touchmove", blockScroll, true);
    window.removeEventListener("keydown", onKeydown, true);
    document.removeEventListener("focusin", keepFocus, true);
    for (const { element, inert } of inertElements) element.inert = inert;
    for (const { element, overflow, priority } of styles) {
      if (overflow) element.style.setProperty("overflow", overflow, priority);
      else element.style.removeProperty("overflow");
    }
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    releasePage = undefined;
  };
}
function resolveElement(target?: GuideStep["element"]): Element | null {
  if (!target) return null;
  // 无效选择器和已卸载的目标均按缺失目标处理
  try {
    const element = typeof target === "function" ? target() : document.querySelector(target);
    return element?.isConnected ? element : null;
  } catch {
    return null;
  }
}
/** 自动居中不继承页面的平滑滚动，防止锁定后仍有滚动动画 */
function centerTarget(element: Element) {
  const ancestors: { element: HTMLElement; value: string; priority: string }[] = [];
  let parent = element.parentElement;
  while (parent) {
    ancestors.push({ element: parent, value: parent.style.getPropertyValue("scroll-behavior"), priority: parent.style.getPropertyPriority("scroll-behavior") });
    parent.style.setProperty("scroll-behavior", "auto", "important");
    parent = parent.parentElement;
  }
  element.scrollIntoView({ behavior: "instant", block: "center", inline: "center" });
  for (const { element: ancestor, value, priority } of ancestors) {
    if (value) ancestor.style.setProperty("scroll-behavior", value, priority);
    else ancestor.style.removeProperty("scroll-behavior");
  }
}
/** 使用共享浮层几何：仅交叉轴贴边，不把面板推回目标内部 */
function syncPosition() {
  const panel = guideBoxRef.value;
  if (!panel || !activeStep.value) return;
  const rect = targetElement.value?.isConnected ? targetElement.value.getBoundingClientRect() : null;
  targetRect.value = rect;
  const size = { width: panel.offsetWidth, height: panel.offsetHeight };
  if (actualMode.value === "dialog" || !rect) {
    guideBoxStyle.value = {
      left: `${Math.max(16, (window.innerWidth - size.width) / 2)}px`,
      top: `${actualMode.value === "dialog" && activeStep.value.placement === "top" ? 32 : Math.max(16, (window.innerHeight - size.height) / 2)}px`,
    };
    guideArrowStyle.value = { display: "none" };
    return;
  }
  const placement = activeStep.value.placement;
  const { side: preferredSide, align } = resolvePlacement(placement === "center" || !placement ? "bottom" : placement);
  // 12px 方块的半对角线正好连接面板边缘与目标真实边框
  const arrowDepth = 6 * Math.SQRT2;
  const { position, side } = resolveFloatingPosition({ triggerRect: rect, size, side: preferredSide, align, offset: arrowDepth });
  const [offsetX, offsetY] = activeStep.value.offset ?? [0, 0];
  position.left += Number.parseFloat(String(offsetX)) || 0;
  position.top += Number.parseFloat(String(offsetY)) || 0;
  guideBoxStyle.value = { left: `${position.left}px`, top: `${position.top}px` };
  const vertical = side === "top" || side === "bottom";
  const center = getArrowCenter({
    panelStart: vertical ? position.left : position.top,
    panelExtent: vertical ? size.width : size.height,
    triggerStart: vertical ? rect.left : rect.top,
    triggerExtent: vertical ? rect.width : rect.height,
    align, inset: 17, pointAtCenter: true,
  });
  const edge: Record<PlacementSide, string> = { top: "bottom", bottom: "top", left: "right", right: "left" };
  guideArrowStyle.value = {
    [edge[side]]: "-6px",
    [vertical ? "left" : "top"]: `${center}px`,
    transform: `${vertical ? "translateX(-50%)" : "translateY(-50%)"} rotate(45deg)`,
  };
}
function schedulePosition() {
  // 初次定位与显示由切步流程负责，滚动事件不能取消显示帧。
  if (!ready.value || !activeStep.value) return;
  cancelAnimationFrame(positionFrame);
  positionFrame = requestAnimationFrame(() => {
    syncPosition();
    positionFrame = 0;
  });
}

/** Motion 的完成信号可取消，不再依赖强制重排或 transitionend。 */
async function animatePanel(panel: HTMLElement, entering: boolean): Promise<void> {
  const offset = prefersReducedMotion() ? 0 : motionDirection.value * 4;
  const animation = runMotion(panel, entering
    ? { opacity: [0, 1], transform: [`translateY(${offset}px)`, "translateY(0px)"] }
    : { opacity: 0, transform: `translateY(${-offset}px)` }, {
    duration: entering ? 0.2 : 0.12,
    ease: [0.22, 1, 0.36, 1],
  });
  cancelTransition = animation.stop;
  await animation.finished;
  if (cancelTransition === animation.stop) cancelTransition = undefined;
}

/**
 * 已显示的步骤内容就地刷新：steps 引用变化（父组件内联数组、步骤依赖高频状态）但目标与形态没变时，
 * 只替换快照，不重放「淡出 → 替换 → 居中 → 淡入」
 */
function refreshDisplayedContent() {
  const snapshot = displayed.value;
  const step = requestedStep.value;
  if (!snapshot || !step || settledRevision !== revision || snapshot.index !== currentStep.value) return;
  if (snapshot.step === step && snapshot.steps === flatSteps.value) return;
  displayed.value = { ...snapshot, step, steps: flatSteps.value };
  schedulePosition();
}
watch(flatSteps, refreshDisplayedContent);

// 切步流程只由真正影响显示位置与形态的值驱动：索引、目标、步骤形态、组件级形态与挂载状态
watch([
  currentStep,
  () => !!requestedStep.value,
  () => requestedStep.value?.element,
  () => requestedStep.value?.mode,
  () => props.mode,
  mounted,
], async () => {
  const request = ++revision;
  cancelTransition?.();
  resizeObserver?.disconnect();
  if (!mounted.value) return;
  cancelAnimationFrame(positionFrame);
  if (!requestedStep.value) {
    ready.value = false;
    displayed.value = null;
    stopMotion(guideBoxRef.value);
    stopMotion(highlightRef.value);
    targetElement.value = null;
    targetRect.value = null;
    releasePage?.();
    return;
  }

  motionDirection.value = currentStep.value < displayedCurrent.value ? -1 : 1;
  if (ready.value && guideBoxRef.value) {
    await animatePanel(guideBoxRef.value, false);
    if (request !== revision) return;
  }

  // 不可见时一次替换内容与定位；切步期间不解除滚动与焦点保护。
  ready.value = false;
  displayed.value = {
    step: requestedStep.value,
    index: currentStep.value,
    steps: flatSteps.value,
    mode: requestedStep.value.mode ?? props.mode,
  };
  await nextTick();
  if (request !== revision || !mounted.value) return;
  lockPage();
  targetElement.value = resolveElement(displayed.value.step.element);
  if (targetElement.value) centerTarget(targetElement.value);
  syncPosition();
  if (guideBoxRef.value) guideBoxRef.value.style.opacity = "0";
  ready.value = true;
  // 替换内容到这里期间若 steps 内容又变了，补刷一次快照
  settledRevision = request;
  refreshDisplayedContent();
  await nextTick();
  if (request !== revision || !mounted.value) return;
  guideBoxRef.value?.focus({ preventScroll: true });
  if (guideBoxRef.value) resizeObserver?.observe(guideBoxRef.value);
  if (targetElement.value) resizeObserver?.observe(targetElement.value);
  if (guideBoxRef.value) await animatePanel(guideBoxRef.value, true);
}, { immediate: true });
watch(currentStep, (value, previous) => {
  if (value >= 0 && previous >= 0 && value !== previous) emit("change", value, { e: new MouseEvent("click"), total: total.value });
});
onMounted(() => {
  resizeObserver = new ResizeObserver(schedulePosition);
  mounted.value = true;
  window.addEventListener("resize", schedulePosition);
  window.addEventListener("scroll", schedulePosition, true);
});
onBeforeUnmount(() => {
  revision++;
  cancelTransition?.();
  cancelAnimationFrame(positionFrame);
  stopMotion(highlightRef.value);
  resizeObserver?.disconnect();
  window.removeEventListener("resize", schedulePosition);
  window.removeEventListener("scroll", schedulePosition, true);
  releasePage?.();
});

const styles = tv(theme);
const ui = computed(() => {
  const slots = styles({ mode: actualMode.value });
  const slot = (key: keyof typeof theme.slots) => (options?: { class?: ClassValue }) =>
    cn(slots[key](), options?.class, props.ui?.[key]);
  return {
    overlay: slot("overlay"), highlightMask: slot("highlightMask"),
    guideBox: slot("guideBox"), guideArrow: slot("guideArrow"),
    guideHeader: slot("guideHeader"), guideTitle: slot("guideTitle"),
    guideBody: slot("guideBody"), guideFooter: slot("guideFooter"),
    counter: slot("counter"), buttonGroup: slot("buttonGroup"),
    dialogOverlay: slot("dialogOverlay"), dialogBox: slot("dialogBox"),
    closeRow: slot("closeRow"), closeButton: slot("closeButton"),
    cover: slot("cover"), indicators: slot("indicators"), indicatorDot: slot("indicatorDot"),
  };
});
defineExpose({ next: onNext, prev: onPrev, finish: onFinish, skip: onSkip, close: onClose });
</script>

<template>
  <Teleport to="body">
    <div
      v-if="mounted && activeStep"
      ref="layerRef"
      :class="actualMode === 'dialog' ? ui.dialogOverlay() : ui.overlay()"
      :style="{ zIndex, backgroundColor: actualShowOverlay && (actualMode === 'dialog' || !targetRect) ? 'rgba(0, 0, 0, 0.5)' : undefined }"
    >
      <!-- 透明遮挡层始终存在，关闭遮罩只影响颜色，不放开背景交互 -->
      <div
        v-if="actualMode === 'popup' && targetRect"
        ref="highlightRef"
        :class="ui.highlightMask({ class: activeStep.stepOverlayClass })"
        :style="{ ...highlightStyle, boxShadow: actualShowOverlay ? '0 0 0 9999px rgba(0, 0, 0, 0.5)' : undefined }"
      >
        <slot v-if="activeStep.highlightContent" :name="activeStep.highlightContent" v-bind="stepContext" />
      </div>
      <div
        ref="guideBoxRef"
        role="dialog"
        aria-modal="true"
        :aria-label="activeStep.title || '功能引导'"
        tabindex="-1"
        :class="actualMode === 'dialog' ? ui.dialogBox({ class: props.class }) : ui.guideBox({ class: props.class })"
        :style="{ ...guideBoxStyle, visibility: ready ? 'visible' : 'hidden' }"
      >
        <div v-if="actualMode === 'popup' && targetRect" :class="ui.guideArrow()" :style="guideArrowStyle" />
        <component :is="stepComponent" v-if="stepComponent" :key="displayedCurrent" v-bind="componentBindings" />
        <template v-else>
          <div :class="ui.closeRow()">
            <button type="button" aria-label="关闭引导" :class="ui.closeButton()" @click="stepContext.close">
              <svg class="size-5" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="m5 5 10 10M15 5 5 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </button>
          </div>
          <img v-if="activeStep.cover" :src="activeStep.cover" :alt="activeStep.coverAlt || ''" :class="ui.cover()">
          <div v-if="activeStep.title" :class="ui.guideHeader()">
            <h3 :class="ui.guideTitle()">{{ activeStep.title }}</h3>
          </div>
          <div v-if="activeStep.content || activeStep.body" :class="ui.guideBody()">
            <slot v-if="activeStep.content" :name="activeStep.content" v-bind="stepContext" />
            <p v-else>{{ activeStep.body }}</p>
          </div>
          <div :class="ui.guideFooter()">
            <slot name="counter" v-bind="stepContext">
              <template v-if="!hideCounter">
                <span v-if="indicator === 'counter'" :class="ui.counter()">{{ displayedCurrent + 1 }}/{{ displayedTotal }}</span>
                <div v-else :class="ui.indicators()" :aria-label="`第 ${displayedCurrent + 1} 步，共 ${displayedTotal} 步`">
                  <span
                    v-for="(_, index) in displayedSteps" :key="index"
                    :class="ui.indicatorDot({ class: index === displayedCurrent ? 'h-1.5 w-2.5 bg-primary' : 'size-1.5 bg-gray-4' })"
                    :aria-current="index === displayedCurrent ? 'step' : undefined"
                  />
                </div>
              </template>
            </slot>
            <div :class="ui.buttonGroup()">
              <RebornButton v-if="!hideSkip && !isLastStep" type="button" v-bind="mergedSkipProps" @click="onSkip($event, displayedCurrent, displayedTotal)" />
              <RebornButton v-if="!hidePrev && displayedCurrent > 0" type="button" v-bind="mergedPrevProps" @click="stepContext.prev" />
              <RebornButton v-if="isLastStep" type="button" v-bind="mergedFinishProps" @click="stepContext.finish" />
              <RebornButton v-else type="button" v-bind="mergedNextProps" @click="stepContext.next" />
            </div>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>
