<script setup lang="ts">
/**
 * 总览卡片缩略：展开状态的滚动岛，顶部是进度环、标题与 42% 阅读进度，下方列出页内锚点
 *
 * 真实组件 fixed 在页面顶部并监听 window 滚动，缩略图不能照搬；
 * 这里按组件的胶囊外观静态摆出展开后的样子，进度环直接复用 AnimatedCircularProgressBar 并给固定值。
 */
const links = ['# 安装', '# API', '# 注意事项']
</script>

<template>
  <div class="w-[200px] overflow-hidden rounded-[22px] bg-primary/90">
    <header class="flex h-11 items-center gap-2 px-4">
      <AnimatedCircularProgressBar
        :value="42"
        :min="0"
        :max="100"
        :circle-stroke-width="10"
        :show-percentage="false"
        gauge-primary-color="white"
        gauge-secondary-color="#6b728099"
        class="size-6!"
      />
      <span class="grow text-center text-sm font-bold text-white">阅读进度</span>
      <span class="text-sm text-secondary">42%</span>
    </header>
    <div class="mb-2 flex flex-col gap-1 px-4 text-xs text-secondary">
      <span
        v-for="link in links"
        :key="link"
      >
        {{ link }}
      </span>
    </div>
  </div>
</template>
