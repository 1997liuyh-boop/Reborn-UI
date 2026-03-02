<script setup lang="ts">
import debounce from 'lodash/debounce'
// @ts-expect-error cjs module
import QRCode from 'qrcode-terminal/vendor/QRCode'
import { computed, getCurrentInstance, nextTick, onMounted, watch } from 'vue'

export interface RebornQrcodeProps {
  value?: string
  icon?: string
  size?: string | number
  iconSize?: string | number
  marginSize?: number
  color?: string
  bgColor?: string
  bordered?: boolean
  errorLevel?: 'L' | 'M' | 'Q' | 'H'
  useCanvasToTempFilePath?: boolean
}

const props = withDefaults(defineProps<RebornQrcodeProps>(), {
  value: '',
  icon: '',
  size: 240,
  iconSize: 42,
  marginSize: 0,
  color: '#000000',
  bgColor: '#ffffff',
  bordered: false,
  errorLevel: 'H',
  useCanvasToTempFilePath: false,
})

const emit = defineEmits<{
  success: [tempFilePath: string]
}>()

function addUnit(value?: string | number): string | null {
  if (value == null || value === '') {
    return null
  }
  const str = String(value)
  return /^-?\d+(?:\.\d+)?$/.test(str) ? `${str}px` : str
}

function unitConvert(value: string | number | null | undefined): number {
  if (value == null || value === '') {
    return 0
  }
  if (typeof value === 'number') {
    return value
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return Number(value)
  }

  const match = value.match(/^(-?\d+(?:\.\d+)?)(rpx|px|%)$/)
  if (!match) {
    return 0
  }

  const numberValue = Number(match[1])
  const unit = match[2]

  if (unit === 'rpx') {
    return uni.upx2px(numberValue)
  }
  if (unit === 'px') {
    return numberValue
  }
  return 0
}

function getErrorLevel(level: RebornQrcodeProps['errorLevel']) {
  if (level === 'L') {
    return 1
  }
  if (level === 'M') {
    return 0
  }
  if (level === 'Q') {
    return 3
  }
  return 2
}

function loadImage(src: string): Promise<any> {
  return new Promise((resolve, reject) => {
    uni.getImageInfo({
      src,
      success: res => resolve(res),
      fail: reject,
    })
  })
}

const instance = getCurrentInstance()
const canvasId = `reborn-qrcode-${instance?.uid ?? Date.now()}`

const styleSize = computed(() => addUnit(props.size) ?? '240px')
const styles = computed(() => `width:${styleSize.value};height:${styleSize.value};`)

const canvasToTempFilePath = debounce(() => {
  uni.canvasToTempFilePath({
    canvasId,
    success: res => emit('success', res.tempFilePath),
  }, instance)
}, 150)

async function render() {
  if (!props.value) {
    return
  }

  const size = unitConvert(props.size)
  const iconSize = unitConvert(props.iconSize)
  const margin = props.bordered ? Math.max(0, props.marginSize) : 0

  const qr = new (QRCode as any)(-1, getErrorLevel(props.errorLevel))
  qr.addData(props.value)
  qr.make()

  const count = qr.getModuleCount()
  const drawSize = size - margin * 2
  const cell = drawSize / count

  const ctx = uni.createCanvasContext(canvasId, instance)
  ctx.setFillStyle(props.bgColor)
  ctx.fillRect(0, 0, size, size)

  for (let row = 0; row < count; row += 1) {
    for (let col = 0; col < count; col += 1) {
      if (!qr.isDark(row, col)) {
        continue
      }
      ctx.setFillStyle(props.color)
      const x = margin + Math.round(col * cell)
      const y = margin + Math.round(row * cell)
      const w = Math.ceil((col + 1) * cell) - Math.floor(col * cell)
      const h = Math.ceil((row + 1) * cell) - Math.floor(row * cell)
      ctx.fillRect(x, y, w, h)
    }
  }

  if (props.icon) {
    try {
      const image = await loadImage(props.icon)
      const x = (size - iconSize) / 2
      const y = (size - iconSize) / 2
      ctx.setFillStyle(props.bgColor)
      ctx.fillRect(x - 4, y - 4, iconSize + 8, iconSize + 8)
      ctx.drawImage(image.path, x, y, iconSize, iconSize)
    }
    catch {
      // ignore logo draw error
    }
  }

  ctx.draw(false, () => {
    if (props.useCanvasToTempFilePath) {
      canvasToTempFilePath()
    }
  })
}

watch(() => ({ ...props }), () => {
  nextTick(() => {
    render()
  })
}, { deep: true })

onMounted(() => {
  render()
})

defineExpose({
  canvasToTempFilePath,
  refresh: render,
})
</script>

<template>
  <view class="relative" :style="styles">
    <canvas :id="canvasId" :canvas-id="canvasId" :style="styles" type="2d" />
  </view>
</template>
