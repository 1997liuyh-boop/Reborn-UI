<script setup lang="ts">
import type { ClassValue } from 'tailwind-variants';
import type { CSSProperties } from 'vue';
import type { ProgressFlowDirection, ProgressSegment, ProgressSize, ProgressStatus, ProgressStrokeColor, ProgressType, ProgressUi } from './reborn-progress.config';
import { computed, useId } from 'vue';
import { tv } from '~/lib/tv';
import { cn } from '~/lib/utils';
import theme from './reborn-progress.config';
import { getArcGeometry, getArcPath, getColorRanges, getGradientStops, getStepRanges, normalizePercent, normalizeSteps } from './reborn-progress.utils';

export interface RebornProgressProps {
  /** 当前百分比，限制在 0–100，非有限数字回退为零。 */
  percent?: number;
  /** 直线、圆环或底部开口的仪表盘。 */
  type?: ProgressType;
  /** 三档尺寸，不受内嵌文字影响。 */
  size?: ProgressSize;
  /** 显式状态，不随百分比自动切换。 */
  status?: ProgressStatus;
  /** 步骤数量，零表示连续进度，最多 1000 个。 */
  steps?: number;
  /** 单色、逐步骤颜色数组或渐变配置。 */
  strokeColor?: ProgressStrokeColor;
  /** 以累计百分比终点指定固定颜色区间。 */
  segments?: ProgressSegment[];
  /** 将直线进度文字放在轨道内部，不改变轨道高度。 */
  textInside?: boolean;
  /** 条纹装饰层，仅直线形态生效。 */
  striped?: boolean;
  /** 让条纹流动起来，需同时开启 striped。 */
  stripedFlow?: boolean;
  /** 条纹流动一个周期的秒数，非正数回退为 3 秒。 */
  duration?: number;
  /** 进度条流动方向：reverse 时直线从右往左填充、圆环逆时针，分段圆角与条纹流向随之翻转。 */
  flowDirection?: ProgressFlowDirection;
  /** 自定义文字内容，优先于默认状态图标。 */
  format?: (percentage: number) => string;
  /** 是否显示文字、状态图标和默认插槽。 */
  showText?: boolean;
  /** 无障碍名称，也可通过原生 aria-label 覆盖。 */
  ariaLabel?: string;
  /** 根元素样式覆盖。 */
  class?: ClassValue;
  /** 各部位样式覆盖。 */
  ui?: ProgressUi;
}

const props = withDefaults(defineProps<RebornProgressProps>(), {
  percent: 0, type: 'line', size: 'md', status: 'default', steps: 0,
  segments: () => [], textInside: false, showText: true, ariaLabel: '进度',
  striped: false, stripedFlow: false, duration: 3, flowDirection: 'normal',
});

defineSlots<{
  /** 自定义进度内容，优先于格式化函数和状态图标。 */
  default?: (props: { percent: number; status: ProgressStatus }) => unknown;
}>();

const b = tv(theme);
const value = computed(() => normalizePercent(props.percent));
const count = computed(() => normalizeSteps(props.steps));
const reversed = computed(() => props.flowDirection === 'reverse');
const styles = computed(() => b({ type: props.type, size: props.size, status: props.status, stepped: count.value > 0, textInside: props.textInside, reversed: reversed.value, stripedFlow: props.striped && props.stripedFlow }));
const geometry = computed(() => getArcGeometry(props.type, props.size, count.value > 0, props.flowDirection));
const text = computed(() => props.format ? props.format(value.value) : `${value.value}%`);
const accessibleText = computed(() => props.format ? text.value : `${value.value}%${props.status === 'success' ? '，成功' : props.status === 'error' ? '，失败' : ''}`);

/** useId 在服务端和客户端保持一致，多个渐变实例不会互相覆盖。 */
const gradientId = `reborn-progress-${useId()}`;
const gradientStops = computed(() => getGradientStops(props.strokeColor));
const gradientAngle = computed(() => {
  const color = props.strokeColor;
  return color && typeof color === 'object' && !Array.isArray(color) && Number.isFinite(color.angle) ? color.angle! : 90;
});
const gradientVector = computed(() => {
  const angle = gradientAngle.value * Math.PI / 180;
  const x = Math.sin(angle) * geometry.value.diameter / 2;
  const y = -Math.cos(angle) * geometry.value.diameter / 2;
  const center = geometry.value.diameter / 2;
  return { x1: center - x, y1: center - y, x2: center + x, y2: center + y };
});
const fallback = computed(() => typeof props.strokeColor === 'string' && props.strokeColor ? props.strokeColor : 'currentColor');
const colorRanges = computed(() => getColorRanges(props.segments, gradientStops.value.length ? `url(#${gradientId})` : fallback.value));

/** 先等分逻辑进度，再扣除圆弧间距，确保同一百分比在六种形态中含义一致。 */
const cells = computed(() => {
  const ranges = getStepRanges(count.value, props.type === 'line' ? undefined : geometry.value);
  return ranges.map((range, index) => {
    const colors = Array.isArray(props.strokeColor) && count.value > 0
      ? [{ from: 0, to: 100, color: props.strokeColor[index] || 'currentColor' }]
      : colorRanges.value;
    const parts = colors.map(color => ({
      from: Math.max(range.from, color.from),
      to: Math.min(range.to, color.to, value.value),
      color: color.color,
    })).filter(part => part.to > part.from);
    return { ...range, parts };
  });
});

/** 渐变始终锚定整个进度范围，而不是随当前百分比改变色标位置。 */
function linePartStyle(cell: { from: number; to: number }, part: { from: number; to: number; color: string }): CSSProperties {
  const length = cell.to - cell.from;
  const stops = part.color.startsWith('url(#') ? gradientStops.value.map(stop => `${stop.color} ${stop.offset}%`).join(', ') : '';
  // 连续进度：每段都从起点铺到自身终点，配合反序渲染叠压，只露出行进方向一侧的圆弧。
  if (!count.value) {
    const to = (part.to - cell.from) / length * 100;
    if (stops) {
      const clip = reversed.value ? `inset(0 0 0 ${100 - to}% round 9999px)` : `inset(0 ${100 - to}% 0 0 round 9999px)`;
      return { left: 0, width: '100%', background: `linear-gradient(${gradientAngle.value}deg, ${stops})`, clipPath: clip };
    }
    return { [reversed.value ? 'right' : 'left']: 0, width: `${to}%`, background: part.color };
  }
  const left = (part.from - cell.from) / length * 100;
  const width = (part.to - part.from) / length * 100;
  // 步骤节点内部保持平端拼接；每个节点裁切同一条完整背景，reverse 方向所有偏移改从右侧计算。
  if (stops) {
    const stepWidth = props.size === 'sm' ? 2 : 32;
    const trackWidth = count.value * (stepWidth + 2) - 2;
    const cellIndex = Math.round(cell.from / length);
    const offset = reversed.value ? trackWidth - cellIndex * (stepWidth + 2) - stepWidth : cellIndex * (stepWidth + 2);
    const clip = reversed.value ? `inset(0 ${left}% 0 ${100 - left - width}%)` : `inset(0 ${100 - left - width}% 0 ${left}%)`;
    return { left: 0, width: '100%', backgroundImage: `linear-gradient(${gradientAngle.value}deg, ${stops})`, backgroundSize: `${trackWidth}px 100%`, backgroundPosition: `${-offset}px 0`, clipPath: clip };
  }
  return { [reversed.value ? 'right' : 'left']: `${left}%`, width: `${width}%`, background: part.color };
}

/** 分段叠压靠渲染顺序实现：终点大的先画垫底、终点小的后画在上，因此反序输出，不引入 z-index。 */
function stackedParts(parts: { from: number; to: number; color: string }[]): { from: number; to: number; color: string }[] {
  return [...parts].reverse();
}

/** 条纹覆盖层跟随已填充宽度，位于所有填充之后渲染；时长与方向作为 CSS 变量传给动画类。 */
function stripeStyle(cell: { from: number; to: number }): CSSProperties {
  const width = (Math.min(cell.to, value.value) - cell.from) / (cell.to - cell.from) * 100;
  const seconds = Number.isFinite(props.duration) && props.duration > 0 ? props.duration : 3;
  const anchor: CSSProperties = reversed.value ? { left: 'auto', right: 0 } : {};
  return { ...anchor, 'width': `${width}%`, '--reborn-progress-duration': `${seconds}s`, '--reborn-progress-flow': reversed.value ? 'reverse' : 'normal' };
}

/** 内嵌文字贴住行进方向的前端，reverse 时改为右侧锚定。 */
const insideTextStyle = computed<CSSProperties>(() => reversed.value
  ? { width: `${value.value}%`, left: 'auto', right: 0, justifyContent: 'flex-start' }
  : { width: `${value.value}%` });
</script>

<template>
  <div
    :class="styles.root({ class: [props.class, props.ui?.root] })"
    role="progressbar" :aria-label="ariaLabel" :aria-valuenow="value" :aria-valuetext="accessibleText"
    :aria-valuemin="0" :aria-valuemax="100" :data-progress-type="type" :data-progress-steps="count"
  >
    <div v-if="type === 'line'" :class="styles.track({ class: props.ui?.track })" aria-hidden="true">
      <div v-for="(cell, index) in cells" :key="index" data-progress-track :class="styles.step({ class: props.ui?.step })">
        <span
          v-for="(part, partIndex) in stackedParts(cell.parts)" :key="partIndex" data-progress-fill
          :class="styles.fill({ class: props.ui?.fill })" :style="linePartStyle(cell, part)"
        />
        <span v-if="striped && cell.parts.length" data-progress-stripes :class="styles.stripes({ class: props.ui?.stripes })" :style="stripeStyle(cell)" />
      </div>
    </div>
    <svg v-else :class="styles.circle({ class: props.ui?.circle })" :viewBox="`0 0 ${geometry.diameter} ${geometry.diameter}`" fill="none" aria-hidden="true">
      <defs v-if="gradientStops.length">
        <linearGradient :id="gradientId" gradientUnits="userSpaceOnUse" v-bind="gradientVector">
          <stop v-for="(stop, index) in gradientStops" :key="index" :offset="`${stop.offset}%`" :stop-color="stop.color" />
        </linearGradient>
      </defs>
      <g :stroke-width="geometry.strokeWidth" :stroke-linecap="count ? 'butt' : 'round'">
        <path v-for="(cell, index) in cells" :key="`track-${index}`" data-progress-track :d="getArcPath(geometry, cell.from, cell.to)" class="stroke-gray-3" :class="[props.ui?.track]" />
        <template v-for="(cell, index) in cells" :key="index">
          <path
            v-for="(part, partIndex) in stackedParts(cell.parts)" :key="partIndex" data-progress-fill
            :d="getArcPath(geometry, part.from, part.to)" :stroke="part.color" :class="cn(props.ui?.fill)"
          />
        </template>
      </g>
    </svg>
    <span v-if="type === 'line' && showText && textInside" data-progress-text aria-hidden="true" :class="styles.text({ class: props.ui?.text })" :style="insideTextStyle">
      <slot :percent="value" :status="status">
        {{ text }}
      </slot>
    </span>
    <span v-if="showText && !(type === 'line' && textInside)" data-progress-text :class="styles.text({ class: props.ui?.text })" aria-hidden="true">
      <slot :percent="value" :status="status">
        <svg v-if="status !== 'default' && !format" :data-progress-icon="status" :class="styles.icon({ class: props.ui?.icon })" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path v-if="status === 'success'" d="m5 12 4 4 10-10" />
          <path v-else d="m6 6 12 12M6 18 18 6" />
        </svg>
        <template v-else>{{ text }}</template>
      </slot>
    </span>
  </div>
</template>

<style>
/* 条纹流动动画：位移一个背景周期后无缝循环，方向由 animation-direction 控制。 */
@keyframes reborn-progress-stripes {
  from { background-position: 0 0; }
  to { background-position: 1.25em 0; }
}
</style>
