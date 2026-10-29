<script setup lang="ts">
import type { VNode } from 'vue';
import type { StepsColor, StepsDirection, StepsLineType, StepsPlacement, StepsSize, StepsStatus, StepsType, StepsUI } from './reborn-steps.config';
import { cloneVNode, Comment, computed, Fragment, h, isVNode, provide, Text, useSlots, watch } from 'vue';
import { stepsTheme } from './reborn-steps.config';
import { stepsContextKey, StepScope } from './reborn-steps.context';

export interface RebornStepsProps {
  /** 整体宽度；数字为 px，字符串支持百分比等 CSS 长度，默认撑满容器 */
  width?: number | string;
  /** 相邻步骤的布局长度；数字为 px，字符串支持百分比等 CSS 长度，空值自适应 */
  space?: number | string;
  /** 步骤排列方向 */
  direction?: StepsDirection;
  /** 标题与描述相对节点的位置；子步骤可单独覆盖，未指定时沿用 alignCenter 布局 */
  placement?: StepsPlacement;
  /** 整体百分比进度；按步骤数等分折算，优先于 active，仅派生展示 */
  overallProgress?: number;
  /** 当前步骤状态 */
  processStatus?: StepsStatus;
  /** 当前步骤之前的状态 */
  finishStatus?: StepsStatus;
  /** 横向上下内容在步内居中；未指定 placement 时放在节点下方 */
  alignCenter?: boolean;
  /** 简洁模式，隐藏描述 */
  simple?: boolean;
  /** 标记与文字尺寸 */
  size?: StepsSize;
  /** 外观类型：圆形数字、点状标记或无标记的文本步骤 */
  type?: StepsType;
  /** 连接方式：实线、原生虚线或箭头 */
  lineType?: StepsLineType;
  /** 步骤主题色；子项未指定时继承，最终默认 primary */
  color?: StepsColor;
  /** 根节点与所有子项的样式覆盖 */
  ui?: StepsUI;
}

defineOptions({ name: 'RebornSteps' });
const props = withDefaults(defineProps<RebornStepsProps>(), {
  width: '100%', space: '', direction: 'horizontal', processStatus: 'process', finishStatus: 'finish',
  alignCenter: false, simple: false, size: 'md', type: 'default', lineType: 'solid', color: 'primary', ui: () => ({}),
});
const emit = defineEmits<{
  /** active 发生变化时触发，初始化时不触发 */
  (event: 'change', next: number, previous: number): void;
}>();
/** 当前步骤的零基索引；等于步骤数量时所有步骤均进入完成状态。 */
const active = defineModel<number>('active', { default: 0 });
const slots = useSlots();
const stepsWidth = computed(() => {
  const value = props.width;
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? `${value}px` : '100%';
  return value.trim() || '100%';
});
const space = computed(() => typeof props.space === 'number'
  ? Number.isFinite(props.space) && props.space >= 0 ? `${props.space}px` : ''
  : props.space.trim());
const placement = computed(() => props.placement ?? (props.direction === 'horizontal' && props.alignCenter ? 'bottom' : 'right'));
const styles = computed(() => stepsTheme({ direction: props.direction, placement: placement.value, spaced: !!space.value }));

provide(stepsContextKey, {
  active: computed(() => active.value), direction: computed(() => props.direction),
  placement: computed(() => props.placement),
  overallProgress: computed(() => props.overallProgress),
  processStatus: computed(() => props.processStatus), finishStatus: computed(() => props.finishStatus),
  alignCenter: computed(() => props.alignCenter), simple: computed(() => props.simple),
  size: computed(() => props.size), type: computed(() => props.type), lineType: computed(() => props.lineType),
  color: computed(() => props.color), space, ui: computed(() => props.ui),
});
watch(active, (next, previous) => emit('change', next, previous));

interface StepNode { node: VNode; key: string }

/** Fragment 的祖先路径为局部 key 加命名空间，两个 v-for 使用相同 key 也不会串实例。 */
function collectSteps(nodes: unknown[], ancestors: string[] = []): StepNode[] {
  return nodes.flatMap((node, index) => {
    if (!isVNode(node) || node.type === Comment || node.type === Text) return [];
    const segment = node.key == null ? `index:${index}` : `key:${typeof node.key}:${String(node.key)}`;
    const path = [...ancestors, segment];
    if (node.type === Fragment && Array.isArray(node.children)) return collectSteps(node.children, path);
    // 默认插槽约定只放步骤组件；同时接收异步包装组件，避免 Nuxt 全局注册后类型身份变化。
    // Vue 的组件标记为函数组件 2 或有状态组件 4，原生元素、Teleport 等不计为步骤。
    if (!(node.shapeFlag & 6)) return [];
    return [{ node, key: JSON.stringify(path) }];
  });
}

/** 只在渲染过程中读取插槽，避免 computed 缓存导致动态步骤列表停留在旧顺序。 */
function renderSteps() {
  const nodes = collectSteps(slots.default?.() ?? []);
  return nodes.map(({ node, key }, index) => h(StepScope, { key, index, count: nodes.length, node: cloneVNode(node) }));
}

/** 节点作为显式参数进入渲染器，父插槽更新时不会被当作无变化的函数组件跳过。 */
function StepItems(props: { nodes: VNode[] }) {
  return props.nodes;
}
</script>

<template>
  <ol :class="styles.root({ class: props.ui.root })" :style="{ '--steps-width': stepsWidth, '--steps-space': space }" :data-direction="direction" :data-type="type" :data-simple="simple">
    <StepItems :nodes="renderSteps()" />
  </ol>
</template>
