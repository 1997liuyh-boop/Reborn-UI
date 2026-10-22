<script setup lang="ts">
/**
 * 总览卡片缩略：一张按 aspectFill 裁满的圆角横图
 *
 * 只放单个示例；复用演示里体积较小的站内图片，不用 575KB 的另一张横图。
 * 横图本身偏暗，加一圈 gray-3 细描边，暗色卡片上也能看出图片边界。
 */
import RebornImage from '~/components/reborn/ui/reborn-image/RebornImage.vue'

const LANDSCAPE = '/images/lithos/strata.webp'
</script>

<template>
  <RebornImage
    :src="LANDSCAPE"
    :width="180"
    :height="120"
    custom-class="rounded-lg ring-1 ring-gray-3"
  />
</template>
