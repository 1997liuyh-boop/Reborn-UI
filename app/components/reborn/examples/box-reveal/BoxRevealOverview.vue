<script setup lang="ts">
/**
 * 总览卡片缩略：主色色块从左向右扫过，露出「Reborn UI.」标题与一行副标题
 *
 * 色块滑出与文字上浮都只在进入视口时播一次，终态即完整文字，可直接使用组件。
 * 色块取站点主色而非 Demo 的固定红色，切换主题色时缩略图跟着变。
 */
</script>

<template>
  <div class="flex flex-col items-start">
    <BoxReveal color="var(--color-primary)">
      <p class="text-highlighted text-3xl font-semibold">
        Reborn UI<span class="text-primary">.</span>
      </p>
    </BoxReveal>
    <BoxReveal
      color="var(--color-primary)"
      :duration="0.8"
    >
      <p class="text-muted mt-1 text-sm">
        为 <span class="text-primary">Vue &amp; Nuxt</span> 准备的组件库
      </p>
    </BoxReveal>
  </div>
</template>
