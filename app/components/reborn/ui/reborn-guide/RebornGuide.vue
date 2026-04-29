<script setup lang="ts">
import type { ClassValue } from "clsx";
import type { ButtonProps } from "../reborn-button/RebornButton.vue";
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import theme from "./reborn-guide.config";

// ==================== 类型定义 ====================

/** popup 模式下的 12 种定位 */
type GuidePopupPlacement =
  | "top" | "left" | "right" | "bottom"
  | "top-left" | "top-right" | "bottom-left" | "bottom-right"
  | "left-top" | "left-bottom" | "right-top" | "right-bottom";

/** dialog 模式下的 2 种定位 */
type GuideDialogPlacement = "top" | "center";

/** 引导步骤定义 */
export interface GuideStep {
  /** 高亮的节点。字符串为 CSS 选择器，函数返回元素 */
  element: string | (() => Element | null);
  /** 当前步骤提示框的内容 */
  body?: string;
  /** 用户自定义引导弹框内容的插槽名 */
  content?: string;
  /** 用户自定义高亮框内容的插槽名 */
  highlightContent?: string;
  /** 高亮框的内边距 */
  highlightPadding?: number;
  /** 引导框的类型 */
  mode?: "popup" | "dialog";
  /** 当前步骤的下一步按钮配置 */
  nextButtonProps?: ButtonProps;
  /** 当前步骤的上一步按钮配置 */
  prevButtonProps?: ButtonProps;
  /** 当前步骤的跳过按钮配置 */
  skipButtonProps?: ButtonProps;
  /** 相对 placement 的偏移量 */
  offset?: [number | string, number | string];
  /** 引导框相对高亮元素出现的位置 */
  placement?: GuidePopupPlacement | GuideDialogPlacement;
  /** 透传全部属性到 Popup 组件（mode=popup 时有效） */
  popupProps?: Record<string, any>;
  /** 是否出现遮罩层 */
  showOverlay?: boolean;
  /** 覆盖引导框的类名 */
  stepOverlayClass?: string;
  /** 当前步骤的标题 */
  title?: string;
}

/** Guide 组件 Props */
export interface RebornGuideProps {
  /** 当前步骤（支持 v-model） */
  current?: number;
  /** 非受控当前步骤 */
  defaultCurrent?: number;
  /** 引导步骤数组 */
  steps: GuideStep[];
  /** 引导框类型 */
  mode?: "popup" | "dialog";
  /** 是否隐藏计数器 */
  hideCounter?: boolean;
  /** 是否隐藏上一步按钮 */
  hidePrev?: boolean;
  /** 是否隐藏跳过按钮 */
  hideSkip?: boolean;
  /** 完成按钮属性 */
  finishButtonProps?: ButtonProps;
  /** 下一步按钮属性 */
  nextButtonProps?: ButtonProps;
  /** 上一步按钮属性 */
  prevButtonProps?: ButtonProps;
  /** 跳过按钮属性 */
  skipButtonProps?: ButtonProps;
  /** 是否出现遮罩层 */
  showOverlay?: boolean;
  /** 高亮框内边距 */
  highlightPadding?: number;
  /** 提示框层级 */
  zIndex?: number;
  /** 自定义类名 */
  class?: any;
  /** UI 局部重写 */
  ui?: Partial<{
    overlay: ClassValue;
    highlightMask: ClassValue;
    guideBox: ClassValue;
    guideArrow: ClassValue;
    guideHeader: ClassValue;
    guideTitle: ClassValue;
    guideBody: ClassValue;
    guideFooter: ClassValue;
    counter: ClassValue;
    buttonGroup: ClassValue;
    skipLink: ClassValue;
    dialogOverlay: ClassValue;
    dialogBox: ClassValue;
  }>;
}

// ==================== Props & Emits ====================

const props = withDefaults(defineProps<RebornGuideProps>(), {
  current: undefined,
  defaultCurrent: -1,
  mode: "popup",
  hideCounter: false,
  hidePrev: false,
  hideSkip: false,
  finishButtonProps: () => ({}),
  nextButtonProps: () => ({}),
  prevButtonProps: () => ({}),
  skipButtonProps: () => ({}),
  showOverlay: true,
  highlightPadding: 8,
  zIndex: 999999,
  class: undefined,
  ui: () => ({}),
});

/** 当前步骤（受控/非受控） */
const currentStep = defineModel<number>("current", {
  default: -1,
});

const emit = defineEmits<{
  (e: "change", current: number, context?: { e: MouseEvent; total: number }): void;
  (e: "finish", context: { e: MouseEvent; current: number; total: number }): void;
  (e: "next-step-click", context: { e: MouseEvent; next: number; current: number; total: number }): void;
  (e: "prev-step-click", context: { e: MouseEvent; prev: number; current: number; total: number }): void;
  (e: "skip", context: { e: MouseEvent; current: number; total: number }): void;
}>();

// ==================== 状态 ====================

/** 指引框是否可见（用于过渡动画） */
const visible = ref(false);
/** 高亮目标元素的视口矩形 */
const targetRect = ref<DOMRect | null>(null);
/** 指引框 DOM 元素引用 */
const guideBoxRef = ref<HTMLElement | null>(null);
/** 指引框宽度 */
const guideBoxWidth = ref(260);
/** 指引框高度 */
const guideBoxHeight = ref(0);
/** rAF 标识 */
const rafId = ref(0);

// ==================== 计算属性 ====================

/** 当前激活的步骤 */
const activeStep = computed<GuideStep | null>(() => {
  if (currentStep.value < 0 || currentStep.value >= props.steps.length) return null;
  return props.steps[currentStep.value] ?? null;
});

/** 实际模式（步骤级优先） */
const actualMode = computed(() => activeStep.value?.mode ?? props.mode);

/** 是否显示遮罩 */
const actualShowOverlay = computed(() => {
  if (activeStep.value?.showOverlay !== undefined) return activeStep.value.showOverlay;
  return props.showOverlay;
});

/** 是否为最后一步 */
const isLastStep = computed(() => currentStep.value >= props.steps.length - 1);

// ==================== 合并按钮属性（步骤级 > 组件级 > 默认值） ====================

const mergedNextProps = computed<ButtonProps>(() => ({
  label: "下一步",
  color: "primary" as const,
  ...props.nextButtonProps,
  ...(activeStep.value?.nextButtonProps ?? {}),
}));

const mergedPrevProps = computed<ButtonProps>(() => ({
  label: "上一步",
  variant: "outline" as const,
  ...props.prevButtonProps,
  ...(activeStep.value?.prevButtonProps ?? {}),
}));

const mergedSkipProps = computed<ButtonProps>(() => ({
  label: "跳过",
  variant: "subtle" as const,
  ...props.skipButtonProps,
  ...(activeStep.value?.skipButtonProps ?? {}),
}));

const mergedFinishProps = computed<ButtonProps>(() => ({
  label: "完成",
  color: "primary" as const,
  ...props.finishButtonProps,
}));

// ==================== 元素查询 ====================

function resolveElement(target: string | (() => Element | null)): Element | null {
  if (typeof target === "function") return target();
  return document.querySelector(target);
}

function queryTargetRect(): DOMRect | null {
  const step = activeStep.value;
  if (!step) return null;
  const el = resolveElement(step.element);
  if (!el || typeof (el as any).getBoundingClientRect !== "function") return null;
  return (el as HTMLElement).getBoundingClientRect();
}

// ==================== 位置计算 ====================

/** 解析 offset 为数值数组 */
function parseOffset(step: GuideStep): [number, number] {
  const raw = step.offset ?? [0, 0];
  return [
    typeof raw[0] === "string" ? parseFloat(raw[0]) || 0 : raw[0],
    typeof raw[1] === "string" ? parseFloat(raw[1]) || 0 : raw[1],
  ];
}

/** 计算高亮框样式 */
function calcHighlightStyle(): Record<string, string> {
  const rect = targetRect.value;
  if (!rect) return { display: "none" };

  const padding = activeStep.value?.highlightPadding ?? props.highlightPadding;

  return {
    left: `${rect.left - padding}px`,
    top: `${rect.top - padding}px`,
    width: `${rect.width + padding * 2}px`,
    height: `${rect.height + padding * 2}px`,
  };
}

/**
 * 计算指引框位置
 * 根据 placement 和目标元素矩形计算指引框的 { left, top }
 * 返回的坐标是 fixed 定位相对于视口的位置
 */
function calcGuideBoxPosition(): { left: number; top: number; arrowSide: string } {
  const rect = targetRect.value;
  if (!rect) return { left: 0, top: 0, arrowSide: "bottom" };

  const placement = (activeStep.value?.placement ?? "bottom") as GuidePopupPlacement;
  const [ox, oy] = parseOffset(activeStep.value!);
  const gap = 12;
  const boxW = guideBoxWidth.value;
  const boxH = guideBoxHeight.value || 120;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 8;

  let left = 0;
  let top = 0;
  let arrowSide = "bottom";

  // 根据 12 种 placement 计算基准位置
  switch (placement) {
    case "top":
      left = rect.left + rect.width / 2 - boxW / 2 + ox;
      top = rect.top - boxH - gap + oy;
      arrowSide = "bottom";
      break;
    case "bottom":
      left = rect.left + rect.width / 2 - boxW / 2 + ox;
      top = rect.bottom + gap + oy;
      arrowSide = "top";
      break;
    case "left":
      left = rect.left - boxW - gap + ox;
      top = rect.top + rect.height / 2 - boxH / 2 + oy;
      arrowSide = "right";
      break;
    case "right":
      left = rect.right + gap + ox;
      top = rect.top + rect.height / 2 - boxH / 2 + oy;
      arrowSide = "left";
      break;
    case "top-left":
      left = rect.left + ox;
      top = rect.top - boxH - gap + oy;
      arrowSide = "bottom";
      break;
    case "top-right":
      left = rect.right - boxW + ox;
      top = rect.top - boxH - gap + oy;
      arrowSide = "bottom";
      break;
    case "bottom-left":
      left = rect.left + ox;
      top = rect.bottom + gap + oy;
      arrowSide = "top";
      break;
    case "bottom-right":
      left = rect.right - boxW + ox;
      top = rect.bottom + gap + oy;
      arrowSide = "top";
      break;
    case "left-top":
      left = rect.left - boxW - gap + ox;
      top = rect.top + oy;
      arrowSide = "right";
      break;
    case "left-bottom":
      left = rect.left - boxW - gap + ox;
      top = rect.bottom - boxH + oy;
      arrowSide = "right";
      break;
    case "right-top":
      left = rect.right + gap + ox;
      top = rect.top + oy;
      arrowSide = "left";
      break;
    case "right-bottom":
      left = rect.right + gap + ox;
      top = rect.bottom - boxH + oy;
      arrowSide = "left";
      break;
  }

  // viewport 钳制
  left = Math.max(margin, Math.min(left, vw - boxW - margin));
  top = Math.max(margin, Math.min(top, vh - boxH - margin));

  return { left, top, arrowSide };
}

/**
 * 计算箭头样式
 * 箭头是一个旋转 45° 的正方形，一半在指引框内，一半在外形成三角形
 */
function calcArrowStyle(guideBoxPos: { left: number; top: number; arrowSide: string }): Record<string, string> {
  const rect = targetRect.value!;
  const { left: boxLeft, top: boxTop, arrowSide } = guideBoxPos;
  const boxW = guideBoxWidth.value;
  const boxH = guideBoxHeight.value || 120;
  const half = 6; // w-3=12px 的一半

  let style: Record<string, string> = {
    left: "auto",
    top: "auto",
    right: "auto",
    bottom: "auto",
  };

  const targetCenterX = rect.left + rect.width / 2;
  const targetCenterY = rect.top + rect.height / 2;

  switch (arrowSide) {
    case "top": {
      // 箭头在指引框顶部 (指向指引框上方的目标)
      const ax = targetCenterX - boxLeft;
      style.left = `${Math.max(12, Math.min(ax - half, boxW - 24))}px`;
      style.top = `${-half}px`;
      style.borderTopWidth = "1px";
      style.borderLeftWidth = "1px";
      break;
    }
    case "bottom": {
      // 箭头在指引框底部 (指向指引框下方的目标)
      const ax = targetCenterX - boxLeft;
      style.left = `${Math.max(12, Math.min(ax - half, boxW - 24))}px`;
      style.bottom = `${-half}px`;
      style.borderBottomWidth = "1px";
      style.borderRightWidth = "1px";
      break;
    }
    case "left": {
      // 箭头在指引框左侧 (指向指引框左侧的目标)
      const ay = targetCenterY - boxTop;
      style.top = `${Math.max(12, Math.min(ay - half, boxH - 24))}px`;
      style.left = `${-half}px`;
      style.borderLeftWidth = "1px";
      style.borderBottomWidth = "1px";
      break;
    }
    case "right": {
      // 箭头在指引框右侧 (指向指引框右侧的目标)
      const ay = targetCenterY - boxTop;
      style.top = `${Math.max(12, Math.min(ay - half, boxH - 24))}px`;
      style.right = `${-half}px`;
      style.borderTopWidth = "1px";
      style.borderRightWidth = "1px";
      break;
    }
  }

  return style;
}

/** 高亮框内联样式 */
const highlightStyle = computed(() => calcHighlightStyle());

/** 临时存储计算后的 guide box 位置 */
const guideBoxPos = ref({ left: 0, top: 0, arrowSide: "bottom" as string });

/** 指引框内联样式 */
const guideBoxStyle = computed(() => {
  if (!targetRect.value) return { display: "none" };
  const pos = guideBoxPos.value;
  return {
    left: `${pos.left}px`,
    top: `${pos.top}px`,
    zIndex: props.zIndex + 2,
  };
});

/** 箭头内联样式 */
const guideArrowStyle = computed(() => {
  if (!targetRect.value) return { display: "none" };
  return calcArrowStyle(guideBoxPos.value);
});

/** 遮罩内联样式 */
const overlayStyle = computed(() => ({
  zIndex: props.zIndex,
}));

// ==================== 步骤切换逻辑 ====================

/** 测量指引框尺寸 */
function measureGuideBox() {
  if (guideBoxRef.value) {
    const r = guideBoxRef.value.getBoundingClientRect();
    guideBoxWidth.value = r.width || 260;
    guideBoxHeight.value = r.height || 120;
  }
}

/** 同步位置：查询元素 + 计算位置 */
function syncPosition() {
  if (currentStep.value < 0) return;

  const rect = queryTargetRect();
  if (rect) {
    targetRect.value = rect;
    guideBoxPos.value = calcGuideBoxPosition();
  } else {
    // 元素未找到时，使用屏幕中央作为回退
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    targetRect.value = null;
    guideBoxPos.value = {
      left: vw / 2 - guideBoxWidth.value / 2,
      top: vh / 2 - (guideBoxHeight.value || 120) / 2,
      arrowSide: "none",
    };
  }
}

/** 当前步骤变化时的处理 */
watch(currentStep, async (newVal, oldVal) => {
  if (newVal < 0) {
    visible.value = false;
    targetRect.value = null;
    return;
  }

  // 隐藏 → 查询新元素 → 测量 → 显示
  visible.value = false;
  await nextTick();

  syncPosition();

  await nextTick();
  requestAnimationFrame(() => {
    measureGuideBox();
    guideBoxPos.value = calcGuideBoxPosition();
    visible.value = true;
  });

  if (oldVal !== undefined && oldVal >= 0) {
    emit("change", newVal, {
      e: new MouseEvent("click") as unknown as MouseEvent,
      total: props.steps.length,
    });
  }
}, { immediate: true });

// ==================== 滚动/缩放监听 ====================

function onResizeOrScroll() {
  cancelAnimationFrame(rafId.value);
  rafId.value = requestAnimationFrame(() => {
    syncPosition();
    if (visible.value) {
      measureGuideBox();
      guideBoxPos.value = calcGuideBoxPosition();
    }
  });
}

onMounted(() => {
  window.addEventListener("resize", onResizeOrScroll);
  window.addEventListener("scroll", onResizeOrScroll, { capture: true });
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResizeOrScroll);
  window.removeEventListener("scroll", onResizeOrScroll, { capture: true });
  cancelAnimationFrame(rafId.value);
});

// ==================== 按钮处理 ====================

function onNext(e: MouseEvent) {
  const next = currentStep.value + 1;
  emit("next-step-click", {
    e,
    next,
    current: currentStep.value,
    total: props.steps.length,
  });
  currentStep.value = next;
}

function onPrev(e: MouseEvent) {
  const prev = currentStep.value - 1;
  emit("prev-step-click", {
    e,
    prev,
    current: currentStep.value,
    total: props.steps.length,
  });
  currentStep.value = prev;
}

function onFinish(e: MouseEvent) {
  emit("finish", {
    e,
    current: currentStep.value,
    total: props.steps.length,
  });
  currentStep.value = -1;
}

function onSkip(e: MouseEvent) {
  emit("skip", { e, current: currentStep.value, total: props.steps.length });
  currentStep.value = -1;
}

// ==================== 指引框出现后的尺寸测量 ====================

function onGuideBoxEnter() {
  requestAnimationFrame(() => {
    measureGuideBox();
    guideBoxPos.value = calcGuideBoxPosition();
  });
}

// ==================== UI 计算 ====================

const b = tv(theme);
const overrides = computed(() => props.ui ?? {});

const ui = computed(() => {
  const styles = b({ mode: actualMode.value as "popup" | "dialog" });

  return {
    overlay: (opts?: { class?: any }) =>
      cn(styles.overlay(), opts?.class, overrides.value.overlay),
    highlightMask: (opts?: { class?: any }) =>
      cn(styles.highlightMask(), opts?.class, overrides.value.highlightMask),
    guideBox: (opts?: { class?: any }) =>
      cn(styles.guideBox(), opts?.class, props.class, overrides.value.guideBox),
    guideArrow: (opts?: { class?: any }) =>
      cn(styles.guideArrow(), opts?.class, overrides.value.guideArrow),
    guideHeader: (opts?: { class?: any }) =>
      cn(styles.guideHeader(), opts?.class, overrides.value.guideHeader),
    guideTitle: (opts?: { class?: any }) =>
      cn(styles.guideTitle(), opts?.class, overrides.value.guideTitle),
    guideBody: (opts?: { class?: any }) =>
      cn(styles.guideBody(), opts?.class, overrides.value.guideBody),
    guideFooter: (opts?: { class?: any }) =>
      cn(styles.guideFooter(), opts?.class, overrides.value.guideFooter),
    counter: (opts?: { class?: any }) =>
      cn(styles.counter(), opts?.class, overrides.value.counter),
    buttonGroup: (opts?: { class?: any }) =>
      cn(styles.buttonGroup(), opts?.class, overrides.value.buttonGroup),
    skipLink: (opts?: { class?: any }) =>
      cn(styles.skipLink(), opts?.class, overrides.value.skipLink),
    dialogOverlay: (opts?: { class?: any }) =>
      cn(styles.dialogOverlay(), opts?.class, overrides.value.dialogOverlay),
    dialogBox: (opts?: { class?: any }) =>
      cn(styles.dialogBox(), opts?.class, props.class, overrides.value.dialogBox),
  };
});

// ==================== 暴露方法 ====================

defineExpose({
  /** 进入下一步 */
  next: () => {
    if (currentStep.value < props.steps.length - 1) {
      currentStep.value = currentStep.value + 1;
    }
  },
  /** 退回上一步 */
  prev: () => {
    if (currentStep.value > 0) {
      currentStep.value = currentStep.value - 1;
    }
  },
  /** 完成引导 */
  finish: () => {
    currentStep.value = -1;
  },
  /** 跳过引导 */
  skip: () => {
    currentStep.value = -1;
  },
});
</script>

<template>
  <Teleport to="body">
    <template v-if="activeStep">
      <!-- ========== Dialog 模式 ========== -->
      <template v-if="actualMode === 'dialog'">
        <div
          :class="ui.dialogOverlay({ class: activeStep.stepOverlayClass })"
          :style="overlayStyle"
        >
          <div :class="ui.dialogBox()">
            <!-- 头部 -->
            <div v-if="activeStep.title" :class="ui.guideHeader()">
              <h3 :class="ui.guideTitle()">{{ activeStep.title }}</h3>
            </div>

            <!-- 正文 -->
            <div :class="ui.guideBody()">
              <slot v-if="activeStep.content" :name="activeStep.content" />
              <p v-else>{{ activeStep.body }}</p>
            </div>

            <!-- 底部 -->
            <div :class="ui.guideFooter()">
              <slot name="counter" :current="currentStep + 1" :total="steps.length">
                <span v-if="!hideCounter" :class="ui.counter()">{{ currentStep + 1 }} / {{ steps.length }}</span>
              </slot>
              <div :class="ui.buttonGroup()">
                <RebornButton
                  v-if="!hideSkip && !isLastStep"
                  v-bind="mergedSkipProps"
                  @click="onSkip"
                />
                <RebornButton
                  v-if="!hidePrev && currentStep > 0"
                  v-bind="mergedPrevProps"
                  @click="onPrev"
                />
                <RebornButton
                  v-if="isLastStep"
                  v-bind="mergedFinishProps"
                  @click="onFinish"
                />
                <RebornButton
                  v-else
                  v-bind="mergedNextProps"
                  @click="onNext"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

      <!-- ========== Popup 模式 ========== -->
      <template v-else>
        <!-- 遮罩层 + 高亮挖洞 -->
        <div
          v-if="actualShowOverlay"
          :class="ui.overlay()"
          :style="overlayStyle"
        >
          <div
            :class="ui.highlightMask({ class: activeStep.stepOverlayClass })"
            :style="{ ...highlightStyle, boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)', zIndex: props.zIndex + 1 }"
          >
            <slot v-if="activeStep.highlightContent" :name="activeStep.highlightContent" />
          </div>
        </div>

        <!-- 指引框 -->
        <Transition name="fade-guide">
          <div
            v-if="visible"
            ref="guideBoxRef"
            :class="ui.guideBox()"
            :style="guideBoxStyle"
            @vue:mounted="onGuideBoxEnter"
          >
            <!-- 箭头 -->
            <div
              v-if="targetRect && guideBoxPos.arrowSide !== 'none'"
              :class="ui.guideArrow()"
              :style="guideArrowStyle"
            />

            <!-- 头部 -->
            <div v-if="activeStep.title" :class="ui.guideHeader()">
              <h3 :class="ui.guideTitle()">{{ activeStep.title }}</h3>
            </div>

            <!-- 正文 -->
            <div :class="ui.guideBody()">
              <slot v-if="activeStep.content" :name="activeStep.content" />
              <p v-else>{{ activeStep.body }}</p>
            </div>

            <!-- 底部 -->
            <div :class="ui.guideFooter()">
              <slot name="counter" :current="currentStep + 1" :total="steps.length">
                <span v-if="!hideCounter" :class="ui.counter()">{{ currentStep + 1 }} / {{ steps.length }}</span>
              </slot>
              <div :class="ui.buttonGroup()">
                <RebornButton
                  v-if="!hideSkip && !isLastStep"
                  v-bind="mergedSkipProps"
                  @click="onSkip"
                />
                <RebornButton
                  v-if="!hidePrev && currentStep > 0"
                  v-bind="mergedPrevProps"
                  @click="onPrev"
                />
                <RebornButton
                  v-if="isLastStep"
                  v-bind="mergedFinishProps"
                  @click="onFinish"
                />
                <RebornButton
                  v-else
                  v-bind="mergedNextProps"
                  @click="onNext"
                />
              </div>
            </div>
          </div>
        </Transition>
      </template>
    </template>
  </Teleport>
</template>

<style scoped>
.fade-guide-enter-active,
.fade-guide-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-guide-enter-from,
.fade-guide-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
