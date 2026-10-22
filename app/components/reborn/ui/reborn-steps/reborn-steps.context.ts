import type { ComputedRef, InjectionKey, PropType, VNode } from 'vue';
import type { StepsColor, StepsDirection, StepsLineType, StepsPlacement, StepsSize, StepsStatus, StepsType, StepsUI } from './reborn-steps.config';
import { computed, defineComponent, provide } from 'vue';

export interface StepsContext {
  active: ComputedRef<number>;
  overallProgress: ComputedRef<number | undefined>;
  direction: ComputedRef<StepsDirection>;
  placement: ComputedRef<StepsPlacement | undefined>;
  processStatus: ComputedRef<StepsStatus>;
  finishStatus: ComputedRef<StepsStatus>;
  alignCenter: ComputedRef<boolean>;
  simple: ComputedRef<boolean>;
  size: ComputedRef<StepsSize>;
  type: ComputedRef<StepsType>;
  lineType: ComputedRef<StepsLineType>;
  color: ComputedRef<StepsColor>;
  space: ComputedRef<string>;
  ui: ComputedRef<StepsUI>;
}

interface StepPosition {
  index: ComputedRef<number>;
  count: ComputedRef<number>;
}

export const stepsContextKey: InjectionKey<StepsContext> = Symbol('reborn-steps');
export const stepPositionKey: InjectionKey<StepPosition> = Symbol('reborn-step-position');

/**
 * 每次渲染直接提供位置，不依赖挂载登记；服务端首屏和客户端重排使用同一索引。
 * 此组件不产生 DOM 包裹，原 Step 的 ref、插槽和组件实例保持原有语义。
 */
export const StepScope = defineComponent({
  name: 'RebornStepScope',
  inheritAttrs: false,
  props: {
    index: { type: Number, required: true },
    count: { type: Number, required: true },
    node: { type: Object as PropType<VNode>, required: true },
  },
  setup(props) {
    provide(stepPositionKey, {
      index: computed(() => props.index),
      count: computed(() => props.count),
    });
    return () => props.node;
  },
});
