<script setup lang="ts">
/**
 * 总览卡片缩略：「Hello」熔化成「Text」的一帧，新词已成形、边缘呈液态，旧词只剩左侧一点残滴
 *
 * 静态模拟：组件靠永不停止的 requestAnimationFrame 循环驱动变形，且阈值滤镜挂在 fixed 定位的 svg 上，
 * 都不适合常驻在挂载后不卸载的总览卡片里。这里把两层文字的模糊与透明度写死成一帧，
 * 再套与组件相同的 alpha 阈值滤镜得到粘连边缘。
 * 数值没有直接套组件的进度公式：卡片里字号只有 60px，按公式取中间帧时两个词都会被阈值吃光，
 * 因此取「新词基本成形」这一帧并按实际渲染目测调定。
 */
import { useId } from 'vue'

const filterId = `morphing-overview-${useId()}`
</script>

<template>
  <div
    class="text-highlighted relative h-16 w-48 text-center text-6xl leading-none font-bold"
    :style="{ filter: `url(#${filterId}) blur(0.6px)` }"
  >
    <!-- 旧词：大幅模糊后经阈值只剩粗笔画处的液滴 -->
    <span
      class="absolute inset-x-0 top-0 m-auto inline-block w-full"
      style="filter: blur(7px); opacity: 1"
    >Hello</span>
    <!-- 新词：轻度模糊，阈值后字形完整、边角圆钝 -->
    <span
      class="absolute inset-x-0 top-0 m-auto inline-block w-full"
      style="filter: blur(2px); opacity: 0.9"
    >Text</span>

    <svg
      class="absolute size-0"
      aria-hidden="true"
    >
      <defs>
        <filter :id="filterId">
          <feColorMatrix
            in="SourceGraphic"
            type="matrix"
            values="1 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 255 -140"
          />
        </filter>
      </defs>
    </svg>
  </div>
</template>
