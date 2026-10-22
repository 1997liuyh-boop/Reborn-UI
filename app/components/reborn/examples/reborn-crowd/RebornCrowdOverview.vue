<script setup lang="ts">
/**
 * 总览卡片缩略：前后两排路人，上下颠着走过
 *
 * 真组件用 gsap 时间线驱动 2D 画布逐帧绘制，这里改为静态 DOM：
 * 直接用 Demo 的同一张精灵图，按格子用 background-position 裁出 7 个人物，前排大、后排小且靠上；
 * 「走路」只保留上下颠这一个特征，用 CSS 关键帧做，步频与组件的 0.32 秒一致。
 */

/** 演示素材：与 Demo 相同的 Open Peeps 精灵图，15 列 × 7 行 */
const SHEET_SRC = "/images/peeps/open-peeps-sheet.png";
const SHEET_COLS = 15;
const SHEET_ROWS = 7;
/** 精灵图单格宽高比（240×324） */
const CELL_RATIO = 240 / 324;

/** 场上一个人物：取精灵图第 col 列、第 row 行，按 height 等比缩放 */
interface Peep {
  col: number;
  row: number;
  /** 距卡片左缘（px） */
  left: number;
  /** 距卡片底边（px），后排更高 */
  bottom: number;
  /** 人物高度（px） */
  height: number;
  /** 向左走的人水平翻转，面朝前进方向 */
  flip: boolean;
  /** 颠步的起始延迟（秒），错开步伐 */
  delay: number;
}

const BACK_HEIGHT = 76;
const FRONT_HEIGHT = 96;

/**
 * 先后排、再前排：后渲染的盖在上面，与组件「越靠下越靠前」一致。
 * 后排抬高 34px，横向落在前排两人之间，头肩才露得出来。
 */
const peeps: Peep[] = [
  { col: 3, row: 1, left: 29, bottom: 34, height: BACK_HEIGHT, flip: false, delay: 0.1 },
  { col: 8, row: 0, left: 72, bottom: 34, height: BACK_HEIGHT, flip: true, delay: 0.25 },
  { col: 11, row: 5, left: 115, bottom: 34, height: BACK_HEIGHT, flip: false, delay: 0.05 },
  { col: 1, row: 0, left: 0, bottom: 0, height: FRONT_HEIGHT, flip: false, delay: 0 },
  { col: 4, row: 2, left: 43, bottom: 0, height: FRONT_HEIGHT, flip: true, delay: 0.16 },
  { col: 7, row: 0, left: 86, bottom: 0, height: FRONT_HEIGHT, flip: false, delay: 0.3 },
  { col: 14, row: 3, left: 129, bottom: 0, height: FRONT_HEIGHT, flip: true, delay: 0.08 },
];

/** 按格子裁切精灵图：背景放大到 列数 × 行数 倍，再按百分比定位到目标格 */
function peepStyle(peep: Peep) {
  return {
    left: `${peep.left}px`,
    bottom: `${peep.bottom}px`,
    width: `${Math.round(peep.height * CELL_RATIO)}px`,
    height: `${peep.height}px`,
    backgroundImage: `url(${SHEET_SRC})`,
    backgroundSize: `${SHEET_COLS * 100}% ${SHEET_ROWS * 100}%`,
    backgroundPosition: `${(peep.col / (SHEET_COLS - 1)) * 100}% ${(peep.row / (SHEET_ROWS - 1)) * 100}%`,
    scale: peep.flip ? "-1 1" : undefined,
    animationDelay: `${peep.delay}s`,
  };
}
</script>

<template>
  <!-- 暗色下与文档页底部人群一致：不反相，只降到 90% 不透明度压一下白色 -->
  <div class="relative h-32 w-50 overflow-hidden dark:opacity-90">
    <div
      v-for="(peep, index) in peeps"
      :key="index"
      class="crowd-ov-peep absolute bg-no-repeat"
      :style="peepStyle(peep)"
    />
  </div>
</template>

<style scoped>
/* 颠步：半个周期 0.32 秒，与组件 STEP_DURATION 一致 */
@keyframes crowd-ov-bob {
  from {
    translate: 0 0;
  }

  to {
    translate: 0 -3px;
  }
}

.crowd-ov-peep {
  animation: crowd-ov-bob 0.32s ease-in-out infinite alternate;
}

@media (prefers-reduced-motion: reduce) {
  .crowd-ov-peep {
    animation: none;
  }
}
</style>
