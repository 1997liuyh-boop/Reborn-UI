<script setup lang="ts">
/**
 * 总览卡片缩略：一句带链接的文案，链接上方已弹出网页截图预览
 *
 * 预览只在悬停时出现，且截图来自 microlink 外部接口；缩略图里链接本身直接挂载组件，
 * 弹出的预览卡片按组件外框样式用 DOM 静态模拟，内部用色块示意网页截图，不发起截图请求。
 */
</script>

<template>
  <div class="flex flex-col items-center">
    <!-- 模拟已弹出的预览卡片 -->
    <div class="mb-2 overflow-hidden rounded-xl shadow-xl">
      <div class="rounded-xl bg-gray-1 p-1 shadow-lg ring-1 ring-gray-3">
        <div class="flex h-[76px] w-[136px] flex-col gap-1.5 rounded-lg bg-gray-2 p-2">
          <div class="flex items-center gap-1">
            <span class="size-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500" />
            <span class="h-1 w-6 rounded-full bg-gray-4" />
            <span class="ml-auto h-1 w-4 rounded-full bg-gray-3" />
            <span class="h-1 w-4 rounded-full bg-gray-3" />
          </div>
          <span class="mt-1 h-2 w-20 rounded-full bg-gray-6" />
          <span class="h-1.5 w-24 rounded-full bg-gray-4" />
          <span class="h-1.5 w-16 rounded-full bg-gray-4" />
          <span class="mt-auto h-3 w-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>
      </div>
    </div>
    <p class="text-sm whitespace-nowrap text-gray-7">
      访问
      <LinkPreview url="https://reborn-ui.com">
        <span class="bg-gradient-to-br from-purple-500 to-pink-500 bg-clip-text font-bold text-transparent">
          Reborn UI
        </span>
      </LinkPreview>
      查看更多组件
    </p>
  </div>
</template>
