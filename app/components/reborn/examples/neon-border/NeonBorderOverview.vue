<script setup lang="ts">
/**
 * 总览卡片缩略：全圈描边动画的霓虹输入框
 *
 * 选 full 动画：组件的辉光被自身 overflow-hidden 裁掉，只剩 1px 描边上的颜色，
 * half 在小尺寸下同一时刻只亮两小段，full 能让蓝、粉两色同时占满大半圈。
 * 宽度定在 160px：描边层整块旋转，转到竖直时外接框高度等于宽度，再宽会顶出卡片内容区。
 * 内部用静态 DOM 仿输入框外观（不放真实 input，避免可聚焦元素），四周各让出 1px，描边加粗到 2px。
 */
</script>

<template>
  <div class="w-40">
    <NeonBorder animation-type="full">
      <div
        class="bg-default m-px flex h-[calc(100%-2px)] w-[calc(100%-2px)] items-center gap-2 rounded-[7px] px-3 text-sm text-muted"
      >
        <Icon
          name="lucide:search"
          class="size-4 shrink-0"
        />
        <span class="truncate">搜索组件</span>
      </div>
    </NeonBorder>
  </div>
</template>
