<script setup lang="ts">
/**
 * 总览卡片缩略：左侧竖线上三个圆点节点，紫蓝渐变光束已从顶部点亮到第二个节点，右侧是版本号与说明
 *
 * 光束长度由页面滚动进度驱动（motion-v 的 useScroll），缩略图不能依赖滚动；
 * 这里按组件的节点、灰色底线与渐变光束样式，静态摆出滚动到一半时的画面。
 */
const items = [
  { label: '1.0 版本', text: '首个公开版本' },
  { label: '2.0 版本', text: '新增暗色主题' },
  { label: '3.0 版本', text: '支持多端同步' },
]
</script>

<template>
  <div class="relative w-[180px]">
    <!-- 灰色底线 -->
    <div class="absolute top-1 bottom-1 left-[9px] w-[2px] bg-gradient-to-b from-transparent via-gray-3 to-transparent" />
    <!-- 已点亮的光束 -->
    <div class="absolute top-1 left-[9px] h-[62%] w-[2px] rounded-full bg-gradient-to-t from-purple-500 via-blue-500 via-10% to-transparent" />
    <div class="flex flex-col gap-2.5">
      <div
        v-for="item in items"
        :key="item.label"
        class="relative flex items-start gap-3"
      >
        <div class="flex size-5 shrink-0 items-center justify-center rounded-full bg-gray-1">
          <div class="size-2.5 rounded-full border border-gray-4 bg-gray-3" />
        </div>
        <div class="flex flex-col">
          <span class="text-sm leading-5 font-bold text-gray-6">{{ item.label }}</span>
          <span class="text-xs text-gray-9">{{ item.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
