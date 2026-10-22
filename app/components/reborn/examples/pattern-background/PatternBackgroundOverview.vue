<script setup lang="ts">
/**
 * 总览卡片缩略：缓慢上移的网格背景，中心椭圆遮罩
 *
 * 选网格而非点阵：缩到 200×128 后点阵只剩稀疏的灰点，网格线条更容易认出「图案背景」。
 * 动画只是 background-position 关键帧，开销很小，保留滚动。
 */
import {
  PATTERN_BACKGROUND_DIRECTION,
  PATTERN_BACKGROUND_MASK,
  PATTERN_BACKGROUND_SPEED,
  PATTERN_BACKGROUND_VARIANT,
} from "../../ui/pattern-background";
</script>

<template>
  <PatternBackground
    :animate="true"
    :direction="PATTERN_BACKGROUND_DIRECTION.Top"
    :variant="PATTERN_BACKGROUND_VARIANT.Grid"
    size="sm"
    :speed="PATTERN_BACKGROUND_SPEED.Slow"
    :mask="PATTERN_BACKGROUND_MASK.Ellipse"
    class="flex h-32 w-50 items-center justify-center overflow-hidden rounded-xl border border-default"
  >
    <span class="text-highlighted relative z-10 text-base font-semibold">
      网格 / 向上滚动
    </span>
  </PatternBackground>
</template>
