<script setup lang="ts">
import type { DescriptionsSpan } from "./reborn-descriptions.config";

defineOptions({
  name: "RebornDescriptionsItem",
});

defineProps<DescriptionsItemProps>();

defineSlots<{
  /** 本项的内容 */
  default?: (props: Record<string, never>) => any;
  /** 本项的标签，优先于 label 属性 */
  label?: (props: Record<string, never>) => any;
}>();

export interface DescriptionsItemProps {
  /** 内容的描述，即左侧标签文字；富内容改用 label 插槽 */
  label?: string;
  /** 包含列的数量，'filled' 表示铺满当前行剩余部分，也可按断点取值 */
  span?: DescriptionsSpan;
  /** 单独覆盖本项的冒号显隐，不传时跟随父级 colon */
  colon?: boolean;
  /** 追加到本项标签节点的类名 */
  labelClass?: string;
  /** 追加到本项内容节点的类名 */
  contentClass?: string;
}

</script>

<template>
  <!--
    这里不产出任何 DOM。父级 RebornDescriptions 需要把所有项统一编排进 <table> 才能对齐列宽与边线，
    因此它直接读取本组件的 props 与插槽函数来渲染，子组件自身只作声明用。
  -->
  <slot />
</template>
