<!-- eslint-disable check-file/filename-naming-convention -->
<script setup lang="ts">
/**
 * 总览卡片缩略：缩小的 iPhone 15 Pro 机身，屏幕里是一个简单的应用首页
 *
 * 机身是组件自带的 SVG，用 CSS 高度整体缩放（width/height prop 会同时改 viewBox，只会裁切不会缩放）。
 * 不传 iframe-src：传了会在屏幕里挂一个加载整站的 iframe，太重；
 * 屏幕区改用几块 DOM 色块示意应用画面，灵动岛随之用一枚深色胶囊补回。
 */
</script>

<template>
  <div class="relative h-[124px] w-[61px]">
    <IPhone15ProMockup class="size-full" />
    <!-- 屏幕区：按机身 SVG 中屏幕矩形的比例定位（x 21.25 / y 19.25 / 389.5×843.5，圆角 55.75） -->
    <div class="absolute top-[2.18%] left-[4.91%] flex h-[95.64%] w-[89.95%] flex-col gap-1 overflow-hidden rounded-[8px] bg-gray-1 px-1 pt-1">
      <div class="mx-auto h-[5px] w-[18px] shrink-0 rounded-full bg-black" />
      <div class="h-[26px] shrink-0 rounded-[3px] bg-primary/80" />
      <div class="h-[3px] w-4/5 rounded-full bg-gray-3" />
      <div class="h-[3px] w-3/5 rounded-full bg-gray-3" />
      <div class="grid grid-cols-2 gap-1">
        <div class="h-[18px] rounded-[3px] bg-gray-2" />
        <div class="h-[18px] rounded-[3px] bg-gray-2" />
        <div class="h-[18px] rounded-[3px] bg-gray-2" />
        <div class="h-[18px] rounded-[3px] bg-gray-2" />
      </div>
      <div class="mt-auto mb-1 flex justify-around">
        <span class="size-[5px] rounded-full bg-primary" />
        <span class="size-[5px] rounded-full bg-gray-3" />
        <span class="size-[5px] rounded-full bg-gray-3" />
      </div>
    </div>
  </div>
</template>
