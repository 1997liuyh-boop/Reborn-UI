<script setup lang="ts">
/**
 * 总览卡片缩略：一张资料卡被局部遮罩盖住，遮罩中央是一块提示
 *
 * 用 absolute 模式只覆盖卡片本身，并关闭滚动锁定；默认的全屏遮罩会盖住整页，不能放进缩略图。
 */
import RebornOverlay from '~/components/reborn/ui/reborn-overlay/RebornOverlay.vue'
</script>

<template>
  <div class="relative isolate h-[120px] w-[200px] overflow-hidden rounded-lg border border-gray-3 bg-gray-1">
    <!-- 被遮住的卡片内容 -->
    <div class="flex flex-col gap-2.5 p-3">
      <div class="flex items-center gap-2">
        <div class="size-7 rounded-full bg-primary/30" />
        <div class="flex flex-col gap-1">
          <div class="h-2 w-16 rounded-sm bg-gray-4" />
          <div class="h-1.5 w-10 rounded-sm bg-gray-3" />
        </div>
      </div>
      <div class="h-10 rounded-md bg-gray-2" />
      <div class="h-1.5 w-[80%] rounded-sm bg-gray-3" />
    </div>

    <RebornOverlay
      :model-value="true"
      absolute
      :lock-scroll="false"
      :close-on-click-overlay="false"
      :z-index="1"
    >
      <div class="flex h-full items-center justify-center">
        <div class="flex items-center gap-1.5 rounded-md bg-gray-1 px-3 py-2 text-xs text-gray-9 shadow-md">
          <Icon
            name="lucide:lock"
            class="size-3.5 text-primary"
          />
          内容已锁定
        </div>
      </div>
    </RebornOverlay>
  </div>
</template>
