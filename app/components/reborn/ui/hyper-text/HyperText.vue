<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { useIntervalFn } from "@vueuse/core";
import { Motion } from "motion-v";
import { computed, onMounted, shallowRef, watch } from "vue";

interface Props {
  class?: HTMLAttributes["class"];
  text: string;
  duration?: number;
  animateOnLoad: boolean;
}

const props = withDefaults(
  defineProps<Props>(),
  {
    duration: 800,
  },
);

const alphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
// 字母数组每帧整体替换，不就地修改
const displayText = shallowRef(props.text.split(""));
const iterations = shallowRef(0);

function getRandomLetter() {
  return alphabets[Math.floor(Math.random() * alphabets.length)];
}
function triggerAnimation() {
  iterations.value = 0;
  startAnimation();
}

const { pause, resume } = useIntervalFn(
  () => {
    if (iterations.value < props.text.length) {
      const arr = displayText.value?.map((l, i) =>
        l === " " ? l : i <= iterations.value ? props.text[i] : getRandomLetter(),
      );
      displayText.value = (arr ?? []) as string[];
      iterations.value += 0.1;
    } else {
      pause();
    }
  },
  computed(() => props.duration / (props.text.length * 10)),
  // 显式关闭立即启动：@vueuse 的 useIntervalFn 默认 immediate 为 true，会让 animateOnLoad=false 也在挂载时播放
  { immediate: false },
);

function startAnimation() {
  pause();
  resume();
}

watch(
  () => props.text,
  (newText) => {
    displayText.value = newText.split("");
    triggerAnimation();
  },
);

// 首播放在挂载后：只在客户端执行，服务端渲染不会起定时器
onMounted(() => {
  if (props.animateOnLoad) triggerAnimation();
});
</script>

<template>
  <div
    class="flex scale-100 cursor-default overflow-hidden py-2"
    :class="[$props.class]"
    @mouseenter="triggerAnimation"
  >
    <div class="flex">
      <Motion
        v-for="(letter, i) in displayText"
        :key="i"
        as="span"
        :class="[letter === ' ' ? 'w-3' : '', $props.class]"
        class="inline-block font-mono"
        :initial="{ opacity: 0, y: -10 }"
        :animate="{ opacity: 1, y: 0 }"
        :delay="i * (duration / (text.length * 10))"
      >
        {{ letter.toUpperCase() }}
      </Motion>
    </div>
  </div>
</template>
