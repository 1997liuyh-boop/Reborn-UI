<script setup lang="ts">
/**
 * 总览卡片缩略：等宽大写字母「REBORN UI」由随机乱码逐位还原
 *
 * 组件的乱码定时器在全部字符还原后会自行暂停，挂载时播一次即停在终态，可直接使用。
 * 悬停重播在卡片里因禁交互不会触发。
 */
</script>

<template>
  <HyperText
    text="Reborn UI"
    class="text-highlighted text-3xl font-bold"
    :duration="800"
    animate-on-load
  />
</template>
