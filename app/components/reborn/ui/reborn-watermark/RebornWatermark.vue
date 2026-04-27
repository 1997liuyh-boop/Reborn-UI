<script setup lang="ts">
import { computed, ref, watchEffect, onMounted } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-watermark.config'

export interface RebornWatermarkFont {
  color?: string
  fontSize?: number | string
  fontWeight?: string | number
  fontFamily?: string
  fontStyle?: string
  textAlign?: 'left' | 'right' | 'center' | 'start' | 'end'
  textBaseline?: 'top' | 'hanging' | 'middle' | 'alphabetic' | 'ideographic' | 'bottom'
}

export interface RebornWatermarkProps {
  width?: number
  height?: number
  rotate?: number
  zIndex?: number
  image?: string
  content?: string | string[]
  font?: RebornWatermarkFont
  gap?: [number, number]
  offset?: [number, number]
  customClass?: any
  ui?: any
}

const props = withDefaults(defineProps<RebornWatermarkProps>(), {
  width: 120,
  height: 64,
  rotate: -22,
  zIndex: 9,
  content: 'Reborn UI',
  gap: () => [100, 100],
  ui: () => ({})
})

const b = tv(theme)
const ui = computed(() => {
  const styles = b()
  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.ui.root) }),
    watermark: (opts?: { class?: any }) => styles.watermark({ class: cn(opts?.class, props.ui.watermark) }),
  }
})

const watermarkBase64 = ref('')

const finalFont = computed(() => ({
  color: 'rgba(0, 0, 0, 0.15)',
  fontSize: 16,
  fontWeight: 'normal',
  fontFamily: 'sans-serif',
  fontStyle: 'normal',
  textAlign: 'center',
  textBaseline: 'hanging',
  ...props.font
}))

const finalOffset = computed(() => {
  if (props.offset) return props.offset
  return [props.gap[0] / 2, props.gap[1] / 2]
})

function drawWatermark() {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const ratio = window.devicePixelRatio || 1
  const { width, height, rotate, gap, image, content } = props
  
  const canvasWidth = (gap[0] + width) * ratio
  const canvasHeight = (gap[1] + height) * ratio
  
  canvas.width = canvasWidth
  canvas.height = canvasHeight
  
  ctx.scale(ratio, ratio)
  
  // Move to center of the tile for rotation
  ctx.translate((gap[0] + width) / 2, (gap[1] + height) / 2)
  ctx.rotate((rotate * Math.PI) / 180)
  
  if (image) {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = image
    img.onload = () => {
      ctx.drawImage(img, -width / 2, -height / 2, width, height)
      watermarkBase64.value = canvas.toDataURL()
    }
  } else {
    const { color, fontSize, fontWeight, fontFamily, fontStyle, textAlign, textBaseline } = finalFont.value
    ctx.fillStyle = color
    ctx.font = `${fontStyle} ${fontWeight} ${typeof fontSize === 'number' ? fontSize + 'px' : fontSize} ${fontFamily}`
    ctx.textAlign = textAlign as any
    ctx.textBaseline = textBaseline as any
    
    const contents = Array.isArray(content) ? content : [content]
    const lineHeight = typeof fontSize === 'number' ? fontSize + 4 : 20
    
    contents.forEach((item, index) => {
      ctx.fillText(item, 0, index * lineHeight - (contents.length * lineHeight) / 2)
    })
    
    watermarkBase64.value = canvas.toDataURL()
  }
}

watchEffect(() => {
  if (process.client) {
    drawWatermark()
  }
})

onMounted(() => {
  drawWatermark()
})

const watermarkStyle = computed(() => {
  const [offsetX, offsetY] = finalOffset.value
  return {
    backgroundImage: `url(${watermarkBase64.value})`,
    backgroundSize: `${props.gap[0] + props.width}px ${props.gap[1] + props.height}px`,
    backgroundRepeat: 'repeat',
    backgroundPosition: `${offsetX}px ${offsetY}px`,
    '--reborn-watermark-z-index': props.zIndex
  }
})
</script>

<template>
  <div :class="ui.root()">
    <slot />
    <div :class="ui.watermark()" :style="watermarkStyle" />
  </div>
</template>
