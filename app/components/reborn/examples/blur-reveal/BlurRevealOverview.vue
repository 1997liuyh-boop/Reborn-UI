<script setup lang="ts">
/**
 * 总览卡片缩略：标题「你好 👋」与副标题先后由模糊上浮到清晰
 *
 * 入场动画只在进入视口时播放一次并停在清晰终态，不常驻，可直接使用组件。
 */
</script>

<template>
  <BlurReveal
    :delay="0.2"
    :duration="0.75"
    class="text-center"
  >
    <h2 class="text-highlighted text-3xl font-bold tracking-tighter">
      你好 👋
    </h2>
    <span class="text-muted text-xl tracking-tighter">最近怎么样？</span>
  </BlurReveal>
</template>
