<script setup lang="ts">
/**
 * 总览卡片缩略：两列滚轮选择器，停在「周三 · 上午」
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：中间一行是主色浅底的圆角指示条，
 * 选中项为主色加粗，其余项按离中线的距离逐级变淡（原生 picker-view 的上下渐隐遮罩）。
 * 每列只画可视窗口内的五行，列表本身不可滚动。
 */
const columns = [
  ['周一', '周二', '周三', '周四', '周五'],
  ['', '', '上午', '下午', ''],
]
/** 中线所在的行序号 */
const centerRow = 2

/** 按离中线的距离给出透明度，模拟上下渐隐 */
function fadeClass(row: number) {
  const distance = Math.abs(row - centerRow)
  if (distance === 0) return 'font-bold text-primary'
  return distance === 1 ? 'text-gray-8 opacity-60' : 'text-gray-8 opacity-25'
}
</script>

<template>
  <div class="relative w-[196px] rounded-lg border border-gray-3 bg-gray-1 px-1 py-0.5">
    <!-- 选中指示条：与 indicatorStyle 一致，左右各留 2px、圆角 10px -->
    <div class="absolute inset-x-1.5 top-1/2 h-6 -translate-y-1/2 rounded-[10px] bg-primary/10" />
    <div class="relative flex">
      <div
        v-for="(column, columnIndex) in columns"
        :key="columnIndex"
        class="flex flex-1 flex-col"
      >
        <div
          v-for="(label, row) in column"
          :key="row"
          class="flex h-6 items-center justify-center text-xs"
          :class="[fadeClass(row)]"
        >
          {{ label }}
        </div>
      </div>
    </div>
  </div>
</template>
