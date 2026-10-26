<script setup lang="ts">
import { useElementBounding, useMounted, useWindowScroll, useWindowSize } from "@vueuse/core";
import { computed, useTemplateRef } from "vue";

const containerRef = useTemplateRef<HTMLElement>("containerRef");

// 不直接访问 window：服务端渲染时这些组合式函数拿不到 window 会返回默认值，不会抛错
const { width, height } = useWindowSize();
const { y: scrollY } = useWindowScroll();
const { bottom } = useElementBounding(containerRef);
const mounted = useMounted();

// 挂载前固定为 false，与服务端首屏一致，避免水合时缩放比例不一致
const isMobile = computed(() => mounted.value && width.value <= 768);

const scrollYProgress = computed(() => {
  if (!bottom.value) return 0;
  return 1 - Math.max(0, bottom.value - scrollY.value) / height.value;
});

const scaleDimensions = computed(() => (isMobile.value ? [0.7, 0.9] : [1.05, 1]));

const rotate = computed(() => 20 * (1 - scrollYProgress.value));
const scale = computed(() => {
  const [start, end] = scaleDimensions.value;
  return start + (end - start) * scrollYProgress.value;
});
const translateY = computed(() => -100 * scrollYProgress.value);
</script>

<template>
  <div
    ref="containerRef"
    class="relative flex h-[60rem] items-center justify-center p-2 md:h-[80rem] md:p-20"
  >
    <div
      class="relative w-full py-10 md:py-40"
      style="perspective: 1000px"
    >
      <ContainerScrollTitle :translate="translateY">
        <slot name="title" />
      </ContainerScrollTitle>
      <ContainerScrollCard
        :rotate="rotate"
        :scale="scale"
      >
        <slot name="card" />
      </ContainerScrollCard>
    </div>
  </div>
</template>
