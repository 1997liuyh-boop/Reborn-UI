<script setup lang="ts">
/**
 * 总览卡片缩略：五张菱形裁切的照片上三下二交错拼成蜂窝状
 *
 * 直接使用组件。菱形格的边长由组件的 CSS 变量 --size 决定（默认 100px），
 * 这里用 important 压到 30px，整个画廊约 200×94。
 * 蜂窝至少要上三下二才看得出交错，所以放了 5 个格子，但只用 3 张不同的图轮流填充，
 * 并把 pexels 的尺寸参数从 600 降到 200。
 */
const photos = [
  'https://images.pexels.com/photos/16834200/pexels-photo-16834200/free-photo-of-young-brunette-in-a-white-dress-sitting-on-a-bench-and-holding-flowers.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/16834202/pexels-photo-16834202/free-photo-of-young-woman-in-a-white-dress-posing-outdoors.jpeg?auto=compress&cs=tinysrgb&w=200',
  'https://images.pexels.com/photos/17362900/pexels-photo-17362900/free-photo-of-pretty-young-model-in-chinese-retro-dress.jpeg?auto=compress&cs=tinysrgb&w=200',
]

/** 上排 A B C，下排 C A：相邻格子不重复同一张图 */
const items = [0, 1, 2, 2, 0].map(index => ({ src: photos[index]! }))
</script>

<template>
  <PhotoGallery
    :items="items"
    container-class="w-[200px] [--size:30px]!"
  />
</template>
