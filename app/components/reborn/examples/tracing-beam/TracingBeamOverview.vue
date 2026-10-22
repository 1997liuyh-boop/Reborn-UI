<script setup lang="ts">
/**
 * 总览卡片缩略：左侧细线顶端一个圆点，上段被青紫渐变光束点亮，右侧是徽章、标题、配图与正文
 *
 * 光束位置由 window 滚动驱动，缩略图不能监听滚动；
 * 这里按组件的路径形状与渐变色标，用固定的渐变区间静态画出读到开头一段时的样子。
 */
/** 左侧路径高度（px） */
const PATH_HEIGHT = 104
/**
 * 组件路径的起点折角画在视口上方（y 为负），可见部分是右侧竖线、末段折回左侧；
 * 这里只画可见部分，避免 path 的几何范围超出 svg 被算进占位尺寸
 */
const path = `M 19 0 V ${PATH_HEIGHT - 30} l -18 24 V ${PATH_HEIGHT}`
</script>

<template>
  <div class="relative flex w-[200px] gap-3">
    <div class="flex shrink-0 flex-col">
      <!-- 顶部圆点：开始滚动后由绿色变为白色，圆心与竖线对齐 -->
      <div class="ml-[11px] flex size-4 items-center justify-center rounded-full border border-gray-3 shadow-sm">
        <div class="size-2 rounded-full border border-white bg-white" />
      </div>
      <svg
        :viewBox="`0 0 20 ${PATH_HEIGHT}`"
        width="20"
        :height="PATH_HEIGHT"
        class="block"
        aria-hidden="true"
      >
        <path
          :d="path"
          fill="none"
          stroke="#9091A0"
          stroke-opacity="0.16"
        />
        <path
          :d="path"
          fill="none"
          stroke="url(#tracing-beam-overview-gradient)"
          stroke-width="1.25"
        />
        <defs>
          <linearGradient
            id="tracing-beam-overview-gradient"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="0"
            y1="0"
            y2="100"
          >
            <stop
              stop-color="#18CCFC"
              stop-opacity="0"
            />
            <stop stop-color="#18CCFC" />
            <stop
              offset="0.325"
              stop-color="#6344F5"
            />
            <stop
              offset="1"
              stop-color="#AE48FF"
              stop-opacity="0"
            />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div class="flex min-w-0 flex-col pt-0.5">
      <div class="mb-1.5 w-fit rounded-full bg-inverted px-2 text-[10px] text-inverted">
        Vue
      </div>
      <p class="mb-1.5 text-sm text-highlighted">
        从山顶看下去
      </p>
      <img
        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=400&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        alt="文章配图"
        class="mb-1.5 h-12 w-full rounded-lg object-cover"
      >
      <p class="truncate text-[10px] text-muted">
        光束会跟着滚动进度走完整篇。
      </p>
    </div>
  </div>
</template>
