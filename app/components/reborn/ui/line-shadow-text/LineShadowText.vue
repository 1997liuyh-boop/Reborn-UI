<script setup lang="ts">
import type { VNode } from "vue";
import { Comment } from "vue";

interface LineShadowTextProps {
  shadowColor?: string;
  as?: keyof HTMLElement;
  class?: string;
  /** 文字内容，同时作为阴影层（data-text）的来源；不传时从默认插槽的纯文本中提取 */
  text?: string;
}

const props = withDefaults(defineProps<LineShadowTextProps>(), {
  shadowColor: "black",
  as: "span" as keyof HTMLElement,
});

defineSlots<{
  /** 正文，应为纯文本；不填时渲染 text */
  default?: () => VNode[];
}>();

/** 递归拼接插槽节点里的文字，组件节点与注释节点不计入 */
function getSlotText(nodes?: VNode[]): string {
  if (!nodes) return "";
  return nodes
    .map((node) => {
      if (node.type === Comment) return "";
      if (typeof node.children === "string") return node.children;
      if (Array.isArray(node.children)) return getSlotText(node.children as VNode[]);
      return "";
    })
    .join("");
}

let warned = false;

/**
 * 阴影文字在渲染期间解析（插槽只在渲染中调用，内容变化时随之更新）。
 * 取不到纯文本时只在开发环境提示一次，不再抛错中断整棵子树的渲染
 */
function resolveShadowText(nodes?: VNode[]): string {
  const text = props.text ?? getSlotText(nodes);
  if (!text && !warned && import.meta.dev) {
    warned = true;
    console.warn("[LineShadowText] 阴影层需要纯文本内容：请传入 text，或在默认插槽里只放文字");
  }
  return text;
}
</script>

<template>
  <component
    :is="as"
    class="shadow-color animate-line-shadow relative z-0 inline-flex after:absolute after:top-[0.04em] after:left-[0.04em] after:-z-10 after:bg-[linear-gradient(45deg,transparent_45%,var(--shadow-color)_45%,var(--shadow-color)_55%,transparent_0)] after:bg-[length:0.06em_0.06em] after:bg-clip-text after:text-transparent after:content-[attr(data-text)]"
    :class="[props.class]"
    :data-text="resolveShadowText($slots.default?.())"
  >
    <slot>{{ props.text }}</slot>
  </component>
</template>

<style scoped>
.shadow-color {
  --shadow-color: v-bind(props.shadowColor);
}

.animate-line-shadow::after {
  animation: line-shadow 15s linear infinite;
}

@keyframes line-shadow {
  0% {
    background-position: 0 0;
  }
  100% {
    background-position: 100% -100%;
  }
}
</style>
