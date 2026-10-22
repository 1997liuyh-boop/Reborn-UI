<script setup lang="ts">
/**
 * 总览卡片缩略：头部、主体、页脚三段的页面框，主体区域被虚线勾出并撑满剩余高度
 *
 * RebornMain 自身没有外观，只负责撑起最小高度（默认 min-h-screen），
 * 缩略图通过 ui.base 改成在框内 flex-1 撑满，再用主色虚线把它的范围标出来。
 */
</script>

<template>
  <div class="flex h-[124px] w-[200px] flex-col overflow-hidden rounded-lg border border-gray-3 bg-gray-1">
    <!-- 头部 -->
    <div class="flex h-6 shrink-0 items-center gap-1.5 border-b border-gray-3 px-2.5">
      <span class="size-2 rounded-full bg-gray-4" />
      <span class="text-[10px] leading-none text-gray-6">头部</span>
    </div>

    <RebornMain
      class="m-1.5 flex flex-col gap-1.5 rounded-md border border-dashed border-primary/60 bg-primary/5 p-2"
      :ui="{ base: 'relative min-h-0 flex-1' }"
    >
      <span class="text-[10px] leading-none font-medium text-primary">主体 · 撑满剩余高度</span>
      <div class="h-1.5 w-[80%] rounded-sm bg-gray-3" />
      <div class="h-1.5 w-[60%] rounded-sm bg-gray-3" />
      <Icon
        name="lucide:move-vertical"
        class="absolute right-2 bottom-2 size-3.5 text-primary"
      />
    </RebornMain>

    <!-- 页脚：始终贴在底部 -->
    <div class="flex h-5 shrink-0 items-center gap-1.5 border-t border-gray-3 px-2.5">
      <span class="text-[10px] leading-none text-gray-6">页脚</span>
      <span class="h-1 w-10 rounded-sm bg-gray-3" />
    </div>
  </div>
</template>
