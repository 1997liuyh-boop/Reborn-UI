<script setup lang="ts">
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";
import { mountAsciiTransition } from "~/lib/payathon/ascii-transition";

/**
 * 区块之间的 ASCII 过渡带：一条 256px 高的字符网格，随滚动从上一区块的底色「溶解」到下一区块。
 * 进入权益区前一条、离开合作伙伴区后一条（exit），两条方向相反。
 *
 * 原站在画布就绪前用一张约 127KB 的 SVG 占位图铺底，画布挂载后立即覆盖，这里不再内联那张占位图。
 * data-astro-cid-* 是原站样式的作用域属性，保留以命中对应规则。
 */
interface Props {
  /** 离场方向的过渡带（合作伙伴区之后） */
  exit?: boolean;
}

defineProps<Props>();

const rootRef = useTemplateRef<HTMLElement>("root");
let cleanup: (() => void) | null = null;

onMounted(() => {
  if (rootRef.value) cleanup = mountAsciiTransition(rootRef.value);
});

onBeforeUnmount(() => {
  cleanup?.();
  cleanup = null;
});
</script>

<template>
  <div
    ref="root"
    class="ascii-section-transition"
    :class="{ 'ascii-section-transition--exit': exit }"
    data-ascii-transition
    aria-hidden="true"
    data-astro-cid-zvihkcu2
  >
    <div class="ascii-stage" data-astro-cid-zvihkcu2>
      <canvas aria-hidden="true" data-astro-cid-zvihkcu2 />
    </div>
  </div>
</template>
