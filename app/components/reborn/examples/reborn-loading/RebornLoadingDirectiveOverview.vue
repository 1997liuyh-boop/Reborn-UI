<script setup lang="ts">
/**
 * 总览卡片缩略：一块数据看板正在加载，v-loading 在其上盖出半透明遮罩、环形图标与提示文字
 *
 * 直接使用真实指令的局部模式：遮罩只挂在宿主元素内，不锁滚动、不挂 body。
 */

/** 看板顶部的三项指标 */
const stats = [
  { label: '订单', value: '1,284' },
  { label: '营收', value: '9.6万' },
  { label: '转化', value: '3.2%' },
]

/** 趋势柱高度（百分比） */
const bars = [40, 65, 50, 80, 60, 90, 72]
</script>

<template>
  <div
    v-loading="true"
    reborn-loading-text="正在同步…"
    reborn-loading-size="22px"
    class="relative flex h-[116px] w-[200px] flex-col gap-2.5 overflow-hidden rounded-lg border border-gray-3 bg-gray-1 p-3"
  >
    <div class="grid grid-cols-3 gap-2">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="flex flex-col gap-0.5"
      >
        <span class="text-[10px] leading-none text-gray-6">{{ stat.label }}</span>
        <span class="text-sm font-semibold text-gray-9">{{ stat.value }}</span>
      </div>
    </div>
    <div class="flex flex-1 items-end gap-1.5">
      <div
        v-for="(height, index) in bars"
        :key="index"
        class="flex-1 rounded-t-sm bg-primary/50"
        :style="{ height: `${height}%` }"
      />
    </div>
  </div>
</template>
