<script setup lang="ts">
/**
 * 总览卡片缩略：粗体「快速上线」，其中「上线」为斜体并带斜线纹理的错位阴影
 *
 * 阴影纹理的流动是纯 CSS 关键帧，直接使用组件。
 * 阴影色用 Nuxt UI 的高亮文字色变量，明暗模式下自动在黑白之间切换，不必像 Demo 那样读颜色模式。
 * 阴影层是绝对定位的伪元素，可用宽度比文字少一个偏移量，小字号下会折行，故补 after:whitespace-nowrap。
 */
</script>

<template>
  <h3 class="text-highlighted text-5xl leading-none font-extrabold tracking-tighter">
    快速<LineShadowText
      class="italic after:whitespace-nowrap"
      shadow-color="var(--ui-text-highlighted)"
    >
      上线
    </LineShadowText>
  </h3>
</template>
