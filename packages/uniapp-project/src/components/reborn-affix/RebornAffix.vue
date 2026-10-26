<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, nextTick, onBeforeUnmount, reactive, watch } from 'vue'

defineOptions({
  name: 'RebornAffix',
})

const props = withDefaults(defineProps<FloatViewProps>(), {
  zIndex: 500,
  size: 40,
  left: 10,
  bottom: 10,
  gap: 10,
  disabled: false,
  noSnapping: false,
  safeArea: true,
})

export interface FloatViewProps {
  zIndex?: number
  size?: number
  left?: number
  right?: number
  top?: number
  bottom?: number
  gap?: number
  disabled?: boolean
  noSnapping?: boolean
  // 新增：是否考虑安全区域（默认为 true）
  safeArea?: boolean
}

/**
 * 可视窗口尺寸与安全区。
 * 用 windowWidth / windowHeight 而不是 screenWidth / screenHeight：fixed 元素的 left / bottom 相对页面窗口计算，
 * H5 里窗口可能比设备屏幕小（例如嵌在文档站的手机预览里），按屏幕宽度算出的右缘位置会落到窗口之外；
 * 小程序带原生导航栏时 screenHeight 也比窗口高。取不到窗口尺寸时退回屏幕尺寸
 */
function viewportOf(info: { windowWidth?: number, windowHeight?: number, screenWidth?: number, screenHeight?: number }) {
  return { width: info.windowWidth || info.screenWidth || 0, height: info.windowHeight || info.screenHeight || 0 }
}
let windowInfo = uni.getWindowInfo() || {}
let screenWidth = viewportOf(windowInfo).width
let screenHeight = viewportOf(windowInfo).height

// 获取底部安全区域高度 (iPhone X+ 的底部黑条)
let safeAreaBottom = props.safeArea ? (windowInfo.safeAreaInsets?.bottom || 0) : 0
// 获取顶部安全区域高度 (状态栏/刘海屏)
let safeAreaTop = props.safeArea ? (windowInfo.safeAreaInsets?.top || 0) : 0

const position = reactive({
  x: props.right !== undefined ? (screenWidth - props.size - props.right) : props.left,
  // 初始位置：
  // 如果指定了 top，则 y = 屏幕高度 - size - top - 顶部安全区域
  // 否则使用 bottom + 底部安全区域
  y: props.top !== undefined
    ? (screenHeight - props.size - props.top - safeAreaTop)
    : (props.bottom + safeAreaBottom),
  isDragging: false,
})

/** 用户是否拖动过悬浮块；拖动过的位置属于用户，窗口变化时不能被复位 */
let userMoved = false

/** 重新读取屏幕尺寸与安全区 */
function readWindow() {
  windowInfo = uni.getWindowInfo() || {}
  screenWidth = viewportOf(windowInfo).width
  screenHeight = viewportOf(windowInfo).height
  safeAreaBottom = props.safeArea ? (windowInfo.safeAreaInsets?.bottom || 0) : 0
  safeAreaTop = props.safeArea ? (windowInfo.safeAreaInsets?.top || 0) : 0
}

/** 按定位 props 推出初始位置 */
function applyInitialPosition() {
  position.x = props.right !== undefined ? screenWidth - props.size - props.right : props.left
  position.y = props.top !== undefined ? screenHeight - props.size - props.top - safeAreaTop : props.bottom + safeAreaBottom
}

/** 定位 props 变化：以新 props 为准复位，之前的拖动位置作废 */
function resetPosition() {
  readWindow()
  userMoved = false
  applyInitialPosition()
}

/**
 * 窗口尺寸变化（H5 地址栏收起 / 软键盘、横竖屏切换）：只刷新边界。
 * 没拖动过时按 props 重新锚定（right / top 锚点随新尺寸生效）；拖动过则保留用户位置，只夹回可视范围，
 * 开启吸附时贴回原来那一侧的边缘（按变化前的中线判断，避免窗口变宽后右侧按钮被判到左侧）。
 */
function onWindowResize() {
  const wasRight = position.x + props.size / 2 > screenWidth / 2
  readWindow()
  if (!userMoved) {
    applyInitialPosition()
    return
  }
  position.x = Math.max(0, Math.min(screenWidth - props.size, position.x))
  position.y = Math.max(safeAreaBottom, Math.min(screenHeight - props.size - safeAreaTop, position.y))
  if (props.noSnapping || position.isDragging) return
  const { size, gap } = props
  position.x = wasRight ? screenWidth - size - gap : gap
  position.y = Math.max(gap + safeAreaBottom, Math.min(screenHeight - size - safeAreaTop - gap, position.y))
}
watch(() => [props.left, props.right, props.top, props.bottom, props.size, props.safeArea], resetPosition)
uni.onWindowResize(onWindowResize)
onBeforeUnmount(() => uni.offWindowResize(onWindowResize))

const dragState = reactive({
  startX: 0,
  startY: 0,
})

// 动态样式计算
const viewStyle = computed<CSSProperties>(() => {
  const style: CSSProperties = {
    left: `${position.x}px`,
    bottom: `${position.y}px`, // 直接使用 position.y，逻辑在内部处理
    zIndex: props.zIndex,
    width: `${props.size}px`,
    height: `${props.size}px`,
    position: 'fixed',
  }

  if (position.isDragging) {
    style.transitionProperty = 'none'
  }
  else {
    style.transitionProperty = 'left, bottom'
    style.transitionDuration = '300ms'
  }

  return style
})

function onTouchStart(e: TouchEvent) {
  if (props.disabled) { return }
  if (e.touches.length > 0) {
    const touch = e.touches[0]
    dragState.startX = touch.clientX
    dragState.startY = touch.clientY
    position.isDragging = true
  }
}

function onTouchMove(e: TouchEvent) {
  if (props.disabled || !position.isDragging || e.touches.length === 0) { return }

  const touch = e.touches[0]
  const deltaX = touch.clientX - dragState.startX
  // Y轴逻辑：手指往上滑(clientY变小)，bottom值应该变大
  const deltaY = dragState.startY - touch.clientY

  // 增加拖拽阈值判断，避免误触点击事件
  if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) { return }

  // 确认为拖拽行为，阻止默认事件
  if (e.cancelable) {
    e.preventDefault()
  }

  let newX = position.x + deltaX
  let newY = position.y + deltaY

  // --- 水平边界限制 ---
  newX = Math.max(0, Math.min(screenWidth - props.size, newX))

  // --- 垂直边界限制 ---
  // 最小值：如果有安全区域，则不能拖到安全区域以下
  const minY = safeAreaBottom
  // 最大值：屏幕高度减去自身高度 - 顶部安全区域
  const maxY = screenHeight - props.size - safeAreaTop

  newY = Math.max(minY, Math.min(maxY, newY))

  position.x = newX
  position.y = newY
  userMoved = true
  dragState.startX = touch.clientX
  dragState.startY = touch.clientY
}

function performEdgeSnapping() {
  const { size, gap } = props

  // 水平吸附：按元素中心落在窗口中线的哪一侧决定贴左还是贴右，两侧都留 gap（与 Web 端一致）。
  // 用左上角坐标比较会让元素中心已过中线、左边缘还没过的悬浮块被判到左侧
  position.x = position.x + size / 2 < screenWidth / 2 ? gap : screenWidth - size - gap

  // 垂直吸附修正
  const maxY = screenHeight - size - safeAreaTop
  // 底部最小值：Gap + 安全区域高度
  const minSafeY = gap + safeAreaBottom

  if (position.y > maxY - gap) { position.y = maxY - gap }
  if (position.y < minSafeY) { position.y = minSafeY }
}

function onTouchEnd() {
  if (props.disabled || !position.isDragging) { return }
  nextTick(() => {
    position.isDragging = false
    if (!props.noSnapping) {
      performEdgeSnapping()
    }
  })
}
</script>

<template>
  <view v-if="disabled" class="fixed" :style="viewStyle">
    <slot />
  </view>
  <view
    v-else
    class="fixed touch-none" :style="viewStyle" @touchstart="onTouchStart" @touchmove.stop.prevent="onTouchMove"
    @touchend="onTouchEnd" @touchcancel="onTouchEnd"
  >
    <slot />
  </view>
</template>

<style></style>
