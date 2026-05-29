<script lang="ts">
interface ActiveSwiperAction {
  id: number
  close: () => void
}

let swiperActionIdSeed = 0
const activeSwiperActions = new Map<string, ActiveSwiperAction>()

export default {
  name: 'RebornSwiperAction',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onPageScroll } from '@dcloudio/uni-app'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, {
  swiperActionColorClasses,
  type SwiperActionColor,
  type SwiperActionSide,
  type SwiperActionUI,
} from './reborn-swiper-action.config'

export interface SwiperActionItem {
  text: string
  key?: string | number
  icon?: string
  color?: SwiperActionColor
  width?: number
  disabled?: boolean
  customClass?: string
  customStyle?: string
  triggerRemove?: boolean
}

export interface SwiperActionClickPayload {
  item: SwiperActionItem
  index: number
  side: SwiperActionSide
  close: () => void
  remove: () => void
}

export interface SwiperActionProps {
  rightActions?: SwiperActionItem[]
  actionWidth?: number
  threshold?: number
  maxThreshold?: number
  closeThreshold?: number
  duration?: number
  closeDuration?: number
  dragDamping?: number
  damping?: number
  dampingDistance?: number
  touchThreshold?: number
  directionRatio?: number
  maxRevealRatio?: number
  disabled?: boolean
  closeOnActionClick?: boolean
  closeOnContentClick?: boolean
  closeOnPageScroll?: boolean
  contentTapNavigate?: boolean
  group?: string | number | false
  mode?: 'push' | 'overlay'
  actionRadius?: 'none' | 'right' | 'both'
  touchHint?: boolean
  customClass?: string
  customStyle?: string
  ui?: SwiperActionUI
}

const props = withDefaults(defineProps<SwiperActionProps>(), {
  rightActions: () => [],
  actionWidth: 144,
  threshold: 0.35,
  maxThreshold: 120,
  closeThreshold: 96,
  duration: 80,
  closeDuration: 300,
  dragDamping: 50,
  damping: 0.05,
  dampingDistance: 72,
  touchThreshold: 12,
  directionRatio: 2.4,
  maxRevealRatio: 0.82,
  disabled: false,
  closeOnActionClick: true,
  closeOnContentClick: true,
  closeOnPageScroll: true,
  contentTapNavigate: false,
  mode: 'push',
  actionRadius: 'right',
  touchHint: false,
  group: 'default',
  customClass: '',
  customStyle: '',
  ui: () => ({}),
})

const openedSide = defineModel<SwiperActionSide | ''>({ default: '' })

const emit = defineEmits<{
  (e: 'change', value: SwiperActionSide | ''): void
  (e: 'open', value: SwiperActionSide): void
  (e: 'close'): void
  (e: 'click', payload: SwiperActionClickPayload): void
  (e: 'content-click', payload: { openSide: SwiperActionSide | '', close: () => void }): void
  (e: 'remove', payload: { item: SwiperActionItem, index: number, side: SwiperActionSide }): void
}>()

defineSlots<{
  default(props: { openSide: SwiperActionSide | '', close: () => void }): any
  'right-action'(props: { item: SwiperActionItem, index: number, side: 'right', ui: typeof ui.value }): any
}>()

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})
const { proxy } = getCurrentInstance()!
const instanceId = ++swiperActionIdSeed

const ui = computed(() => {
  const styles = b({ disabled: props.disabled })

  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.customClass, uiOverrides.value.root) }),
    actions: (opts?: { class?: any }) => styles.actions({ class: cn(opts?.class, uiOverrides.value.actions) }),
    rightActions: (opts?: { class?: any }) => styles.rightActions({ class: cn(opts?.class, uiOverrides.value.rightActions) }),
    content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
    action: (opts?: { class?: any }) => styles.action({ class: cn(opts?.class, uiOverrides.value.action) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    text: (opts?: { class?: any }) => styles.text({ class: cn(opts?.class, uiOverrides.value.text) }),
  }
})

const startX = ref(0)
const startY = ref(0)
const startTranslateX = ref(0)
const dragTargetX = ref(0)
const translateX = ref(0)
const rootWidth = ref(0)
const rootLeft = ref(0)
const isDragging = ref(false)
const isHorizontalMoving = ref(false)
const isTapClosing = ref(false)
const isSmoothClosing = ref(false)
const suppressNextTap = ref(false)
/** 非小程序端：滑动结束后阻止紧随其后的 @tap 误触 */
const blockContentTapByGesture = ref(false)
const isScrollLocked = ref(false)
const lockDirection = ref<'x' | 'y' | ''>('')
const dragStartOpenedSide = ref<SwiperActionSide | ''>('')
const ACTION_TOUCH_DEDUPLICATE_MS = 350
let scrollLockTimer: ReturnType<typeof setTimeout> | undefined
let dragStartSideResetTimer: ReturnType<typeof setTimeout> | undefined
let touchMoveCount = 0
let verticalLockMoveCount = 0
let maxTouchDeltaX = 0
let maxTouchDeltaY = 0

// #ifdef MP-WEIXIN
const isMpWeixin = true
// #endif
// #ifndef MP-WEIXIN
const isMpWeixin = false
// #endif
let lastActionTouchTime = 0
let pageScrollWatcherTimer: ReturnType<typeof setInterval> | undefined
let pageScrollWatcherPending = false
let pageScrollTopBaseline = 0
let h5ScrollLockRegistered = false
let h5TouchActive = false
let h5GestureGuarding = false
let h5TouchStartX = 0
let h5TouchStartY = 0
let h5ScrollPositionLocked = false

const REMOVE_DURATION = 220
const isRemoving = ref(false)
const isRemoveCollapsed = ref(false)
const removingMaxHeight = ref<number | null>(null)
const isSnapping = ref(false)

const rightRawWidth = computed(() => getActionsWidth(props.rightActions))
const maxRevealWidth = computed(() => {
  if (rootWidth.value <= 0) {
    return Number.POSITIVE_INFINITY
  }

  const ratio = Math.max(0.1, Math.min(props.maxRevealRatio, 1))
  return rootWidth.value * ratio
})
const rightWidth = computed(() => Math.min(rightRawWidth.value, maxRevealWidth.value))
const hasRightActions = computed(() => props.rightActions.length > 0)
const shouldShowRightActions = computed(() => hasRightActions.value)
const isOverlayMode = computed(() => props.mode === 'overlay')

/**
 * 收起态不挂载彩色操作区，避免 iOS 纵向滚动时底层色块拖影。
 * 关合动画期间保持挂载，避免滚动触发收起时操作区瞬间消失。
 *
 * overlay 模式正常情况下不含 isDragging 条件（touchHint=false 时）：
 * onTouchStart 会立即置 isDragging=true，但此时 translateX 仍为 0，
 * 操作区容器会被 translate3d 推到右侧屏外。部分渲染环境（小程序/App）
 * overflow:hidden 无法裁剪经 transform 的绝对定位子元素，导致容器左边缘
 * 以细竖线形式在内容右侧短暂可见。
 * 当 touchHint=true 时，该行为被作为操作提示保留，两种模式均支持。
 */
const shouldExposeActions = computed(() => {
  const baseCondition = !!openedSide.value || translateX.value !== 0 || isTapClosing.value || isSmoothClosing.value
  if (isOverlayMode.value) {
    return (props.touchHint && isDragging.value) || baseCondition
  }
  return isDragging.value || baseCondition
})

/**
 * touchHint 模式下，push 模式触摸时对内容施加微小负偏移，
 * 露出背后操作区的左边缘色条，给用户可滑动的视觉提示。
 * overlay 模式的提示来自操作区容器自身的边缘出血，内容无需移动。
 */
const touchHintOffset = computed(() => {
  if (
    !props.touchHint
    || !isDragging.value
    || !!openedSide.value
    || translateX.value !== 0
    || !hasRightActions.value
    || isOverlayMode.value
  ) {
    return 0
  }
  return -4
})

const contentStyle = computed(() => {
  const tx = translateX.value + touchHintOffset.value
  const isClosing = isTapClosing.value || isSmoothClosing.value
  const timingFunction = isClosing
    ? 'cubic-bezier(0.16, 1, 0.3, 1)'
    : (isSnapping.value && !isOverlayMode.value)
      ? 'cubic-bezier(0.34, 1.18, 0.64, 1)'
      : 'cubic-bezier(0.22, 1, 0.36, 1)'
  const duration = isDragging.value ? 0 : isClosing ? props.closeDuration : isSnapping.value ? 300 : props.duration
  const layerHint = shouldExposeActions.value
    ? 'will-change: transform; backface-visibility: hidden; -webkit-backface-visibility: hidden;'
    : ''

  return `transform: translate3d(${tx}px, 0, 0); transition: transform ${duration}ms ${timingFunction}; ${layerHint}touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none;`
})

/**
 * overlay 模式：
 * 1. z-index: 20 —— 高于内容层（z-10），操作区覆盖在内容之上
 * 2. 容器整体从右侧屏外滑入，translateX 从 +rightWidth（隐藏）到 0（完全进入）
 *    公式：offsetX = rightWidth * (1 - progress)
 * 3. 多按钮初始叠放在容器左端，随进度向右舒展到各自位置，overflow:hidden 始终不超界。
 */
const actionsContainerStyle = computed(() => {
  const width = `width: ${rightWidth.value}px;`
  if (!isOverlayMode.value) {
    return width
  }

  const progress = rightWidth.value > 0
    ? Math.min(1, Math.abs(translateX.value) / rightWidth.value)
    : 0
  const offsetX = rightWidth.value * (1 - progress)
  // 已完全展开后继续左滑时，以容器右边缘为基点横向拉伸，
  // 右侧固定不动、左侧弹性延伸，产生各按钮被独立向左拉拽的橡皮筋感
  const overflow = Math.max(0, -(translateX.value + rightWidth.value))
  const scaleFactor = rightWidth.value > 0 && overflow > 0
    ? (rightWidth.value + overflow) / rightWidth.value
    : 1
  const isClosing = isTapClosing.value || isSmoothClosing.value
  const duration = isDragging.value ? 0 : isClosing ? props.closeDuration : isSnapping.value ? 300 : props.duration
  const timingFunction = isClosing
    ? 'cubic-bezier(0.16, 1, 0.3, 1)'
    : isSnapping.value
      ? 'cubic-bezier(0.34, 1.18, 0.64, 1)'
      : 'cubic-bezier(0.22, 1, 0.36, 1)'

  return `${width} z-index: 20; transform-origin: right center; transform: translate3d(${offsetX}px, 0, 0) scaleX(${scaleFactor}); transition: transform ${duration}ms ${timingFunction};`
})

const touchThresholdPx = computed(() => toPx(props.touchThreshold))

const removeAnimStyle = computed(() => {
  if (isRemoveCollapsed.value) {
    return `display: none;`
  }
  const transition = `max-height ${REMOVE_DURATION}ms cubic-bezier(0.4,0,0.9,1), opacity ${REMOVE_DURATION}ms cubic-bezier(0.4,0,0.9,1)`
  if (removingMaxHeight.value !== null) {
    if (isRemoving.value) {
      return `max-height: 0px; opacity: 0; transition: ${transition};`
    }
    return `max-height: ${removingMaxHeight.value}px; transition: ${transition};`
  }
  return ''
})

const rootStyle = computed(() => {
  if (!removeAnimStyle.value) return props.customStyle
  return [props.customStyle, removeAnimStyle.value].filter(Boolean).join('; ')
})

/**
 * 将 rpx 宽度转换为当前平台像素值，保持手势位移和视觉宽度一致。
 */
function toPx(value: number) {
  if (typeof uni !== 'undefined' && typeof uni.upx2px === 'function') {
    return uni.upx2px(value)
  }

  return value
}

function canUseH5TouchLock() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * 获取当前组件宽度，用来限制操作区最大展开宽度。
 */
function updateRootWidth() {
  if (rootWidth.value <= 0) {
    const windowInfo = uni.getWindowInfo?.()
    if (windowInfo?.windowWidth) {
      rootWidth.value = windowInfo.windowWidth
    }
  }

  uni.createSelectorQuery()
    .in(proxy)
    .select('.reborn-swiper-action')
    .boundingClientRect((data) => {
      const rect = data as UniApp.NodeInfo
      if (rect?.width) {
        rootWidth.value = rect.width
      }
      if (rect?.left !== undefined) {
        rootLeft.value = rect.left
      }
    })
    .exec()
}

/**
 * 计算单侧操作区总宽度。
 */
function getActionsWidth(actions: SwiperActionItem[]) {
  return actions.reduce((total, item) => total + toPx(item.width || props.actionWidth), 0)
}

/**
 * 计算吸附触发距离，避免操作区过宽时需要滑动太久。
 */
function getTriggerThreshold(width: number) {
  const ratioThreshold = width * props.threshold
  const maxThreshold = toPx(props.maxThreshold)

  return Math.max(24, Math.min(ratioThreshold, maxThreshold))
}

/**
 * 计算关闭触发距离，避免操作区过宽时回滑很久才关闭。
 */
function getCloseThreshold(width: number) {
  return Math.max(24, Math.min(width * props.threshold, toPx(props.closeThreshold)))
}

/**
 * 正常滑动区间内压缩目标位移，让展开过程更有阻力。
 */
function resistTranslate(value: number) {
  if (value === 0) {
    return value
  }

  if (value > 0) {
    return 0
  }

  const sideWidth = rightWidth.value
  if (sideWidth <= 0) {
    return 0
  }

  const strength = normalizeDamping(props.dragDamping)
  if (strength <= 0) {
    return value
  }

  const sign = value > 0 ? 1 : -1
  const distance = Math.abs(value)
  const baseDistance = Math.min(distance, sideWidth)
  const overflow = Math.max(0, distance - sideWidth)
  const progress = baseDistance / sideWidth
  const factor = Math.max(0.18, 1 - strength * (0.24 + progress * 0.48))
  const resistedDistance = baseDistance * factor

  return sign * (resistedDistance + overflow)
}

/**
 * 让视觉位移滞后追随目标位移，形成拖动时的惯性阻尼感。
 */
function followTranslate(target: number, relaxed = false) {
  const strength = normalizeDamping(props.dragDamping)
  if (strength <= 0) {
    return target
  }

  const rate = relaxed
    ? Math.max(0.42, 1 - strength * 0.38)
    : Math.max(0.16, 1 - strength * 0.74)

  return translateX.value + (target - translateX.value) * rate
}

/**
 * 支持 0-1 小数和 0-100 百分比两种阻尼写法。
 */
function normalizeDamping(value: number) {
  if (value > 1) {
    return Math.max(0, Math.min(value / 100, 1))
  }

  return Math.max(0, Math.min(value, 1))
}

/**
 * 超出边界时加入阻尼，避免滑块在边缘硬停。
 */
function dampTranslate(value: number) {
  const min = hasRightActions.value ? -rightWidth.value : 0
  const ratio = Math.max(0, Math.min(props.damping, 1))
  const maxDistance = toPx(props.dampingDistance)

  if (value < min) {
    const overflow = Math.max(-maxDistance, (value - min) * ratio)
    return min + overflow
  }

  if (value > 0) {
    const overflow = Math.min(maxDistance, value * ratio)
    return overflow
  }

  return value
}

function constrainOpenedSideTranslate(value: number) {
  const crossSideLimit = Math.max(2, Math.min(8, touchThresholdPx.value * 0.5))
  const crossSideDamping = 0.18

  if (startTranslateX.value < 0 && value > 0) {
    return Math.min(crossSideLimit, value * crossSideDamping)
  }

  return value
}

/**
 * 判断触摸起点是否已经在操作区边界附近。
 */
function isAtRevealBoundary(value: number) {
  const min = hasRightActions.value ? -rightWidth.value : 0
  const tolerance = 1

  return hasRightActions.value && value <= min + tolerance
}

/**
 * 判断是否已经出现滑块方向意图。只要往有操作区的一侧滑动，就优先交给滑块处理。
 */
function hasSwipeIntent(diffX: number, diffY = 0) {
  const absX = Math.abs(diffX)
  const intentThreshold = getSwipeIntentThreshold()

  if (absX < intentThreshold || !isSwipeSlopeAllowed(absX, diffY)) {
    return false
  }

  if (diffX < 0 && (hasRightActions.value || openedSide.value === 'left')) {
    return true
  }

  if (diffX > 0 && openedSide.value === 'right') {
    return true
  }

  return false
}

function getSwipeIntentThreshold() {
  return Math.max(8, Math.min(16, touchThresholdPx.value * 1.4))
}

function getSwipeVerticalTakeoverLimit() {
  return Math.max(touchThresholdPx.value * 3, getSwipeIntentThreshold() * 2.2)
}

function isSwipeSlopeAllowed(absX: number, diffY: number) {
  const verticalDistance = Math.abs(diffY)

  if (verticalDistance <= getSwipeIntentThreshold()) {
    return true
  }

  if (diffY < 0) {
    return absX >= verticalDistance * 1.15
  }

  return verticalDistance <= getSwipeVerticalTakeoverLimit() && absX >= verticalDistance * 0.85
}

function hasSwipeDirection(diffX: number) {
  return (diffX < 0 && (hasRightActions.value || openedSide.value === 'left'))
    || (diffX > 0 && openedSide.value === 'right')
}

function shouldPreferOpenedSideSwipe(diffX: number) {
  return Math.abs(startTranslateX.value) > 0 && hasSwipeDirection(diffX)
}

/**
 * App 基座在方向未确认的前几帧容易先触发页面滚动；有横向分量时先保留给滑块判定。
 */
function shouldDeferVerticalForSwipe(diffX: number, diffY: number) {
  const absX = Math.abs(diffX)
  const absY = Math.abs(diffY)
  const intentThreshold = getSwipeIntentThreshold()

  if (!hasSwipeDirection(diffX) || absX < intentThreshold * 0.5) {
    return false
  }

  if (hasSwipeIntent(diffX, diffY)) {
    return true
  }

  return absY < intentThreshold && isSwipeSlopeAllowed(absX, diffY)
}

/**
 * 判断本次手势是否已经满足横向滑动条件。
 */
function shouldLockHorizontal(diffX: number, diffY: number) {
  if (shouldPreferOpenedSideSwipe(diffX)) {
    const absX = Math.abs(diffX)
    const intentThreshold = Math.max(4, getSwipeIntentThreshold() * 0.45)

    if (absX >= intentThreshold && isSwipeSlopeAllowed(absX, diffY)) {
      return true
    }
  }

  return hasSwipeIntent(diffX, diffY)
}

function shouldUpgradeVerticalToHorizontal(diffX: number, diffY: number) {
  if (!shouldLockHorizontal(diffX, diffY)) {
    return false
  }

  const absY = Math.abs(diffY)
  const moveDistanceLimit = getSwipeVerticalTakeoverLimit()
  const moveCountLimit = 2

  return touchMoveCount - verticalLockMoveCount <= moveCountLimit && absY <= moveDistanceLimit
}

/**
 * 判断本次手势是否更像纵向滚动。
 */
function shouldLockVertical(diffX: number, diffY: number) {
  const absX = Math.abs(diffX)
  const absY = Math.abs(diffY)
  const threshold = touchThresholdPx.value

  if (shouldPreferOpenedSideSwipe(diffX)) {
    const horizontalThreshold = Math.max(4, getSwipeIntentThreshold() * 0.45)
    const verticalBreakoutDistance = Math.max(threshold * 1.35, getSwipeVerticalTakeoverLimit() * 1.35)
    const isVerticalBreakout = absY >= Math.max(verticalBreakoutDistance, absX * 1.45)

    if (absX >= horizontalThreshold && !isVerticalBreakout) {
      return false
    }
  }

  const verticalDeadZone = threshold * 0.8
  const isStraightVertical = absX <= verticalDeadZone
  const isVerticalDominant = absY >= absX * 1.15
  const isLongDownwardScroll = diffY > 0 && absY > getSwipeVerticalTakeoverLimit() && absY >= absX * 0.75

  return absY >= threshold
    && (isStraightVertical || isVerticalDominant || isLongDownwardScroll)
    && !hasSwipeIntent(diffX, diffY)
    && !shouldDeferVerticalForSwipe(diffX, diffY)
}

/**
 * 横向滑动确认后阻止页面滚动和父级手势继续响应。
 */
function preventHorizontalGesture(event: any) {
  if (event.cancelable !== false && event.preventDefault) {
    event.preventDefault()
  }

  stopGesturePropagation(event)
}

/**
 * App 基座中页面滚动层也可能继续接收 touchmove，横向手势确认后需要截断传播。
 */
function stopGesturePropagation(event: any) {
  if (event.stopPropagation) {
    event.stopPropagation()
  }

  if (event.stopImmediatePropagation) {
    event.stopImmediatePropagation()
  }
}

function holdH5ScrollPosition() {
  if (!canUseH5TouchLock()) {
    return
  }

  h5ScrollPositionLocked = true
}

function releaseH5ScrollPosition() {
  if (!h5ScrollPositionLocked) {
    return
  }

  h5ScrollPositionLocked = false
}

function preventH5Scroll(event: TouchEvent) {
  const touch = event.touches?.[0]

  if (h5TouchActive && touch && !props.disabled) {
    const diffX = touch.clientX - h5TouchStartX
    const diffY = touch.clientY - h5TouchStartY

    if (lockDirection.value === 'x') {
      if (event.cancelable !== false) {
        event.preventDefault()
      }
      stopGesturePropagation(event)
      holdH5ScrollPosition()
      applyHorizontalMove(diffX)
      return
    }

    if (shouldLockHorizontal(diffX, diffY)) {
      if (lockDirection.value !== 'x') {
        lockHorizontalGesture()
      }

      if (event.cancelable !== false) {
        event.preventDefault()
      }
      stopGesturePropagation(event)
      holdH5ScrollPosition()
      applyHorizontalMove(diffX)
      return
    }

    if (shouldLockVertical(diffX, diffY)) {
      h5GestureGuarding = false
      releaseH5ScrollPosition()
      return
    }
  }

  if (h5GestureGuarding) {
    if (event.cancelable !== false) {
      event.preventDefault()
    }
    stopGesturePropagation(event)
    holdH5ScrollPosition()
    return
  }

  if (!isScrollLocked.value && !isHorizontalMoving.value && lockDirection.value !== 'x') {
    return
  }

  if (event.cancelable !== false) {
    event.preventDefault()
  }
  stopGesturePropagation(event)
  holdH5ScrollPosition()
}

function preventContentDefault(event: Event) {
  if (event.cancelable !== false && event.preventDefault) {
    event.preventDefault()
  }

  stopGesturePropagation(event)
}

function registerH5ScrollLock() {
  if (h5ScrollLockRegistered || !canUseH5TouchLock()) {
    return
  }

  document.addEventListener('touchmove', preventH5Scroll, { passive: false, capture: true })
  h5ScrollLockRegistered = true
}

function unregisterH5ScrollLock() {
  if (!h5ScrollLockRegistered || !canUseH5TouchLock()) {
    return
  }

  document.removeEventListener('touchmove', preventH5Scroll, true)
  h5ScrollLockRegistered = false
}

function lockPageScroll() {
  if (scrollLockTimer) {
    clearTimeout(scrollLockTimer)
    scrollLockTimer = undefined
  }

  isScrollLocked.value = true
  registerH5ScrollLock()
}

function releasePageScroll(delay = 0) {
  if (scrollLockTimer) {
    clearTimeout(scrollLockTimer)
    scrollLockTimer = undefined
  }

  if (delay <= 0) {
    isScrollLocked.value = false
    h5TouchActive = false
    h5GestureGuarding = false
    releaseH5ScrollPosition()
    unregisterH5ScrollLock()
    return
  }

  scrollLockTimer = setTimeout(() => {
    isScrollLocked.value = false
    h5TouchActive = false
    h5GestureGuarding = false
    releaseH5ScrollPosition()
    unregisterH5ScrollLock()
    scrollLockTimer = undefined
  }, delay)
}

function lockHorizontalGesture() {
  h5GestureGuarding = false
  lockDirection.value = 'x'
  isDragging.value = true
  isHorizontalMoving.value = true
  isTapClosing.value = false
  suppressNextTap.value = true
  lockPageScroll()
}

function applyHorizontalMove(diffX: number) {
  const nextTranslateX = constrainOpenedSideTranslate(startTranslateX.value + diffX)
  const isOpeningFarther = Math.abs(nextTranslateX) > Math.abs(startTranslateX.value)
  const shouldUseResist = isOpeningFarther && !isAtRevealBoundary(startTranslateX.value)
  const targetTranslateX = dampTranslate(shouldUseResist ? resistTranslate(nextTranslateX) : nextTranslateX)

  dragTargetX.value = nextTranslateX
  translateX.value = followTranslate(targetTranslateX, !isOpeningFarther)
}

function getViewportScrollTop(callback: (scrollTop: number) => void) {
  uni.createSelectorQuery()
    .selectViewport()
    .scrollOffset((data) => {
      const scrollData = data as { scrollTop?: number } | null
      callback(scrollData?.scrollTop || 0)
    })
    .exec()
}

function startPageScrollWatcher() {
  if (!props.closeOnPageScroll || pageScrollWatcherTimer) {
    return
  }

  getViewportScrollTop((scrollTop) => {
    pageScrollTopBaseline = scrollTop
  })

  pageScrollWatcherTimer = setInterval(() => {
    if (!openedSide.value || !props.closeOnPageScroll) {
      stopPageScrollWatcher()
      return
    }

    if (pageScrollWatcherPending) {
      return
    }

    pageScrollWatcherPending = true
    getViewportScrollTop((scrollTop) => {
      pageScrollWatcherPending = false

      if (!openedSide.value || isHorizontalMoving.value) {
        pageScrollTopBaseline = scrollTop
        return
      }

      if (Math.abs(scrollTop - pageScrollTopBaseline) > 1) {
        closeByPageScroll()
        return
      }

      pageScrollTopBaseline = scrollTop
    })
  }, 80)
}

function stopPageScrollWatcher() {
  if (pageScrollWatcherTimer) {
    clearInterval(pageScrollWatcherTimer)
    pageScrollWatcherTimer = undefined
  }

  pageScrollWatcherPending = false
}

function clearDragStartOpenedSide(delay = 0) {
  if (dragStartSideResetTimer) {
    clearTimeout(dragStartSideResetTimer)
    dragStartSideResetTimer = undefined
  }

  if (delay <= 0) {
    dragStartOpenedSide.value = ''
    return
  }

  dragStartSideResetTimer = setTimeout(() => {
    dragStartOpenedSide.value = ''
    dragStartSideResetTimer = undefined
  }, delay)
}

/**
 * 获取互斥分组标识，传入 false 时关闭同组互斥能力。
 */
function getGroupKey() {
  if (props.group === false) {
    return ''
  }

  return String(props.group || 'default')
}

/**
 * 关闭同组中上一个已打开的滑动项。
 */
function closeOtherInGroup() {
  const groupKey = getGroupKey()
  if (!groupKey) {
    return
  }

  const active = activeSwiperActions.get(groupKey)
  if (active && active.id !== instanceId) {
    active.close()
  }
}

/**
 * 记录当前打开项，供同组其它实例打开时关闭。
 */
function markActiveInGroup() {
  const groupKey = getGroupKey()
  if (!groupKey) {
    return
  }

  activeSwiperActions.set(groupKey, {
    id: instanceId,
    close,
  })
}

/**
 * 当前实例关闭或卸载时清理互斥记录。
 */
function clearActiveInGroup() {
  const groupKey = getGroupKey()
  if (!groupKey) {
    return
  }

  const active = activeSwiperActions.get(groupKey)
  if (active?.id === instanceId) {
    activeSwiperActions.delete(groupKey)
  }
}

/**
 * 根据打开方向同步内容位移。
 */
function syncTranslate(side: SwiperActionSide | '') {
  if (side === 'right' && hasRightActions.value) {
    translateX.value = -rightWidth.value
    return
  }

  translateX.value = 0
}

/**
 * 更新打开方向并抛出状态事件。
 */
function updateOpenedSide(side: SwiperActionSide | '') {
  const previous = openedSide.value

  if (side) {
    isTapClosing.value = false
    isSmoothClosing.value = false
    closeOtherInGroup()
  }

  isInternalUpdate = true
  openedSide.value = side
  syncTranslate(side)

  if (side) {
    markActiveInGroup()
    startPageScrollWatcher()
  } else {
    clearActiveInGroup()
    stopPageScrollWatcher()
  }

  if (previous === side) {
    return
  }

  emit('change', side)
  if (side) {
    emit('open', side)
  } else {
    emit('close')
  }
}

/**
 * 使用更克制的动画关闭，避免点击内容区时出现明显回弹感。
 */
function closeByContentTap() {
  isDragging.value = false
  isHorizontalMoving.value = false
  lockDirection.value = ''
  isTapClosing.value = true
  isSmoothClosing.value = false
  updateOpenedSide('')

  setTimeout(() => {
    isTapClosing.value = false
  }, props.closeDuration)
}

/**
 * 页面滚动时收起已展开的操作区，避免滚动列表中残留打开状态。
 */
function closeByPageScroll() {
  if (!props.closeOnPageScroll || !openedSide.value || isHorizontalMoving.value) {
    return
  }

  isDragging.value = false
  isHorizontalMoving.value = false
  lockDirection.value = ''
  isTapClosing.value = false
  isSmoothClosing.value = true
  updateOpenedSide('')

  setTimeout(() => {
    isSmoothClosing.value = false
  }, props.closeDuration)
}

/**
 * 打开指定方向的操作区。
 */
function open(side: SwiperActionSide = 'right') {
  if (props.disabled) {
    return
  }

  updateOpenedSide(side)

  isSmoothClosing.value = true
  setTimeout(() => {
    isSmoothClosing.value = false
  }, props.closeDuration)
}

/**
 * 拖拽未达阈值时平滑吸附回关闭状态，避免使用快速 snap 动画。
 */
function snapClose() {
  isTapClosing.value = false
  isSmoothClosing.value = true
  setTimeout(() => {
    isSmoothClosing.value = false
  }, props.closeDuration)
  updateOpenedSide('')
}

/**
 * 关闭操作区。
 */
function close() {
  if (openedSide.value) {
    isTapClosing.value = false
    isSmoothClosing.value = true
    setTimeout(() => {
      isSmoothClosing.value = false
    }, props.closeDuration)
  }

  updateOpenedSide('')
}

function getContentTapTolerance() {
  return Math.max(6, touchThresholdPx.value * 0.8)
}

function resetTouchGestureMetrics() {
  maxTouchDeltaX = 0
  maxTouchDeltaY = 0
}

function recordTouchGestureDelta(diffX: number, diffY: number) {
  maxTouchDeltaX = Math.max(maxTouchDeltaX, Math.abs(diffX))
  maxTouchDeltaY = Math.max(maxTouchDeltaY, Math.abs(diffY))
}

/**
 * 判断本次手势是否为点按（位移在容差内），用于与横向滑动区分。
 */
function isContentTapGesture(event: any) {
  const tolerance = getContentTapTolerance()
  const touch = event?.changedTouches?.[0]
  const endDeltaX = touch ? Math.abs(touch.clientX - startX.value) : 0
  const endDeltaY = touch ? Math.abs(touch.clientY - startY.value) : 0
  const translateDelta = Math.abs(dragTargetX.value - startTranslateX.value)

  return endDeltaX <= tolerance
    && endDeltaY <= tolerance
    && maxTouchDeltaX <= tolerance
    && maxTouchDeltaY <= tolerance
    && translateDelta <= tolerance
}

function markGestureSwipe() {
  suppressNextTap.value = true
  blockContentTapByGesture.value = true
}

function runContentTapHandler() {
  if (props.contentTapNavigate) {
    emit('content-click', {
      openSide: openedSide.value,
      close,
    })
    return
  }

  if (openedSide.value && props.closeOnContentClick) {
    closeByContentTap()
  }
}

/**
 * 微信小程序端在 touchend 判定为点按后再触发内容点击，避免与滑动手势冲突。
 */
function triggerContentTapFromTouchEnd(event: any, wasHorizontalSwipe: boolean) {
  if (!isMpWeixin || wasHorizontalSwipe || !isContentTapGesture(event)) {
    return
  }

  runContentTapHandler()
}

/**
 * 触摸开始时记录初始位置，后续根据移动方向判断是否进入横向滑动。
 */
function onTouchStart(event: any) {
  if (props.disabled) {
    return
  }

  if (openedSide.value && suppressNextTap.value) {
    suppressNextTap.value = false
  }

  isTapClosing.value = false
  isSmoothClosing.value = false
  blockContentTapByGesture.value = false
  resetTouchGestureMetrics()
  updateRootWidth()

  const touch = event.touches?.[0]
  if (!touch) {
    return
  }

  registerH5ScrollLock()
  h5TouchActive = true
  h5GestureGuarding = canUseH5TouchLock() && (hasRightActions.value || !!openedSide.value)
  h5TouchStartX = touch.clientX
  h5TouchStartY = touch.clientY
  if (h5GestureGuarding) {
    holdH5ScrollPosition()
  }
  startX.value = touch.clientX
  startY.value = touch.clientY
  startTranslateX.value = translateX.value
  dragTargetX.value = translateX.value
  dragStartOpenedSide.value = openedSide.value
  isDragging.value = true
  isHorizontalMoving.value = false
  lockDirection.value = ''
  touchMoveCount = 0
  verticalLockMoveCount = 0
}

/**
 * 触摸移动时横向拖动内容，纵向滚动则交还给页面。
 */
function onTouchMove(event: any) {
  if (!isDragging.value || props.disabled) {
    return
  }

  const touch = event.touches?.[0]
  if (!touch) {
    return
  }

  const diffX = touch.clientX - startX.value
  const diffY = touch.clientY - startY.value
  touchMoveCount += 1
  recordTouchGestureDelta(diffX, diffY)

  if (!lockDirection.value) {
    if (shouldLockHorizontal(diffX, diffY)) {
      lockHorizontalGesture()
    } else if (shouldLockVertical(diffX, diffY)) {
      lockDirection.value = 'y'
      verticalLockMoveCount = touchMoveCount
      isHorizontalMoving.value = false
      h5GestureGuarding = false
      if (scrollLockTimer) {
        clearTimeout(scrollLockTimer)
        scrollLockTimer = undefined
      }
      isScrollLocked.value = false
      releaseH5ScrollPosition()
      if (openedSide.value && props.closeOnPageScroll) {
        closeByPageScroll()
      } else {
        syncTranslate(openedSide.value)
      }
      return
    } else {
      return
    }
  }

  if (lockDirection.value === 'y') {
    if (shouldUpgradeVerticalToHorizontal(diffX, diffY)) {
      lockHorizontalGesture()
    } else {
      return
    }
  }

  if (lockDirection.value !== 'x') {
    return
  }

  preventHorizontalGesture(event)
  applyHorizontalMove(diffX)
}

/**
 * App 端滑动后的 tap 不稳定时，用轻触内容块的 touchend 作为收起兜底。
 */
function shouldCloseByContentTouchEnd(event: any) {
  if (!openedSide.value || !props.closeOnContentClick || props.contentTapNavigate || lockDirection.value) {
    return false
  }

  const touch = event?.changedTouches?.[0] || event?.touches?.[0]
  if (!touch) {
    return touchMoveCount === 0
  }

  return isContentTapGesture(event)
}

/**
 * 触摸结束后按阈值吸附到打开或关闭状态。
 */
function onTouchEnd(event: any) {
  if (!isDragging.value) {
    isHorizontalMoving.value = false
    releasePageScroll()
    clearDragStartOpenedSide()
    return
  }

  const wasHorizontalMoving = lockDirection.value === 'x'

  isDragging.value = false
  isHorizontalMoving.value = false

  if (lockDirection.value !== 'x') {
    const shouldCloseByTouchEnd = shouldCloseByContentTouchEnd(event)

    lockDirection.value = ''
    releasePageScroll()
    clearDragStartOpenedSide()
    if (shouldCloseByTouchEnd) {
      consumeBlockedContentTap()
      closeByContentTap()
      return
    }

    triggerContentTapFromTouchEnd(event, false)
    syncTranslate(openedSide.value)
    return
  }

  lockDirection.value = ''
  releasePageScroll(props.duration)
  clearDragStartOpenedSide(props.duration)

  if (wasHorizontalMoving) {
    markGestureSwipe()
  }

  const releaseX = dragTargetX.value
  const dragDistance = releaseX - startTranslateX.value

  if (startTranslateX.value < 0 && hasRightActions.value) {
    const threshold = getCloseThreshold(rightWidth.value)
    if (dragDistance >= threshold) {
      snapClose()
    } else {
      updateOpenedSide('right')
    }
    return
  }

  if (releaseX < 0 && hasRightActions.value) {
    const threshold = getTriggerThreshold(rightWidth.value)
    if (Math.abs(releaseX) >= threshold) {
      isSnapping.value = true
      updateOpenedSide('right')
      setTimeout(() => { isSnapping.value = false }, 320)
    } else {
      snapClose()
    }
    return
  }

  close()
}

/**
 * 手势被系统取消时不按阈值吸附，避免误触发完整展开。
 */
function hadGestureMovement() {
  const tolerance = getContentTapTolerance()
  const translateDelta = Math.abs(dragTargetX.value - startTranslateX.value)

  return maxTouchDeltaX > tolerance || maxTouchDeltaY > tolerance || translateDelta > tolerance
}

function onTouchCancel() {
  if (isDragging.value && hadGestureMovement()) {
    markGestureSwipe()
  }

  isDragging.value = false
  isHorizontalMoving.value = false
  releasePageScroll()
  lockDirection.value = ''
  isSmoothClosing.value = true
  syncTranslate(openedSide.value)
  setTimeout(() => {
    isSmoothClosing.value = false
  }, props.closeDuration)
  clearDragStartOpenedSide()
}

function consumeBlockedContentTap() {
  suppressNextTap.value = false
  blockContentTapByGesture.value = false
}

/**
 * 非微信小程序端通过 @tap 触发；需排除滑动后的幽灵点击。
 */
function onContentTap() {
  if (isMpWeixin) {
    return
  }

  if (suppressNextTap.value || blockContentTapByGesture.value) {
    consumeBlockedContentTap()
    return
  }

  runContentTapHandler()
}

/**
 * 查询根元素实际高度后钉住 max-height，再折叠到 0。
 * 动画结束后立即设置 display:none 消除父容器 gap 残留，再 emit remove。
 */
function triggerRemoveAnimation(item: SwiperActionItem, actionIndex: number, side: SwiperActionSide) {
  uni.createSelectorQuery()
    .in(proxy)
    .select('.reborn-swiper-action')
    .boundingClientRect((data) => {
      const rect = data as UniApp.NodeInfo
      removingMaxHeight.value = rect?.height ?? 120
      setTimeout(() => {
        isRemoving.value = true
        setTimeout(() => {
          isRemoveCollapsed.value = true
          setTimeout(() => {
            emit('remove', { item, index: actionIndex, side })
          }, 32)
        }, REMOVE_DURATION)
      }, 30)
    })
    .exec()
}

/**
 * 点击操作按钮。
 */
function triggerAction(item: SwiperActionItem, index: number, side: SwiperActionSide) {
  if (props.disabled || item.disabled) {
    return
  }

  function remove() {
    close()
    setTimeout(() => {
      triggerRemoveAnimation(item, index, side)
    }, Math.round(props.closeDuration * 0.6))
  }

  emit('click', { item, index, side, close, remove })

  if (item.triggerRemove) {
    remove()
    return
  }

  if (props.closeOnActionClick) {
    close()
  }
}

function onActionTap(item: SwiperActionItem, index: number, side: SwiperActionSide) {
  if (Date.now() - lastActionTouchTime < ACTION_TOUCH_DEDUPLICATE_MS) {
    return
  }

  triggerAction(item, index, side)
}

/**
 * App 端滑动后的首个 tap 可能被手势吞掉，用 touchend 兜底并去重后续 tap。
 */
function onActionTouchEnd(item: SwiperActionItem, index: number, side: SwiperActionSide) {
  lastActionTouchTime = Date.now()
  triggerAction(item, index, side)
}

function getActionClass(item: SwiperActionItem) {
  const color = item.color || (item.key === 'delete' ? 'error' : item.key === 'more' ? 'info' : 'primary')
  return cn(ui.value.action(), swiperActionColorClasses[color], item.disabled ? 'opacity-60' : '', item.customClass)
}

/**
 * 操作项过多时按可展开宽度均分，避免主体内容被推离可视区域。
 */
function getActionWidth(item: SwiperActionItem, _side?: SwiperActionSide) {
  if (props.rightActions.length > 0 && rightRawWidth.value > rightWidth.value) {
    return rightWidth.value / props.rightActions.length
  }

  return toPx(item.width || props.actionWidth)
}

/**
 * 按 actionRadius 决定操作区外侧按钮的圆角策略：
 *   'none'  — 所有按钮不补圆角
 *   'right' — 仅最右侧按钮补右边圆角（默认）
 *   'both'  — 最左侧按钮补左边圆角、最右侧按钮补右边圆角
 */
function getActionOuterRadiusStyle(index: number) {
  if (props.actionRadius === 'none') {
    return ''
  }

  const radius = `${toPx(14)}px`
  const actions = props.rightActions
  let style = ''

  if (index === actions.length - 1 && actions.length > 0) {
    style += `border-top-right-radius: ${radius}; border-bottom-right-radius: ${radius};`
  }

  if (props.actionRadius === 'both' && index === 0) {
    style += `border-top-left-radius: ${radius}; border-bottom-left-radius: ${radius};`
  }

  return style
}

/**
 * overlay 模式的展开动画：所有按钮初始堆叠在容器左端（位置 0），
 * 随手势进度逐渐向右舒展到各自的最终位置。
 *
 * 公式：
 *   stackedLeft = 0                              （所有按钮初始均叠放在左端）
 *   finalLeft[i] = sum(width[0..i-1])           （第 i 个按钮的最终左边界）
 *   translateX[i] = -finalLeft[i] * (1 - progress)
 *
 * 验证（2 个宽 124 的按钮，rightWidth=248）：
 *   progress=0：收藏 left=0、删除 left=0 → 完全重叠在左端
 *   progress=1：收藏 left=0、删除 left=124 → 完全展开
 *
 * z-index = index，最右侧按钮值最大，始终在最顶层。
 */
function getStackButtonTransform(index: number): string {
  const actions = props.rightActions
  const N = actions.length
  if (N <= 1 || rightWidth.value <= 0) {
    return ''
  }

  let leftAccum = 0
  for (let j = 0; j < index; j++) {
    leftAccum += getActionWidth(actions[j])
  }

  const progress = Math.min(1, Math.abs(translateX.value) / rightWidth.value)
  const tx = -leftAccum * (1 - progress)

  const isClosing = isTapClosing.value || isSmoothClosing.value
  const duration = isDragging.value ? 0 : isClosing ? props.closeDuration : isSnapping.value ? 300 : props.duration
  // overlay 模式下各按钮行程不同，弹簧过冲量不等会产生缝隙，改用普通缓动
  const timingFunction = isClosing
    ? 'cubic-bezier(0.16, 1, 0.3, 1)'
    : 'cubic-bezier(0.22, 1, 0.36, 1)'

  return `z-index: ${index}; transform: translateX(${tx}px); transition: transform ${duration}ms ${timingFunction};`
}

function getActionStyle(item: SwiperActionItem, index: number) {
  const w = getActionWidth(item)
  const radius = getActionOuterRadiusStyle(index)
  const custom = item.customStyle || ''

  if (!isOverlayMode.value) {
    return `width: ${w}px; ${radius} ${custom}`
  }

  let leftAccum = 0
  for (let j = 0; j < index; j++) {
    leftAccum += getActionWidth(props.rightActions[j])
  }

  const stackTransform = getStackButtonTransform(index)
  return `position: absolute; top: 0; bottom: 0; left: ${leftAccum}px; width: ${w}px; ${radius} ${stackTransform} ${custom}`
}

/**
 * App 端透明点击代理层的绝对定位样式。
 * 代理层不在 transform 容器内，命中区域始终与视觉位置一致。
 */
function getActionOverlayStyle(index: number): string {
  const actions = props.rightActions
  const w = getActionWidth(actions[index])

  let rightOffset = 0
  for (let i = actions.length - 1; i > index; i--) {
    rightOffset += getActionWidth(actions[i])
  }

  return `position: absolute; top: 0; bottom: 0; right: ${rightOffset}px; width: ${w}px; z-index: 30;`
}

/**
 * 区分外部 prop 变更与内部手势/API 触发的更新。
 * - isInternalUpdate：updateOpenedSide 调用时置 true，watch 消费后清除。
 *   内部更新已在 updateOpenedSide 内调用过 syncTranslate，watch 无需重复调用。
 * - watchInitialized：首次 immediate 触发时需同步初始位置，之后跳过内部更新。
 */
let isInternalUpdate = false
let watchInitialized = false

watch(
  () => openedSide.value,
  (side) => {
    if (side) {
      closeOtherInGroup()
      markActiveInGroup()
    } else {
      clearActiveInGroup()
    }

    if (!isDragging.value) {
      if (!watchInitialized) {
        watchInitialized = true
        syncTranslate(side)
      }
      else if (isInternalUpdate) {
        isInternalUpdate = false
      }
      else {
        isSmoothClosing.value = true
        syncTranslate(side)
        setTimeout(() => {
          isSmoothClosing.value = false
        }, props.closeDuration)
      }
    }
  },
  { immediate: true },
)

watch(rightWidth, () => {
  syncTranslate(openedSide.value)
})

onMounted(() => {
  updateRootWidth()
})

onBeforeUnmount(() => {
  releasePageScroll()
  unregisterH5ScrollLock()
  stopPageScrollWatcher()
  clearDragStartOpenedSide()
  clearActiveInGroup()
})

onPageScroll(() => {
  closeByPageScroll()
})

defineExpose({
  open,
  close,
})
</script>

<script module="swipeWxs" lang="wxs">
var gestureStates = {}

function getDataset(e) {
  if (e.currentTarget && e.currentTarget.dataset) {
    return e.currentTarget.dataset
  }

  return {}
}

function getId(dataset) {
  return dataset.instanceId || dataset.instanceid || 'default'
}

function isTruthy(value) {
  return value === true || value === 'true' || value === 1 || value === '1'
}

function getTouch(e) {
  if (e.touches && e.touches.length > 0) {
    return e.touches[0]
  }

  if (e.changedTouches && e.changedTouches.length > 0) {
    return e.changedTouches[0]
  }

  return null
}

function getThreshold(dataset) {
  var rawValue = dataset.touchThreshold || dataset.touchthreshold || 12
  var value = rawValue - 0

  if (value > 0) {
    return value
  }

  return 12
}

function getDirectionRatio(dataset) {
  var rawValue = dataset.directionRatio || dataset.directionratio || 2.4
  var value = rawValue - 0

  if (value > 0) {
    return value
  }

  return 2.4
}

function getSwipeIntentThreshold(dataset) {
  var threshold = getThreshold(dataset)

  return Math.max(8, Math.min(16, threshold * 1.4))
}

function getSwipeVerticalTakeoverLimit(dataset) {
  return Math.max(getThreshold(dataset) * 3, getSwipeIntentThreshold(dataset) * 2.2)
}

function isSwipeSlopeAllowed(absX, diffY, dataset) {
  var verticalDistance = Math.abs(diffY)

  if (verticalDistance <= getSwipeIntentThreshold(dataset)) {
    return true
  }

  if (diffY < 0) {
    return absX >= verticalDistance * 1.15
  }

  return verticalDistance <= getSwipeVerticalTakeoverLimit(dataset) && absX >= verticalDistance * 0.85
}

function hasSwipeIntent(diffX, diffY, dataset) {
  var absX = Math.abs(diffX)
  var intentThreshold = getSwipeIntentThreshold(dataset)
  var openedSide = dataset.openedSide || dataset.openedside || ''
  var hasRightActions = isTruthy(dataset.hasRightActions || dataset.hasrightactions)

  if (absX < intentThreshold || !isSwipeSlopeAllowed(absX, diffY, dataset)) {
    return false
  }

  if (diffX < 0 && (hasRightActions || openedSide === 'left')) {
    return true
  }

  if (diffX > 0 && openedSide === 'right') {
    return true
  }

  return false
}

function hasSwipeDirection(diffX, dataset) {
  var openedSide = dataset.openedSide || dataset.openedside || ''
  var hasRightActions = isTruthy(dataset.hasRightActions || dataset.hasrightactions)

  return (diffX < 0 && (hasRightActions || openedSide === 'left'))
    || (diffX > 0 && openedSide === 'right')
}

function shouldPreferOpenedSideSwipe(diffX, dataset) {
  var openedSide = dataset.openedSide || dataset.openedside || ''

  return !!openedSide && hasSwipeDirection(diffX, dataset)
}

function shouldDeferVerticalForSwipe(diffX, diffY, dataset) {
  var absX = Math.abs(diffX)
  var absY = Math.abs(diffY)
  var intentThreshold = getSwipeIntentThreshold(dataset)

  if (!hasSwipeDirection(diffX, dataset) || absX < intentThreshold * 0.5) {
    return false
  }

  if (hasSwipeIntent(diffX, diffY, dataset)) {
    return true
  }

  return absY < intentThreshold && isSwipeSlopeAllowed(absX, diffY, dataset)
}

function shouldLockVertical(diffX, diffY, dataset) {
  var absX = Math.abs(diffX)
  var absY = Math.abs(diffY)
  var threshold = getThreshold(dataset)

  if (shouldPreferOpenedSideSwipe(diffX, dataset)) {
    var horizontalThreshold = Math.max(4, getSwipeIntentThreshold(dataset) * 0.45)
    var verticalBreakoutDistance = Math.max(threshold * 1.35, getSwipeVerticalTakeoverLimit(dataset) * 1.35)
    var isVerticalBreakout = absY >= Math.max(verticalBreakoutDistance, absX * 1.45)

    if (absX >= horizontalThreshold && !isVerticalBreakout) {
      return false
    }
  }

  var isStraightVertical = absX <= threshold * 0.8
  var isVerticalDominant = absY >= absX * 1.15
  var isLongDownwardScroll = diffY > 0 && absY > getSwipeVerticalTakeoverLimit(dataset) && absY >= absX * 0.75

  return absY >= threshold
    && (isStraightVertical || isVerticalDominant || isLongDownwardScroll)
    && !hasSwipeIntent(diffX, diffY, dataset)
    && !shouldDeferVerticalForSwipe(diffX, diffY, dataset)
}

function shouldLockHorizontal(diffX, diffY, dataset) {
  if (shouldPreferOpenedSideSwipe(diffX, dataset)) {
    var absX = Math.abs(diffX)
    var intentThreshold = Math.max(4, getSwipeIntentThreshold(dataset) * 0.45)

    if (absX >= intentThreshold && isSwipeSlopeAllowed(absX, diffY, dataset)) {
      return true
    }
  }

  return hasSwipeIntent(diffX, diffY, dataset)
}

function shouldUpgradeVerticalToHorizontal(diffX, diffY, dataset, state) {
  if (!shouldLockHorizontal(diffX, diffY, dataset)) {
    return false
  }

  var absY = Math.abs(diffY)
  var moveDistanceLimit = getSwipeVerticalTakeoverLimit(dataset)
  var moveCountLimit = 2

  return state.moveCount - state.verticalLockMoveCount <= moveCountLimit && absY <= moveDistanceLimit
}

function resetState(id) {
  gestureStates[id] = {
    active: false,
    lockDirection: '',
    moveCount: 0,
    verticalLockMoveCount: 0,
    startX: 0,
    startY: 0
  }
}

module.exports = {
  touchstart: function (e, ins) {
    var dataset = getDataset(e)
    var id = getId(dataset)
    var touch = getTouch(e)

    if (isTruthy(dataset.disabled) || !touch) {
      resetState(id)
      return true
    }

    gestureStates[id] = {
      active: true,
      lockDirection: '',
      moveCount: 0,
      verticalLockMoveCount: 0,
      startX: touch.clientX,
      startY: touch.clientY
    }

    return true
  },
  touchmove: function (e, ins) {
    var dataset = getDataset(e)
    var id = getId(dataset)
    var swiping = dataset.swiping
    var scrollLocked = dataset.scrollLocked || dataset.scrolllocked

    if (isTruthy(swiping) || isTruthy(scrollLocked)) {
      return false
    }

    if (isTruthy(dataset.disabled)) {
      return true
    }

    var state = gestureStates[id]
    var touch = getTouch(e)

    if (!state || !state.active || !touch) {
      return true
    }

    var diffX = touch.clientX - state.startX
    var diffY = touch.clientY - state.startY
    state.moveCount += 1

    if (!state.lockDirection) {
      if (shouldLockHorizontal(diffX, diffY, dataset)) {
        state.lockDirection = 'x'
      } else if (shouldLockVertical(diffX, diffY, dataset)) {
        state.lockDirection = 'y'
        state.verticalLockMoveCount = state.moveCount
      } else {
        return true
      }
    }

    if (state.lockDirection === 'y' && shouldUpgradeVerticalToHorizontal(diffX, diffY, dataset, state)) {
      state.lockDirection = 'x'
    }

    if (state.lockDirection === 'x') {
      return false
    }

    return true
  },
  touchend: function (e, ins) {
    resetState(getId(getDataset(e)))
    return true
  },
  touchcancel: function (e, ins) {
    resetState(getId(getDataset(e)))
    return true
  }
}
</script>

<template>
  <view :class="ui.root()" :style="rootStyle" :data-instance-id="instanceId" :data-swiping="isHorizontalMoving"
    :data-scroll-locked="isScrollLocked" :data-disabled="disabled" :data-has-right-actions="hasRightActions"
    :data-opened-side="openedSide" :data-touch-threshold="touchThresholdPx" :data-direction-ratio="directionRatio"
    @touchstart="swipeWxs.touchstart" @touchmove="swipeWxs.touchmove" @touchend="swipeWxs.touchend"
    @touchcancel="swipeWxs.touchcancel">
    <view v-if="shouldShowRightActions && shouldExposeActions" :class="cn(ui.actions(), ui.rightActions())"
      :style="actionsContainerStyle">
      <view v-for="(item, index) in rightActions" :key="item.key || index" :class="getActionClass(item)"
        :style="getActionStyle(item, index)" @tap.stop="onActionTap(item, index, 'right')">
        <slot name="right-action" :item="item" :index="index" side="right" :ui="ui">
          <view v-if="item.icon" :class="cn(ui.icon(), item.icon)" />
          <text :class="ui.text()">{{ item.text }}</text>
        </slot>
      </view>
    </view>

    <view :class="ui.content()" :style="contentStyle" @tap="onContentTap" @touchstart="onTouchStart"
      @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchCancel" @contextmenu="preventContentDefault"
      @dragstart="preventContentDefault" @selectstart="preventContentDefault">
      <slot :open-side="openedSide" :close="close">
        <view class="
            flex min-h-[112rpx] flex-row items-center justify-between px-[32rpx]
          ">
          <view class="flex flex-col gap-[8rpx]">
            <text class="
                text-gray-9 text-[30rpx] font-medium
                dark:text-gray-1
              ">
              滑动操作
            </text>
            <text class="
                text-[24rpx] text-gray-5
                dark:text-gray-4
              ">
              向左滑动显示操作
            </text>
          </view>
          <view class="i-lucide-chevron-left-right text-[36rpx] text-gray-4" />
        </view>
      </slot>
    </view>

    <!-- #ifdef APP-PLUS -->
    <!-- App 端透明点击代理层：不在 transform 容器内，命中区域始终与视觉位置准确对齐 -->
    <template v-if="openedSide === 'right' && shouldShowRightActions && shouldExposeActions">
      <view v-for="(item, index) in rightActions" :key="`overlay-right-${index}`" :style="getActionOverlayStyle(index)"
        @touchend.stop.prevent="onActionTouchEnd(item, index, 'right')" @tap.stop="onActionTap(item, index, 'right')" />
    </template>
    <!-- #endif -->
  </view>
</template>
