<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";

interface Props {
  words: string;
  filter?: boolean;
  duration?: number;
  delay?: number;
  class?: HTMLAttributes["class"];
}

const props = withDefaults(
  defineProps<Props>(),
  { duration: 0.7, delay: 0, filter: true },
);

const wordsArray = computed(() => props.words.split(" "));

/**
 * 是否已开始渐显。渐显完全由状态驱动、由 Vue 统一写 style：
 * 直接改 span.style 会与 :style 绑定争抢同一属性，words 变化后新词停在透明，
 * filter / duration 变化时 Vue 又会把已显示的文字打回透明
 */
const started = shallowRef(false);

let frame = 0;

function cancelFrame() {
  if (frame) {
    cancelAnimationFrame(frame);
    frame = 0;
  }
}

/** 无过渡地回到起始态，等起始帧渲染后再开启过渡，逐词渐显 */
function replay() {
  cancelFrame();
  started.value = false;
  // 双 rAF：保证透明的起始态先完成样式计算并绘制，否则过渡不会触发、文字直接出现
  frame = requestAnimationFrame(() => {
    frame = requestAnimationFrame(() => {
      frame = 0;
      started.value = true;
    });
  });
}

onMounted(replay);
watch(() => props.words, replay);
onBeforeUnmount(cancelFrame);

/** 单个词的样式：起始态不带过渡，开始后按 delay + 词序 × 200ms 依次渐显 */
function wordStyle(idx: number) {
  if (!started.value) {
    return {
      opacity: 0,
      filter: props.filter ? "blur(10px)" : "none",
      transition: "none",
    };
  }
  return {
    opacity: 1,
    filter: props.filter ? "blur(0px)" : "none",
    transition: `opacity ${props.duration}s, filter ${props.duration}s`,
    transitionDelay: `${props.delay + idx * 200}ms`,
  };
}
</script>

<template>
  <div
    class="leading-snug tracking-wide"
    :class="[props.class]"
  >
    <div>
      <span
        v-for="(word, idx) in wordsArray"
        :key="word + idx"
        class="inline-block"
        :style="wordStyle(idx)"
      >
        {{ word }}&nbsp;
      </span>
    </div>
  </div>
</template>
