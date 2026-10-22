<script setup lang="ts">
import type { TabKey, TabPaneMeta, TabsContext } from "./reborn-tabs.config";
import { animate } from "motion-v";
import {
  computed,
  getCurrentInstance,
  inject,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowReactive,
  shallowRef,
  useSlots,
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
const ctx = inject<TabsContext | null>(TABS_INJECTION_KEY, null);
if (!ctx) throw new Error("[RebornTabPane] 必须作为 RebornTabs 的子组件使用");

const instance = getCurrentInstance();
const el = shallowRef<HTMLElement>();

/** 登记到父级的元信息，父级据此渲染头部；未写 key 时留空由父级补序号 */
const meta = shallowReactive<TabPaneMeta>({
  key: (instance?.vnode.key ?? undefined) as TabKey,
  title: props.title,
  disabled: props.disabled,
  closable: props.closable,
  destroyOnHidden: props.destroyOnHidden,
  // 包一层始终调用当前插槽，避免父级重渲染后头部仍渲染旧的插槽函数
  titleSlot: slots.title ? () => slots.title?.() : undefined,
});

watchEffect(() => {
  meta.title = props.title;
  meta.disabled = props.disabled;
  meta.closable = props.closable;
  meta.destroyOnHidden = props.destroyOnHidden;
});

ctx.addPane(meta);

const isActive = computed(() => ctx.activeKey.value === meta.key);
const destroyOnHidden = computed(() => props.destroyOnHidden || ctx.destroyOnHidden.value);
const paneClass = computed(() => ctx.paneClass.value);

/** 记录是否被展示过，lazy-load 据此决定首次挂载时机 */
const shown = ref(false);
watchEffect(() => {
  if (isActive.value) shown.value = true;
});

const shouldRender = computed(() => {
  if (destroyOnHidden.value) return isActive.value;
  if (ctx.lazyLoad.value) return shown.value;
  return true;
});

/** 离场面板脱离文档流，与入场面板重叠；父级单独平滑调整内容高度。 */
const leaving = ref(false);
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
  meta.el = el.value;
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
