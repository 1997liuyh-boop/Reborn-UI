<script lang="ts">
import type { TransitionName } from './reborn-transition.config';
import { computed, normalizeStyle, onBeforeUnmount, ref, watch } from 'vue';
import { runMotion } from '@/lib/motion';
import { transitionStyles } from './reborn-transition.config';

export const selectAnimations = {
  enterActiveClass: "transition-[height,opacity] duration-300 ease-out overflow-hidden",
  enterFromClass: "opacity-0",
  enterToClass: "opacity-100",
  leaveActiveClass: "transition-[height,opacity] duration-200 ease-in overflow-hidden",
  leaveFromClass: "opacity-100",
  leaveToClass: "opacity-0",
};
</script>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  show?: boolean;
  duration?: number | { enter?: number; leave?: number } | boolean;
  lazyRender?: boolean;
  name?: TransitionName | TransitionName[];
  destroy?: boolean;
  appear?: boolean;
  customClass?: string;
  customStyle?: any;
  disableTouchMove?: boolean;
  collapse?: boolean;
  enterFromClass?: string;
  enterActiveClass?: string;
  enterToClass?: string;
  leaveFromClass?: string;
  leaveActiveClass?: string;
  leaveToClass?: string;
}>(), {
  show: false,
  duration: 300,
  lazyRender: false,
  destroy: true,
  appear: false,
  customClass: '',
  customStyle: '',
  disableTouchMove: false,
  collapse: undefined,
});

const emit = defineEmits<{
  (e: 'click'): void;
  (e: 'beforeEnter', el: Element): void;
  (e: 'enter', el: Element, done: () => void): void;
  (e: 'afterEnter', el: Element): void;
  (e: 'beforeLeave', el: Element): void;
  (e: 'leave', el: Element, done: () => void): void;
  (e: 'afterLeave', el: Element): void;
}>();

const isCollapse = computed(() => {
  if (props.collapse !== undefined) return props.collapse;
  const name = props.name ?? 'fade';
  const names = Array.isArray(name) ? name : [name];
  return names.includes('select-collapse' as TransitionName);
});

const durationOf = (type: 'enter' | 'leave') => (typeof props.duration === 'object'
  ? (props.duration[type] ?? 300)
  : (props.duration === false ? 0 : Number(props.duration)));

const transitionClasses = computed(() => {
  if (props.enterActiveClass || props.enterFromClass || props.leaveActiveClass || props.leaveFromClass) {
    return {
      enterFrom: props.enterFromClass || '',
      enterActive: props.enterActiveClass || '',
      enterTo: props.enterToClass || '',
      leaveFrom: props.leaveFromClass || '',
      leaveActive: props.leaveActiveClass || '',
      leaveTo: props.leaveToClass || '',
    };
  }

  const name = props.name ?? 'fade';
  const names = Array.isArray(name) ? name : [name];
  const picked = names.map(n => transitionStyles[n]).filter((it): it is Record<string, string> => !!it);
  const join = (key: string) => picked.map(it => it[key]).join(' ');
  return {
    enterFrom: join('enter'),
    enterActive: join('enter-active'),
    enterTo: join('enter-to'),
    leaveFrom: join('leave'),
    leaveActive: join('leave-active'),
    leaveTo: join('leave-to'),
  };
});

/** 起止类继续作为样式入口；仅把实际插值交给 Motion，避免同时运行两套过渡。 */
const animatedProperties = ['opacity', 'transform', 'translate', 'scale', 'rotate', 'height', 'overflow', 'transitionProperty', 'animationName'] as const;
interface MotionFrame { opacity: number; transform: string; height?: string }
interface TransitionRun {
  saved: Record<(typeof animatedProperties)[number], string>;
  from: MotionFrame;
  to: MotionFrame;
  stop?: () => void;
  cancelled: boolean;
  added: string[];
  ease: [number, number, number, number];
  entering: boolean;
}
const runs = new Map<HTMLElement, TransitionRun>();
let pendingFrame: MotionFrame | undefined;
let pendingHeight: string | undefined;
const baseClasses = new Set(['rb-transition', 'transform-gpu', 'will-change-[opacity,transform,translate,scale]']);
function readCustomStyle(value: any): Record<string, string | number | undefined> {
  const style = normalizeStyle([value]);
  return style && typeof style === 'object' ? { ...style } : {};
}
let previousStyle = readCustomStyle(props.customStyle);

watch(() => props.customClass, (value, previous) => {
  const next = value.split(/\s+/).filter(Boolean);
  // v-if 退场保留的是旧虚拟节点，显隐联动的命中区类仍需同步到真实节点。
  for (const [element, run] of runs) {
    for (const name of previous.split(/\s+/).filter(Boolean)) {
      if (!baseClasses.has(name) && !run.added.includes(name)) element.classList.remove(name);
    }
    element.classList.add(...next);
  }
}, { flush: 'post' });

watch(() => props.customStyle, (value) => {
  const style = readCustomStyle(value);
  for (const run of runs.values()) {
    for (const property of animatedProperties) {
      const key = property.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`);
      const next = style[property] ?? style[key];
      const previous = previousStyle[property] ?? previousStyle[key];
      if (next !== previous) {
        // 运行中的运动值由 Motion 管理，结束后恢复最新传入的行内样式。
        run.saved[property] = next == null ? '' : typeof next === 'number' && property === 'height' ? `${next}px` : String(next);
      }
    }
  }
  previousStyle = style;
}, { deep: true, flush: 'post' });

/** Tailwind 4 的独立 translate/scale 合成为完整 transform，保留外部自定义变换。 */
function readFrame(el: HTMLElement): MotionFrame {
  const css = el.ownerDocument.defaultView!.getComputedStyle(el);
  const transforms = [
    css.translate && css.translate !== 'none' ? `translate(${css.translate.trim().split(/\s+/).join(',')})` : '',
    css.rotate && css.rotate !== 'none' ? `rotate(${css.rotate})` : '',
    css.scale && css.scale !== 'none' ? `scale(${css.scale.trim().split(/\s+/).join(',')})` : '',
    css.transform && css.transform !== 'none' ? css.transform : '',
  ].filter(Boolean);
  return { opacity: Number.parseFloat(css.opacity) || (css.opacity === '0' ? 0 : 1), transform: transforms.join(' ') || 'none' };
}

function restore(el: HTMLElement, run: TransitionRun) {
  for (const property of animatedProperties) el.style[property] = run.saved[property];
  const custom = new Set(props.customClass.split(/\s+/));
  el.classList.remove(...run.added.filter(name => !custom.has(name)));
}

function prepare(el: Element, entering: boolean) {
  if (!(el instanceof HTMLElement)) return;
  const previous = runs.get(el);
  const current = previous ? readFrame(el) : entering ? pendingFrame : undefined;
  const currentHeight = previous ? `${el.getBoundingClientRect().height}px` : entering ? pendingHeight : undefined;
  if (entering) { pendingFrame = undefined; pendingHeight = undefined; }
  previous?.stop?.();
  if (previous) restore(el, previous);
  const saved = Object.fromEntries(animatedProperties.map(property => [property, el.style[property]])) as TransitionRun['saved'];
  el.style.transitionProperty = 'none';
  el.style.animationName = 'none';
  const classes = transitionClasses.value;
  const activeClasses = (entering ? classes.enterActive : classes.leaveActive).split(/\s+/).filter(Boolean);
  const fromClasses = (entering ? classes.enterFrom : classes.leaveFrom).split(/\s+/).filter(Boolean);
  const toClasses = (entering ? classes.enterTo : classes.leaveTo).split(/\s+/).filter(Boolean);
  const original = new Set(el.classList);
  el.classList.add(...activeClasses);
  el.classList.add(...fromClasses);
  const from = current ?? readFrame(el);
  for (const name of fromClasses) if (!original.has(name)) el.classList.remove(name);
  el.classList.add(...toClasses);
  const to = readFrame(el);
  for (const name of toClasses) if (!original.has(name)) el.classList.remove(name);
  if (isCollapse.value) {
    from.height = currentHeight ?? (entering ? '0px' : `${el.getBoundingClientRect().height}px`);
    to.height = entering ? `${el.scrollHeight}px` : '0px';
    el.style.overflow = 'hidden';
  }
  el.style.opacity = String(from.opacity);
  el.style.translate = 'none';
  el.style.scale = 'none';
  el.style.rotate = 'none';
  el.style.transform = from.transform;
  if (from.height) el.style.height = from.height;
  const timing = el.ownerDocument.defaultView!.getComputedStyle(el).transitionTimingFunction;
  const curve = timing.match(/cubic-bezier\(([-\d.,\s]+)\)/)?.[1].split(',').map(Number);
  const ease: TransitionRun['ease'] = curve?.length === 4
    ? [curve[0]!, curve[1]!, curve[2]!, curve[3]!]
    : entering ? [0.22, 1, 0.36, 1] : [0.4, 0, 0.2, 1];
  runs.set(el, { saved, from, to, cancelled: false, added: activeClasses.filter(name => !original.has(name)), ease, entering });
}

function play(el: Element, done: () => void, entering: boolean) {
  if (!(el instanceof HTMLElement)) { done(); return; }
  const run = runs.get(el);
  if (!run) { done(); return; }
  // 新节点在 before-enter 时尚未插入，入场钩子中才能取得真实内容高度。
  if (entering && isCollapse.value) run.to.height = `${el.scrollHeight}px`;
  const animation = runMotion(el, {
    opacity: [run.from.opacity, run.to.opacity],
    transform: [run.from.transform, run.to.transform],
    ...(isCollapse.value ? { height: [run.from.height!, run.to.height!] } : {}),
  }, { duration: Math.max(0, durationOf(entering ? 'enter' : 'leave')) / 1000, ease: run.ease });
  run.stop = animation.stop;
  void animation.finished.then(() => {
    if (runs.get(el) !== run || run.cancelled) return;
    restore(el, run);
    runs.delete(el);
    done();
  });
}

function cancel(el: Element) {
  if (!(el instanceof HTMLElement)) return;
  const run = runs.get(el);
  // Vue 可能先把 v-show 节点隐藏；下一次 prepare 读取当前画面后再停止。
  if (run) run.cancelled = true;
}
function onBeforeEnterInternal(el: Element) { emit('beforeEnter', el); }
function onEnterInternal(el: Element, done: () => void) {
  // 新节点插入后先让浮层完成定位，再读取 Tailwind 起止类，避免把空样式采成 1 → 1。
  emit('enter', el, done);
  prepare(el, true);
  play(el, done, true);
}
function onAfterEnterInternal(el: Element) { emit('afterEnter', el); }
function onBeforeLeaveInternal(el: Element) { emit('beforeLeave', el); prepare(el, false); }
function onLeaveInternal(el: Element, done: () => void) { emit('leave', el, done); play(el, done, false); }
function onAfterLeaveInternal(el: Element) {
  // destroy 模式反向重开时，Vue 会提前移除旧节点，此时不算一次完整退场。
  const run = el instanceof HTMLElement ? runs.get(el) : undefined;
  if (run && el instanceof HTMLElement) {
    run.cancelled = true;
    run.stop?.();
    restore(el, run);
    runs.delete(el);
  }
  if (!props.show) emit('afterLeave', el);
}
onBeforeUnmount(() => {
  for (const [element, run] of runs) { run.cancelled = true; run.stop?.(); restore(element, run); }
  runs.clear();
});

const renderReady = ref(!props.lazyRender);
const elRef = ref<HTMLElement | null>(null);

watch(() => props.show, (val) => {
  if (val) {
    pendingFrame = undefined;
    pendingHeight = undefined;
    // destroy 模式重开会换成新节点，在 Vue 移除退出节点前保存当前画面。
    for (const [element, run] of runs) {
      if (!run.entering) {
        pendingFrame = readFrame(element);
        pendingHeight = `${element.getBoundingClientRect().height}px`;
        break;
      }
    }
  }
  if (val && props.lazyRender) renderReady.value = true;
}, { immediate: true });

defineExpose({
  el: elRef,
});
</script>

<template>
  <Transition
    :appear="appear" :css="false" @before-enter="onBeforeEnterInternal"
    @enter="onEnterInternal" @after-enter="onAfterEnterInternal" @before-leave="onBeforeLeaveInternal"
    @leave="onLeaveInternal" @after-leave="onAfterLeaveInternal" @enter-cancelled="cancel" @leave-cancelled="cancel"
  >
    <div
      v-if="renderReady && (destroy ? show : true)" v-show="destroy ? true : show" ref="elRef"
      class="rb-transition transform-gpu will-change-[opacity,transform,translate,scale]" :class="[customClass]"
      :style="customStyle"
      @click="emit('click')"
    >
      <slot />
    </div>
  </Transition>
</template>
