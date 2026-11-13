<script setup lang="ts">
// 兄弟组件一律显式导入：经 CLI 复制到使用方项目后，不能指望对方的自动导入按同样的名字解析（如 Nuxt 的 pathPrefix）
import RippleCircle from "./RippleCircle.vue";

interface Props {
  baseCircleSize?: number;
  baseCircleOpacity?: number;
  spaceBetweenCircle?: number;
  circleOpacityDowngradeRatio?: number;
  circleClass?: string;
  waveSpeed?: number;
  numberOfCircles?: number;
}

withDefaults(defineProps<Props>(), {
  baseCircleSize: 210,
  baseCircleOpacity: 0.24,
  circleOpacityDowngradeRatio: 0.03,
  waveSpeed: 80,
  spaceBetweenCircle: 70,
  numberOfCircles: 7,
});
</script>

<template>
  <div class="absolute inset-0">
    <!-- v-for 的取值是 1..numberOfCircles，最外圈是 index === numberOfCircles -->
    <RippleCircle
      v-for="index in numberOfCircles"
      :key="index"
      :opacity="baseCircleOpacity - index * circleOpacityDowngradeRatio"
      :size="baseCircleSize + index * spaceBetweenCircle"
      :animation-delay="index * waveSpeed"
      :border-style="index === numberOfCircles ? 'dashed' : 'solid'"
      :class="circleClass"
    />
  </div>
</template>
