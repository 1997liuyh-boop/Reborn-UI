<script setup lang="ts">
import type { TabKey, TabPaneRegistration } from "./reborn-tabs.config";
import { animate } from "motion-v";
import {
  computed,
  inject,
  onBeforeUnmount,
  onBeforeUpdate,
  onMounted,
  shallowReactive,
  shallowRef,
  useSlots,
  useTemplateRef,
  watch,
  watchEffect,
} from "vue";
import { motionPresets, prefersReducedMotion } from "@/lib/motion";
import { TABS_INJECTION_KEY } from "./reborn-tabs.config";

defineOptions({
  name: "RebornTabPane",
});

const props = withDefaults(defineProps<RebornTabPaneProps>(), {
  disabled: false,
  closable: true,
  destroyOnHidden: false,
});

export interface RebornTabPaneProps {
  /** 业务选中标识；Vue key 只用于列表复用 */
  paneKey?: TabKey
  /** 显式序位；小程序动态列表所有项都应传入有限数值 */
  order?: number
  /** 标题文本，需要富文本时改用 title 插槽 */
  title?: string;
  /** 是否禁用，禁用后点击与悬停都不会切换 */
  disabled?: boolean;
  /** 是否允许关闭此选项卡，仅在可编辑模式生效 */
  closable?: boolean;
  /** 是否在不显示此标签时销毁 DOM 结构，与父级同名参数取或 */
  destroyOnHidden?: boolean;
}

const slots = useSlots();
const ctx = inject(TABS_INJECTION_KEY, null);
if (!ctx) throw new Error("[RebornTabPane] 必须作为 RebornTabs 的子组件使用");

const el = useTemplateRef<HTMLElement>("el");

/** 标题插槽的稳定包装：始终调用当前插槽，父级重渲染换了插槽函数也不会渲染到旧的 */
const renderTitle = () => slots.title?.() ?? [];

/** 登记到父级的元信息，父级据此渲染头部；未写 paneKey 时留空由父级补序号 */
const meta = ctx.addPane(shallowReactive<TabPaneRegistration>({
  key: props.paneKey,
  order: props.order,
  title: props.title,
  disabled: props.disabled,
  closable: props.closable,
  destroyOnHidden: props.destroyOnHidden,
  titleSlot: slots.title ? renderTitle : undefined,
}));

/**
 * useSlots() 在生产构建下不是响应式的，setup 里判断一次插槽是否存在，之后 v-if 增删 #title 就感知不到。
 * 父级增删插槽会强制本组件更新，onBeforeUpdate 里把存在性同步到响应式的 meta，头部随之重渲染
 */
onBeforeUpdate(() => {
  meta.titleSlot = slots.title ? renderTitle : undefined;
});

watchEffect(() => {
  if (props.paneKey !== undefined) meta.key = props.paneKey
  meta.order = props.order
  meta.title = props.title;
  meta.disabled = props.disabled;
  meta.closable = props.closable;
  meta.destroyOnHidden = props.destroyOnHidden;
});

const isActive = computed(() => ctx.activeKey.value === meta.key);
const destroyOnHidden = computed(() => props.destroyOnHidden || ctx.destroyOnHidden.value);
const paneClass = computed(() => ctx.paneClass.value);

/** 记录是否被展示过，lazy-load 据此决定首次挂载时机 */
const shown = shallowRef(false);
watchEffect(() => {
  if (isActive.value) shown.value = true;
});

const shouldRender = computed(() => {
  if (destroyOnHidden.value) return isActive.value;
  if (ctx.lazyLoad.value) return shown.value;
  return true;
});

/** 离场面板脱离文档流，与入场面板重叠；父级单独平滑调整内容高度。 */
const leaving = shallowRef(false);
let transitionRun = 0;
let finishTransition: (() => void) | undefined;
let motionMedia: MediaQueryList | undefined;
let playback: ReturnType<typeof animate> | undefined;
let visual: { opacity: number; y: number; scale: number } | undefined;

/** 中断时保留当前画面，反向切换沿用中间值，不闪回完整透明度。 */
function cancelMotion() {
  transitionRun++;
  finishTransition = undefined;
  playback?.stop();
  playback = undefined;
}

function clearMotion(element: Element) {
  cancelMotion();
  const node = element as HTMLElement;
  node.style.opacity = "";
  node.style.transform = "";
  visual = undefined;
  leaving.value = false;
}

function transitionPane(element: Element, done: () => void, enter: boolean) {
  cancelMotion();
  const run = transitionRun;
  const finish = () => {
    if (run !== transitionRun) return;
    done();
    clearMotion(element);
  };
  finishTransition = finish;
  leaving.value = !enter;
  if (!ctx?.animation.value || prefersReducedMotion()) {
    finish();
    return;
  }
  const from = visual ?? (enter ? { opacity: 0, y: 4, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 });
  const to = enter ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -4, scale: 1.01 };
  const node = element as HTMLElement;
  const paint = (progress: number) => {
    if (run !== transitionRun) return;
    visual = {
      opacity: from.opacity + (to.opacity - from.opacity) * progress,
      y: from.y + (to.y - from.y) * progress,
      scale: from.scale + (to.scale - from.scale) * progress,
    };
    node.style.opacity = `${visual.opacity}`;
    node.style.transform = `translateY(${visual.y}px) scale(${visual.scale})`;
  };
  paint(0);
  playback = animate(0, 1, {
    ...(enter ? motionPresets.base : motionPresets.fast), onUpdate: paint, onComplete: finish,
  });
}

function enterPane(element: Element, done: () => void) {
  transitionPane(element, done, true);
}

function leavePane(element: Element, done: () => void) {
  transitionPane(element, done, false);
}

function syncMotionPreference() {
  if (motionMedia?.matches) finishTransition?.();
}

watch(() => ctx.animation.value, enabled => { if (!enabled) finishTransition?.(); });

onMounted(() => {
  motionMedia = window.matchMedia?.("(prefers-reduced-motion: reduce)");
  motionMedia?.addEventListener("change", syncMotionPreference);
  meta.el = el.value ?? undefined;
  // setup 顺序在标签被插入到中间时会失真，挂载后由父级按 DOM 先后重排
  ctx.sortPanes();
});

onBeforeUnmount(() => {
  if (el.value) clearMotion(el.value);
  motionMedia?.removeEventListener("change", syncMotionPreference);
  ctx.removePane(meta);
});
</script>

<template>
  <Transition :css="false" @enter="enterPane" @leave="leavePane" @enter-cancelled="cancelMotion" @leave-cancelled="cancelMotion">
    <div v-show="isActive" ref="el" role="tabpanel" :class="[paneClass, leaving && 'absolute inset-0']">
      <slot v-if="shouldRender" />
    </div>
  </Transition>
</template>
