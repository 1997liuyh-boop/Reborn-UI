<script setup lang="ts">
/**
 * 总览卡片缩略：深色卡片上落下几道流星
 *
 * 不直接挂 Meteors：它把每颗流星随机放在 -400~400px 的横向位置、再滑出 500px，
 * 是按宽屏头图设计的，放进 200×128 的缩略图里大多数时候一颗都看不到。
 * 这里沿用组件的流星外观类名和关键帧写法（rotate(215deg) translateX），
 * 只把 6 颗流星的起点固定在卡片顶部、滑行距离缩到 110px，保证随时有流星划过且不出画框。
 * 深色底沿用 Demo 的 bg-gray-10 / dark:bg-gray-1，拖尾在浅色底上看不清。
 */

/** 单颗流星：起点（px）与动画节奏（秒） */
interface Meteor {
  left: number;
  top: number;
  delay: number;
  duration: number;
}

const meteors: Meteor[] = [
  { left: 20, top: 0, delay: 0, duration: 2.6 },
  { left: 58, top: 6, delay: 1.1, duration: 3.2 },
  { left: 96, top: 2, delay: 0.5, duration: 2.2 },
  { left: 132, top: 8, delay: 1.8, duration: 3.6 },
  { left: 170, top: 0, delay: 0.9, duration: 2.8 },
  { left: 76, top: 4, delay: 2.4, duration: 3 },
];
</script>

<template>
  <div
    class="relative flex h-32 w-50 flex-col items-start justify-end overflow-hidden rounded-2xl border border-gray-8/40 bg-gray-10 px-4 py-3 dark:bg-gray-1"
  >
    <h3 class="relative z-10 text-sm font-bold text-white">
      流星划过夜空
    </h3>
    <p class="relative z-10 mt-1 text-xs text-gray-6">
      为深色区块叠加流星动画
    </p>

    <!-- 外观类名与 Meteors 组件一致：2px 光点 + 50px 渐变拖尾 -->
    <span
      v-for="(meteor, index) in meteors"
      :key="index"
      class="meteors-ov-item absolute h-0.5 w-0.5 rotate-[45deg] rounded-[9999px] bg-slate-500 shadow-[0_0_0_1px_#ffffff10] before:absolute before:top-1/2 before:h-[1px] before:w-[50px] before:-translate-y-[50%] before:transform before:bg-gradient-to-r before:from-[#64748b] before:to-transparent before:content-['']"
      :style="{
        left: `${meteor.left}px`,
        top: `${meteor.top}px`,
        animationDelay: `${meteor.delay}s`,
        animationDuration: `${meteor.duration}s`,
      }"
    />
  </div>
</template>

<style scoped>
/* 与组件的 meteor 关键帧同形，只把滑行距离从 500px 缩到 110px */
@keyframes meteors-ov-fall {
  0% {
    transform: rotate(215deg) translateX(0);
    opacity: 1;
  }

  70% {
    opacity: 1;
  }

  100% {
    transform: rotate(215deg) translateX(-110px);
    opacity: 0;
  }
}

.meteors-ov-item {
  animation: meteors-ov-fall 3s linear infinite backwards;
}

@media (prefers-reduced-motion: reduce) {
  .meteors-ov-item {
    animation: none;
  }
}
</style>
