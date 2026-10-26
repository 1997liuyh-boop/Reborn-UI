<script lang="ts" setup>
import { useEventListener } from "@vueuse/core";
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from "vue";

interface Props {
  class?: string;
  text: string;
}

const props = defineProps<Props>();

const textScrollRevealRef = useTemplateRef<HTMLElement>("textScrollRevealRef");

/** 每个词的显现区间，预先算好：模板里写数组字面量每次渲染都会新建，进度没变也会强制子组件更新 */
const words = computed(() => {
  const values = props.text.split(" ");
  const total = values.length;
  return values.map((word, i) => ({ word, range: [i / total, (i + 1) / total] }));
});

const scrollYProgress = shallowRef(0);

function updateScrollYProgress() {
  if (textScrollRevealRef.value) {
    const boundingRect = textScrollRevealRef.value.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    scrollYProgress.value = (boundingRect.y / windowHeight) * -1;
  }
}

/** 滚动与缩放按帧合并：一帧内多次事件只测量、更新一次 */
let frame = 0;
function scheduleUpdate() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    updateScrollYProgress();
  });
}

// 不传目标时默认挂到 window 且服务端不执行；passive 不阻塞滚动，卸载时自动移除
useEventListener("scroll", scheduleUpdate, { passive: true });
useEventListener("resize", scheduleUpdate, { passive: true });

onMounted(updateScrollYProgress);

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <div
    ref="textScrollRevealRef"
    class="relative z-0 h-[200vh]"
    :class="[$props.class]"
  >
    <div class="sticky top-0 mx-auto flex h-1/2 max-w-4xl items-center bg-transparent px-4 py-20">
      <p
        class="flex flex-wrap p-5 text-2xl font-bold text-black/20 md:p-8 md:text-3xl lg:p-10 lg:text-4xl xl:text-5xl dark:text-white/20"
      >
        <ScrollWord
          v-for="(item, i) in words"
          :key="i"
          :word="item.word"
          :progress="scrollYProgress"
          :range="item.range"
        />
      </p>
    </div>
  </div>
</template>
