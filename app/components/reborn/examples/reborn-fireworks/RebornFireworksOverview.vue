<script setup lang="ts">
/**
 * 总览卡片缩略：礼花筒朝上喷出一扇彩纸屑，矩形纸片、圆点与彩带混在一起
 *
 * 真实组件用 canvas 逐帧绘制粒子，缩略图改用 SVG 画一帧静态的绽放图案：
 * 粒子形状比例（矩形 65%、圆点与彩带各约 17.5%）、发射角（正上方左右各 65°）与色板均取自组件默认值，
 * 位置用固定种子的伪随机数生成，每次挂载都是同一幅图。
 */

interface ConfettiPiece {
  /** 粒子形状 */
  kind: 'rect' | 'circle' | 'ribbon'
  /** SVG 变换：位置、旋转与缩放 */
  transform: string
  /** 颜色 */
  color: string
}

/** 组件默认色板中的一部分，挑在浅色与深色背景下都看得清的 */
const COLORS = ['#FF6B6B', '#FFD93D', '#6BCB77', '#4D96FF', '#FF922B', '#CC5DE8', '#F06595', '#20C997', '#1E90FF', '#FF8C00']

/** 发射点：礼花筒口 */
const ORIGIN = { x: 100, y: 98 }

/** 线性同余伪随机数：固定种子保证图案稳定 */
function createRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296
    return state / 4294967296
  }
}

const random = createRandom(20261020)

const pieces: ConfettiPiece[] = Array.from({ length: 72 }, () => {
  const angle = ((270 - 65 + random() * 130) * Math.PI) / 180
  // 开方让粒子在远处更均匀地铺开，而不是全挤在筒口附近
  const distance = 20 + Math.sqrt(random()) * 76
  // 越远的粒子下坠越多，模拟重力
  const drop = (distance / 96) ** 2 * 10
  const x = ORIGIN.x + Math.cos(angle) * distance * 1.15
  const y = ORIGIN.y + Math.sin(angle) * distance + drop
  const roll = random()
  const kind: ConfettiPiece['kind'] = roll < 0.65 ? 'rect' : roll < 0.825 ? 'circle' : 'ribbon'
  const rotate = Math.round(random() * 360)
  const scale = (1 + random() * 0.6).toFixed(2)
  return {
    kind,
    transform: `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${rotate}) scale(${scale})`,
    color: COLORS[Math.floor(random() * COLORS.length)]!,
  }
})
</script>

<template>
  <div class="relative h-[124px] w-[200px]">
    <svg
      class="absolute inset-0 size-full"
      viewBox="0 0 200 124"
      fill="none"
    >
      <template
        v-for="(piece, index) in pieces"
        :key="index"
      >
        <rect
          v-if="piece.kind === 'rect'"
          x="-3"
          y="-1.5"
          width="6"
          height="3"
          rx="0.6"
          :fill="piece.color"
          :transform="piece.transform"
        />
        <circle
          v-else-if="piece.kind === 'circle'"
          r="1.8"
          :fill="piece.color"
          :transform="piece.transform"
        />
        <path
          v-else
          d="M-5 0 q1.25 -2.5 2.5 0 t2.5 0 t2.5 0 t2.5 0"
          :stroke="piece.color"
          stroke-width="1.3"
          stroke-linecap="round"
          :transform="piece.transform"
        />
      </template>
    </svg>

    <!-- 礼花筒：筒口朝上 -->
    <Icon
      name="lucide:party-popper"
      class="absolute bottom-1.5 left-1/2 size-6 -translate-x-1/2 -rotate-45 text-primary"
    />
  </div>
</template>
