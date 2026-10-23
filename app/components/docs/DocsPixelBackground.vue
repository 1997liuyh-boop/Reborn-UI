<script setup lang="ts">
/**
 * 组合式函数一节（/composables 及其子页）的像素风背景：进入页面后像素点从视口顶部落下，逐行拼成整图
 * - 素材是 128×85 的透明 PNG，每个像素就是一个像素点（生成方式见 public/images/composables/README.md）；
 * - 由下往上逐行落位：先落的行在下，后落的行停在它上面，像一块块搭起来；
 * - 拼完后画一帧静止图就停掉 rAF，不留常驻循环；视口尺寸变化时按新尺寸重画静止图；
 * - 减少动态效果偏好下直接画成品，不播放下落。
 * 由 docs 布局挂载，挂在 UPage 的 :key 之外：同一节里切换子页不重播，从别的栏目进入时才播。
 */
import { withBase } from 'ufo'
import { onBeforeUnmount, onMounted, useTemplateRef } from 'vue'

interface Props {
  /** 整层透明度 */
  opacity?: number
  /** 整图最多占可用区域（顶栏以下的视口）宽与高的比例，越大图越大 */
  scale?: number
}

const { opacity = 0.1, scale = 0.86 } = defineProps<Props>()

const { app } = useRuntimeConfig()
const source = withBase('/images/composables/throne-pixel.png', app.baseURL)

const wrapper = useTemplateRef<HTMLDivElement>('wrapper')
const canvas = useTemplateRef<HTMLCanvasElement>('canvas')

/** 单个像素点：所在行列与颜色；下落延迟在拿到素材后按行算好 */
interface Pixel {
  col: number
  row: number
  color: string
  delay: number
}

/** 每行比下面一行晚落多少毫秒；85 行约 1.7s 落完 */
const ROW_STEP = 20
/** 同一行内的随机错落，让一行不是整齐地同时落下 */
const ROW_JITTER = 70
/** 单个像素点从视口顶部上方落到位的时长 */
const FALL_DURATION = 560
/** 顶栏高度：整图在顶栏以下的区域里居中 */
const HEADER_HEIGHT = 64

/** 素材的列数与行数，即像素格的宽高 */
let gridWidth = 0
let gridHeight = 0
/** 按颜色分组，绘制时每种颜色只切换一次 fillStyle（素材约 90 种颜色、7400 个点） */
let groups: Array<{ color: string, pixels: Pixel[] }> = []
let totalDuration = 0

let context: CanvasRenderingContext2D | null = null
let viewWidth = 0
let viewHeight = 0
let dpr = 1
let frame = 0
let startTime = 0
let finished = false

/** 整图的位置与单个像素点的边长（CSS 像素）：按宽、高两个方向取较小的格子边长，保证整图放得下 */
function layout() {
  const areaHeight = viewHeight - HEADER_HEIGHT
  const cell = Math.min(viewWidth / gridWidth, areaHeight / gridHeight) * scale
  return {
    cell,
    left: (viewWidth - gridWidth * cell) / 2,
    top: HEADER_HEIGHT + (areaHeight - gridHeight * cell) / 2,
    // 像素点之间留一道细缝，看得出一格一格的像素感
    gap: Math.max(0.5, cell * 0.08),
  }
}

/** 下落缓动：先慢后快，像受重力加速落下 */
const easeIn = (t: number) => t * t * t

function draw(now: number) {
  const ctx = context
  if (!ctx || !gridWidth) return
  const { cell, left, top, gap } = layout()
  const elapsed = finished ? Infinity : now - startTime
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, viewWidth, viewHeight)
  for (const group of groups) {
    ctx.fillStyle = group.color
    for (const pixel of group.pixels) {
      const t = (elapsed - pixel.delay) / FALL_DURATION
      if (t <= 0) continue
      const targetY = top + pixel.row * cell
      // 起点在视口顶部之外一格，落到目标行
      const y = t >= 1 ? targetY : -cell + (targetY + cell) * easeIn(t)
      ctx.fillRect(left + pixel.col * cell, y, cell - gap, cell - gap)
    }
  }
}

function tick(now: number) {
  frame = 0
  draw(now)
  if (now - startTime >= totalDuration) {
    finished = true
    return
  }
  frame = requestAnimationFrame(tick)
}

function measure() {
  const element = wrapper.value
  const target = canvas.value
  if (!element || !target) return
  viewWidth = element.clientWidth
  viewHeight = element.clientHeight
  dpr = Math.min(window.devicePixelRatio || 1, 2)
  target.width = Math.round(viewWidth * dpr)
  target.height = Math.round(viewHeight * dpr)
}

/** 读出素材里每个不透明像素，按「由下往上逐行」排好下落延迟 */
async function loadPixels() {
  const image = new Image()
  image.src = source
  await image.decode()
  gridWidth = image.width
  gridHeight = image.height
  const reader = document.createElement('canvas')
  reader.width = image.width
  reader.height = image.height
  const readerContext = reader.getContext('2d', { willReadFrequently: true })
  if (!readerContext) return
  readerContext.drawImage(image, 0, 0)
  const data = readerContext.getImageData(0, 0, image.width, image.height).data
  const byColor = new Map<string, Pixel[]>()
  for (let row = 0; row < image.height; row++) {
    for (let col = 0; col < image.width; col++) {
      const i = (row * image.width + col) * 4
      if (data[i + 3]! < 128) continue
      const color = `rgb(${data[i]},${data[i + 1]},${data[i + 2]})`
      const delay = (image.height - 1 - row) * ROW_STEP + Math.random() * ROW_JITTER
      const list = byColor.get(color) ?? []
      list.push({ col, row, color, delay })
      byColor.set(color, list)
    }
  }
  groups = [...byColor].map(([color, pixels]) => ({ color, pixels }))
  totalDuration = (image.height - 1) * ROW_STEP + ROW_JITTER + FALL_DURATION
}

let resizeObserver: ResizeObserver | undefined

function onResize() {
  measure()
  // 播放中由下一帧按新尺寸接着画；已拼完则重画一帧静止图
  if (finished) draw(performance.now())
}

onMounted(async () => {
  context = canvas.value?.getContext('2d') ?? null
  if (!context) return
  measure()
  resizeObserver = new ResizeObserver(onResize)
  resizeObserver.observe(wrapper.value!)
  try {
    await loadPixels()
  }
  catch {
    // 素材加载失败只影响装饰层，不打断页面
    return
  }
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    finished = true
    draw(performance.now())
    return
  }
  startTime = performance.now()
  frame = requestAnimationFrame(tick)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(frame)
  resizeObserver?.disconnect()
})
</script>

<template>
  <!--
    纯装饰层：固定铺满视口，不占文档高度，不拦截指针。
    z-[-1] 与布局的 bg-gray-1 底色层同级，靠 DOM 顺序排在底色之上、正文之下；更低的层级会被底色盖住。
  -->
  <div
    ref="wrapper" aria-hidden="true" data-docs-pixel
    class="pointer-events-none fixed inset-0 z-[-1] select-none overflow-hidden" :style="{ opacity }"
  >
    <canvas ref="canvas" class="block size-full" />
  </div>
</template>
