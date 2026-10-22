<script setup lang="ts">
/**
 * 总览卡片缩略：深色舞台上的一张配图，右上部有一圈被放大两倍的圆形镜头区域
 *
 * 静态模拟：组件的做法是把整张图按倍数放大成一层、再用圆形遮罩只露出镜头部分，
 * 放大层本身比图片大一倍、远超缩略图边界（只是被外层裁掉），不符合缩略图的尺寸约束；
 * 这里改为一个圆形容器，用同一张图做背景、按相同倍数与圆心换算背景尺寸和偏移，画面与组件一致。
 * 半透明白描边是缩略图加的提示，组件本身只有遮罩没有描边。
 * Demo 里的光束与光晕装饰是 380px 宽的大块 SVG，缩略图里省略。
 */
const IMAGE_URL = 'https://images.unsplash.com/photo-1713869820987-519844949a8a?q=80&w=360&h=144&auto=format&fit=crop'

/** 图片显示尺寸、镜头直径、圆心（相对图片左上角）与放大倍数，单位 px */
const IMAGE_WIDTH = 180
const IMAGE_HEIGHT = 72
const LENS_SIZE = 52
const CENTER = { x: 118, y: 34 }
const ZOOM = 2

const lensStyle = {
  width: `${LENS_SIZE}px`,
  height: `${LENS_SIZE}px`,
  left: `${CENTER.x - LENS_SIZE / 2}px`,
  top: `${CENTER.y - LENS_SIZE / 2}px`,
  backgroundImage: `url(${IMAGE_URL})`,
  backgroundSize: `${IMAGE_WIDTH * ZOOM}px ${IMAGE_HEIGHT * ZOOM}px`,
  // 放大后让原圆心对准镜头中心
  backgroundPosition: `${LENS_SIZE / 2 - CENTER.x * ZOOM}px ${LENS_SIZE / 2 - CENTER.y * ZOOM}px`,
}
</script>

<template>
  <div class="w-[200px] rounded-2xl bg-gray-10 p-2.5 dark:bg-gray-1">
    <div
      class="relative overflow-hidden rounded-lg bg-black/40"
      :style="{ width: `${IMAGE_WIDTH}px`, height: `${IMAGE_HEIGHT}px` }"
    >
      <img
        :src="IMAGE_URL"
        alt="Vision Pro 配图"
        class="size-full object-cover"
      >
      <span
        class="absolute rounded-full ring-1 ring-white/70"
        :style="lensStyle"
      />
    </div>
    <div class="mt-1.5 text-xs font-bold text-white">
      Apple Vision Pro
    </div>
  </div>
</template>
