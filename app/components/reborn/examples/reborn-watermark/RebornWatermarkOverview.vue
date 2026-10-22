<script setup lang="ts">
/**
 * 总览卡片缩略：一张报告卡片铺满倾斜重复的「内部资料」文字水印
 *
 * 水印图块由画布离屏绘制成图片，颜色只能写死；选中灰加半透明，浅色与暗色底上都能看见又不抢正文。
 * 默认 100px 的图块间距在小卡片里只能排下一两个，这里缩小间距与图块尺寸让水印铺满。
 */
import RebornWatermark from '~/components/reborn/ui/reborn-watermark/RebornWatermark.vue'

const font = { color: 'rgba(128, 128, 128, 0.35)', fontSize: 12 }
</script>

<template>
  <div class="w-[200px]">
    <RebornWatermark
      content="内部资料"
      :width="56"
      :height="16"
      :gap="[24, 24]"
      :rotate="-22"
      :z-index="1"
      :font="font"
      class="rounded-lg border border-gray-3 bg-gray-1"
    >
      <div class="flex flex-col gap-1.5 p-3">
        <div class="text-base font-medium text-gray-9">
          三季度经营报告
        </div>
        <p class="text-sm text-gray-7">
          营收 1,286 万元，同比增长 12%
        </p>
        <p class="text-sm text-gray-7">
          新签客户 48 家，续约率 91%
        </p>
        <p class="text-sm text-gray-7">
          下季度重点推进华东交付
        </p>
      </div>
    </RebornWatermark>
  </div>
</template>
