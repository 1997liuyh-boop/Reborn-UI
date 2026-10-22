<script setup lang="ts">
/**
 * 总览卡片缩略：列表底部正在加载下一页，显示转圈图标与「加载中...」
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：组件本体只有底部那一行，
 * 单独放一行文字辨识度低，所以在上方补两条列表项交代「列表到底」的语境。
 * 加载图标复用 Web 端 RebornLoading（与 UniApp 版同一套环形动画），颜色取灰阶跟随明暗主题。
 */
import RebornLoading from '~/components/reborn/ui/reborn-loading/RebornLoading.vue'
</script>

<template>
  <div class="flex w-[200px] flex-col gap-1.5">
    <div
      v-for="i in 2"
      :key="i"
      class="flex items-center gap-2 rounded-lg border border-gray-3 bg-gray-1 p-1.5"
    >
      <div class="size-6 shrink-0 rounded-md bg-primary/15" />
      <div class="flex flex-1 flex-col gap-1">
        <div class="h-1.5 w-4/5 rounded-full bg-gray-4" />
        <div class="h-1.5 w-1/2 rounded-full bg-gray-3" />
      </div>
    </div>
    <!-- 加载更多：loading 状态 -->
    <div class="flex h-9 items-center justify-center gap-2 text-xs text-gray-6">
      <RebornLoading
        type="ring"
        color="var(--color-gray-6)"
        size="14px"
      />
      <span>加载中...</span>
    </div>
  </div>
</template>
