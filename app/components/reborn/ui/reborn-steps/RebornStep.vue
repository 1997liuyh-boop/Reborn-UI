<script setup lang="ts">
import type { Component, CSSProperties } from 'vue';
import type { StepsColor, StepsDirection, StepsLineType, StepsPlacement, StepsStatus, StepsUI } from './reborn-steps.config';
import { Icon } from '#components';
import { computed, inject } from 'vue';
import { cn } from '~/lib/utils';
import { stepsTheme } from './reborn-steps.config';
import { stepPositionKey, stepsContextKey } from './reborn-steps.context';

export interface RebornStepProps {
  /** 步骤标题，title 插槽优先 */
  title?: string;
  /** 步骤描述，description 插槽优先 */
  description?: string;
  /** 标题与描述相对节点的位置；优先于父级 placement 与默认位置 */
  placement?: StepsPlacement;
  /** 自定义图标名称或组件，icon 插槽优先；点状类型不显示图标 */
  icon?: string | Component;
  /** 空值时由父级 active、processStatus、finishStatus 推导 */
  status?: StepsStatus | '';
  /** 本步骤百分比进度；显式值优先于整体折算，仅当前且状态为 process 时显示圆环 */
  progress?: number;
  /** 步骤主题色；未指定时继承父级，最终默认 primary；错误和成功使用对应状态色 */
  color?: StepsColor;
  /** 本节点的样式覆盖，优先于父级同名配置 */
  ui?: StepsUI;
}

/** 内容插槽共享当前步骤状态，供业务定制节点和文案。 */
export interface RebornStepSlotProps {
  index: number;
  status: StepsStatus;
  current: boolean;
  progress: number | undefined;
}

/** 连接器额外提供方向和完成状态，供业务控制连线外观。 */
export interface RebornStepConnectorSlotProps extends RebornStepSlotProps {
  completed: boolean;
  direction: StepsDirection;
  lineType: StepsLineType;
}

defineOptions({ name: 'RebornStep' });
const props = withDefaults(defineProps<RebornStepProps>(), { title: '', description: '', status: '', ui: () => ({}) });
defineSlots<{
  icon?: (props: RebornStepSlotProps) => unknown;
  title?: (props: RebornStepSlotProps) => unknown;
  description?: (props: RebornStepSlotProps) => unknown;
  connector?: (props: RebornStepConnectorSlotProps) => unknown;
}>();
const uiOverrides = computed(() => props.ui);
const context = inject(stepsContextKey, undefined);
const position = inject(stepPositionKey, undefined);
const index = computed(() => position?.index.value ?? 0);
const last = computed(() => index.value === (position?.count.value ?? 1) - 1);
/** 进度只接受有限百分比，避免异常数值生成无效圆环。 */
function normalizeProgress(value: number) {
  return Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
}
// 总数来自每次渲染的位置上下文，增删步骤时直接折算，不在渲染中回写父级 active。
const overallPosition = computed(() => {
  const value = context?.overallProgress.value;
  if (value === undefined) return undefined;
  const stepProgress = normalizeProgress(value) / 100 * (position?.count.value ?? 1);
  const boundary = Math.round(stepProgress);
  // 等分份额来回加减会产生浮点尾差，仅吸附机器精度内的边界，避免误判成前一步接近完成。
  return Math.abs(stepProgress - boundary) <= Number.EPSILON * Math.max(1, stepProgress) * 4 ? boundary : stepProgress;
});
const activeIndex = computed(() => overallPosition.value === undefined ? context?.active.value ?? 0 : Math.floor(overallPosition.value));
const current = computed(() => index.value === activeIndex.value);
const progressValue = computed(() => {
  if (!current.value) return undefined;
  if (props.progress !== undefined) return normalizeProgress(props.progress);
  if (overallPosition.value !== undefined) return normalizeProgress((overallPosition.value - index.value) * 100);
  return undefined;
});
const direction = computed(() => context?.direction.value ?? 'horizontal');
const placement = computed(() => props.placement ?? context?.placement.value
  ?? (direction.value === 'horizontal' && context?.alignCenter.value ? 'bottom' : 'right'));
const simple = computed(() => context?.simple.value ?? false);
const type = computed(() => context?.type.value ?? 'default');
const lineType = computed(() => context?.lineType.value ?? 'solid');
const status = computed<StepsStatus>(() => {
  if (props.status) return props.status;
  if (index.value < activeIndex.value) return context?.finishStatus.value ?? 'finish';
  return current.value ? context?.processStatus.value ?? 'process' : 'wait';
});
const showProgress = computed(() => current.value && status.value === 'process' && progressValue.value !== undefined);
const completed = computed(() => status.value === 'finish' || status.value === 'success');
const progressLabel = computed(() => `${props.title || `步骤 ${index.value + 1}`}进度`);
const color = computed(() => status.value === 'error' || status.value === 'success'
  ? status.value
  : props.color ?? context?.color.value ?? 'primary');
const iconName = computed(() => typeof props.icon === 'string' ? props.icon : undefined);
const iconComponent = computed(() => typeof props.icon !== 'string' ? props.icon : undefined);
const statusIcon = computed(() => status.value === 'error' ? 'lucide:x' : ['finish', 'success'].includes(status.value) ? 'lucide:check' : undefined);
const layoutStyle = computed<CSSProperties | undefined>(() => {
  const length = context?.space.value;
  if (!length) return undefined;
  if (direction.value === 'horizontal') return undefined;
  return { height: length, minHeight: length };
});
const styles = computed(() => stepsTheme({
  direction: direction.value, size: context?.size.value ?? 'md', color: color.value, status: status.value,
  type: type.value, lineType: lineType.value, completed: completed.value,
  placement: placement.value, alignCenter: context?.alignCenter.value ?? false, simple: simple.value, last: last.value,
  spaced: !!context?.space.value,
}));

/** 样式合并顺序统一为组件基础、父级覆盖、当前步骤覆盖。 */
function ui(key: keyof StepsUI) {
  return styles.value[key]({ class: cn(context?.ui.value[key], uiOverrides.value[key]) });
}
</script>

<template>
  <li :class="ui('item')" :style="layoutStyle" :data-step-index="index" :data-status="status" :data-placement="placement" :aria-current="current ? 'step' : undefined">
    <span :class="ui('marker')" :aria-hidden="showProgress ? undefined : true">
      <svg v-if="showProgress" :class="ui('progressRing')" role="progressbar" :aria-label="progressLabel" :aria-valuenow="progressValue" :aria-valuemin="0" :aria-valuemax="100">
        <circle :class="ui('progressTrack')" cx="50%" cy="50%" r="calc(50% - var(--spacing) / 4)" />
        <circle v-if="progressValue" :class="ui('progressIndicator')" cx="50%" cy="50%" r="calc(50% - var(--spacing) / 4)" pathLength="100" :stroke-dasharray="`${progressValue} 100`" stroke-linecap="round" />
      </svg>
      <template v-if="type !== 'dot'">
        <slot name="icon" :index="index" :status="status" :current="current" :progress="progressValue">
          <Icon v-if="iconName" :name="iconName" :class="ui('icon')" />
          <component :is="iconComponent" v-else-if="iconComponent" :class="ui('icon')" />
          <Icon v-else-if="statusIcon" :name="statusIcon" :class="ui('icon')" />
          <span v-else aria-hidden="true">{{ index + 1 }}</span>
        </slot>
      </template>
    </span>
    <div :class="ui('content')">
      <div :class="ui('title')"><slot name="title" :index="index" :status="status" :current="current" :progress="progressValue">{{ title }}</slot></div>
      <!-- 插槽结构不具备响应性，渲染时直接读取，避免动态增删描述时命中旧的计算缓存。 -->
      <div v-if="!simple && (description || $slots.description)" :class="ui('description')"><slot name="description" :index="index" :status="status" :current="current" :progress="progressValue">{{ description }}</slot></div>
    </div>
    <span v-if="!last" :class="ui('connector')" aria-hidden="true">
      <slot name="connector" :index="index" :status="status" :current="current" :progress="progressValue" :completed="completed" :direction="direction" :line-type="lineType">
        <Icon v-if="lineType === 'arrow'" name="lucide:chevron-right" :class="ui('arrow')" />
        <template v-else>
          <span :class="ui('line')" />
          <span :class="[ui('line'), ui('lineFill')]" />
        </template>
      </slot>
    </span>
  </li>
</template>
