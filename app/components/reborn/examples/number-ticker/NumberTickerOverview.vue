<script setup lang="ts">
/**
 * 总览卡片缩略：大号数字从 0 滚动到「12,800」后停住，下方一行说明文字
 *
 * 组件只在首次进入视口时过渡一次（useTransition 播完即停），可直接使用。
 */
</script>

<template>
  <div class="flex flex-col items-center gap-1">
    <NumberTicker
      :value="12800"
      :decimal-places="0"
      class="text-5xl font-medium"
    />
    <span class="text-muted text-xs">本月新增用户</span>
  </div>
</template>
