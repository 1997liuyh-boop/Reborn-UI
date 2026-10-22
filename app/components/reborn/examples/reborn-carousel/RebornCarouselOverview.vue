<script setup lang="ts">
/**
 * 总览卡片缩略：卡片式轮播，当前一张居中，左右各露出相邻一张的边缘，下方是线条分页
 *
 * 用 type="card" + slidesPerView="auto" + centeredSlides（与演示「卡片与自动尺寸」同一组合）：
 * 两侧露出的半张卡片一眼就能看出「还有下一张」，比单张铺满加箭头更像轮播。
 * 卡片底色用固定色相的渐变而不是主题色板：主题色板在暗色下会反转成浅色，白字就看不清了。
 * autoplay 与 loop 保持关闭，挂载后不会自动翻页；卡片禁用了交互，不放箭头。
 */
import RebornCarousel from '~/components/reborn/ui/reborn-carousel/RebornCarousel.vue'

const slides = [
  { id: 1, title: '城市漫步', description: '街区路线与沿途记录', tone: 'from-sky-400 to-indigo-500' },
  { id: 2, title: '山间步道', description: '步道路线与出行准备', tone: 'from-emerald-400 to-teal-600' },
  { id: 3, title: '海边日落', description: '海岸路线与拍摄时间', tone: 'from-amber-400 to-rose-500' },
]
</script>

<template>
  <div class="w-full max-w-[236px]">
    <RebornCarousel
      type="card"
      slides-per-view="auto"
      centered-slides
      :space-between="10"
      :height="104"
      :initial-slide="1"
      arrow="never"
      :pagination="{ type: 'line' }"
      indicator-position="outside"
    >
      <div
        v-for="slide in slides"
        :key="slide.id"
        class="flex h-full w-[150px] flex-col justify-end gap-0.5 rounded-lg bg-linear-to-br p-3 text-white"
        :class="slide.tone"
      >
        <span class="text-sm font-medium">{{ slide.title }}</span>
        <span class="text-[11px] text-white/80">{{ slide.description }}</span>
      </div>
    </RebornCarousel>
  </div>
</template>
