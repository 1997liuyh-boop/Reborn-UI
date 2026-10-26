<script setup lang="ts">
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
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

const watermarkBase64 = shallowRef('')
const { proxy } = getCurrentInstance()!
let drawVersion = 0
let disposed = false
let mounted = false
let exportTimer: ReturnType<typeof setTimeout> | undefined
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

/** 只比较绘制输入的实际值，避免父级内联对象引起重复导出。 */
const drawKey = computed(() => JSON.stringify([
  props.width, props.height, props.rotate, props.image, props.content, props.gap, finalFont.value,
]))

async function drawWatermark() {
  const version = ++drawVersion
  clearTimeout(exportTimer)
  await nextTick()
  if (!mounted || disposed || version !== drawVersion) return
  const { width, height, rotate, image, content } = props
  const gap = [...props.gap]
  const font = { ...finalFont.value }
  const canvasWidth = gap[0] + width
  const canvasHeight = gap[1] + height
  let imagePath = image
  if (image) {
    // 小程序画布需使用本地图片路径，加载失败时回退文字。
    imagePath = await new Promise<string>(resolve => uni.getImageInfo({
      src: image,
      success: result => resolve(result.path),
      fail: () => resolve(''),
    }))
    if (disposed || version !== drawVersion) return
  }
  const ctx = uni.createCanvasContext(canvasId, proxy)
  if (!ctx) return
  ctx.translate(canvasWidth / 2, canvasHeight / 2)
  ctx.rotate((rotate * Math.PI) / 180)
  if (imagePath) {
    ctx.drawImage(imagePath, -width / 2, -height / 2, width, height)
  } else {
    const fontSize = Number.parseInt(String(font.fontSize)) || 16
    ctx.setFillStyle(font.color)
    ctx.setFontSize(fontSize)
    // 原生 canvas 分别设置字号、颜色与对齐方式。
    ctx.setTextAlign(font.textAlign as any)
    ctx.setTextBaseline(font.textBaseline as any)
    const contents = Array.isArray(content) ? content : [content]
    contents.forEach((item, index) => {
      ctx.fillText(item, 0, index * (fontSize + 4) - contents.length * (fontSize + 4) / 2)
    })
  }
  ctx.draw(false, () => {
    if (disposed || version !== drawVersion) return
    exportTimer = setTimeout(() => {
      if (disposed || version !== drawVersion) return
      uni.canvasToTempFilePath({
        canvasId,
        destWidth: canvasWidth * 2,
        destHeight: canvasHeight * 2,
        success: result => {
          if (!disposed && version === drawVersion) watermarkBase64.value = result.tempFilePath
        },
        fail: error => {
          if (!disposed && version === drawVersion) console.warn('[RebornWatermark] 水印导出失败', error)
        },
      }, proxy)
    }, 50)
  })
}

watch(drawKey, () => { if (mounted) drawWatermark() }, { flush: 'post' })
onMounted(() => { mounted = true; drawWatermark() })
onBeforeUnmount(() => {
  disposed = true
  drawVersion++
  clearTimeout(exportTimer)
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
  <view :class="ui.root({ class: props.customClass })">
    <slot />
    <!-- 隐藏画布仅用于生成水印图片。 -->
    <canvas 
      :canvas-id="canvasId" 
      :style="{ width: (gap[0] + width) + 'px', height: (gap[1] + height) + 'px', position: 'absolute', left: '-9999px', top: '-9999px' }" 
    />
    <view :class="ui.watermark()" :style="watermarkStyle" />
  </view>
</template>
