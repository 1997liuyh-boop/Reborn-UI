<script setup lang="ts">
/**
 * 总览卡片缩略：缩小的 Safari 浏览器窗口，内容区是一张简单的落地页
 *
 * 窗口外框是组件自带的 SVG，用 CSS 宽度整体缩放（width/height prop 会同时改 viewBox，只会裁切不会缩放）。
 * 不传 src：传了会在内容区挂一个加载整站的 iframe，太重；
 * 内容区改用几块 DOM 色块示意页面，位置按 SVG 中内容区（y 52 起，高 700）的比例对齐；
 * SVG 机身边框只有 1 个单位宽，缩小后几乎消失，暗色下窗口会和卡片底色融在一起，这里给内容区补一圈细边框。
 */
</script>

<template>
  <div class="relative w-[200px]">
    <SafariMockup
      url="reborn-ui.com"
      class="block h-auto w-full"
    />
    <div class="absolute inset-x-0 top-[6.9%] bottom-0 flex flex-col items-center overflow-hidden rounded-b-[2px] border border-t-0 border-gray-3 bg-gray-1 px-3 pt-2.5">
      <div class="flex w-full items-center justify-between">
        <span class="h-[5px] w-6 rounded-full bg-gray-6" />
        <span class="flex gap-1">
          <span class="h-[3px] w-3 rounded-full bg-gray-3" />
          <span class="h-[3px] w-3 rounded-full bg-gray-3" />
          <span class="h-[3px] w-3 rounded-full bg-gray-3" />
        </span>
      </div>
      <span class="mt-3 h-[6px] w-28 rounded-full bg-gray-8" />
      <span class="mt-1.5 h-[3px] w-20 rounded-full bg-gray-4" />
      <span class="mt-2 h-[9px] w-12 rounded-full bg-primary" />
      <div class="mt-2.5 grid w-full grid-cols-3 gap-1.5">
        <span class="h-[22px] rounded-[3px] bg-gray-2" />
        <span class="h-[22px] rounded-[3px] bg-gray-2" />
        <span class="h-[22px] rounded-[3px] bg-gray-2" />
      </div>
    </div>
  </div>
</template>
