<script lang="ts">
type ActiveSwiperAction = {
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
}

export interface SwiperActionProps {
  leftActions?: SwiperActionItem[]
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
  customClass?: string
  customStyle?: string
  ui?: SwiperActionUI
}


const props = withDefaults(defineProps<SwiperActionProps>(), {
  leftActions: () => [],
  rightActions: () => [],
  actionWidth: 144,
  threshold: 0.35,
  maxThreshold: 120,
  closeThreshold: 96,
  duration: 220,
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
  (e: 'click', payload: { item: SwiperActionItem, index: number, side: SwiperActionSide }): void
  (e: 'content-click', payload: { openSide: SwiperActionSide | '', close: () => void }): void
}>()

defineSlots<{
  default(props: { openSide: SwiperActionSide | '', close: () => void }): any
  'left-action'(props: { item: SwiperActionItem, index: number, side: 'left', ui: typeof ui.value }): any
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
    leftActions: (opts?: { class?: any }) => styles.leftActions({ class: cn(opts?.class, uiOverrides.value.leftActions) }),
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
const isDragging = ref(false)
const isHorizontalMoving = ref(false)
const isTapClosing = ref(false)
const isSmoothClosing = ref(false)
const suppressNextTap = ref(false)
const isScrollLocked = ref(false)
const lockDirection = ref<'x' | 'y' | ''>('')
const dragStartOpenedSide = ref<SwiperActionSide | ''>('')
let scrollLockTimer: ReturnType<typeof setTimeout> | undefined
let dragStartSideResetTimer: ReturnType<typeof setTimeout> | undefined
let touchMoveCount = 0
let verticalLockMoveCount = 0
let pageScrollWatcherTimer: ReturnType<typeof setInterval> | undefined
let pageScrollWatcherPending = false
let pageScrollTopBaseline = 0
let h5ScrollLockRegistered = false
let h5TouchActive = false
let h5GestureGuarding = false
let h5TouchStartX = 0
let h5TouchStartY = 0
let h5ScrollPositionLocked = false

const leftRawWidth = computed(() => getActionsWidth(props.leftActions))
const rightRawWidth = computed(() => getActionsWidth(props.rightActions))
const maxRevealWidth = computed(() => {
  if (rootWidth.value <= 0) {
    return Number.POSITIVE_INFINITY
  }

  const ratio = Math.max(0.1, Math.min(props.maxRevealRatio, 1))
  return rootWidth.value * ratio
})
const leftWidth = computed(() => Math.min(leftRawWidth.value, maxRevealWidth.value))
const rightWidth = computed(() => Math.min(rightRawWidth.value, maxRevealWidth.value))
const hasLeftActions = computed(() => props.leftActions.length > 0)
const hasRightActions = computed(() => props.rightActions.length > 0)
const shouldShowLeftActions = computed(() => hasLeftActions.value && !(isDragging.value && dragStartOpenedSide.value === 'right'))
const shouldShowRightActions = computed(() => hasRightActions.value && !(isDragging.value && dragStartOpenedSide.value === 'left'))

const contentStyle = computed(() => {
  const isClosing = isTapClosing.value || isSmoothClosing.value
  const timingFunction = isClosing ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)'
  const duration = isDragging.value ? 0 : (isClosing ? props.closeDuration : props.duration)

  return `transform: translate3d(${translateX.value}px, 0, 0); transition: transform ${duration}ms ${timingFunction}; will-change: transform; touch-action: pan-y; user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; backface-visibility: hidden; -webkit-backface-visibility: hidden; contain: paint;`
})

const touchThresholdPx = computed(() => toPx(props.touchThreshold))

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

  const sideWidth = value > 0 ? leftWidth.value : rightWidth.value
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
  const max = hasLeftActions.value ? leftWidth.value : 0
  const ratio = Math.max(0, Math.min(props.damping, 1))
  const maxDistance = toPx(props.dampingDistance)

  if (value < min) {
    const overflow = Math.max(-maxDistance, (value - min) * ratio)
    return min + overflow
  }

  if (value > max) {
    const overflow = Math.min(maxDistance, (value - max) * ratio)
    return max + overflow
  }

  return value
}

function constrainOpenedSideTranslate(value: number) {
  const crossSideLimit = Math.max(2, Math.min(8, touchThresholdPx.value * 0.5))
  const crossSideDamping = 0.18

  if (startTranslateX.value > 0 && value < 0) {
    return Math.max(-crossSideLimit, value * crossSideDamping)
  }

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
  const max = hasLeftActions.value ? leftWidth.value : 0
  const tolerance = 1

  return (hasRightActions.value && value <= min + tolerance) || (hasLeftActions.value && value >= max - tolerance)
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

  if (diffX > 0 && (hasLeftActions.value || openedSide.value === 'right')) {
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
    || (diffX > 0 && (hasLeftActions.value || openedSide.value === 'right'))
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
  closeOtherInGroup()
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
  if (side === 'left' && hasLeftActions.value) {
    translateX.value = leftWidth.value
    return
  }

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

/**
 * 触摸开始时记录初始位置，后续根据移动方向判断是否进入横向滑动。
 */
function onTouchStart(event: any) {
  if (props.disabled) {
    return
  }

  isTapClosing.value = false
  isSmoothClosing.value = false
  updateRootWidth()

  const touch = event.touches?.[0]
  if (!touch) {
    return
  }

  registerH5ScrollLock()
  h5TouchActive = true
  h5GestureGuarding = canUseH5TouchLock() && (hasLeftActions.value || hasRightActions.value || !!openedSide.value)
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
 * 触摸结束后按阈值吸附到打开或关闭状态。
 */
function onTouchEnd() {
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
    syncTranslate(openedSide.value)
    lockDirection.value = ''
    releasePageScroll()
    clearDragStartOpenedSide()
    return
  }

  lockDirection.value = ''
  releasePageScroll(props.duration)
  clearDragStartOpenedSide(props.duration)

  if (wasHorizontalMoving) {
    setTimeout(() => {
      suppressNextTap.value = false
    }, 300)
  }

  const releaseX = dragTargetX.value
  const dragDistance = releaseX - startTranslateX.value

  if (startTranslateX.value < 0 && hasRightActions.value) {
    const threshold = getCloseThreshold(rightWidth.value)
    updateOpenedSide(dragDistance >= threshold ? '' : 'right')
    return
  }

  if (startTranslateX.value > 0 && hasLeftActions.value) {
    const threshold = getCloseThreshold(leftWidth.value)
    updateOpenedSide(dragDistance <= -threshold ? '' : 'left')
    return
  }

  if (releaseX > 0 && hasLeftActions.value) {
    const threshold = getTriggerThreshold(leftWidth.value)
    updateOpenedSide(releaseX >= threshold ? 'left' : '')
    return
  }

  if (releaseX < 0 && hasRightActions.value) {
    const threshold = getTriggerThreshold(rightWidth.value)
    updateOpenedSide(Math.abs(releaseX) >= threshold ? 'right' : '')
    return
  }

  close()
}

/**
 * 手势被系统取消时不按阈值吸附，避免误触发完整展开。
 */
function onTouchCancel() {
  isDragging.value = false
  isHorizontalMoving.value = false
  releasePageScroll()
  lockDirection.value = ''
  syncTranslate(openedSide.value)
  clearDragStartOpenedSide()
}

/**
 * 点击主体区域时，如果操作区已打开，则优先关闭。
 */
function onContentTap() {
  if (suppressNextTap.value) {
    suppressNextTap.value = false
    return
  }

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
 * 点击操作按钮。
 */
function onActionTap(item: SwiperActionItem, index: number, side: SwiperActionSide) {
  if (props.disabled || item.disabled) {
    return
  }

  emit('click', { item, index, side })

  if (props.closeOnActionClick) {
    close()
  }
}

function getActionClass(item: SwiperActionItem) {
  const color = item.color || (item.key === 'delete' ? 'error' : item.key === 'more' ? 'info' : 'primary')
  return cn(ui.value.action(), swiperActionColorClasses[color], item.disabled ? 'opacity-60' : '', item.customClass)
}

/**
 * 操作项过多时按可展开宽度均分，避免主体内容被推离可视区域。
 */
function getActionWidth(item: SwiperActionItem, side: SwiperActionSide) {
  const actions = side === 'left' ? props.leftActions : props.rightActions
  const rawWidth = side === 'left' ? leftRawWidth.value : rightRawWidth.value
  const revealWidth = side === 'left' ? leftWidth.value : rightWidth.value

  if (actions.length > 0 && rawWidth > revealWidth) {
    return revealWidth / actions.length
  }

  return toPx(item.width || props.actionWidth)
}

/**
 * 仅给操作区外侧按钮补圆角，内侧保持直角，保证三端表现一致。
 */
function getActionOuterRadiusStyle(index: number, side: SwiperActionSide) {
  const radius = `${toPx(14)}px`
  const actions = side === 'left' ? props.leftActions : props.rightActions

  if (side === 'left' && index === 0 && actions.length > 0) {
    return `border-top-left-radius: ${radius}; border-bottom-left-radius: ${radius};`
  }

  if (side === 'right' && index === actions.length - 1 && actions.length > 0) {
    return `border-top-right-radius: ${radius}; border-bottom-right-radius: ${radius};`
  }

  return ''
}

function getActionStyle(item: SwiperActionItem, side: SwiperActionSide, index: number) {
  return `width: ${getActionWidth(item, side)}px; ${getActionOuterRadiusStyle(index, side)} ${item.customStyle || ''}`
}

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
      syncTranslate(side)
    }
  },
  { immediate: true },
)

watch([leftWidth, rightWidth], () => {
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

<template>
  <view :class="ui.root()" :style="customStyle" :data-instance-id="instanceId" :data-swiping="isHorizontalMoving"
    :data-scroll-locked="isScrollLocked" :data-disabled="disabled" :data-has-left-actions="hasLeftActions"
    :data-has-right-actions="hasRightActions" :data-opened-side="openedSide" :data-touch-threshold="touchThresholdPx"
    :data-direction-ratio="directionRatio" @touchstart="swipeWxs.touchstart" @touchmove="swipeWxs.touchmove"
    @touchend="swipeWxs.touchend" @touchcancel="swipeWxs.touchcancel">
    <view v-if="shouldShowLeftActions" :class="cn(ui.actions(), ui.leftActions())" :style="`width: ${leftWidth}px;`">
      <view v-for="(item, index) in leftActions" :key="item.key || index" :class="getActionClass(item)"
        :style="getActionStyle(item, 'left', index)" @tap.stop="onActionTap(item, index, 'left')">
        <slot name="left-action" :item="item" :index="index" side="left" :ui="ui">
          <view v-if="item.icon" :class="cn(ui.icon(), item.icon)" />
          <text :class="ui.text()">{{ item.text }}</text>
        </slot>
      </view>
    </view>

    <view v-if="shouldShowRightActions" :class="cn(ui.actions(), ui.rightActions())" :style="`width: ${rightWidth}px;`">
      <view v-for="(item, index) in rightActions" :key="item.key || index" :class="getActionClass(item)"
        :style="getActionStyle(item, 'right', index)" @tap.stop="onActionTap(item, index, 'right')">
        <slot name="right-action" :item="item" :index="index" side="right" :ui="ui">
          <view v-if="item.icon" :class="cn(ui.icon(), item.icon)" />
          <text :class="ui.text()">{{ item.text }}</text>
        </slot>
      </view>
    </view>

    <view :class="ui.content()" :style="contentStyle" @tap="onContentTap" @touchstart="onTouchStart"
      @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchCancel"
      @contextmenu="preventContentDefault" @dragstart="preventContentDefault" @selectstart="preventContentDefault">
      <slot :open-side="openedSide" :close="close">
        <view class="flex min-h-[112rpx] flex-row items-center justify-between px-[32rpx]">
          <view class="flex flex-col gap-[8rpx]">
            <text class="text-[30rpx] font-medium text-gray-9 dark:text-gray-1">滑动操作</text>
            <text class="text-[24rpx] text-gray-5 dark:text-gray-4">向左或向右滑动显示操作</text>
          </view>
          <view class="i-lucide-chevron-left-right text-[36rpx] text-gray-4" />
        </view>
      </slot>
    </view>
  </view>
</template>

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
  var hasLeftActions = isTruthy(dataset.hasLeftActions || dataset.hasleftactions)
  var hasRightActions = isTruthy(dataset.hasRightActions || dataset.hasrightactions)

  if (absX < intentThreshold || !isSwipeSlopeAllowed(absX, diffY, dataset)) {
    return false
  }

  if (diffX < 0 && (hasRightActions || openedSide === 'left')) {
    return true
  }

  if (diffX > 0 && (hasLeftActions || openedSide === 'right')) {
    return true
  }

  return false
}

function hasSwipeDirection(diffX, dataset) {
  var openedSide = dataset.openedSide || dataset.openedside || ''
  var hasLeftActions = isTruthy(dataset.hasLeftActions || dataset.hasleftactions)
  var hasRightActions = isTruthy(dataset.hasRightActions || dataset.hasrightactions)

  return (diffX < 0 && (hasRightActions || openedSide === 'left'))
    || (diffX > 0 && (hasLeftActions || openedSide === 'right'))
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
