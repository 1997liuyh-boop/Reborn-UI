<script setup lang="ts">
/* eslint vue/custom-event-name-casing: off -- 事件名与约定的 Drawer API 保持一致 */
import type { CSSProperties } from 'vue';
import type { DrawerDirection, DrawerUI } from './reborn-drawer.config';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, useId, watch } from 'vue';
import { useGlobalScrollLock } from '~/composables/useGlobalScrollLock';
import { tv } from '~/lib/tv';
import { cn } from '~/lib/utils';
import { isTopDrawer, normalizeDrawerSize, registerDrawer, unregisterDrawer } from './drawer.utils';
import theme, { drawerOffsets } from './reborn-drawer.config';

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<RebornDrawerProps>(), {
  appendToBody: true, lockScroll: true, closeOnClickModal: true, closeOnPressEscape: true,
  openDelay: 0, closeDelay: 0, destroyOnClose: false, modal: true, modalPenetrable: false,
  direction: 'right', resizable: false, size: '30%', title: '', withHeader: false,
  zIndex: 2000, duration: 300, ariaLabel: '抽屉', ui: () => ({}),
});
const emit = defineEmits<{
  /** 开始打开。 */
  open: [];
  /** 打开动画结束。 */
  opened: [];
  /** 开始关闭。 */
  close: [];
  /** 关闭动画结束。 */
  closed: [];
  /** 内容获得自动焦点。 */
  'open-auto-focus': [];
  /** 焦点归还原触发元素。 */
  'close-auto-focus': [];
  /** 开始调整尺寸，参数为当前像素尺寸。 */
  'resize-start': [size: number];
  /** 尺寸变化，参数为当前像素尺寸。 */
  resize: [size: number];
  /** 结束调整尺寸，参数为最终像素尺寸。 */
  'resize-end': [size: number];
}>();
defineSlots<{
  default: (props: { close: () => void }) => unknown;
  header: (props: { close: () => void }) => unknown;
  title: (props: { close: () => void }) => unknown;
  close: (props: { close: () => void }) => unknown;
  extra: (props: { close: () => void }) => unknown;
  footer: (props: { close: () => void }) => unknown;
}>();
export interface RebornDrawerProps {
  /** 指定挂载节点，优先于 appendToBody；不传时由 appendToBody 决定。 */
  appendTo?: string | HTMLElement;
  /** 默认挂载 body；关闭后在当前位置的定位父容器内渲染。 */
  appendToBody?: boolean;
  /** 打开及退场期间锁定页面滚动。 */
  lockScroll?: boolean;
  /** 点击遮罩是否关闭。 */
  closeOnClickModal?: boolean;
  /** 按 ESC 是否关闭，仅最上层抽屉响应。 */
  closeOnPressEscape?: boolean;
  /** 打开延迟，单位毫秒。 */
  openDelay?: number;
  /** 关闭延迟，单位毫秒。 */
  closeDelay?: number;
  /** 关闭动画结束后销毁子元素。 */
  destroyOnClose?: boolean;
  /** 是否显示遮罩颜色。 */
  modal?: boolean;
  /** 仅 modal=false 时允许点击穿透抽屉之外的区域。 */
  modalPenetrable?: boolean;
  /** 抽屉从哪一侧滑入。 */
  direction?: DrawerDirection;
  /** 是否允许指针拖动或方向键调整尺寸。 */
  resizable?: boolean;
  /** 左右为宽度、上下为高度；百分比或像素数值。 */
  size?: number | string;
  /** 标题内容。 */
  title?: string;
  /** 是否显示头部，关闭时所有头部插槽均不生效。 */
  withHeader?: boolean;
  /** 用户关闭前拦截；done(false) 放行，done() / done(true) 取消。 */
  beforeClose?: (done: (cancel?: boolean) => void) => void;
  /** 基础层级，嵌套时自动递增。 */
  zIndex?: number;
  /** 动画时长，单位毫秒；减少动态效果偏好下自动为零。 */
  duration?: number;
  /** 无可见标题时使用的无障碍名称。 */
  ariaLabel?: string;
  /** 内部各区域的样式覆盖。 */
  ui?: DrawerUI;
}
/** 是否显示抽屉。 */
const modelValue = defineModel<boolean>({ default: false });
const panel = ref<HTMLElement>();
const wrapper = ref<HTMLElement>();
const mounted = ref(false);
const rendered = ref(false);
const visible = ref(false);
const active = ref(false);
const resizedSize = ref<number>();
const layer = ref(props.zIndex);
const titleId = useId();
const id = Symbol('drawer');
const target = ref<HTMLElement>();
const viewport = computed(() => !mounted.value || target.value === document.body);
const horizontal = computed(() => props.direction === 'left' || props.direction === 'right');
const penetrable = computed(() => !props.modal && props.modalPenetrable);
const b = tv(theme);
const ui = computed(() => b({ direction: props.direction, viewport: viewport.value, modal: props.modal }));
const offset = computed(() => drawerOffsets[props.direction]);
const reducedMotion = ref(false);
const duration = computed(() => reducedMotion.value ? 0 : Math.max(0, props.duration));
const panelStyle = computed<CSSProperties>(() => ({
  [horizontal.value ? 'width' : 'height']: normalizeDrawerSize(resizedSize.value ?? props.size),
  transitionDuration: `${duration.value}ms`,
}));
const lock = useGlobalScrollLock();
let timer: ReturnType<typeof setTimeout> | undefined;
let previousFocus: HTMLElement | null = null;
let closeRequest = 0;
let awaitingClose = false;
let disposed = false;
let media: MediaQueryList | undefined;

/** 目标节点须在打开时存在；非法选择器或缺失节点安全回退到 body。 */
function resolveTarget() {
  if (!mounted.value) return;
  const requested = props.appendTo ?? (props.appendToBody ? document.body : undefined);
  try {
    target.value = typeof requested === 'string' ? document.querySelector<HTMLElement>(requested) ?? document.body : requested;
  } catch { target.value = document.body; }
}
function focusableElements() {
  return [...(panel.value?.querySelectorAll<HTMLElement>('a[href],button,input,textarea,select,[tabindex]') ?? [])]
    .filter(el => el.tabIndex >= 0 && !el.matches(':disabled,[hidden],input[type="hidden"]') && !el.closest('[inert],[hidden]') && getComputedStyle(el).display !== 'none' && getComputedStyle(el).visibility !== 'hidden');
}
function focusContent() {
  const autofocus = panel.value?.querySelector<HTMLElement>('[autofocus]');
  (autofocus ?? focusableElements()[0] ?? panel.value)?.focus({ preventScroll: true });
}
function restoreFocus() {
  if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
  previousFocus = null;
  emit('close-auto-focus');
}
async function openDrawer() {
  if (disposed || !modelValue.value || visible.value) return;
  resolveTarget();
  if (!active.value) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    layer.value = registerDrawer(id, props.zIndex);
  }
  active.value = true;
  rendered.value = true;
  visible.value = true;
  if (props.lockScroll) lock.acquire();
  emit('open');
  await nextTick();
  if (!disposed && visible.value && isTopDrawer(id)) { focusContent(); emit('open-auto-focus'); }
}
function closeDrawer() {
  if (disposed || modelValue.value || !visible.value) return;
  finishResize();
  visible.value = false;
  emit('close');
}
/** 根因：延迟开关和异步拦截容易交错；每次模型变化作废旧定时器与关闭请求。 */
function syncVisibility() {
  clearTimeout(timer);
  closeRequest++;
  awaitingClose = false;
  if (!mounted.value) return;
  const action = modelValue.value ? openDrawer : closeDrawer;
  const delay = Math.max(0, modelValue.value ? props.openDelay : props.closeDelay);
  if (delay) timer = setTimeout(action, delay);
  else action();
}
function requestClose() {
  if (!visible.value || !modelValue.value || awaitingClose) return;
  if (!props.beforeClose) { modelValue.value = false; return; }
  awaitingClose = true;
  const request = ++closeRequest;
  let completed = false;
  const done = (cancel = true) => {
    if (completed || disposed || request !== closeRequest) return;
    completed = true;
    awaitingClose = false;
    if (!cancel) modelValue.value = false;
  };
  try { props.beforeClose(done); }
  catch (error) { awaitingClose = false; throw error; }
}
function onOpened() { if (visible.value) emit('opened'); }
function onClosed() {
  if (visible.value || !active.value) return;
  const top = isTopDrawer(id);
  unregisterDrawer(id);
  active.value = false;
  lock.release();
  if (props.destroyOnClose) rendered.value = false;
  if (top) restoreFocus();
  else { previousFocus = null; emit('close-auto-focus'); }
  emit('closed');
}
function onBackdropClick() { if (isTopDrawer(id) && props.closeOnClickModal) requestClose(); }
function onKeydown(event: KeyboardEvent) {
  if (!active.value || !isTopDrawer(id)) return;
  if (event.key === 'Escape' && visible.value && props.closeOnPressEscape) {
    event.preventDefault(); event.stopImmediatePropagation(); requestClose();
  }
  if (event.key !== 'Tab' || penetrable.value) return;
  const elements = focusableElements();
  const first = elements[0]; const last = elements.at(-1);
  if (!first) { event.preventDefault(); panel.value?.focus(); return; }
  if (!panel.value?.contains(document.activeElement) || (event.shiftKey ? document.activeElement === first : document.activeElement === last)) {
    event.preventDefault(); (event.shiftKey ? last : first)?.focus();
  }
}
function onFocusin(event: FocusEvent) {
  if (active.value && visible.value && !penetrable.value && isTopDrawer(id) && !wrapper.value?.contains(event.target as Node)) focusContent();
}

let drag: { pointerId: number; origin: number; size: number; extent: number } | undefined;
let resizeFrame: number | undefined;
let pendingSize: number | undefined;
function currentSize() { return panel.value?.getBoundingClientRect()[horizontal.value ? 'width' : 'height'] ?? 0; }
function extent() { return wrapper.value?.getBoundingClientRect()[horizontal.value ? 'width' : 'height'] || (horizontal.value ? window.innerWidth : window.innerHeight); }
function updateSize(value: number, limit: number) {
  const size = Math.round(Math.max(Math.min(80, limit), Math.min(value, limit)));
  if (size === (resizedSize.value ?? drag?.size)) return;
  resizedSize.value = size;
  emit('resize', size);
}
function flushResize() {
  if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame);
  resizeFrame = undefined;
  const size = pendingSize;
  pendingSize = undefined;
  if (drag && size !== undefined) updateSize(size, drag.extent);
}
function onPointerMove(event: PointerEvent) {
  if (!drag || event.pointerId !== drag.pointerId) return;
  const delta = (horizontal.value ? event.clientX : event.clientY) - drag.origin;
  pendingSize = drag.size + delta * (props.direction === 'left' || props.direction === 'top' ? 1 : -1);
  // 同一帧只提交最后一次位置，避免高频指针事件反复触发组件和父级更新。
  resizeFrame ??= requestAnimationFrame(flushResize);
}
function finishResize(event?: PointerEvent) {
  if (!drag || (event && event.pointerId !== drag.pointerId)) return;
  // 结束前提交末次尺寸并取消排队帧，保证 resize-end 之后不再更新。
  flushResize();
  drag = undefined;
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', finishResize);
  document.removeEventListener('pointercancel', finishResize);
  emit('resize-end', resizedSize.value ?? currentSize());
}
function startResize(event: PointerEvent) {
  if (!visible.value || !props.resizable || event.button !== 0 || !isTopDrawer(id)) return;
  event.preventDefault();
  finishResize();
  drag = { pointerId: event.pointerId, origin: horizontal.value ? event.clientX : event.clientY, size: currentSize(), extent: extent() };
  emit('resize-start', drag.size);
  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', finishResize);
  document.addEventListener('pointercancel', finishResize);
}
function resizeByKey(event: KeyboardEvent) {
  const keys = horizontal.value ? ['ArrowLeft', 'ArrowRight'] : ['ArrowUp', 'ArrowDown'];
  if (!keys.includes(event.key) || !visible.value || !isTopDrawer(id)) return;
  event.preventDefault();
  const size = currentSize();
  const sign = props.direction === 'right' || props.direction === 'bottom' ? -1 : 1;
  emit('resize-start', size);
  updateSize(size + (event.key === keys[0] ? -10 : 10) * sign, extent());
  emit('resize-end', resizedSize.value ?? size);
}
function updateMotion() { reducedMotion.value = media?.matches ?? false; }
watch(modelValue, syncVisibility);
watch(() => [props.appendTo, props.appendToBody], resolveTarget);
watch(() => props.lockScroll, value => { if (active.value && value) lock.acquire(); else lock.release(); });
watch(() => [props.size, props.direction], () => { finishResize(); resizedSize.value = undefined; });
watch(() => props.resizable, value => { if (!value) finishResize(); });
onMounted(() => {
  mounted.value = true;
  media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  updateMotion(); media?.addEventListener('change', updateMotion);
  document.addEventListener('keydown', onKeydown);
  document.addEventListener('focusin', onFocusin);
  syncVisibility();
});
onBeforeUnmount(() => {
  disposed = true; closeRequest++; clearTimeout(timer); finishResize();
  document.removeEventListener('keydown', onKeydown);
  document.removeEventListener('focusin', onFocusin);
  media?.removeEventListener('change', updateMotion);
  const top = isTopDrawer(id);
  unregisterDrawer(id); lock.release();
  if (active.value && top) restoreFocus();
});
/** 手动关闭同样经过 beforeClose；直接修改 v-model 则由父组件决定是否关闭。 */
defineExpose({ close: requestClose, panel });
</script>

<template>
  <Teleport v-if="mounted && rendered" :to="target || 'body'" :disabled="!target">
    <div v-show="active" ref="wrapper" :class="ui.wrapper({ class: cn(props.ui.wrapper) })" :style="{ zIndex: layer }" :data-drawer-direction="direction">
      <Transition enter-active-class="transition-opacity ease-out" leave-active-class="transition-opacity ease-in" enter-from-class="opacity-0" leave-to-class="opacity-0" :duration="duration" appear>
        <div v-show="visible && !penetrable" data-drawer-backdrop :class="ui.backdrop({ class: cn(props.ui.backdrop, penetrable && 'pointer-events-none') })" :style="{ transitionDuration: `${duration}ms` }" aria-hidden="true" @click.self="onBackdropClick" />
      </Transition>
      <Transition enter-active-class="ease-out" leave-active-class="ease-in" :enter-from-class="offset" :leave-to-class="offset" :duration="duration" appear @after-enter="onOpened" @after-leave="onClosed">
        <section v-show="visible" v-bind="$attrs" ref="panel" role="dialog" tabindex="-1" :aria-modal="penetrable ? undefined : true" :aria-label="title || ariaLabel" :aria-labelledby="withHeader && !$slots.header && (title || $slots.title) ? titleId : undefined" :class="ui.root({ class: cn(props.ui.root) })" :style="panelStyle">
          <div v-if="resizable" role="separator" tabindex="0" aria-label="调整抽屉大小" :aria-orientation="horizontal ? 'vertical' : 'horizontal'" :aria-valuenow="resizedSize" :class="ui.resizer({ class: cn(props.ui.resizer) })" @pointerdown="startResize" @keydown="resizeByKey" />
          <header v-if="withHeader" :class="ui.header({ class: cn(props.ui.header) })">
            <slot name="header" :close="requestClose">
              <div :class="ui.heading({ class: cn(props.ui.heading) })">
                <slot name="close" :close="requestClose">
                  <button type="button" aria-label="关闭抽屉" :class="ui.close({ class: cn(props.ui.close) })" @click="requestClose"><Icon name="lucide:x" class="size-5" /></button>
                </slot>
                <h2 :id="titleId" :class="ui.title({ class: cn(props.ui.title) })"><slot name="title" :close="requestClose">{{ title }}</slot></h2>
              </div>
              <div v-if="$slots.extra" :class="ui.extra({ class: cn(props.ui.extra) })"><slot name="extra" :close="requestClose" /></div>
            </slot>
          </header>
          <div :class="ui.body({ class: cn(props.ui.body) })"><slot :close="requestClose" /></div>
          <footer v-if="$slots.footer" :class="ui.footer({ class: cn(props.ui.footer) })"><slot name="footer" :close="requestClose" /></footer>
        </section>
      </Transition>
    </div>
  </Teleport>
</template>
