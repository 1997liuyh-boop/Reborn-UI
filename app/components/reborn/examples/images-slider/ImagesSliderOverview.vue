<script setup lang="ts">
/**
 * 总览卡片缩略：一张铺满的轮播图片，底部渐变上叠着标题与「立即加入」按钮
 *
 * 直接使用组件，不开 autoplay（默认关闭，不会起定时器），停在第一张。
 * 组件会先预加载全部图片再显示，这里只给 3 张、并把 picsum 尺寸从 1920×1080 降到 400×225。
 * img 默认按原图尺寸渲染，用 image-class 把它固定成卡片大小。
 */
const images = [
  'https://picsum.photos/seed/waiting/400/225',
  'https://picsum.photos/seed/full-collapse/400/225',
  'https://picsum.photos/seed/five-stories-falling/400/225',
]
</script>

<template>
  <div class="h-[118px] w-[200px] overflow-hidden rounded-xl bg-gray-2">
    <ImagesSlider
      :images="images"
      image-class="h-[118px] w-[200px] object-cover"
    >
      <div class="flex size-full flex-col items-center justify-end bg-linear-to-b from-transparent via-transparent to-black/80 p-2.5 text-center text-white">
        <div class="text-xs font-medium">
          很好看的图片轮播
        </div>
        <span class="mt-1.5 rounded-full border border-current/50 px-2.5 py-0.5 text-[10px]">
          立即加入
        </span>
      </div>
    </ImagesSlider>
  </div>
</template>
