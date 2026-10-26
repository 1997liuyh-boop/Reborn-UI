<script setup lang="ts">
import type { Dayjs } from 'dayjs';
import type { ClassValue } from 'tailwind-variants';
import type { CSSProperties } from 'vue';
import type { StatisticUI } from '../reborn-statistic/reborn-statistic.config';
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue';
import { cn } from '~/lib/utils';
import RebornStatistic from '../reborn-statistic/RebornStatistic.vue';
import { formatCountdown } from './reborn-countdown.utils';

export interface CountdownProps {
  /** 目标时间：毫秒时间戳或 Dayjs 对象；未传或无效时显示零且不派发 finish */
  value?: number | Dayjs;
  /** 格式支持 D / H / m / s / S，重复字母补零，方括号中的内容原样输出 */
  format?: string;
  /** 倒计时前缀，同名插槽优先 */
  prefix?: string;
  /** 倒计时后缀，同名插槽优先 */
  suffix?: string;
  /** 倒计时标题，同名插槽优先 */
  title?: string;
  /** 数字区行内样式，包含前后缀 */
  valueStyle?: string | CSSProperties;
  /** 根容器追加类名 */
  class?: ClassValue;
  /** 沿用 Statistic 的结构键覆盖类名 */
  ui?: StatisticUI;
}

defineOptions({ name: 'RebornCountdown' });
const props = withDefaults(defineProps<CountdownProps>(), {
  format: 'HH:mm:ss',
  ui: () => ({}),
});
const emit = defineEmits<{
  /** 剩余时间改变，参数为非负毫秒数 */
  change: [remaining: number];
  /** 当前目标倒计时结束，每个目标只派发一次 */
  finish: [];
}>();

// 服务端与客户端首帧都从零开始，挂载后再读时钟，避免跨秒造成水合不一致。
const remaining = shallowRef(0);
/** 当前格式化后的倒计时文本，不含标题和前后缀。 */
const displayValue = computed(() => formatCountdown(remaining.value, props.format));
let timer: ReturnType<typeof setTimeout> | undefined;
let mounted = false;
let finished = false;

/** 清理旧任务，重置目标和页面恢复可见时都只能保留一个计时器。 */
function clearTimer() {
  clearTimeout(timer);
  timer = undefined;
}

/** 每次都按绝对时间重算，后台限频或卡顿不会让倒计时越走越慢。 */
function tick() {
  clearTimer();
  if (!mounted) return;
  const target = props.value?.valueOf();
  const valid = typeof target === 'number' && Number.isFinite(target);
  const difference = valid ? Math.max(0, target - Date.now()) : 0;
  if (difference !== remaining.value) {
    remaining.value = difference;
    emit('change', difference);
  }
  if (!valid) return;
  if (difference === 0) {
    if (!finished) {
      finished = true;
      emit('finish');
    }
    return;
  }
  const interval = props.format.replace(/\[[^\]]*\]/g, '').includes('S') ? 16 : 1000;
  timer = setTimeout(tick, Math.min(interval, difference));
}

/** 更新目标后恢复运行，已结束的目标不会阻止下一次倒计时。 */
function restart() {
  finished = false;
  tick();
}

/** 交给 Statistic 的格式化入口，直接沿用同一展示结构和插槽。 */
function formatValue() {
  return displayValue.value;
}

// 按时间戳监听：父组件内联构造 Dayjs 时每次渲染都是新对象，时刻没变就不能重启，否则会重复派发 change / finish
watch(() => props.value?.valueOf(), restart);
watch(() => props.format, tick);
onMounted(() => {
  mounted = true;
  restart();
  document.addEventListener('visibilitychange', tick);
});
onBeforeUnmount(() => {
  mounted = false;
  clearTimer();
  if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', tick);
});

defineExpose({ displayValue });
</script>

<template>
  <RebornStatistic
    :value="remaining" :formatter="formatValue" :animated="false" :title="title" :prefix="prefix" :suffix="suffix"
    :value-style="valueStyle" :ui="ui" :class="cn('reborn-countdown', props.class)"
  >
    <template v-if="$slots.title" #title><slot name="title" /></template>
    <template v-if="$slots.prefix" #prefix><slot name="prefix" /></template>
    <template v-if="$slots.suffix" #suffix><slot name="suffix" /></template>
  </RebornStatistic>
</template>
