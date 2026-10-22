<script setup lang="ts">
/**
 * 总览卡片缩略：渐变涂层被刮开一道，露出下面的庆祝表情
 *
 * 真组件靠 canvas 逐笔擦除涂层，挂载后还会抖动一次，这里改为静态 SVG：
 * 涂层用 Demo 的三色渐变，刮痕是遮罩里的一条粗圆头曲线，末端放一枚与组件光标同款的白色圆点。
 */
import { useId } from "vue";

/** 渐变与遮罩的 id，避免与页面上其他 SVG 冲突 */
const uid = useId().replace(/[^\w-]/g, "");
const gradientId = `scratch-ov-gradient-${uid}`;
const maskId = `scratch-ov-mask-${uid}`;
</script>

<template>
  <div
    class="border-default bg-elevated relative flex size-28 items-center justify-center overflow-hidden rounded-3xl border-2"
  >
    <span class="text-5xl leading-none">🥳</span>

    <svg
      class="absolute inset-0 size-full"
      viewBox="0 0 112 112"
      aria-hidden="true"
    >
      <defs>
        <linearGradient
          :id="gradientId"
          x1="0"
          y1="0"
          x2="1"
          y2="1"
        >
          <stop
            offset="0"
            stop-color="#A97CF8"
          />
          <stop
            offset="0.5"
            stop-color="#F38CB8"
          />
          <stop
            offset="1"
            stop-color="#FDCC92"
          />
        </linearGradient>
        <!-- 白色保留涂层，黑色刮痕处透出底下内容 -->
        <mask :id="maskId">
          <rect
            width="112"
            height="112"
            fill="white"
          />
          <path
            d="M24 40 C38 30 46 62 60 48 S80 34 86 58 C80 70 60 80 42 72"
            fill="none"
            stroke="black"
            stroke-width="22"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </mask>
      </defs>
      <rect
        width="112"
        height="112"
        :fill="`url(#${gradientId})`"
        :mask="`url(#${maskId})`"
      />
      <!-- 刮擦光标：与组件 cursor 图同样是白底黑边圆点 -->
      <circle
        cx="42"
        cy="72"
        r="9"
        fill="#fff"
        stroke="#000"
        stroke-width="1"
      />
    </svg>
  </div>
</template>
