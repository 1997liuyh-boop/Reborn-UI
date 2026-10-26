<script setup lang="ts">
/**
 * 总览卡片缩略：组件写在一张会裁剪内容的卡片里，渲染结果却出现在页面根节点上，虚线箭头连接两处
 *
 * RebornRootPortal 只做一件事：把插槽内容 Teleport 到 body，本身没有外观；
 * 缩略图不真的传送，用静态 DOM 画出「原位置 → 根节点」的去向。
 */
import { Icon } from '#components';
</script>

<template>
  <div class="relative h-[124px] w-[200px] overflow-hidden rounded-lg border border-gray-3 bg-gray-2">
    <span class="absolute top-2 left-2.5 font-mono text-[10px] leading-none text-gray-6">body</span>

    <!-- 会裁剪内容的卡片：组件写在这里 -->
    <div class="absolute bottom-3 left-3 flex h-[66px] w-[92px] flex-col gap-1.5 overflow-hidden rounded-md border border-gray-3 bg-gray-1 p-2">
      <span class="text-[10px] leading-none text-gray-6">卡片</span>
      <div class="h-1.5 w-full rounded-sm bg-gray-2" />
      <div class="flex flex-1 items-center justify-center rounded-sm border border-dashed border-primary/70 text-[10px] leading-none text-primary">
        原位置
      </div>
    </div>

    <!-- 传送到根节点后的浮层 -->
    <div class="absolute top-4 right-3 flex w-[76px] flex-col gap-1.5 rounded-md bg-gray-1 p-2 shadow-lg ring-1 ring-primary/50">
      <div class="flex items-center gap-1">
        <Icon
          name="lucide:message-square"
          class="size-3 text-primary"
        />
        <span class="text-[10px] leading-none text-gray-9">浮层内容</span>
      </div>
      <div class="h-1.5 w-full rounded-sm bg-gray-2" />
      <div class="h-1.5 w-[70%] rounded-sm bg-gray-2" />
    </div>

    <!-- 去向：从卡片里的原位置指向根节点上的浮层 -->
    <svg
      class="pointer-events-none absolute inset-0 size-full"
      viewBox="0 0 198 122"
      fill="none"
    >
      <path
        d="M98 90 C114 90 121 84 123 75"
        class="stroke-primary"
        stroke-width="1.5"
        stroke-dasharray="3 3"
        stroke-linecap="round"
      />
      <path
        d="M119 77.5 L123.5 72 L127 78.5"
        class="stroke-primary"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </div>
</template>
