<script setup lang="ts">
import type { ClassValue } from 'tailwind-variants';
import type { CSSProperties } from 'vue';
import type { StatisticUI } from './reborn-statistic.config';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { cn } from '~/lib/utils';
import { statisticTheme } from './reborn-statistic.config';
import { formatStatistic } from './reborn-statistic.utils';

export interface StatisticProps {
  /** 数字内容，非有限数值按 0 显示 */
  value?: number;
  /** 小数点符号 */
  decimalSeparator?: string;
  /** 自定义格式化；传入后优先于精度和分隔符 */
  formatter?: (value: number) => string | number;
  /** 千分位标识符，传空字符串关闭分组 */
  groupSeparator?: string;
  /** 小数位数，取 0–20 之间的整数，超出时收敛到边界 */
  precision?: number;
  /** 默认从零连续计数；自定义格式化与系统减少动态效果时直接显示 */
  animated?: boolean;
  /** 单次数值过渡时长，单位毫秒；小于等于 0 或非有限值时立即显示 */
  duration?: number;
  /** 数字区前缀，同名插槽优先 */
  prefix?: string;
  /** 数字区后缀，同名插槽优先 */
  suffix?: string;
  /** 数字标题，同名插槽优先 */
  title?: string;
  /** 数字区行内样式，包含前后缀 */
  valueStyle?: string | CSSProperties;
  /** 根容器追加类名 */
  class?: ClassValue;
  /** 按结构键覆盖内部节点类名 */
  ui?: StatisticUI;
}

defineOptions({ name: 'RebornStatistic' });
const props = withDefaults(defineProps<StatisticProps>(), {
  value: 0,
  decimalSeparator: '.',
  groupSeparator: ',',
  precision: 0,
  animated: true,
  duration: 1500,
  ui: () => ({}),
});

const motionReady = ref(false);
const reducedMotion = ref(false);
const targetValue = computed(() => Number.isFinite(props.value) ? props.value : 0);
const currentValue = ref(targetValue.value);
let media: MediaQueryList | undefined;
let frame: number | undefined;
/** 无效时长直接展示目标，不创建后续帧。 */
const animationDuration = computed(() => Number.isFinite(props.duration) ? Math.max(0, props.duration) : 0);
const canAnimate = computed(() => props.animated && !props.formatter && Number.isFinite(props.value)
  && motionReady.value && !reducedMotion.value && animationDuration.value > 0);
/** 当前正在显示的格式化内容，计数期间也可通过公开实例读取。 */
const displayValue = computed(() => props.formatter
  ? props.formatter(props.value)
  : formatStatistic(currentValue.value, props.precision, props.decimalSeparator, props.groupSeparator));

/** 新目标或组件卸载时取消旧帧，避免旧动画覆盖最新结果。 */
function stopAnimation() {
  if (frame !== undefined) window.cancelAnimationFrame(frame);
  frame = undefined;
}

/** 与参考示例一致使用线性计数，更新目标时从当前可见数值继续。 */
function animateValue(from = currentValue.value) {
  stopAnimation();
  const target = targetValue.value;
  if (!canAnimate.value || from === target) {
    currentValue.value = target;
    return;
  }
  currentValue.value = from;
  const startedAt = performance.now();
  const duration = animationDuration.value;
  const tick = (now: number) => {
    const progress = Math.min(1, Math.max(0, (now - startedAt) / duration));
    // 先相减可能让正负极值溢出，按权重相加可保持中间值有限。
    currentValue.value = progress === 1 ? target : from * (1 - progress) + target * progress;
    frame = progress < 1 ? window.requestAnimationFrame(tick) : undefined;
  };
  frame = window.requestAnimationFrame(tick);
}

/** 页面打开期间改变系统偏好时，立即停止计数并显示目标。 */
function syncMotionPreference() {
  reducedMotion.value = media?.matches ?? false;
}

watch([targetValue, canAnimate, animationDuration], () => animateValue(), { flush: 'sync' });

onMounted(() => {
  // 服务端与水合首帧输出相同目标，客户端挂载后才从零计数，避免水合差异。
  media = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  syncMotionPreference();
  media?.addEventListener('change', syncMotionPreference);
  motionReady.value = typeof window.requestAnimationFrame === 'function' && typeof window.cancelAnimationFrame === 'function';
  animateValue(0);
});
onBeforeUnmount(() => {
  stopAnimation();
  media?.removeEventListener('change', syncMotionPreference);
});

const ui = computed(() => {
  const styles = statisticTheme();
  return {
    root: () => styles.root({ class: cn(props.ui.root, props.class) }),
    title: () => styles.title({ class: props.ui.title }),
    content: () => styles.content({ class: props.ui.content }),
    prefix: () => styles.prefix({ class: props.ui.prefix }),
    value: () => styles.value({ class: props.ui.value }),
    suffix: () => styles.suffix({ class: props.ui.suffix }),
  };
});

defineExpose({ displayValue });
</script>

<template>
  <div :class="ui.root()">
    <div v-if="$slots.title || title" :class="ui.title()">
      <slot name="title">{{ title }}</slot>
    </div>
    <div :class="ui.content()" :style="valueStyle">
      <span v-if="$slots.prefix || prefix" :class="ui.prefix()">
        <slot name="prefix">{{ prefix }}</slot>
      </span>
      <span :class="ui.value()">{{ displayValue }}</span>
      <span v-if="$slots.suffix || suffix" :class="ui.suffix()">
        <slot name="suffix">{{ suffix }}</slot>
      </span>
    </div>
  </div>
</template>
