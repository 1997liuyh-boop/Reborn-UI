<script setup lang="ts">
/**
 * 总览卡片缩略：描边空心字「reborn」，光标所在处透出一团彩色渐变描边
 *
 * 悬停效果靠鼠标坐标驱动，组件没有强制悬停或指定光标位置的 prop，卡片里也禁交互；
 * 这里按组件的三层 SVG 结构（底层描边 + 渐变描边 + 跟随光标的径向遮罩）静态画出
 * 「光标停在字母中段」时的样子。渐变 id 用 useId 生成，避免与页面上其它 SVG 冲突。
 * 卡片里 SVG 只有约 200px 宽，描边按比例加粗（底层 1.5、渐变层 2），遮罩半径放大到 25%，否则细到看不见。
 */
import { useId } from 'vue'

const uid = useId().replace(/[^\w-]/g, '')
const gradientId = `${uid}-text-gradient`
const maskGradientId = `${uid}-reveal-mask`
const maskId = `${uid}-text-mask`
</script>

<template>
  <svg
    width="200"
    viewBox="0 0 300 100"
    xmlns="http://www.w3.org/2000/svg"
    class="select-none"
  >
    <defs>
      <!-- 悬停时出现的五色线性渐变，颜色同组件 -->
      <linearGradient
        :id="gradientId"
        gradientUnits="userSpaceOnUse"
      >
        <stop
          offset="0%"
          stop-color="#eab308"
        />
        <stop
          offset="25%"
          stop-color="#ef4444"
        />
        <stop
          offset="50%"
          stop-color="#3b82f6"
        />
        <stop
          offset="75%"
          stop-color="#06b6d4"
        />
        <stop
          offset="100%"
          stop-color="#8b5cf6"
        />
      </linearGradient>

      <!-- 以「光标」为圆心的径向遮罩，圆心固定在字母中段 -->
      <radialGradient
        :id="maskGradientId"
        gradientUnits="userSpaceOnUse"
        r="25%"
        cx="45%"
        cy="50%"
      >
        <stop
          offset="0%"
          stop-color="white"
        />
        <stop
          offset="100%"
          stop-color="black"
        />
      </radialGradient>

      <mask :id="maskId">
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          :fill="`url(#${maskGradientId})`"
        />
      </mask>
    </defs>

    <!-- 底层：悬停后完整画出的中性色描边 -->
    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      stroke-width="1.5"
      opacity="0.75"
      class="fill-transparent stroke-neutral-400 font-[helvetica] text-7xl font-bold dark:stroke-neutral-600"
    >
      reborn
    </text>

    <!-- 上层：渐变描边，只在遮罩圆内可见 -->
    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      :stroke="`url(#${gradientId})`"
      stroke-width="2"
      :mask="`url(#${maskId})`"
      class="fill-transparent font-[helvetica] text-7xl font-bold"
    >
      reborn
    </text>
  </svg>
</template>
