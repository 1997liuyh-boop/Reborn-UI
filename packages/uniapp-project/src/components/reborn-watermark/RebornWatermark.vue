<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue'
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
const canvasId = `watermark-canvas-${Math.random().toString(36).slice(2)}`

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
  const { width, height, rotate, gap, image, content } = props
  const canvasWidth = gap[0] + width
  const canvasHeight = gap[1] + height
  
  const ctx = uni.createCanvasContext(canvasId)
  if (!ctx) return

  // Move to center for rotation
  ctx.translate(canvasWidth / 2, canvasHeight / 2)
  ctx.rotate((rotate * Math.PI) / 180)
  
  if (image) {
    ctx.drawImage(image, -width / 2, -height / 2, width, height)
    ctx.draw(false, () => {
      uni.canvasToTempFilePath({
        canvasId,
        success: (res) => {
          watermarkBase64.value = res.tempFilePath
        }
      })
    })
  } else {
    const { color, fontSize, fontWeight, fontFamily, fontStyle, textAlign, textBaseline } = finalFont.value
    ctx.setFillStyle(color)
    ctx.setFontSize(typeof fontSize === 'number' ? fontSize : parseInt(String(fontSize)))
    // UniApp canvas doesn't support full font string as well as web, so we set fontSize/fillStyle
    ctx.setTextAlign(textAlign as any)
    ctx.setTextBaseline(textBaseline as any)
    
    const contents = Array.isArray(content) ? content : [content]
    const lineHeight = typeof fontSize === 'number' ? fontSize + 4 : 20
    
    contents.forEach((item, index) => {
      ctx.fillText(item, 0, index * lineHeight - (contents.length * lineHeight) / 2)
    })
    
    ctx.draw(false, () => {
      setTimeout(() => {
        uni.canvasToTempFilePath({
          canvasId,
          destWidth: canvasWidth * 2,
          destHeight: canvasHeight * 2,
          success: (res) => {
            watermarkBase64.value = res.tempFilePath
          }
        })
      }, 50)
    })
  }
}

watch(() => [props.content, props.image, props.font, props.gap, props.rotate], () => {
  drawWatermark()
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    drawWatermark()
  })
})

const watermarkStyle = computed(() => {
  const [offsetX, offsetY] = finalOffset.value
  return {
    backgroundImage: `url(${watermarkBase64.value})`,
    backgroundSize: `${props.gap[0] + props.width}px ${props.gap[1] + props.height}px`,
    backgroundRepeat: 'repeat',
    backgroundPosition: `${offsetX}px ${offsetY}px`,
    zIndex: props.zIndex
  }
})
</script>

<template>
  <view :class="ui.root()">
    <slot />
    <!-- Hidden canvas for watermark generation -->
    <canvas 
      :canvas-id="canvasId" 
      :style="{ width: (gap[0] + width) + 'px', height: (gap[1] + height) + 'px', position: 'absolute', left: '-9999px', top: '-9999px' }" 
    />
    <view :class="ui.watermark()" :style="watermarkStyle" />
  </view>
</template>
