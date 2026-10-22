<script setup lang="ts">
/**
 * 总览卡片缩略：圆点码点、圆角定位点的二维码，下方附一行扫码提示
 *
 * 默认白底黑点在暗色卡片上是一块刺眼的白方块，这里把背景设为透明、码点与定位点取 currentColor，
 * 颜色跟随外层文字色在明暗主题间切换；容错等级降到 M，码点更稀疏，缩小后依然清楚。
 */
import RebornQrcode from '~/components/reborn/ui/reborn-qrcode/RebornQrcode.vue'
import { eccLevel } from '~/components/reborn/ui/reborn-qrcode/types'
</script>

<template>
  <div class="flex flex-col items-center gap-2 text-gray-10">
    <RebornQrcode
      text="https://www.leyifan.com/"
      :size="96"
      :padding="0"
      :ecc="eccLevel.M"
      foreground="currentColor"
      background-transparent
      corners-square-type="extra-rounded"
      corners-dot-type="dot"
    />
    <span class="text-xs text-gray-7">打开手机扫一扫</span>
  </div>
</template>
