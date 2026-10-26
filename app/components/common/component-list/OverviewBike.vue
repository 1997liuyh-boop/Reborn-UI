<script setup lang="ts">
/**
 * 组件总览头图里的自行车。
 *
 * 加载顺序照顾首屏：先显示一张静态首帧（与 3D 场景同机位、同构图），等头图进入视口且浏览器空闲，
 * 再并行拉取 three 分包与模型（约 1MB），首帧渲染完成后画布淡入、首帧淡出，替换时看不出跳动。
 * 以下情况只显示静态首帧、不加载 3D：视口窄于 xl（此时整块隐藏）、系统开启减少动态效果、浏览器开启省流量。
 * 3D 加载失败也停在静态首帧，这是装饰元素，不打断页面。
 *
 * 交互（见 lib/three/bikeScene.ts）：指针在 trigger 区域内越靠近车身，车越解体；离开时逐渐合体；指针上下移动调整俯仰。
 */
import type { BikeSceneController } from '~/lib/three/bikeScene'
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from 'vue'
import { loadModelBuffer, resolveModelURL } from '~/lib/three/modelAssets'

interface Props {
  /**
   * 驱动解体与俯仰的指针区域，一般传整个头图；不传时用组件自身。
   * 父级模板 ref 首次渲染时还是 null，但场景要等进入视口且浏览器空闲才创建，届时已经拿到元素
   */
  trigger?: HTMLElement | null
}

const props = defineProps<Props>()

/** 静态首帧，由 scripts/models/render-bike-poster.mjs 从同一场景截取 */
const POSTER = '/models/bike/carbon-frame-bike-poster.webp'
/** 与 lib/three/bikeScene.ts 的 BIKE_MODEL_PATH 一致；这里单独写一份，预取时不必先下载 three 分包 */
const MODEL = '/models/bike/carbon-frame-bike.glb.gz'

const rootRef = useTemplateRef<HTMLElement>('root')
const canvasRef = useTemplateRef<HTMLCanvasElement>('canvas')
/** 3D 首帧已渲染：画布淡入、静态首帧淡出 */
const ready = shallowRef(false)

const { app } = useRuntimeConfig()
let controller: BikeSceneController | undefined
let abort: AbortController | undefined
let cleanups: Array<() => void> = []
let started = false

/** 满足全部前置条件后才开始：视口够宽、没有减少动态效果、没有省流量 */
function canLoad() {
  const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData
  return window.matchMedia('(min-width: 1280px)').matches
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    && !saveData
}

async function start() {
  const canvas = canvasRef.value
  const root = rootRef.value
  if (started || !canvas || !root) return
  started = true
  abort = new AbortController()
  const { signal } = abort
  try {
    // 模型下载与 three 分包并行：模型请求不依赖 three，先发出去
    loadModelBuffer(resolveModelURL(MODEL, app.baseURL), signal).catch(() => {})
    const { createBikeScene } = await import('~/lib/three/bikeScene')
    signal.throwIfAborted()
    controller = await createBikeScene({
      canvas,
      trigger: props.trigger ?? root,
      signal,
      baseURL: app.baseURL,
      onLost: () => {
        ready.value = false
        controller = undefined
      },
    })
    ready.value = true
  }
  catch {
    // 装饰元素：失败就停在静态首帧
  }
}

/** 头图进入视口且浏览器空闲后再开始，不和正文、卡片预览抢首屏资源 */
function schedule() {
  const root = rootRef.value
  if (!root || started) return
  const io = new IntersectionObserver((entries) => {
    if (!entries.some(entry => entry.isIntersecting)) return
    io.disconnect()
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => start(), { timeout: 1500 })
      cleanups.push(() => window.cancelIdleCallback(id))
    }
    else {
      const id = window.setTimeout(start, 300)
      cleanups.push(() => window.clearTimeout(id))
    }
  })
  io.observe(root)
  cleanups.push(() => io.disconnect())
}

onMounted(() => {
  if (canLoad()) {
    schedule()
    return
  }
  // 窄屏进来、之后拉宽到 xl 时补加载
  const wide = window.matchMedia('(min-width: 1280px)')
  const onChange = () => {
    if (!canLoad()) return
    wide.removeEventListener('change', onChange)
    schedule()
  }
  wide.addEventListener('change', onChange)
  cleanups.push(() => wide.removeEventListener('change', onChange))
})

onBeforeUnmount(() => {
  for (const cleanup of cleanups) cleanup()
  cleanups = []
  abort?.abort()
  controller?.dispose()
})
</script>

<template>
  <!-- 定位与尺寸由父级给（需为 absolute / relative 之一），根节点不写 position，避免与父级传入的定位类互相覆盖 -->
  <div ref="root" class="overview-bike" aria-hidden="true">
    <!--
      画布比舞台左右各宽出 30%（共 1.6 倍）、中心不变：合体车身占满舞台高度，
      解体时镜头会拉远（见 lib/three/bikeScene.ts 的 SAFE_X / SAFE_Y），零件完整落在画布中部，这块余量给缩小后的散开范围。
      左右两侧各 18% 渐隐：零件靠近两边文字时逐渐淡出，也不会在画布边缘被硬切。
      首帧图与画布同框同比例，替换时完全重合
    -->
    <div class="overview-bike-frame absolute inset-y-0 -inset-x-[30%]">
      <img
        :src="POSTER" alt="" loading="lazy" decoding="async" draggable="false"
        class="absolute inset-0 size-full object-contain transition-opacity duration-500"
        :class="ready ? 'opacity-0' : 'opacity-100'"
      >
      <canvas
        ref="canvas" class="absolute inset-0 size-full transition-opacity duration-500"
        :class="ready ? 'opacity-100' : 'opacity-0'"
      />
    </div>
  </div>
</template>

<style scoped>
.overview-bike-frame {
  mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent);
}
</style>
