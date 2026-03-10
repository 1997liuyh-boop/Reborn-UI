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

const eyeCenter = (eye: { x: number, y: number }) => {
  return { x: eye.x + 2, y: eye.y + 2 }
}

const qrcodeId = computed(() => `qr-${Math.random().toString(36).slice(2, 9)}`)

const getGradientStops = (gradient: any) => {
  if (!gradient || !gradient.colorStops) return []
  return gradient.colorStops
}

const getGradientCoords = (gradient: any) => {
  if (!gradient || !gradient.direction) return { x1: "0%", y1: "0%", x2: "100%", y2: "0%" }
  switch (gradient.direction) {
    case 'horizontal': return { x1: "0%", y1: "0%", x2: "100%", y2: "0%" }
    case 'vertical': return { x1: "0%", y1: "0%", x2: "0%", y2: "100%" }
    case 'diagonal': return { x1: "0%", y1: "0%", x2: "100%", y2: "100%" }
    default: return { x1: "0%", y1: "0%", x2: "100%", y2: "0%" }
  }
}

const dotsFill = computed(() => {
  if (props.dotsImage) return `url(#${qrcodeId.value}-dots-img)`
  if (props.dotsGradient) return `url(#${qrcodeId.value}-dots-grad)`
  return props.foreground
})

const bgFill = computed(() => {
  if (props.backgroundTransparent) return 'transparent'
  if (props.backgroundGradient) return `url(#${qrcodeId.value}-bg-grad)`
  return props.background
})

const cornerSquareFill = computed(() => {
  if (props.cornersSquareGradient) return `url(#${qrcodeId.value}-cs-grad)`
  if (props.cornersSquareOptions?.color) return props.cornersSquareOptions.color
  if (props.pdColor) return props.pdColor
  return props.foreground
})

const cornerDotFill = computed(() => {
  if (props.cornersDotGradient) return `url(#${qrcodeId.value}-cd-grad)`
  if (props.cornersDotOptions?.color) return props.cornersDotOptions.color
  if (props.pdColor) return props.pdColor
  return props.foreground
})

const getRoundRectPath = (x: number, y: number, w: number, h: number, r: number) => {
  if (r <= 0) return `M ${x} ${y} h ${w} v ${h} h ${-w} Z`
  const radius = Math.min(r, w / 2, h / 2)
  return `M ${x + radius} ${y} 
          h ${w - 2 * radius} 
          a ${radius} ${radius} 0 0 1 ${radius} ${radius} 
          v ${h - 2 * radius} 
          a ${radius} ${radius} 0 0 1 ${-radius} ${radius} 
          h ${-(w - 2 * radius)} 
          a ${radius} ${radius} 0 0 1 ${-radius} ${-radius} 
          v ${-(h - 2 * radius)} 
          a ${radius} ${radius} 0 0 1 ${radius} ${-radius} Z`
}
</script>

<template>
  <div :style="{ width: `${size}px`, height: `${size}px` }" class="relative">
    <svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <!-- Dots Gradient -->
        <linearGradient v-if="dotsGradient" :id="`${qrcodeId}-dots-grad`" gradientUnits="userSpaceOnUse"
          v-bind="getGradientCoords(dotsGradient)">
          <stop v-for="stop in getGradientStops(dotsGradient)" :key="stop.offset" :offset="`${stop.offset * 100}%`"
            :stop-color="stop.color" />
        </linearGradient>

        <!-- Background Gradient -->
        <linearGradient v-if="backgroundGradient" :id="`${qrcodeId}-bg-grad`" gradientUnits="userSpaceOnUse"
          v-bind="getGradientCoords(backgroundGradient)">
          <stop v-for="stop in getGradientStops(backgroundGradient)" :key="stop.offset"
            :offset="`${stop.offset * 100}%`" :stop-color="stop.color" />
        </linearGradient>

        <!-- Corner Square Gradient -->
        <linearGradient v-if="cornersSquareGradient" :id="`${qrcodeId}-cs-grad`" gradientUnits="userSpaceOnUse"
          v-bind="getGradientCoords(cornersSquareGradient)">
          <stop v-for="stop in getGradientStops(cornersSquareGradient)" :key="stop.offset"
            :offset="`${stop.offset * 100}%`" :stop-color="stop.color" />
        </linearGradient>

        <!-- Corner Dot Gradient -->
        <linearGradient v-if="cornersDotGradient" :id="`${qrcodeId}-cd-grad`" gradientUnits="userSpaceOnUse"
          v-bind="getGradientCoords(cornersDotGradient)">
          <stop v-for="stop in getGradientStops(cornersDotGradient)" :key="stop.offset"
            :offset="`${stop.offset * 100}%`" :stop-color="stop.color" />
        </linearGradient>

        <!-- Dots Image Pattern -->
        <pattern v-if="dotsImage" :id="`${qrcodeId}-dots-img`" patternUnits="userSpaceOnUse" width="100%" height="100%">
          <image :href="dotsImage" x="0" y="0" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" />
        </pattern>
      </defs>

      <rect :width="size" :height="size" :fill="bgFill" />

      <template v-for="dot in dots" :key="`${dot.x}-${dot.y}`">
        <circle v-if="mode === 'circular'" :cx="padding + (dot.x + 0.5) * cellSize"
          :cy="padding + (dot.y + 0.5) * cellSize" :r="cellSize * 0.42" :fill="dotsFill" />
        <rect v-else-if="mode === 'rectSmall'" :x="padding + dot.x * cellSize + cellSize * 0.2"
          :y="padding + dot.y * cellSize + cellSize * 0.2" :width="cellSize * 0.6" :height="cellSize * 0.6" rx="1"
          :fill="dotsFill" />
        <rect v-else-if="mode === 'line'" :x="padding + dot.x * cellSize"
          :y="padding + dot.y * cellSize + cellSize * 0.15" :width="cellSize" :height="cellSize * 0.7"
          :fill="dotsFill" />
        <rect v-else :x="padding + dot.x * cellSize" :y="padding + dot.y * cellSize" :width="cellSize"
          :height="cellSize" :fill="dotsFill" />
      </template>

      <template v-for="eye in eyeRects" :key="`${eye.x}-${eye.y}`">
        <!-- Position Ring (Outer 7x7 - Inner 5x5) -->
        <path :d="`
            ${getRoundRectPath(padding + eye.x * cellSize, padding + eye.y * cellSize, eye.size * cellSize, eye.size * cellSize, pdOuterRadius ?? pdRadius)}
            ${getRoundRectPath(padding + (eye.x + 1) * cellSize, padding + (eye.y + 1) * cellSize, 5 * cellSize, 5 * cellSize, Math.max(0, (pdOuterRadius ?? pdRadius) - cellSize))}
          `" fill-rule="evenodd" :fill="cornerSquareFill" />
        <!-- Inner Center Dot (3x3) -->
        <path
          :d="getRoundRectPath(padding + eyeCenter(eye).x * cellSize, padding + eyeCenter(eye).y * cellSize, 3 * cellSize, 3 * cellSize, pdInnerRadius ?? pdRadius / 2)"
          :fill="cornerDotFill" />
      </template>
    </svg>

    <img v-if="logo" :src="logo" alt="logo" class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded"
      :style="{ width: `${logoSize}px`, height: `${logoSize}px` }">
  </div>
</template>
