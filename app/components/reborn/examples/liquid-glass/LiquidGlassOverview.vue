<script setup lang="ts">
/**
 * 总览卡片缩略：大点阵背景上浮着一枚液态玻璃胶囊，边缘把底下的圆点折射变形
 *
 * 组件是 SVG 位移滤镜 + backdrop-filter，没有画布和脚本循环，直接挂载；
 * position 改为 absolute 限在画框内（默认 fixed 会盖住整页）。背景不开滚动：
 * 底图每动一帧玻璃滤镜都要重算，静止的点阵已足够看出折射。
 */
import {
  PATTERN_BACKGROUND_MASK,
  PATTERN_BACKGROUND_VARIANT,
} from "../../ui/pattern-background";
</script>

<template>
  <PatternBackground
    :variant="PATTERN_BACKGROUND_VARIANT.BigDot"
    size="sm"
    :mask="PATTERN_BACKGROUND_MASK.Ellipse"
    class="h-32 w-50 overflow-hidden rounded-xl border border-default"
  >
    <LiquidGlass
      position="absolute"
      :radius="20"
      container-class="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      class="text-highlighted flex items-center justify-center px-6 py-3 text-sm font-medium whitespace-nowrap"
    >
      液态玻璃
    </LiquidGlass>
  </PatternBackground>
</template>
