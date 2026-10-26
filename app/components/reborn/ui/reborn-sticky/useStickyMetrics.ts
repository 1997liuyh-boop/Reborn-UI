import type { Ref } from 'vue';
import { nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';

export interface StickyMetrics {
  wrapper: { top: number; bottom: number; width: number; left: number; docTop: number; docBottom: number };
  contentHeight: number;
  targetBottom: number | null;
  targetElement: HTMLElement | null;
  viewportHeight: number;
  scrollTop: number;
}

type WrapperBox = StickyMetrics['wrapper'];
const WRAPPER_KEYS = ['top', 'bottom', 'width', 'left', 'docTop', 'docBottom'] as const satisfies readonly (keyof WrapperBox)[];

/** 两份快照逐字段相同：页面上与本组件无关的容器滚动也会排一次测量，数值没变时不应替换快照 */
function sameMetrics(a: StickyMetrics, b: StickyMetrics) {
  return a.contentHeight === b.contentHeight
    && a.targetBottom === b.targetBottom
    && a.targetElement === b.targetElement
    && a.viewportHeight === b.viewportHeight
    && a.scrollTop === b.scrollTop
    && WRAPPER_KEYS.every(key => a.wrapper[key] === b.wrapper[key]);
}

/**
 * 占位容器的祖先（不含 body）。侧栏折叠、主区伸缩时占位容器可能只平移、自身尺寸不变，
 * 观察自身捕捉不到，而这类布局变化通常会让某一层祖先改变尺寸；body 的宽度变化由窗口 resize 覆盖
 */
function ancestorsOf(element: HTMLElement | null) {
  const list: HTMLElement[] = [];
  for (let node = element?.parentElement ?? null; node && node !== document.body; node = node.parentElement) list.push(node);
  return list;
}

/**
 * 所有 DOM 读取集中在同一帧，状态和样式计算只消费这份快照。
 * 快照是 shallowRef、按引用判断变化：只在数值确实变化时整体替换，下游 watch 与样式计算才不会每帧空转
 */
export function useStickyMetrics(wrapper: Readonly<Ref<HTMLElement | null>>, content: Readonly<Ref<HTMLElement | null>>, target: () => string | HTMLElement | undefined) {
  const metrics = shallowRef<StickyMetrics>({
    wrapper: { top: 0, bottom: 0, width: 0, left: 0, docTop: 0, docBottom: 0 },
    contentHeight: 0, targetBottom: null, targetElement: null, viewportHeight: 0, scrollTop: 0,
  });
  let targetElement: HTMLElement | null = null;
  let observer: ResizeObserver | undefined;
  let frame = 0;
  let mounted = false;

  function measure() {
    if (!mounted || !wrapper.value || !content.value) return;
    const box = wrapper.value.getBoundingClientRect();
    const scrollTop = window.scrollY;
    const next: StickyMetrics = {
      wrapper: { top: box.top, bottom: box.bottom, width: box.width, left: box.left, docTop: box.top + scrollTop, docBottom: box.bottom + scrollTop },
      contentHeight: content.value.getBoundingClientRect().height,
      targetBottom: targetElement?.getBoundingClientRect().bottom ?? null,
      targetElement,
      viewportHeight: window.innerHeight,
      scrollTop,
    };
    if (!sameMetrics(metrics.value, next)) metrics.value = next;
  }
  function schedule() {
    if (!mounted || frame) return;
    frame = requestAnimationFrame(() => { frame = 0; measure(); });
  }
  function bindTarget() {
    const value = target();
    targetElement = typeof value === 'string' ? document.querySelector<HTMLElement>(value) : value ?? null;
    observer?.disconnect();
    for (const element of [wrapper.value, content.value, targetElement, ...ancestorsOf(wrapper.value)]) {
      if (element) observer?.observe(element);
    }
    measure();
  }
  async function forceUpdate() {
    await nextTick();
    if (mounted) bindTarget();
  }
  watch(target, forceUpdate, { flush: 'post' });
  onMounted(() => {
    mounted = true;
    if (typeof ResizeObserver !== 'undefined') observer = new ResizeObserver(schedule);
    bindTarget();
    window.addEventListener('scroll', schedule, { capture: true, passive: true });
    window.addEventListener('resize', schedule, { passive: true });
  });
  onBeforeUnmount(() => {
    mounted = false;
    observer?.disconnect();
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('scroll', schedule, true);
    window.removeEventListener('resize', schedule);
  });
  return { metrics, forceUpdate };
}
