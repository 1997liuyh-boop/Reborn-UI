<script setup lang="ts">
/**
 * 总览卡片缩略：一行半透明标题文字，一道光泽从左向右扫过
 *
 * 光泽流动是组件自带的纯 CSS 循环（background-position 关键帧），开销很小，保留原样；
 * 演示里的 5 秒周期沿用，字号收到 text-xl 让整行放进卡片。
 */
</script>

<template>
  <RadiantText
    class="inline-flex items-center justify-center px-2 py-1"
    :duration="5"
  >
    <span class="text-xl font-bold whitespace-nowrap">✨ 认识 Reborn UI</span>
  </RadiantText>
</template>
