<script setup lang="ts">
/**
 * 总览卡片缩略：中心向外扩散的主色同心圆
 *
 * Ripple 是纯 CSS 关键帧，直接挂载真组件；默认首圈 210px、圈距 70px 放不进卡片，
 * 这里缩到首圈 20px、圈距 21px、共 5 圈，最大一圈不超过 128px，底部沿用 Demo 的渐隐遮罩。
 */
</script>

<template>
  <div class="relative flex h-32 w-50 items-center justify-center overflow-hidden">
    <span class="bg-primary relative z-10 size-3 rounded-full shadow-sm" />
    <Ripple
      class="[mask-image:linear-gradient(to_bottom,white,transparent)]"
      circle-class="border-primary/50 bg-primary/10 rounded-full"
      :base-circle-size="20"
      :space-between-circle="21"
      :number-of-circles="5"
      :base-circle-opacity="0.8"
      :circle-opacity-downgrade-ratio="0.12"
    />
  </div>
</template>
