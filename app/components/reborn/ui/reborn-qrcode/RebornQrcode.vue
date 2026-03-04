<script setup lang="ts">
import type { ClQrcodeMode } from './types'
import { computed } from 'vue'
import { generateFrame } from './qrcode'
import { eccLevel } from './types'

interface RebornQrcodeOptions {
  size?: number
  foreground?: string
  background?: string
  pdColor?: string | null
  pdRadius?: number
  text?: string
  logo?: string
  logoSize?: number
  padding?: number
  mode?: ClQrcodeMode
  ecc?: eccLevel
  pdOuterRadius?: number
  pdInnerRadius?: number
  dotsGradient?: any
  dotsImage?: string | null
  backgroundGradient?: any
  backgroundTransparent?: boolean
  logoOptions?: any
  cornersSquareGradient?: any
  cornersDotGradient?: any
  cornersSquareOptions?: any
  cornersDotOptions?: any
}

const props = withDefaults(defineProps<RebornQrcodeOptions>(), {
  size: 200,
  foreground: '#131313',
  background: '#FFFFFF',
  pdColor: null,
  pdRadius: 10,
  text: 'https://cool-js.com/',
  logo: '',
  logoSize: 40,
  padding: 5,
  mode: 'circular',
  ecc: eccLevel.H,
  pdOuterRadius: undefined,
  pdInnerRadius: undefined,
})

const frameData = computed(() => generateFrame(props.text, props.ecc))
const width = computed(() => frameData.value.width)
const cellSize = computed(() => (props.size - props.padding * 2) / width.value)

const eyeRects = computed(() => {
  const w = width.value
  const s = 7
  return [
    { x: 0, y: 0, size: s },
    { x: w - s, y: 0, size: s },
    { x: 0, y: w - s, size: s },
  ]
})

function isInEye(x: number, y: number) {
  return eyeRects.value.some((eye) => x >= eye.x && x < eye.x + eye.size && y >= eye.y && y < eye.y + eye.size)
}

const dots = computed(() => {
  const arr: Array<{ x: number, y: number }> = []
  const frame = frameData.value.frameBuffer
  const w = width.value
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      if (frame[idx] && !isInEye(x, y))
        arr.push({ x, y })
    }
  }
  return arr
})

function eyeCenter(eye: { x: number, y: number }) {
  return { x: eye.x + 2, y: eye.y + 2 }
}
</script>

<template>
  <div :style="{ width: `${size}px`, height: `${size}px` }" class="relative">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" xmlns="http://www.w3.org/2000/svg">
      <rect :width="size" :height="size" :fill="backgroundTransparent ? 'transparent' : background" />

      <template v-for="dot in dots" :key="`${dot.x}-${dot.y}`">
        <circle
          v-if="mode === 'circular'"
          :cx="padding + (dot.x + 0.5) * cellSize"
          :cy="padding + (dot.y + 0.5) * cellSize"
          :r="cellSize * 0.42"
          :fill="foreground"
        />
        <rect
          v-else-if="mode === 'rectSmall'"
          :x="padding + dot.x * cellSize + cellSize * 0.2"
          :y="padding + dot.y * cellSize + cellSize * 0.2"
          :width="cellSize * 0.6"
          :height="cellSize * 0.6"
          rx="1"
          :fill="foreground"
        />
        <rect
          v-else-if="mode === 'line'"
          :x="padding + dot.x * cellSize"
          :y="padding + dot.y * cellSize + cellSize * 0.15"
          :width="cellSize"
          :height="cellSize * 0.7"
          :fill="foreground"
        />
        <rect
          v-else
          :x="padding + dot.x * cellSize"
          :y="padding + dot.y * cellSize"
          :width="cellSize"
          :height="cellSize"
          :fill="foreground"
        />
      </template>

      <template v-for="eye in eyeRects" :key="`${eye.x}-${eye.y}`">
        <rect
          :x="padding + eye.x * cellSize"
          :y="padding + eye.y * cellSize"
          :width="eye.size * cellSize"
          :height="eye.size * cellSize"
          :rx="pdOuterRadius ?? pdRadius"
          :fill="pdColor || foreground"
        />
        <rect
          :x="padding + (eye.x + 1) * cellSize"
          :y="padding + (eye.y + 1) * cellSize"
          :width="5 * cellSize"
          :height="5 * cellSize"
          :fill="backgroundTransparent ? 'transparent' : background"
        />
        <rect
          :x="padding + eyeCenter(eye).x * cellSize"
          :y="padding + eyeCenter(eye).y * cellSize"
          :width="3 * cellSize"
          :height="3 * cellSize"
          :rx="pdInnerRadius ?? pdRadius / 2"
          :fill="pdColor || foreground"
        />
      </template>
    </svg>

    <img
      v-if="logo"
      :src="logo"
      alt="logo"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded"
      :style="{ width: `${logoSize}px`, height: `${logoSize}px` }"
    >
  </div>
</template>
