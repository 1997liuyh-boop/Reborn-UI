<script setup lang="ts">
import type { ClQrcodeMode } from './types'
import { computed } from 'vue'
import { generateFrame } from './qrcode'
import { eccLevel } from './types'

interface RebornQrcodeOptions {
  /** 二维码尺寸 (px) */
  size?: number | string
  /** 前景色 (实心点颜色) */
  foreground?: string
  /** 别名：前景色 */
  dotsColor?: string
  /** 背景颜色 */
  background?: string
  /** 别名：背景颜色 */
  backgroundColor?: string
  /** 背景是否透明 (会忽略 background 设置) */
  backgroundTransparent?: boolean
  /** 定位点 (Eyes) 的颜色，不传则跟随前景色 */
  pdColor?: string | null
  /** 定位点基础圆角半径 (默认 10) */
  pdRadius?: number | string
  /** 二维码编码的内容文案 */
  text?: string
  /** Logo 图片地址 (会自动居中显示) */
  logo?: string
  /** 别名：Logo 图片地址 */
  logoImage?: string
  /** Logo 尺寸 (px) */
  logoSize?: number | string
  /** 二维码内边距 (px) */
  padding?: number | string
  /** 别名：内边距 */
  margin?: number | string
  /** Logo 外部预留边空 (用于遮住背景点点) */
  logoMargin?: number | string
  /** 是否隐藏 Logo 下方的点 */
  logoHideBackgroundDots?: boolean
  /** Logo 是否显示阴影 */
  logoShadow?: boolean
  /** Logo 形状: 'circle' | 'square' */
  logoShape?: 'circle' | 'square'
  /** 点阵渲染模式: 'circular' | 'rectSmall' | 'line' | 'rect' */
  mode?: ClQrcodeMode
  /** 别名：渲染模式 */
  dotsType?: ClQrcodeMode
  /** 容错等级: L (7%), M (15%), Q (25%), H (30%) */
  ecc?: eccLevel
  /** 定位点 (Eyes) 外框渲染类型: 'rect' (直角), 'extra-rounded' (圆角), 'dot' (圆形) */
  cornersSquareType?: 'rect' | 'dot' | 'square' | 'extra-rounded'
  /** 定位点 (Eyes) 中央内点渲染类型: 'rect' (直角), 'dot' (圆形) */
  cornersDotType?: 'rect' | 'dot' | 'square'
  /** 定位点 (Eyes) 外框圆角半径 (优先级高于 cornersSquareType) */
  pdOuterRadius?: number | string
  /** 定位点 (Eyes) 中央内点圆角半径 (优先级高于 cornersDotType) */
  pdInnerRadius?: number | string
  /** 点阵渐变配置 { direction, colorStops } */
  dotsGradient?: any
  /** 点阵使用图片填充的图案地址 */
  dotsImage?: string | null
  /** 背景渐变配置 */
  backgroundGradient?: any
  /** Logo 其他选项 (扩展参数) */
  logoOptions?: any
  /** 定位点外框渐变配置 */
  cornersSquareGradient?: any
  /** 定位点中央内点渐变配置 */
  cornersDotGradient?: any
  /** 定位点外框自定义属性 */
  cornersSquareOptions?: any
  /** 定位点中央内点自定义属性 */
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
  logoMargin: 4,
  logoHideBackgroundDots: false,
  logoShadow: false,
  ecc: eccLevel.H,
})

// 计算最终生效的参数 (处理 Alias 优先级及类型转换)
const finalSize = computed(() => Number(props.size))
const finalForeground = computed(() => props.dotsColor || props.foreground)
const finalBackground = computed(() => props.backgroundColor || props.background)
const finalPadding = computed(() => (props.margin !== undefined ? Number(props.margin) : Number(props.padding)))
const finalLogo = computed(() => props.logoImage || props.logo)
const finalLogoSize = computed(() => Number(props.logoSize))
const finalLogoMargin = computed(() => Number(props.logoMargin))
const finalMode = computed(() => props.dotsType || props.mode || 'circular')

// 定位点半径处理 (处理 'rect' 逻辑)
const finalPdOuterRadius = computed(() => {
  if (props.pdOuterRadius !== undefined) return Number(props.pdOuterRadius)
  if (props.cornersSquareType === 'rect') return 0
  if (props.cornersSquareType === 'extra-rounded') return finalSize.value * 0.1
  if (props.cornersSquareType === 'dot') return finalSize.value * 0.2
  return Number(props.pdRadius)
})

const finalPdInnerRadius = computed(() => {
  if (props.pdInnerRadius !== undefined) return Number(props.pdInnerRadius)
  if (props.cornersDotType === 'rect') return 0
  if (props.cornersDotType === 'dot') return finalSize.value * 0.1
  return Number(props.pdRadius) / 2
})

const frameData = computed(() => generateFrame(props.text, props.ecc))
const width = computed(() => frameData.value.width)
const cellSize = computed(() => (finalSize.value - finalPadding.value * 2) / width.value)

interface EyeRect {
  x: number
  y: number
  size: number
}

const eyeRects = computed((): EyeRect[] => {
  const w = width.value
  const s = 7
  return [
    { x: 0, y: 0, size: s },
    { x: w - s, y: 0, size: s },
    { x: 0, y: w - s, size: s },
  ]
})

function isInEye(x: number, y: number) {
  return eyeRects.value.some((eye: EyeRect) => x >= eye.x && x < eye.x + eye.size && y >= eye.y && y < eye.y + eye.size)
}

function isInLogo(x: number, y: number) {
  if (!finalLogo.value || !props.logoHideBackgroundDots) return false

  const logoPx = {
    x1: (finalSize.value - finalLogoSize.value) / 2 - finalLogoMargin.value,
    y1: (finalSize.value - finalLogoSize.value) / 2 - finalLogoMargin.value,
    x2: (finalSize.value + finalLogoSize.value) / 2 + finalLogoMargin.value,
    y2: (finalSize.value + finalLogoSize.value) / 2 + finalLogoMargin.value,
  }

  const dotPx = {
    x1: finalPadding.value + x * cellSize.value,
    y1: finalPadding.value + y * cellSize.value,
    x2: finalPadding.value + (x + 1) * cellSize.value,
    y2: finalPadding.value + (y + 1) * cellSize.value,
  }

  return (
    dotPx.x1 < logoPx.x2 &&
    dotPx.x2 > logoPx.x1 &&
    dotPx.y1 < logoPx.y2 &&
    dotPx.y2 > logoPx.y1
  )
}

const dots = computed(() => {
  const arr: Array<{ x: number, y: number }> = []
  const frame = frameData.value.frameBuffer
  const w = width.value
  for (let y = 0; y < w; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x
      if (frame[idx] && !isInEye(x, y) && !isInLogo(x, y))
        arr.push({ x, y })
    }
  }
  return arr
})

const eyeCenter = (eye: EyeRect) => {
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
  return finalForeground.value
})

const bgFill = computed(() => {
  if (props.backgroundTransparent) return 'transparent'
  if (props.backgroundGradient) return `url(#${qrcodeId.value}-bg-grad)`
  return finalBackground.value
})

const cornerSquareFill = computed(() => {
  if (props.cornersSquareGradient) return `url(#${qrcodeId.value}-cs-grad)`
  if (props.cornersSquareOptions?.color) return props.cornersSquareOptions.color
  if (props.pdColor) return props.pdColor
  return finalForeground.value
})

const cornerDotFill = computed(() => {
  if (props.cornersDotGradient) return `url(#${qrcodeId.value}-cd-grad)`
  if (props.cornersDotOptions?.color) return props.cornersDotOptions.color
  if (props.pdColor) return props.pdColor
  return finalForeground.value
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
  <div :style="{ width: `${finalSize}px`, height: `${finalSize}px` }" class="relative overflow-hidden">
    <svg :width="finalSize" :height="finalSize" :viewBox="`0 0 ${finalSize} ${finalSize}`"
      xmlns="http://www.w3.org/2000/svg">
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

      <rect :width="finalSize" :height="finalSize" :fill="bgFill" />

      <template v-for="dot in dots" :key="`${dot.x}-${dot.y}`">
        <circle v-if="finalMode === 'circular'" :cx="finalPadding + (dot.x + 0.5) * cellSize"
          :cy="finalPadding + (dot.y + 0.5) * cellSize" :r="cellSize * 0.42" :fill="dotsFill" />
        <rect v-else-if="finalMode === 'rectSmall'" :x="finalPadding + dot.x * cellSize + cellSize * 0.2"
          :y="finalPadding + dot.y * cellSize + cellSize * 0.2" :width="cellSize * 0.6" :height="cellSize * 0.6" rx="1"
          :fill="dotsFill" />
        <rect v-else-if="finalMode === 'line'" :x="finalPadding + dot.x * cellSize"
          :y="finalPadding + dot.y * cellSize + cellSize * 0.15" :width="cellSize" :height="cellSize * 0.7"
          :fill="dotsFill" />
        <rect v-else :x="finalPadding + dot.x * cellSize" :y="finalPadding + dot.y * cellSize" :width="cellSize"
          :height="cellSize" :fill="dotsFill" />
      </template>

      <template v-for="eye in eyeRects" :key="`${eye.x}-${eye.y}`">
        <!-- Position Ring (Outer 7x7 - Inner 5x5) -->
        <path :d="`
            ${getRoundRectPath(finalPadding + eye.x * cellSize, finalPadding + eye.y * cellSize, eye.size * cellSize, eye.size * cellSize, finalPdOuterRadius)}
            ${getRoundRectPath(finalPadding + (eye.x + 1) * cellSize, finalPadding + (eye.y + 1) * cellSize, 5 * cellSize, 5 * cellSize, Math.max(0, finalPdOuterRadius - cellSize))}
          `" fill-rule="evenodd" :fill="cornerSquareFill" />
        <!-- Inner Center Dot (3x3) -->
        <path
          :d="getRoundRectPath(finalPadding + eyeCenter(eye).x * cellSize, finalPadding + eyeCenter(eye).y * cellSize, 3 * cellSize, 3 * cellSize, finalPdInnerRadius)"
          :fill="cornerDotFill" />
      </template>
    </svg>

    <img v-if="finalLogo" :src="finalLogo" alt="logo"
      class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
      :class="[logoShape === 'circle' ? 'rounded-full' : 'rounded']" :style="{
        width: `${finalLogoSize}px`,
        height: `${finalLogoSize}px`,
        filter: logoShadow ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.15))' : 'none'
      }">
  </div>
</template>
