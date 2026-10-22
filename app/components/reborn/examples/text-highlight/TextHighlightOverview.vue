<script setup lang="ts">
/**
 * 总览卡片缩略：两行粗体标题，第二行的关键词被渐变色块从左到右刷亮
 *
 * 高亮是一次性 CSS 动画（forwards 停在终态），直接用真实组件。
 * 色块是固定的浅紫渐变，暗色主题下白字压在浅底上看不清，
 * 所以用 textEndColor 让文字随高亮一起过渡成深色，两种主题下都可读。
 */
</script>

<template>
  <h1 class="text-highlighted max-w-[200px] text-center text-2xl font-bold text-balance">
    你是一位
    <TextHighlight
      class="rounded-lg bg-linear-to-r from-indigo-300 to-purple-300"
      text-end-color="#1e1b4b"
    >
      了不起的开发者
    </TextHighlight>
  </h1>
</template>
