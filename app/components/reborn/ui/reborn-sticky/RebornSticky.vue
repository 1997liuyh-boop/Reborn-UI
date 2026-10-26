<script setup lang="ts">
import type { CSSProperties, Ref } from 'vue';
import { computed, nextTick, onMounted, readonly, shallowRef, useTemplateRef, watch } from 'vue';
import { provideLayoutAnimation } from '~/composables/useLayoutAnimation';
import { tv } from '~/lib/tv';
import { cn } from '~/lib/utils';
import theme from './reborn-sticky.config';
import { useStickyBottom } from './useStickyBottom';
import { useStickyMetrics } from './useStickyMetrics';
import { useStickyTop } from './useStickyTop';

export interface RebornStickyProps {
    // 吸顶偏移量, 单位px
    offsetTop?: number;
    // 层级
    zIndex?: number;
    // 是否需要减去导航栏高度
    isNeedNavbarHeight?: boolean;
    // 导航栏高度
    navbarHeight?: number;
    // 目标容器，CSS选择器或DOM元素。吸顶元素将始终保持在该容器内，超过范围则隐藏
    target?: string | HTMLElement;
    // 手动控制吸顶状态
    sticky?: boolean;
    // 固定位置：top 吸顶，bottom 吸底
    position?: 'top' | 'bottom';
    // 吸底越界后的边界基准：parent 保持旧逻辑，target 按目标容器底部向上 offsetTop 停靠
    bottomBoundary?: 'parent' | 'target';
    // 吸底固定后的占位策略：auto 保持旧逻辑，keep 保留高度，none 不参与页面排版
    bottomPlaceholder?: 'auto' | 'keep' | 'none';
    // 覆盖内部节点类名：wrapper 为外层占位容器，content 为实际执行吸附定位的内容容器
    ui?: { wrapper?: string, content?: string };
}

const props = withDefaults(defineProps<RebornStickyProps>(), {
    offsetTop: 0,
    zIndex: 100,
    isNeedNavbarHeight: true,
    navbarHeight: 0, // Web 端默认值通常为 0，除非存在固定的导航栏
    target: undefined,
    sticky: true,
    position: 'top',
    bottomBoundary: 'parent',
    bottomPlaceholder: 'auto',
    ui: undefined
});


const emit = defineEmits<{
  /** 吸顶或吸底状态改变。 */
  change: [isSticky: boolean];
  /** 测量后尺寸或文档位置改变，单位为 px。 */
  resize: [rect: { height: number; width: number; left: number; top: number }];
}>();
defineSlots<{ default?: (props: { isSticky: boolean }) => unknown }>();

const wrapperRef = useTemplateRef<HTMLElement>('wrapperRef');
const contentRef = useTemplateRef<HTMLElement>('contentRef');
const hasMounted = shallowRef(false);
const animations = shallowRef<Readonly<Ref<boolean>>[]>([]);
provideLayoutAnimation({
  register(animating) {
    animations.value = [...animations.value, animating];
    return () => { animations.value = animations.value.filter(item => item !== animating); };
  },
});
const childAnimating = computed(() => animations.value.some(item => item.value));
const { metrics, forceUpdate } = useStickyMetrics(wrapperRef, contentRef, () => props.target);
const threshold = computed(() => props.offsetTop + (props.isNeedNavbarHeight ? props.navbarHeight : 0));
const overlay = computed(() => hasMounted.value && props.sticky && props.position === 'bottom' && props.bottomPlaceholder !== 'auto');
const rect = shallowRef({ height: 0, width: 0, left: 0, top: 0 });

/** 吸顶时后代布局动画期间暂停提交尺寸 */
const rectPaused = computed(() => props.position === 'top' && childAnimating.value);
// 测量先提交尺寸，再让状态切换定位；动画中的吸顶尺寸等后代完成后统一刷新。
// 暂停状态也作为来源：快照只在数值变化时才替换，动画结束时快照可能早已是最终值，要靠暂停解除补一次提交
watch([metrics, rectPaused], ([sample, paused]) => {
  if (paused) return;
  const next = { height: sample.contentHeight, width: sample.wrapper.width, left: sample.wrapper.left, top: sample.wrapper.docTop };
  if (Object.keys(next).some(key => next[key as keyof typeof next] !== rect.value[key as keyof typeof next])) {
    rect.value = next;
    emit('resize', { ...next });
  }
});
watch(childAnimating, value => { if (!value) forceUpdate(); });
const topActive = useStickyTop(metrics, () => hasMounted.value && props.sticky && props.position === 'top', () => threshold.value, () => childAnimating.value);
const bottom = useStickyBottom(metrics, {
  enabled: () => hasMounted.value && props.sticky && props.position === 'bottom',
  threshold: () => threshold.value,
  overlay: () => overlay.value,
  boundary: () => props.bottomBoundary,
});
const isSticky = computed(() => props.position === 'top' ? topActive.value : bottom.active.value);
/**
 * 吸附前在文档流里的宽度。父容器按内容收缩包裹时（如 flex 列 align-items: flex-start），
 * 内容脱离文档流会把占位容器压成 0 宽，吸附期间要靠它把占位撑回原宽度。
 * 状态切换的这一轮里尺寸已先于状态提交，此刻的 rect 仍是吸附前的流内测量值
 */
const flowWidth = shallowRef(0);
watch(isSticky, value => {
  if (value) flowWidth.value = rect.value.width;
  emit('change', value);
  nextTick(forceUpdate);
});
watch(() => [props.position, props.offsetTop, props.navbarHeight, props.isNeedNavbarHeight, props.bottomBoundary, props.bottomPlaceholder], forceUpdate, { flush: 'post' });
onMounted(() => { hasMounted.value = true; forceUpdate(); });

const b = tv(theme);
const stickyUi = computed(() => {
  const styles = b({ sticky: isSticky.value });
  return { wrapper: cn(styles.wrapper(), props.ui?.wrapper), content: cn(styles.content(), props.ui?.content) };
});
const wrapperStyle = computed<CSSProperties>(() => overlay.value ? {
  height: props.bottomPlaceholder === 'keep' ? `${rect.value.height}px` : '0px',
  minHeight: '0px', overflow: 'visible', position: 'relative', zIndex: props.zIndex,
} : {
  height: isSticky.value && props.position === 'top' ? `${rect.value.height}px` : 'auto',
  // 只设下限不写死宽度：块级父容器里占位仍随父容器伸缩；100% 保证父容器变窄时不撑破
  minWidth: isSticky.value ? `min(${flowWidth.value}px, 100%)` : undefined,
  zIndex: isSticky.value ? props.zIndex : 'auto',
});

/** 左右向外取整，避免遮盖条产生亚像素缝隙。 */
function fixedEdges() {
  const left = Math.floor(rect.value.left);
  return { left: `${left}px`, width: `${Math.max(0, Math.ceil(rect.value.left + rect.value.width) - left)}px` };
}
function dockedStyle(top: number): CSSProperties {
  return { width: `${rect.value.width}px`, left: '0px', top: `${top - metrics.value.wrapper.top}px`, bottom: 'auto', position: 'absolute', willChange: 'auto' };
}
const contentStyle = computed<CSSProperties>(() => {
  const sample = metrics.value;
  const height = rect.value.height;
  if (overlay.value) {
    const fixedTop = sample.viewportHeight - threshold.value - height;
    if (sample.targetBottom !== null) {
      const boundaryTop = sample.targetBottom - threshold.value - height;
      if (boundaryTop <= fixedTop) return dockedStyle(boundaryTop);
    }
    return { ...fixedEdges(), top: `${Math.floor(fixedTop)}px`, bottom: 'auto', position: 'fixed', willChange: 'transform' };
  }
  if (!isSticky.value) return { width: '100%', left: '0px', top: '0px', position: 'relative', willChange: 'auto' };
  if (props.position === 'bottom') {
    if (sample.targetBottom !== null && bottom.atTarget.value) return dockedStyle(sample.targetBottom - threshold.value - height);
    return { ...fixedEdges(), bottom: `${threshold.value}px`, top: 'auto', position: 'fixed', willChange: 'transform' };
  }
  if (sample.targetBottom !== null && sample.targetBottom - height <= threshold.value) return dockedStyle(sample.targetBottom - height);
  return { ...fixedEdges(), top: `${Math.floor(threshold.value)}px`, position: 'fixed', willChange: 'transform' };
});

defineExpose({
  height: computed(() => rect.value.height),
  isSticky,
  position: computed(() => props.position),
  rect: readonly(rect),
  forceUpdate,
});
</script>

<template>
  <div ref="wrapperRef" :class="stickyUi.wrapper" :style="wrapperStyle">
    <div ref="contentRef" :class="stickyUi.content" :style="contentStyle">
      <slot :is-sticky="isSticky" />
    </div>
  </div>
</template>
