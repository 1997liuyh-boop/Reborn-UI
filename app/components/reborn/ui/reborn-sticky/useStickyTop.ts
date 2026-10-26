import type { Ref } from 'vue';
import type { StickyMetrics } from './useStickyMetrics';
import { computed, shallowRef, watch } from 'vue';

/** 吸顶只以包装器位置切换，后代布局动画期间保留当前状态。 */
export function useStickyTop(metrics: Readonly<Ref<StickyMetrics>>, enabled: () => boolean, threshold: () => number, paused: () => boolean) {
  const active = shallowRef(false);
  watch([metrics, enabled, threshold, paused], () => {
    if (!enabled()) { active.value = false; return; }
    if (paused()) return;
    const top = metrics.value.wrapper.top;
    active.value = active.value ? top <= threshold() + 2 : top <= threshold();
  }, { immediate: true });
  return computed(() => active.value);
}
