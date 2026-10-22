<script setup lang="ts">
/**
 * 总览卡片缩略：三列错落排布的图文卡片，每列高度不一、底部齐平
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：瀑布流按列等宽、卡片高度随图片比例变化，
 * 新卡片总是追加到最矮的一列。Web 端 Demo 没有可复用的图片，图片区用语义色渐变块代替；
 * 每列卡片高度预先配平，保证整体不超出缩略图区域。
 */
interface Tile {
  /** 卡片总高度（px） */
  height: number
  /** 图片区渐变色 */
  tone: string
}

const columns: Tile[][] = [
  [
    { height: 70, tone: 'from-primary/40 to-primary/10' },
    { height: 48, tone: 'from-info/40 to-info/10' },
  ],
  [
    { height: 46, tone: 'from-warning/40 to-warning/10' },
    { height: 72, tone: 'from-success/40 to-success/10' },
  ],
  [
    { height: 58, tone: 'from-error/35 to-error/10' },
    { height: 60, tone: 'from-primary/30 to-info/10' },
  ],
]
</script>

<template>
  <div class="flex w-[198px] gap-1.5">
    <div
      v-for="(column, columnIndex) in columns"
      :key="columnIndex"
      class="flex flex-1 flex-col gap-1.5"
    >
      <div
        v-for="(tile, index) in column"
        :key="index"
        class="flex flex-col overflow-hidden rounded-md border border-gray-3 bg-gray-1"
        :style="{ height: `${tile.height}px` }"
      >
        <div
          class="flex-1 bg-linear-to-br"
          :class="[tile.tone]"
        />
        <div class="flex flex-col gap-[3px] p-1">
          <div class="h-1 w-full rounded-full bg-gray-4" />
          <div class="h-1 w-3/5 rounded-full bg-gray-3" />
        </div>
      </div>
    </div>
  </div>
</template>
