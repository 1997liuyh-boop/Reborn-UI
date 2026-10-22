<script setup lang="ts">
/**
 * 总览卡片缩略：沿 Y 轴翻过大半、已露出深色背面的卡片
 *
 * 翻转只在 group-hover 时触发，没有控制翻面的 prop；缩略图禁交互，
 * 这里从外层用 important 把旋转层定格在 140°——背面朝外但仍带透视倾角，
 * 一眼能看出是「翻过来的卡片」，而不是一张普通的深色卡片。
 * 组件默认 224×288，同样用 important 收窄；卡片变小后默认 1000px 的透视几乎看不出近大远小，
 * 按比例把透视距离缩到 300px。
 */
</script>

<template>
  <FlipCard class="h-[112px]! w-[90px]! [perspective:300px]! [&>div]:[transform:rotateY(140deg)]!">
    <template #default>
      <img
        src="https://images.unsplash.com/photo-1525373698358-041e3a460346?w=300&auto=format&fit=crop&q=60"
        alt="卡片正面配图"
        class="size-full rounded-2xl object-cover"
      >
      <div class="absolute bottom-2 left-2 text-xs font-bold text-white">
        Reborn UI
      </div>
    </template>
    <template #back>
      <div class="-m-2 flex min-h-full flex-col gap-1 text-white">
        <h3 class="text-xs font-bold">
          Reborn UI
        </h3>
        <p class="border-t border-current/30 pt-1.5 text-[10px] leading-snug">
          背面放说明文字，悬停时翻转过来
        </p>
      </div>
    </template>
  </FlipCard>
</template>
