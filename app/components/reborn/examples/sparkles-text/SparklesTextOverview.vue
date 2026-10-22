<script setup lang="ts">
/**
 * 总览卡片缩略：粗体标题四周点缀着紫、粉两色的四角星
 *
 * 组件用 setInterval 每 100ms 刷新星星、每颗星再跑无限循环的 Motion 动画，属于常驻 JS 循环，
 * 且没有关闭开关；这里沿用组件的结构与星形路径，按固定位置、大小和角度画出某一帧的静态画面。
 */

/** 单颗星星的静态参数：位置（百分比）、缩放、旋转角、颜色与透明度 */
interface StaticSparkle {
  x: string
  y: string
  scale: number
  rotate: number
  color: string
  opacity: number
}

/** 与组件默认值一致的两种星星颜色 */
const FIRST = '#9E7AFF'
const SECOND = '#FE8BBB'

const sparkles: StaticSparkle[] = [
  { x: '-4%', y: '-20%', scale: 0.9, rotate: 100, color: FIRST, opacity: 1 },
  { x: '24%', y: '62%', scale: 0.5, rotate: 80, color: SECOND, opacity: 0.8 },
  { x: '48%', y: '-28%', scale: 1.1, rotate: 120, color: SECOND, opacity: 1 },
  { x: '70%', y: '55%', scale: 0.7, rotate: 90, color: FIRST, opacity: 0.9 },
  { x: '90%', y: '-12%', scale: 0.6, rotate: 140, color: SECOND, opacity: 0.7 },
  { x: '8%', y: '78%', scale: 0.4, rotate: 110, color: FIRST, opacity: 0.6 },
]
</script>

<template>
  <div class="text-highlighted text-3xl font-bold">
    <span class="relative inline-block whitespace-nowrap">
      <svg
        v-for="(sparkle, index) in sparkles"
        :key="index"
        class="absolute z-20"
        :style="{
          left: sparkle.x,
          top: sparkle.y,
          opacity: sparkle.opacity,
          transform: `scale(${sparkle.scale}) rotate(${sparkle.rotate}deg)`,
        }"
        width="21"
        height="21"
        viewBox="0 0 21 21"
      >
        <path
          d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
          :fill="sparkle.color"
        />
      </svg>
      Reborn UI
    </span>
  </div>
</template>
