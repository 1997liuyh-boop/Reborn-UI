<script setup lang="ts">
/**
 * 总览卡片缩略：三张竖条图片并排，中间一张被展开到三倍宽
 *
 * 展开原本靠 hover:flex-[3]，组件没有指定展开项的 prop；缩略图禁交互，
 * 这里从外层用 important 把第二张定格成悬停时的 flex-[3]。
 * 组件里的 img 只设了 h-full、宽度随原图比例撑开（由外层 overflow 裁掉），
 * 这里补上 w-full，让图片老老实实待在自己的条带里。
 */
const images = [
  'https://images.unsplash.com/photo-1709884735646-897b57461d61?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=400&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?q=80&w=400&auto=format&fit=crop',
]
</script>

<template>
  <ExpandableGallery
    :images="images"
    class="h-[112px]! w-[200px]! gap-1.5! [&_img]:w-full [&>div:nth-child(2)]:flex-[3]!"
  />
</template>
