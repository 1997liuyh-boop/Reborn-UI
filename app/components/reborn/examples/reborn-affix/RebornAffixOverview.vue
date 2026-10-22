<script setup lang="ts">
/**
 * 总览卡片缩略：页面框右缘吸附着一枚可拖拽的悬浮按钮，虚线轨迹标出它从页面中部被拖过去、松手后吸边
 *
 * RebornAffix 是 fixed 定位、按窗口尺寸计算位置的浮层，挂进卡片会悬浮到整个视口上，
 * 因此只用静态 DOM 模拟「页面 + 悬浮按钮」，按钮外观与 Demo 里的主色圆形按钮一致。
 */
</script>

<template>
  <div class="relative h-[124px] w-[200px] overflow-hidden rounded-lg border border-gray-3 bg-gray-1">
    <!-- 页面内容条：悬浮按钮不占这里的文档流 -->
    <div class="flex flex-col gap-2 p-3">
      <div class="h-2.5 w-20 rounded-sm bg-gray-3" />
      <div class="h-2 w-full rounded-sm bg-gray-2" />
      <div class="h-2 w-[85%] rounded-sm bg-gray-2" />
      <div class="h-2 w-[70%] rounded-sm bg-gray-2" />
      <div class="mt-1 h-6 w-[55%] rounded-md bg-gray-2" />
    </div>

    <!-- 拖拽起点：按钮原先所在的位置 -->
    <div class="absolute top-[54px] left-[64px] size-8 rounded-full border border-dashed border-primary/70 bg-primary/10" />

    <!-- 拖拽轨迹：松手后吸附到右侧边缘 -->
    <svg
      class="absolute inset-0 size-full"
      viewBox="0 0 198 122"
      fill="none"
    >
      <path
        d="M98 72 Q126 86 150 72"
        class="stroke-primary"
        stroke-width="1.5"
        stroke-dasharray="3 3"
        stroke-linecap="round"
      />
      <path
        d="M144 69 L151 71.5 L146 77"
        class="stroke-primary"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>

    <!-- 吸附在右缘的悬浮按钮 -->
    <div class="absolute top-[50px] right-2 flex size-9 items-center justify-center rounded-full bg-primary text-white shadow-lg">
      <Icon
        name="lucide:move"
        class="size-4"
      />
    </div>
  </div>
</template>
