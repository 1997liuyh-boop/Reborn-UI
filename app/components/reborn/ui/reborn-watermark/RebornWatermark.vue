<script setup lang="ts">
import { computed, onBeforeUnmount, shallowRef, watchEffect } from 'vue'
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
  /** 追加到根元素的类名 */
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

/**
 * 每次绘制递增的序号。图片是异步加载的，image 连续变化时先发起的图片可能后加载完，
 * onload / onerror 里与当前序号比对，过期的结果直接丢弃，避免旧图覆盖新水印
 */
let drawToken = 0

function drawWatermark() {
  const token = ++drawToken
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const ratio = window.devicePixelRatio || 1
  const { width, height, rotate, gap, image, content } = props
  // 文字配置同步读取：图片加载失败时要回退到文字水印，字体变化也需要触发重绘
  const { color, fontSize, fontWeight, fontFamily, fontStyle, textAlign, textBaseline } = finalFont.value

  const canvasWidth = (gap[0] + width) * ratio
  const canvasHeight = (gap[1] + height) * ratio

  canvas.width = canvasWidth
  canvas.height = canvasHeight

  ctx.scale(ratio, ratio)

  // 移到单元格中心再旋转
  ctx.translate((gap[0] + width) / 2, (gap[1] + height) / 2)
  ctx.rotate((rotate * Math.PI) / 180)

  const drawText = () => {
    ctx.fillStyle = color
    ctx.font = `${fontStyle} ${fontWeight} ${typeof fontSize === 'number' ? `${fontSize}px` : fontSize} ${fontFamily}`
    ctx.textAlign = textAlign as any
    ctx.textBaseline = textBaseline as any

    const contents = Array.isArray(content) ? content : [content]
    const lineHeight = typeof fontSize === 'number' ? fontSize + 4 : 20

    contents.forEach((item, index) => {
      ctx.fillText(item, 0, index * lineHeight - (contents.length * lineHeight) / 2)
    })

    watermarkBase64.value = canvas.toDataURL()
  }

  if (!image) {
    drawText()
    return
  }

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    if (token !== drawToken) return
    ctx.drawImage(img, -width / 2, -height / 2, width, height)
    watermarkBase64.value = canvas.toDataURL()
  }
  // 图片加载失败（地址无效、跨域被拒）时回退为文字水印，避免整块水印消失
  img.onerror = () => {
    if (token !== drawToken) return
    drawText()
  }
  img.src = image
}

// 只在挂载后绘制、依赖变化时重绘：post 时机的 watchEffect 服务端不执行，客户端首次运行排在挂载之后。
// 若在 setup 里就画，SSR 水合时 style 与服务端输出不一致，Vue 不修补 style，水印会一直不显示
watchEffect(drawWatermark, { flush: 'post' })

// 卸载后让在途的图片加载结果作废
onBeforeUnmount(() => {
  drawToken++
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
  <div :class="ui.root({ class: props.customClass })">
    <slot />
    <div :class="ui.watermark()" :style="watermarkStyle" />
  </div>
</template>
