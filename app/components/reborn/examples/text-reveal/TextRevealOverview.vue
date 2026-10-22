<script setup lang="ts">
/**
 * 总览卡片缩略：两行标题文字按行从下方遮罩里依次升起，最后停在完整排版上
 *
 * 揭示动画是挂载时的一次性 GSAP 补间（不依赖滚动），播放一次即结束，GSAP 在无动画时会自动休眠，
 * 因此直接用真实组件；字号收到 text-xl，让文字在卡片里折成两行，逐行升起的节奏更明显。
 */
</script>

<template>
  <TextReveal
    class="text-highlighted max-w-[200px] text-center text-xl leading-relaxed font-semibold"
  >
    用 Reborn UI 更快地搭建好看的页面
  </TextReveal>
</template>
