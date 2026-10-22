<script setup lang="ts">
/**
 * 总览卡片缩略：一块深色画布，蓝紫星云与散落星点，近似 Demo 默认的 Star Nest 着色器画面
 *
 * 真实组件是 WebGL 渲染加逐帧动画，总览页禁止再开 WebGL 上下文；
 * 这里用多层径向渐变叠出星云，再用固定种子生成的一组小圆点渐变模拟星空，纯 CSS 静态近似。
 */
/** 星云：几团不同色相的柔光，叠在近黑底色上 */
const nebula = [
  'radial-gradient(ellipse 45% 55% at 46% 46%, rgba(190, 210, 255, 0.35), transparent 70%)',
  'radial-gradient(ellipse 60% 70% at 30% 40%, rgba(70, 110, 255, 0.6), transparent 70%)',
  'radial-gradient(ellipse 50% 60% at 74% 62%, rgba(170, 80, 255, 0.5), transparent 70%)',
  'radial-gradient(ellipse 35% 40% at 60% 26%, rgba(255, 170, 110, 0.35), transparent 70%)',
  'radial-gradient(ellipse 30% 35% at 16% 78%, rgba(90, 220, 255, 0.35), transparent 70%)',
]

/** 固定种子的伪随机数，保证每次渲染星点位置一致 */
let seed = 7
function random() {
  seed = (seed * 16807) % 2147483647
  return seed / 2147483647
}

/** 星点：不平铺、逐个指定位置，避免看出重复规律 */
const stars = Array.from({ length: 36 }, () => {
  const size = (0.8 + random() * 1.2).toFixed(1)
  const alpha = (0.5 + random() * 0.5).toFixed(2)
  const x = (random() * 100).toFixed(1)
  const y = (random() * 100).toFixed(1)
  return `radial-gradient(${size}px ${size}px at ${x}% ${y}%, rgba(225, 235, 255, ${alpha}), transparent)`
})

const canvasStyle = {
  backgroundColor: '#05060f',
  backgroundImage: [...stars, ...nebula].join(', '),
}
</script>

<template>
  <div
    class="h-[120px] w-[200px] rounded-lg shadow-lg ring-1 ring-gray-3"
    :style="canvasStyle"
  />
</template>
