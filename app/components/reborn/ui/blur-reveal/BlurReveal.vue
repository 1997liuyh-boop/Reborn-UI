<script setup lang="ts">
import type { VNode } from "vue";
import { Motion } from "motion-v";
import { Comment, Fragment } from "vue";

interface Props {
  duration?: number;
  delay?: number;
  blur?: string;
  yOffset?: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  duration: 1,
  delay: 2,
  blur: "20px",
  yOffset: 20,
});

defineSlots<{
  /** 需要逐个模糊显现的内容，每个顶层节点各自做一次动画 */
  default?: () => VNode[];
}>();

/**
 * 展平插槽返回的节点：v-for 等会产生 Fragment，注释节点（v-if 占位）不参与动画。
 * 只在渲染期间（模板里）调用插槽，插槽内容变化时随父组件重渲染同步更新
 */
function flattenNodes(nodes: VNode[]): VNode[] {
  const result: VNode[] = [];
  for (const node of nodes) {
    if (node.type === Fragment && Array.isArray(node.children)) {
      result.push(...flattenNodes(node.children as VNode[]));
    } else if (node.type !== Comment) {
      result.push(node);
    }
  }
  return result;
}

function getInitial() {
  return {
    opacity: 0,
    filter: `blur(${props.blur})`,
    y: props.yOffset,
  };
}

function getAnimate() {
  return {
    opacity: 1,
    filter: `blur(0px)`,
    y: 0,
  };
}
</script>

<template>
  <div :class="props.class">
    <Motion
      v-for="(child, index) in flattenNodes($slots.default?.() ?? [])"
      :key="index"
      as="div"
      :initial="getInitial()"
      :while-in-view="getAnimate()"
      :transition="{
        duration: props.duration,
        easing: 'easeInOut',
        delay: props.delay * index,
      }"
    >
      <component :is="child" />
    </Motion>
  </div>
</template>
