<script setup lang="ts">
import {
  PATTERN_BACKGROUND_DIRECTION,
  PATTERN_BACKGROUND_MASK,
  PATTERN_BACKGROUND_SPEED,
  PATTERN_BACKGROUND_VARIANT,
} from "../../ui/pattern-background";
</script>

<template>
  <div class="flex w-full flex-col gap-6 py-6">
    <!-- 网格图案：默认速度向上滚动 -->
    <PatternBackground
      :animate="true"
      :direction="PATTERN_BACKGROUND_DIRECTION.Top"
      :variant="PATTERN_BACKGROUND_VARIANT.Grid"
      size="md"
      :speed="PATTERN_BACKGROUND_SPEED.Default"
      class="flex h-56 w-full items-center justify-center rounded-lg"
    >
      <span class="relative z-10 text-xl font-semibold text-black dark:text-white">
        Grid / Animate Top
      </span>
    </PatternBackground>

    <!-- 点阵图案：静态 + 椭圆遮罩聚焦中心 -->
    <PatternBackground
      :variant="PATTERN_BACKGROUND_VARIANT.Dot"
      size="sm"
      :mask="PATTERN_BACKGROUND_MASK.Ellipse"
      class="flex h-56 w-full items-center justify-center rounded-lg"
    >
      <span class="relative z-10 text-xl font-semibold text-black dark:text-white">
        Dot / Ellipse Mask
      </span>
    </PatternBackground>

    <!-- 大点阵图案：快速斜向滚动 + 顶部椭圆遮罩 -->
    <PatternBackground
      :animate="true"
      :direction="PATTERN_BACKGROUND_DIRECTION.BottomRight"
      :variant="PATTERN_BACKGROUND_VARIANT.BigDot"
      size="lg"
      :speed="PATTERN_BACKGROUND_SPEED.Fast"
      :mask="PATTERN_BACKGROUND_MASK.EllipseTop"
      class="flex h-56 w-full items-center justify-center rounded-lg"
    >
      <span class="relative z-10 text-xl font-semibold text-black dark:text-white">
        Big Dot / Fast
      </span>
    </PatternBackground>
  </div>
</template>
