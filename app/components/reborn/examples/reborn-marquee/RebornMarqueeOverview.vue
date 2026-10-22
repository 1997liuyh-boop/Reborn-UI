<script setup lang="ts">
/**
 * 总览卡片缩略：上下两行反向滚动的品牌标识带，两端有渐隐遮罩
 *
 * 跑马灯本身是纯 CSS 关键帧动画，没有 JS 循环，缩略图保留滚动；每行只放 4 个标识、重复 2 份，元素量很小。
 * 默认 96px 宽的渐隐遮罩会盖住窄卡片的大半，这里收窄到 32px。
 */
import RebornMarquee from '~/components/reborn/ui/reborn-marquee/RebornMarquee.vue'

const rows = [
  { reverse: false, logos: ['i-simple-icons-github', 'i-simple-icons-discord', 'i-simple-icons-google', 'i-simple-icons-x'] },
  { reverse: true, logos: ['i-simple-icons-apple', 'i-simple-icons-youtube', 'i-simple-icons-linkedin', 'i-simple-icons-tiktok'] },
]

const ui = { overlayStart: 'w-8', overlayEnd: 'w-8' }
</script>

<template>
  <div class="flex w-[208px] flex-col gap-2">
    <RebornMarquee
      v-for="(row, index) in rows"
      :key="index"
      :reverse="row.reverse"
      :repeat="2"
      :ui="ui"
      class="[--duration:16s] [--gap:0.5rem]"
    >
      <div
        v-for="logo in row.logos"
        :key="logo"
        class="flex items-center gap-1.5 rounded-lg border border-default px-3 py-2 text-muted"
      >
        <UIcon
          :name="logo"
          class="size-4"
        />
        <span class="text-xs font-semibold">{{ logo.split('-').pop() }}</span>
      </div>
    </RebornMarquee>
  </div>
</template>
