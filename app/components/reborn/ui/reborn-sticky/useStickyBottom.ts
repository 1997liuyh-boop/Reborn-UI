import type { Ref } from 'vue';
import type { StickyMetrics } from './useStickyMetrics';
import { computed, shallowRef, watch } from 'vue';

/** 吸底用激活时的文档位置退出，避免脱离文档流后包装器塌陷造成反复切换。 */
export function useStickyBottom(metrics: Readonly<Ref<StickyMetrics>>, options: {
  enabled: () => boolean;
  threshold: () => number;
  overlay: () => boolean;
  boundary: () => 'parent' | 'target';
}) {
  const active = shallowRef(false);
  const atTarget = shallowRef(false);
  let activationDocBottom = 0;
  let previousTarget: HTMLElement | null = null;
  watch([metrics, options.enabled, options.threshold, options.overlay, options.boundary], () => {
    if (!options.enabled()) { active.value = false; atTarget.value = false; activationDocBottom = 0; return; }
    const sample = metrics.value;
    // 更换目标容器后重新捕获激活点，不能沿用旧容器的文档位置。
    if (previousTarget !== sample.targetElement) {
      active.value = false;
      atTarget.value = false;
      activationDocBottom = 0;
      previousTarget = sample.targetElement;
    }
    const targetBottom = sample.targetBottom;
    if (options.overlay()) {
      active.value = targetBottom === null || targetBottom >= sample.viewportHeight + (active.value ? -2 : 2);
      atTarget.value = false;
      return;
    }
    const threshold = sample.viewportHeight - options.threshold();
    const line = targetBottom === null ? Infinity : targetBottom + (options.boundary() === 'target' ? -options.threshold() : options.threshold());
    const reachesTarget = options.boundary() === 'target' ? line <= threshold + (atTarget.value ? 2 : -2) : line <= threshold;
    if (active.value) {
      if (activationDocBottom - sample.scrollTop < threshold - 2) {
        active.value = false;
        atTarget.value = false;
      } else atTarget.value = targetBottom !== null && reachesTarget;
    } else if (sample.wrapper.bottom >= threshold || (targetBottom !== null && options.boundary() === 'target' && reachesTarget)) {
      activationDocBottom = targetBottom === null ? sample.wrapper.docBottom : Math.max(sample.wrapper.docBottom, sample.scrollTop + threshold);
      atTarget.value = targetBottom !== null && reachesTarget;
      active.value = true;
    }
  }, { immediate: true });
  return { active: computed(() => active.value), atTarget: computed(() => atTarget.value) };
}
