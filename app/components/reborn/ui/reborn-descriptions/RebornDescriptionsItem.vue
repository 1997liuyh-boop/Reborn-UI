<script setup lang="ts">
/**
 * 描述列表子项组件
 *
 * 作为 RebornDescriptions 的直接子组件使用。父组件通过 VNode 解析识别此组件，
 * 将其 props 和插槽内容重新组织为行列布局。此组件本身不产生可见输出，
 * 所有渲染由父组件控制。
 *
 * 若在 RebornDescriptions 外部单独使用，则正常渲染默认插槽。
 */
defineOptions({ name: "RebornDescriptionsItem" });

withDefaults(defineProps<DescriptionsItemProps>(), {
  span: 1,
});

defineSlots<{
  /** 内容区插槽 */
  default: () => any;
  /** 标签区自定义插槽 */
  label: () => any;
}>();

export interface DescriptionsItemProps {
  /** 标签文字 */
  label?: string;
  /** 占据列数，默认 1 */
  span?: number;
  /** 自定义标签单元格 CSS 类 */
  labelClass?: string;
  /** 自定义内容单元格 CSS 类 */
  contentClass?: string;
  /** 单项标签单元格背景色（优先于组件全局 labelBackground） */
  labelBackground?: string;
  /** 单项内容单元格背景色（优先于组件全局 contentBackground） */
  contentBackground?: string;
  /** 单项标签字体颜色（优先于组件全局 labelColor） */
  labelColor?: string;
  /** 单项内容字体颜色（优先于组件全局 contentColor） */
  contentColor?: string;
  /** 单项标签字体加粗（优先于组件全局 labelBold） */
  labelBold?: boolean;
  /** 单项内容字体加粗（优先于组件全局 contentBold） */
  contentBold?: boolean;
}
</script>

<template>
  <!-- 此组件内容由父级 RebornDescriptions 通过 VNode 解析后渲染 -->
  <slot />
</template>
