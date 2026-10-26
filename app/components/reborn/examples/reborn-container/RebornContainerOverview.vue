<script setup lang="ts">
import RebornContainer from "~/components/reborn/ui/reborn-container/RebornContainer.vue";

/**
 * 总览卡片缩略：浏览器视口里一列限宽居中的内容，上方标尺标出最大宽度
 *
 * 默认最大宽度跟随 --ui-container，放进卡片时等于撑满、看不出居中，
 * 这里通过 ui.root 把最大宽度收到 140px、内边距收到 12px，左右虚线即容器边界。
 */
</script>

<template>
  <div class="flex h-[124px] w-[200px] flex-col overflow-hidden rounded-lg border border-gray-3 bg-gray-2">
    <!-- 浏览器顶栏 -->
    <div class="flex h-4 shrink-0 items-center gap-1 border-b border-gray-3 bg-gray-1 px-2">
      <span class="size-1.5 rounded-full bg-gray-4" />
      <span class="size-1.5 rounded-full bg-gray-4" />
      <span class="size-1.5 rounded-full bg-gray-4" />
    </div>

    <!-- 最大宽度标尺：与容器同宽 -->
    <div class="mx-auto flex h-5 w-[140px] shrink-0 items-center gap-1 text-[10px] leading-none text-primary">
      <span class="h-2 w-px bg-primary" />
      <span class="h-px flex-1 bg-primary/50" />
      <span>最大宽度</span>
      <span class="h-px flex-1 bg-primary/50" />
      <span class="h-2 w-px bg-primary" />
    </div>

    <RebornContainer
      class="flex min-h-0 flex-1 flex-col gap-1.5 border-x border-dashed border-primary/60 bg-gray-1 py-2"
      :ui="{ root: 'max-w-[140px] px-3 sm:px-3 lg:px-3' }"
    >
      <div class="h-2.5 w-14 rounded-sm bg-gray-4" />
      <div class="h-1.5 w-full rounded-sm bg-gray-2" />
      <div class="h-1.5 w-[80%] rounded-sm bg-gray-2" />
      <div class="mt-0.5 grid flex-1 grid-cols-2 gap-1.5">
        <div class="rounded-sm bg-primary/15" />
        <div class="rounded-sm bg-gray-2" />
      </div>
    </RebornContainer>
  </div>
</template>
