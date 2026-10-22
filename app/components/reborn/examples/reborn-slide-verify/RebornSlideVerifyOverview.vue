<script setup lang="ts">
/**
 * 总览卡片缩略：胶囊形滑块验证的初始态，圆形滑块停在最左，轨道中央提示「向右滑动完成验证」
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：默认 pill 形状、md 尺寸、primary 配色，
 * 滑块为白底圆钮加浅投影、图标为主色双箭头。选初始态而非拖动中：拖动中提示文案会被
 * 分层裁切，缩小后反而看不清；完成态文案是「验证通过」，不如初始态能说明用途。
 */
</script>

<template>
  <div class="relative h-10 w-[200px] overflow-hidden rounded-full border border-gray-3 bg-gray-2">
    <!-- 提示文案：左右留出滑块宽度后居中 -->
    <div class="absolute inset-0 flex items-center justify-center px-11">
      <span class="truncate text-xs font-medium text-gray-6">向右滑动完成验证</span>
    </div>
    <!-- 滑块：白底圆钮，紧贴轨道左端 -->
    <div class="absolute top-1/2 left-0.5 flex size-[34px] -translate-y-1/2 items-center justify-center rounded-full border border-gray-3 bg-gray-1 shadow-[0_4px_12px_rgba(15,23,42,0.16)]">
      <Icon
        name="lucide:chevrons-right"
        class="size-[18px] text-primary"
      />
    </div>
  </div>
</template>
