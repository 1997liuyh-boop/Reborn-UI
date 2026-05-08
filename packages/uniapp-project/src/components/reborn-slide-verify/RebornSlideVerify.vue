<script setup lang="ts">
import type {
  SlideVerifyColor,
  SlideVerifySize,
  SlideVerifyUI,
} from './reborn-slide-verify.config'
import { computed, getCurrentInstance, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-slide-verify.config'

defineOptions({
  name: 'RebornSlideVerify',
})

const props = withDefaults(defineProps<RebornSlideVerifyProps>(), {
  customClass: '',
  customStyle: '',
  ui: () => ({}),
  size: 'md',
  color: 'primary',
  disabled: false,
  loading: false,
  threshold: 0.92,
  duration: 220,
  defaultText: '向右滑动完成验证',
  successText: '验证通过',
  loadingText: '验证中...',
  failText: '请拖动到最右侧',
  failDuration: 900,
  autoReset: false,
  resetDelay: 1200,
  thumbIcon: 'i-lucide-chevrons-right',
  successIcon: 'i-lucide-check',
  loadingIcon: 'i-svg-spinners-180-ring-with-bg',
})

const emit = defineEmits<{
  (e: 'start', payload: SlideVerifyPayload): void
  (e: 'drag', payload: SlideVerifyPayload): void
  (e: 'success', payload: SlideVerifyPayload): void
  (e: 'fail', payload: SlideVerifyPayload): void
  (e: 'reset'): void
  (e: 'change', value: boolean): void
}>()

defineSlots<{
  default: (props: { verified: boolean, loading: boolean, progress: number, text: string, ui: any }) => any
  thumb: (props: { verified: boolean, loading: boolean, progress: number, ui: any }) => any
}>()

const verified = defineModel<boolean>({ default: false })

interface TouchPoint {
  clientX: number
  clientY: number
}

export interface SlideVerifyPayload {
  /** 当前进度，范围 0 - 100 */
  progress: number
  /** 当前滑块偏移量，单位 px */
  offset: number
  /** 是否已经验证通过 */
  verified: boolean
}

export interface RebornSlideVerifyProps {
  /** 自定义 class */
  customClass?: any
  /** 自定义 style */
  customStyle?: any
  /** 样式覆盖 */
  ui?: SlideVerifyUI
  /** 尺寸 */
  size?: SlideVerifySize
  /** 主题色 */
  color?: SlideVerifyColor
  /** 是否禁用 */
  disabled?: boolean
  /** 是否加载中 */
  loading?: boolean
  /** 通过阈值，0.92 表示滑到 92% 即通过 */
  threshold?: number
  /** 回弹与通过动画时长，单位 ms */
  duration?: number
  /** 默认提示文案 */
  defaultText?: string
  /** 通过文案 */
  successText?: string
  /** 加载文案 */
  loadingText?: string
  /** 未通过文案 */
  failText?: string
  /** 未通过文案展示时长，单位 ms */
  failDuration?: number
  /** 通过后是否自动重置 */
  autoReset?: boolean
  /** 自动重置延迟，单位 ms */
  resetDelay?: number
  /** 默认滑块图标 */
  thumbIcon?: string
  /** 通过滑块图标 */
  successIcon?: string
  /** 加载滑块图标 */
  loadingIcon?: string
}

const { proxy } = getCurrentInstance()!
const { disabled: formDisabled, size: formSize, validate } = useFormInject(props)
const b = tv(theme)

const uiOverrides = computed(() => props.ui || {})
const isDragging = ref(false)
const failVisible = ref(false)
const rootWidth = ref(0)
const thumbWidth = ref(0)
const translateX = ref(0)
const startX = ref(0)
const startY = ref(0)
const startTranslateX = ref(0)
const lockDirection = ref<'x' | 'y' | ''>('')

let failTimer: ReturnType<typeof setTimeout> | undefined
let autoResetTimer: ReturnType<typeof setTimeout> | undefined

const isDisabled = computed(() => formDisabled.value || props.disabled)
const isInteractive = computed(() => !isDisabled.value && !props.loading && !verified.value)
const maxTranslate = computed(() => Math.max(0, rootWidth.value - thumbWidth.value))
const progressRatio = computed(() => {
  if (maxTranslate.value <= 0) {
    return verified.value ? 1 : 0
  }
  return Math.max(0, Math.min(1, translateX.value / maxTranslate.value))
})
const progress = computed(() => Math.round(progressRatio.value * 100))
const verifyThreshold = computed(() => Math.max(0.5, Math.min(1, props.threshold)))
const transitionDuration = computed(() => isDragging.value ? '0ms' : `${props.duration}ms`)

const displayText = computed(() => {
  if (props.loading) {
    return props.loadingText
  }
  if (verified.value) {
    return props.successText
  }
  if (failVisible.value) {
    return props.failText
  }
  return props.defaultText
})

const currentIcon = computed(() => {
  if (props.loading) {
    return props.loadingIcon
  }
  if (verified.value) {
    return props.successIcon
  }
  return props.thumbIcon
})

const progressStyle = computed(() => ({
  width: `${progress.value}%`,
  transitionDuration: transitionDuration.value,
}))

const thumbStyle = computed(() => ({
  transform: `translateX(${translateX.value}px)`,
  transitionDuration: transitionDuration.value,
}))

const ui = computed(() => {
  const styles = b({
    size: (formSize.value || props.size) as SlideVerifySize,
    color: props.color,
    verified: verified.value,
    loading: props.loading,
    disabled: isDisabled.value,
  })

  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.customClass, uiOverrides.value.root) }),
    track: (opts?: { class?: any }) => styles.track({ class: cn(opts?.class, uiOverrides.value.track) }),
    progress: (opts?: { class?: any }) => styles.progress({ class: cn(opts?.class, uiOverrides.value.progress) }),
    content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, uiOverrides.value.content) }),
    text: (opts?: { class?: any }) => styles.text({ class: cn(opts?.class, uiOverrides.value.text) }),
    thumb: (opts?: { class?: any }) => styles.thumb({ class: cn(opts?.class, uiOverrides.value.thumb) }),
    thumbIcon: (opts?: { class?: any }) => styles.thumbIcon({ class: cn(opts?.class, uiOverrides.value.thumbIcon) }),
  }
})

function clearFailTimer() {
  if (failTimer) {
    clearTimeout(failTimer)
    failTimer = undefined
  }
}

function clearAutoResetTimer() {
  if (autoResetTimer) {
    clearTimeout(autoResetTimer)
    autoResetTimer = undefined
  }
}

function createPayload(): SlideVerifyPayload {
  return {
    progress: progress.value,
    offset: translateX.value,
    verified: verified.value,
  }
}

function getTouchPoint(e: any): TouchPoint | null {
  return e?.touches?.[0] || e?.changedTouches?.[0] || null
}

function setTranslate(value: number) {
  translateX.value = Math.max(0, Math.min(maxTranslate.value, value))
}

function syncPosition(value = verified.value) {
  setTranslate(value ? maxTranslate.value : 0)
}

function measureTrack(): Promise<void> {
  return new Promise((resolve) => {
    const query = uni.createSelectorQuery().in(proxy)
    query.select('.reborn-slide-verify').boundingClientRect()
    query.select('.reborn-slide-verify__thumb').boundingClientRect()
    query.exec((res) => {
      const [rootNode, thumbNode] = res as any[]

      if (rootNode) {
        rootWidth.value = rootNode.width ?? 0
      }
      if (thumbNode) {
        thumbWidth.value = thumbNode.width ?? 0
      }

      syncPosition()
      resolve()
    })
  })
}

function updateVerified(value: boolean) {
  if (verified.value === value) {
    validate('change')
    return
  }
  verified.value = value
  emit('change', value)
  validate('change')
}

function reset() {
  clearFailTimer()
  clearAutoResetTimer()
  failVisible.value = false
  isDragging.value = false
  lockDirection.value = ''
  setTranslate(0)
  updateVerified(false)
  emit('reset')
}

function completeVerify() {
  clearFailTimer()
  failVisible.value = false
  setTranslate(maxTranslate.value)
  updateVerified(true)

  const payload = createPayload()
  emit('success', payload)

  if (props.autoReset) {
    clearAutoResetTimer()
    autoResetTimer = setTimeout(() => {
      reset()
    }, props.resetDelay)
  }
}

function failVerify() {
  const payload = createPayload()
  emit('fail', payload)

  failVisible.value = true
  setTranslate(0)

  clearFailTimer()
  failTimer = setTimeout(() => {
    failVisible.value = false
  }, props.failDuration)
}

async function verify() {
  if (rootWidth.value <= 0) {
    await measureTrack()
  }
  completeVerify()
}

async function handleTouchStart(e: any) {
  if (!isInteractive.value) {
    return
  }

  const point = getTouchPoint(e)
  if (!point) {
    return
  }

  clearFailTimer()
  failVisible.value = false

  if (rootWidth.value <= 0 || thumbWidth.value <= 0) {
    await measureTrack()
  }

  isDragging.value = true
  lockDirection.value = ''
  startX.value = point.clientX
  startY.value = point.clientY
  startTranslateX.value = translateX.value

  emit('start', createPayload())
}

function handleTouchMove(e: any) {
  if (!isDragging.value || !isInteractive.value) {
    return
  }

  const point = getTouchPoint(e)
  if (!point) {
    return
  }

  const diffX = point.clientX - startX.value
  const diffY = point.clientY - startY.value
  const absX = Math.abs(diffX)
  const absY = Math.abs(diffY)

  if (!lockDirection.value && Math.max(absX, absY) > 6) {
    lockDirection.value = absX >= absY ? 'x' : 'y'
  }

  if (lockDirection.value === 'y') {
    return
  }

  e?.preventDefault?.()
  e?.stopPropagation?.()

  setTranslate(startTranslateX.value + diffX)
  emit('drag', createPayload())
}

function handleTouchEnd() {
  if (!isDragging.value) {
    return
  }

  isDragging.value = false
  lockDirection.value = ''

  if (progressRatio.value >= verifyThreshold.value) {
    completeVerify()
    return
  }

  failVerify()
}

watch(verified, async (value) => {
  await nextTick()
  if (rootWidth.value <= 0 || thumbWidth.value <= 0) {
    await measureTrack()
    return
  }
  syncPosition(value)
})

onMounted(async () => {
  await nextTick()
  await measureTrack()
})

onBeforeUnmount(() => {
  clearFailTimer()
  clearAutoResetTimer()
})

defineExpose({
  reset,
  verify,
})
</script>

<template>
  <view :class="ui.root()" :style="customStyle">
    <view :class="ui.track()">
      <view :class="ui.progress()" :style="progressStyle" />

      <view :class="ui.content()">
        <slot :verified="verified" :loading="loading" :progress="progress" :text="displayText" :ui="ui">
          <text :class="ui.text()">
            {{ displayText }}
          </text>
        </slot>
      </view>

      <view
        :class="ui.thumb()"
        :style="thumbStyle"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
        @touchcancel="handleTouchEnd"
      >
        <slot name="thumb" :verified="verified" :loading="loading" :progress="progress" :ui="ui">
          <view :class="[ui.thumbIcon(), currentIcon]" />
        </slot>
      </view>
    </view>
  </view>
</template>
