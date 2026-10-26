<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { Motion } from "motion-v";
import { computed, onMounted, shallowRef, watch } from "vue";

interface Props {
  starsCount?: number;
  class?: HTMLAttributes["class"];
}

const props = withDefaults(defineProps<Props>(), {
  starsCount: 130,
});

/** 单颗星的起点与动画目标，生成后固定，组件重渲染时不再重新随机 */
interface StarConfig {
  initial: { top: string; left: string };
  animate: { top: string; left: string; opacity: number; scale: number[] };
}

function randomMove() {
  return Math.random() * 4 - 2;
}

function randomOpacity() {
  return Math.random();
}

function random() {
  return Math.random();
}

function generatePosition() {
  return {
    top: `calc(${random() * 100}% + ${randomMove()}px)`,
    left: `calc(${random() * 100}% + ${randomMove()}px)`,
  };
}

function generateEnterAnimation() {
  return {
    top: `calc(${random() * 100}% + ${randomMove()}px)`,
    left: `calc(${random() * 100}% + ${randomMove()}px)`,
    opacity: randomOpacity(),
    scale: [1, 1.2, 0],
  };
}

function createStar(): StarConfig {
  return { initial: generatePosition(), animate: generateEnterAnimation() };
}

/**
 * 随机配置只在客户端挂载后生成一次：渲染期调用 Math.random 时服务端与客户端结果不同，
 * 水合时 style 不一致且不会被修补；组件每次重渲染也会让所有星星拿到新目标而同时跳变
 */
const stars = shallowRef<StarConfig[]>([]);
const starTransition = shallowRef({ duration: 20, repeat: Infinity, ease: "linear" as const });

onMounted(() => {
  starTransition.value = { ...starTransition.value, duration: random() * 10 + 20 };
  stars.value = Array.from({ length: props.starsCount }, createStar);
});

// 数量变化时保留已有的星，只截断或补齐
watch(
  () => props.starsCount,
  (count) => {
    const current = stars.value;
    stars.value = count <= current.length
      ? current.slice(0, count)
      : [...current, ...Array.from({ length: count - current.length }, createStar)];
  },
);

const starClass = computed(() => [props.class]);
</script>

<template>
  <div class="absolute inset-0">
    <Motion
      v-for="(star, i) in stars"
      :key="i"
      as="span"
      :initial="star.initial"
      :animate="star.animate"
      :transition="starTransition"
      class="absolute z-[1] inline-block h-0.5 w-0.5 rounded-full bg-white"
      :class="starClass"
    />
  </div>
</template>
