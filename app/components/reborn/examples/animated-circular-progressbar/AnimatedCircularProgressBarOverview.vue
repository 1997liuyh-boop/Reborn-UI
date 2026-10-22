<script setup lang="ts">
/**
 * 总览卡片缩略：停在 68% 的圆形进度环
 *
 * Demo 靠 setInterval 每 2 秒推进一次数值，总览页的缩略图挂载后不会卸载，
 * 这里直接给固定值、不起定时器；默认底环 rgba(0,0,0,0.1) 在暗色下几乎看不见，改用会随明暗切换的灰阶令牌。
 */
</script>

<template>
  <AnimatedCircularProgressBar
    :value="68"
    :min="0"
    :max="100"
    gauge-primary-color="var(--color-primary)"
    gauge-secondary-color="var(--color-gray-3)"
    class="size-28! text-gray-9"
  />
</template>
