<script setup lang="ts">
/**
 * 总览卡片缩略：标题下方一道渐变光带，光带下是闪烁的粒子
 *
 * 真组件是 canvas + requestAnimationFrame 的常驻粒子循环，这里改为静态 SVG 圆点：
 * 粒子位置在 setup 里按固定种子一次算好，分三组用 CSS 关键帧错开明暗，只有 3 个动画节点。
 */

/** 单个粒子：坐标与半径都是 SVG 视口内的数值 */
interface Dot {
  x: number;
  y: number;
  r: number;
}

/** 视口尺寸，与粒子区域的 CSS 尺寸一致 */
const VIEW_WIDTH = 200;
const VIEW_HEIGHT = 72;

/** 线性同余伪随机：固定种子，保证每次挂载画面一致 */
function createRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

/** 生成一组粒子；半径取 0.4~1.4，对应 Demo 的 min-size / max-size */
function createDots(seed: number, count: number): Dot[] {
  const random = createRandom(seed);
  return Array.from({ length: count }, () => ({
    x: Math.round(random() * VIEW_WIDTH * 10) / 10,
    y: Math.round(random() * VIEW_HEIGHT * 10) / 10,
    r: Math.round((0.4 + random()) * 100) / 100,
  }));
}

/** 三组粒子，分别挂不同的闪烁延迟 */
const dotGroups = [createDots(7, 26), createDots(19, 26), createDots(43, 26)];
</script>

<template>
  <div class="flex w-50 flex-col items-center">
    <h3 class="text-highlighted text-2xl font-bold">
      Reborn UI
    </h3>

    <div class="relative mt-1 h-18 w-full">
      <!-- 光带：与 Demo 相同的靛蓝 / 天蓝两层渐变，宽度按卡片等比缩小 -->
      <div class="absolute inset-x-6 top-0 h-[2px] bg-linear-to-r from-transparent via-indigo-500 to-transparent blur-sm" />
      <div class="absolute inset-x-6 top-0 h-px bg-linear-to-r from-transparent via-indigo-500 to-transparent" />
      <div class="absolute inset-x-16 top-0 h-[4px] bg-linear-to-r from-transparent via-sky-500 to-transparent blur-sm" />
      <div class="absolute inset-x-16 top-0 h-px bg-linear-to-r from-transparent via-sky-500 to-transparent" />

      <!-- 粒子：颜色取 currentColor，跟随明暗；径向遮罩让边缘淡出 -->
      <svg
        class="text-highlighted absolute inset-0 size-full [mask-image:radial-gradient(100px_64px_at_top,white_30%,transparent)]"
        :viewBox="`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`"
        aria-hidden="true"
      >
        <g
          v-for="(group, groupIndex) in dotGroups"
          :key="groupIndex"
          class="sparkles-ov-group"
          :style="{ animationDelay: `${groupIndex * -0.8}s` }"
          fill="currentColor"
        >
          <circle
            v-for="(dot, dotIndex) in group"
            :key="dotIndex"
            :cx="dot.x"
            :cy="dot.y"
            :r="dot.r"
          />
        </g>
      </svg>
    </div>
  </div>
</template>

<style scoped>
/* 三组粒子错开明暗，模拟逐粒闪烁 */
@keyframes sparkles-ov-twinkle {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.2;
  }
}

.sparkles-ov-group {
  animation: sparkles-ov-twinkle 2.4s ease-in-out infinite;
}

@media (prefers-reduced-motion: reduce) {
  .sparkles-ov-group {
    animation: none;
  }
}
</style>
