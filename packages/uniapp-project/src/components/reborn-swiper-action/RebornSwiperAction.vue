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
let scrollLockTimer: ReturnType<typeof setTimeout> | undefined

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

const contentStyle = computed(() => {
  const isClosing = isTapClosing.value || isSmoothClosing.value
  const timingFunction = isClosing ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'cubic-bezier(0.22, 1, 0.36, 1)'
  const duration = isDragging.value ? 0 : (isClosing ? props.closeDuration : props.duration)

  return `transform: translateX(${translateX.value}px); transition: transform ${duration}ms ${timingFunction};`
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
function hasSwipeIntent(diffX: number) {
  const intentThreshold = 1

  if (diffX < 0 && (hasRightActions.value || openedSide.value === 'left')) {
    return Math.abs(diffX) >= intentThreshold
  }

  if (diffX > 0 && (hasLeftActions.value || openedSide.value === 'right')) {
    return diffX >= intentThreshold
  }

  return false
}

/**
 * 判断本次手势是否已经满足横向滑动条件。
 */
function shouldLockHorizontal(diffX: number, diffY: number) {
  const absX = Math.abs(diffX)
  const threshold = touchThresholdPx.value

  return hasSwipeIntent(diffX) || (absX >= threshold * 0.6 && !shouldLockVertical(diffX, diffY))
}

/**
 * 判断本次手势是否更像纵向滚动。
 */
function shouldLockVertical(diffX: number, diffY: number) {
  const absX = Math.abs(diffX)
  const absY = Math.abs(diffY)
  const threshold = touchThresholdPx.value
  const verticalDeadZone = threshold * 0.8

  return absY >= threshold && absX <= verticalDeadZone && !hasSwipeIntent(diffX)
}

/**
 * 横向滑动确认后阻止页面滚动和父级手势继续响应。
 */
function preventHorizontalGesture(event: any) {
  if (event.cancelable !== false && event.preventDefault) {
    event.preventDefault()
  }

  if (event.stopPropagation) {
    event.stopPropagation()
  }
}

function lockPageScroll() {
  if (scrollLockTimer) {
    clearTimeout(scrollLockTimer)
    scrollLockTimer = undefined
  }

  isScrollLocked.value = true
}

function releasePageScroll(delay = 0) {
  if (scrollLockTimer) {
    clearTimeout(scrollLockTimer)
    scrollLockTimer = undefined
  }

  if (delay <= 0) {
    isScrollLocked.value = false
    return
  }

  scrollLockTimer = setTimeout(() => {
    isScrollLocked.value = false
    scrollLockTimer = undefined
  }, delay)
}

function lockHorizontalGesture() {
  lockDirection.value = 'x'
  isDragging.value = true
  isHorizontalMoving.value = true
  isTapClosing.value = false
  suppressNextTap.value = true
  lockPageScroll()
  closeOtherInGroup()
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
  } else {
    clearActiveInGroup()
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

  startX.value = touch.clientX
  startY.value = touch.clientY
  startTranslateX.value = translateX.value
  dragTargetX.value = translateX.value
  isDragging.value = true
  isHorizontalMoving.value = false
  lockDirection.value = ''
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

  if (!lockDirection.value) {
    if (shouldLockHorizontal(diffX, diffY)) {
      lockHorizontalGesture()
    } else if (shouldLockVertical(diffX, diffY)) {
      lockDirection.value = 'y'
      isHorizontalMoving.value = false
      releasePageScroll()
      syncTranslate(openedSide.value)
      return
    } else {
      return
    }
  }

  if (lockDirection.value === 'y') {
    if (shouldLockHorizontal(diffX, diffY)) {
      lockHorizontalGesture()
    } else {
      return
    }
  }

  if (lockDirection.value !== 'x') {
    return
  }

  preventHorizontalGesture(event)

  const nextTranslateX = startTranslateX.value + diffX
  const isOpeningFarther = Math.abs(nextTranslateX) > Math.abs(startTranslateX.value)
  const shouldUseResist = isOpeningFarther && !isAtRevealBoundary(startTranslateX.value)
  const targetTranslateX = dampTranslate(shouldUseResist ? resistTranslate(nextTranslateX) : nextTranslateX)

  dragTargetX.value = nextTranslateX
  translateX.value = followTranslate(targetTranslateX, !isOpeningFarther)
}

/**
 * 触摸结束后按阈值吸附到打开或关闭状态。
 */
function onTouchEnd() {
  if (!isDragging.value) {
    isHorizontalMoving.value = false
    releasePageScroll()
    return
  }

  const wasHorizontalMoving = lockDirection.value === 'x'

  isDragging.value = false
  isHorizontalMoving.value = false

  if (lockDirection.value !== 'x') {
    syncTranslate(openedSide.value)
    lockDirection.value = ''
    releasePageScroll()
    return
  }

  lockDirection.value = ''
  releasePageScroll(props.duration)

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

function getActionStyle(item: SwiperActionItem, side: SwiperActionSide) {
  return `width: ${getActionWidth(item, side)}px; ${item.customStyle || ''}`
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
    @touchstart="swipeWxs.touchstart" @touchmove.stop.prevent="swipeWxs.touchmove" @touchend="swipeWxs.touchend"
    @touchcancel="swipeWxs.touchcancel">
    <view v-if="hasLeftActions" :class="cn(ui.actions(), ui.leftActions())" :style="`width: ${leftWidth}px;`">
      <view v-for="(item, index) in leftActions" :key="item.key || index" :class="getActionClass(item)"
        :style="getActionStyle(item, 'left')" @tap.stop="onActionTap(item, index, 'left')">
        <slot name="left-action" :item="item" :index="index" side="left" :ui="ui">
          <view v-if="item.icon" :class="cn(ui.icon(), item.icon)" />
          <text :class="ui.text()">{{ item.text }}</text>
        </slot>
      </view>
    </view>

    <view v-if="hasRightActions" :class="cn(ui.actions(), ui.rightActions())" :style="`width: ${rightWidth}px;`">
      <view v-for="(item, index) in rightActions" :key="item.key || index" :class="getActionClass(item)"
        :style="getActionStyle(item, 'right')" @tap.stop="onActionTap(item, index, 'right')">
        <slot name="right-action" :item="item" :index="index" side="right" :ui="ui">
          <view v-if="item.icon" :class="cn(ui.icon(), item.icon)" />
          <text :class="ui.text()">{{ item.text }}</text>
        </slot>
      </view>
    </view>

    <view :class="ui.content()" :style="contentStyle" @tap="onContentTap" @touchstart="onTouchStart"
      @touchmove="onTouchMove" @touchend="onTouchEnd" @touchcancel="onTouchCancel">
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
  var value = Number(dataset.touchThreshold || dataset.touchthreshold || 12)

  if (value > 0) {
    return value
  }

  return 12
}

function hasSwipeIntent(diffX, dataset) {
  var intentThreshold = 1
  var openedSide = dataset.openedSide || dataset.openedside || ''
  var hasLeftActions = isTruthy(dataset.hasLeftActions || dataset.hasleftactions)
  var hasRightActions = isTruthy(dataset.hasRightActions || dataset.hasrightactions)

  if (diffX < 0 && (hasRightActions || openedSide === 'left')) {
    return Math.abs(diffX) >= intentThreshold
  }

  if (diffX > 0 && (hasLeftActions || openedSide === 'right')) {
    return diffX >= intentThreshold
  }

  return false
}

function shouldLockVertical(diffX, diffY, dataset) {
  var absX = Math.abs(diffX)
  var absY = Math.abs(diffY)
  var threshold = getThreshold(dataset)

  return absY >= threshold && absX <= threshold * 0.8 && !hasSwipeIntent(diffX, dataset)
}

function shouldLockHorizontal(diffX, diffY, dataset) {
  var absX = Math.abs(diffX)
  var threshold = getThreshold(dataset)

  return hasSwipeIntent(diffX, dataset) || (absX >= threshold * 0.6 && !shouldLockVertical(diffX, diffY, dataset))
}

function resetState(id) {
  gestureStates[id] = {
    active: false,
    lockDirection: '',
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

    if (!state.lockDirection) {
      if (shouldLockHorizontal(diffX, diffY, dataset)) {
        state.lockDirection = 'x'
      } else if (shouldLockVertical(diffX, diffY, dataset)) {
        state.lockDirection = 'y'
      } else {
        return true
      }
    }

    if (state.lockDirection === 'y' && shouldLockHorizontal(diffX, diffY, dataset)) {
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
