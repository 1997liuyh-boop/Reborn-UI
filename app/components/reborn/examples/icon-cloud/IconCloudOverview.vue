<script setup lang="ts">
/**
 * 总览卡片缩略：一圈按球面分布的技术栈图标，近大远小、远处变淡
 *
 * 真实组件是 canvas 加常驻 requestAnimationFrame 持续旋转，总览页挂载后不卸载，不能照搬；
 * 这里沿用组件同一套斐波那契球面布点与缩放、透明度公式，取一个固定视角算出静态坐标，用 DOM 图标摆出来。
 */
const icons = [
  'logos:typescript-icon',
  'logos:javascript',
  'logos:vue',
  'logos:react',
  'logos:nuxt-icon',
  'logos:nodejs-icon',
  'logos:html-5',
  'logos:css-3',
  'logos:docker-icon',
  'logos:git-icon',
  'logos:figma',
  'logos:vitejs',
  'logos:tailwindcss-icon',
  'logos:postgresql',
  'logos:flutter',
  'logos:dart',
  'logos:java',
  'logos:firebase',
  'logos:nginx',
  'logos:jest',
]

/** 画布边长（px），与组件 300px 画布等比缩小 */
const STAGE = 128
/** 组件坐标到缩略图坐标的缩放系数 */
const RATIO = 0.56
/** 固定视角：绕 X、Y 轴的旋转弧度 */
const ROTATE_X = 0.35
const ROTATE_Y = 0.6

/** 与组件一致：单位球面上均匀布点，再按固定视角旋转投影 */
const nodes = icons
  .map((name, i) => {
    const offset = 2 / icons.length
    const increment = Math.PI * (3 - Math.sqrt(5))
    const y = i * offset - 1 + offset / 2
    const r = Math.sqrt(1 - y * y)
    const phi = i * increment
    const x = Math.cos(phi) * r * 100
    const z = Math.sin(phi) * r * 100
    const py = y * 100

    const rotatedX = x * Math.cos(ROTATE_Y) - z * Math.sin(ROTATE_Y)
    const rotatedZ = x * Math.sin(ROTATE_Y) + z * Math.cos(ROTATE_Y)
    const rotatedY = py * Math.cos(ROTATE_X) + rotatedZ * Math.sin(ROTATE_X)

    const scale = (rotatedZ + 200) / 300
    const size = 40 * scale * RATIO
    return {
      name,
      depth: rotatedZ,
      style: {
        left: `${STAGE / 2 + rotatedX * RATIO - size / 2}px`,
        top: `${STAGE / 2 + rotatedY * RATIO - size / 2}px`,
        width: `${size}px`,
        height: `${size}px`,
        opacity: Math.max(0.2, Math.min(1, (rotatedZ + 150) / 200)),
      },
    }
  })
  // 远处的先渲染，近处的盖在上面
  .sort((a, b) => a.depth - b.depth)
</script>

<template>
  <div class="relative size-32 shrink-0">
    <div
      v-for="node in nodes"
      :key="node.name"
      class="absolute"
      :style="node.style"
    >
      <Icon
        :name="node.name"
        class="size-full"
      />
    </div>
  </div>
</template>
