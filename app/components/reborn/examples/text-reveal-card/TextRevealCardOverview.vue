<script setup lang="ts">
/**
 * 总览卡片缩略：深色卡片里一行字被竖线一分为二，左侧已切换成暗色文字、右侧仍是亮白文字
 *
 * 揭示进度由鼠标横向位置驱动，组件没有控制进度的 prop；星点背景是上百个无限循环的 Motion 动画，
 * 也不能常驻。这里沿用组件的结构与配色，静态画出「鼠标停在约 55% 处」的一帧，星点改为固定位置的静态小点。
 */

/** 揭示分界线所在的横向百分比 */
const REVEAL_PERCENT = 55

/** 与组件一致：分界线随进度轻微倾斜 */
const rotateDeg = (REVEAL_PERCENT - 50) * 0.1

/** 静态星点：用固定种子的线性同余序列生成位置与透明度，保证每次渲染一致 */
const stars = (() => {
  let seed = 7
  const next = () => {
    seed = (seed * 9301 + 49297) % 233280
    return seed / 233280
  }
  return Array.from({ length: 18 }, () => ({
    top: `${(next() * 100).toFixed(1)}%`,
    left: `${(next() * 100).toFixed(1)}%`,
    opacity: (0.3 + next() * 0.7).toFixed(2),
  }))
})()
</script>

<template>
  <div class="relative w-[200px] overflow-hidden rounded-lg border border-white/[0.08] bg-[#1d1c20] p-3">
    <h2 class="mb-0.5 text-xs font-semibold text-white">
      文字揭示
    </h2>
    <p class="text-[10px] text-neutral-400">
      把鼠标移到文字上，看看藏着什么。
    </p>

    <div class="relative flex h-14 items-center overflow-hidden">
      <!-- 已揭示部分：左侧按进度裁切出的暗色文字 -->
      <div
        class="absolute z-20 w-full bg-[#1d1c20]"
        :style="{ clipPath: `inset(0 ${100 - REVEAL_PERCENT}% 0 0)` }"
      >
        <p class="bg-[#323238] bg-clip-text text-xl font-bold text-transparent">
          影子里藏着的东西
        </p>
      </div>

      <!-- 跟随鼠标的分界线 -->
      <div
        class="absolute z-50 h-14 w-[4px] bg-gradient-to-b from-transparent via-neutral-800 to-transparent"
        :style="{ left: `${REVEAL_PERCENT}%`, transform: `rotate(${rotateDeg}deg)` }"
      />

      <!-- 默认显示的亮白文字与静态星点 -->
      <div class="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,white,transparent)]">
        <p
          class="bg-linear-to-b from-white to-neutral-300 bg-clip-text text-xl font-bold text-white"
          :style="{ textShadow: '4px 4px 15px rgba(0,0,0,0.5)' }"
        >
          光会揭开所有影子
        </p>
        <div class="absolute inset-0">
          <span
            v-for="(star, index) in stars"
            :key="index"
            class="absolute inline-block size-0.5 rounded-full bg-white"
            :style="{ top: star.top, left: star.left, opacity: star.opacity }"
          />
        </div>
      </div>
    </div>
  </div>
</template>
