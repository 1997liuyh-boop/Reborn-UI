<script setup lang="ts">
import type { ClassValue } from 'clsx'
import type { rateColors, rateSizes } from './reborn-rate.config'
import { computed, getCurrentInstance, onBeforeUnmount } from 'vue'

import { useFormInject } from '@/composables/useFieldGroup'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-rate.config'

defineOptions({
  name: 'RebornRate',
})

const props = withDefaults(defineProps<RateProps>(), {
  count: 5,
  allowHalf: false,
  showValue: false,
  disabled: false,
  readonly: false,
  icon: 'i-lucide-star',
  activeIcon: 'i-lucide-star',
  size: 'md',
  color: 'warning',
  ui: () => ({}),
})

const emit = defineEmits<{
  (e: 'change', value: number): void
}>()

export interface RateProps {
  /** 当前评分 */
  /** 星星总数 */
  count?: number
  /** 允许半星 */
  allowHalf?: boolean
  /** 显示分数 */
  showValue?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 未选中图标 class */
  icon?: string
  /** 选中图标 class */
  activeIcon?: string
  /** 半星选中图标 class */
  halfIcon?: string
  /** 尺寸 */
  size?: (typeof rateSizes)[number]
  /** 颜色 */
  color?: (typeof rateColors)[number]
  /** 样式覆盖 */
  ui?: Partial<{
    wrapper: ClassValue
    star: ClassValue
    icon: ClassValue
    iconActive: ClassValue
    value: ClassValue
  }>
  /** 自定义 class */
  customClass?: any
}

const { proxy } = getCurrentInstance()!

// reborn-form 上下文
const { disabled, size } = useFormInject(props)

const isInteractive = computed(
  () => !disabled.value && !props.readonly,
)

// ui 样式系统
const uiOverrides = computed(() => props.ui || {})
const b = tv(theme)

const ui = computed(() => {
  const styles = b({
    size: (size.value || props.size) as any,
    color: props.color,
    disabled: disabled.value,
    readonly: props.readonly,
    allowHalf: props.allowHalf,
  })

  return {
    wrapper: (opts?: { class?: any }) =>
      styles.wrapper({ class: cn(opts?.class, uiOverrides.value.wrapper) }),
    star: (opts?: { class?: any }) =>
      styles.star({ class: cn(opts?.class, uiOverrides.value.star) }),
    icon: (opts?: { class?: any }) =>
      styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
    iconActive: (opts?: { class?: any }) =>
      styles.iconActive({ class: cn(opts?.class, uiOverrides.value.iconActive) }),
    value: (opts?: { class?: any }) =>
      styles.value({ class: cn(opts?.class, uiOverrides.value.value) }),
  }
})

function activeIcon(index: number) {
  if (isHalf(index)) {
    return props.halfIcon ?? props.activeIcon
  }
  return props.activeIcon
}

// 当前评分：读取时按 0 ~ count 夹取（不回写模型），越界值不会进入渲染与比较，与 Web 端一致
const currentValue = defineModel<number>({ default: 0, get: value => Math.max(0, Math.min(props.count, value)) })

// 判断当前星星是否为半星状态
function isHalf(index: number): boolean {
  return props.allowHalf && currentValue.value >= index - 0.5 && currentValue.value < index
}

// 防止 touchstart 和 tap 重复触发
let touchHandled = false
let starRects: any[] = []
let gestureVersion = 0
/** 半星点按的代次：只被新的 touchstart 与卸载作废，touchend 不作废（快速点按时测量常晚于抬起） */
let tapVersion = 0
/** 本次手势是否已转为拖动；拖动的取值优先，迟到的半星点按结果不再覆盖 */
let gestureDragged = false

/** iOS H5：touchstart 上 preventDefault 会阻断 tap；横向滑动超过阈值后再 preventDefault */
const DRAG_SLOP_PX = 12
let touchStartX = 0
let touchStartY = 0
let dragActive = false
let suppressNextTap = false

// 点击事件
function onTap(index: number) {
  if (!isInteractive.value) { return }

  if (suppressNextTap) {
    suppressNextTap = false
    touchHandled = false
    return
  }

  // 如果 touchStart 已处理（半星模式），跳过 tap
  if (touchHandled) {
    touchHandled = false
    return
  }

  let newValue = index

  if (props.allowHalf) {
    if (currentValue.value === index) {
      newValue = index - 0.5
    }
    else if (currentValue.value === index - 0.5) {
      newValue = 0
    }
  }
  else {
    // 点击同一个星星则清零
    if (currentValue.value === index) {
      newValue = 0
    }
  }

  updateValue(newValue)
}

function onStarTouchStart(e: TouchEvent, index: number) {
  if (!isInteractive.value) { return }
  e.stopPropagation()
  const t = e.touches[0]
  if (t) {
    touchStartX = t.clientX
    touchStartY = t.clientY
  }
  dragActive = false
  gestureDragged = false
  suppressNextTap = false
  const version = ++gestureVersion
  const tap = ++tapVersion
  const touch = e.touches[0]
  // 半星模式由触点决定取值：同步标记，抬起后的 tap 不再走「同星循环」逻辑，结果不取决于测量快慢
  if (props.allowHalf && touch) touchHandled = true
  getAllStarRects().then((rects) => {
    if (!isInteractive.value) return
    // 拖动缓存只交给仍在进行的手势
    if (version === gestureVersion) starRects = rects
    if (tap !== tapVersion || gestureDragged) return
    if (props.allowHalf && touch && rects[index - 1]) {
      const rect = rects[index - 1]
      updateValue(touch.clientX < rect.left + rect.width / 2 ? index - 0.5 : index)
    }
  })
}

function onStarTouchMove(e: TouchEvent, index: number) {
  if (!isInteractive.value) { return }
  const t = e.touches[0]
  if (!t) { return }

  const dx = Math.abs(t.clientX - touchStartX)
  const dy = Math.abs(t.clientY - touchStartY)

  if (!dragActive) {
    if (dx < DRAG_SLOP_PX && dy < DRAG_SLOP_PX) {
      return
    }
    if (dy >= dx) {
      return
    }
    dragActive = true
    gestureDragged = true
  }

  e.stopPropagation()
  e.preventDefault()
  onTouchMove(e, index)
}

function onStarTouchEnd() {
  if (dragActive) {
    suppressNextTap = true
  }
  dragActive = false
  gestureVersion++
  starRects = []
}

// 触摸移动 — 拖动评分
function onTouchMove(e: TouchEvent, index: number) {
  if (!isInteractive.value) { return }

  const touch = e.touches[0]
  if (!touch) { return }

  // 通过触摸位置计算哪个星星
  const rects = starRects
    if (!rects || rects.length === 0) { return }

    for (let i = rects.length - 1; i >= 0; i--) {
      const rect = rects[i]
      if (touch.clientX >= rect.left) {
        if (props.allowHalf) {
          const midX = rect.left + rect.width / 2
          const newValue = touch.clientX < midX ? i + 0.5 : i + 1
          updateValue(newValue)
        }
        else {
          updateValue(i + 1)
        }
        return
      }
    }

    // 在所有星星左边
    updateValue(0)
}

// 更新值
function updateValue(newValue: number) {
  if (currentValue.value !== newValue) {
    currentValue.value = newValue
    emit('change', newValue)
  }
}

// 获取所有星星的矩形信息
function getAllStarRects(): Promise<any[]> {
  return new Promise((resolve) => {
    uni.createSelectorQuery()
      .in(proxy)
      .selectAll('.reborn-rate__star')
      .boundingClientRect((nodes: any) => {
        resolve(nodes ?? [])
      })
      .exec()
  })
}

onBeforeUnmount(() => { gestureVersion++; tapVersion++; starRects = [] })
</script>

<template>
  <view :class="ui.wrapper({ class: props.customClass })">
    <view
      v-for="index in count" :key="index" class="reborn-rate__star"
      :class="[ui.star(), isInteractive && 'touch-none overscroll-x-contain']" @tap="onTap(index)"
      @touchstart="onStarTouchStart($event, index)" @touchmove="onStarTouchMove($event, index)"
      @touchend="onStarTouchEnd" @touchcancel="onStarTouchEnd"
    >
      <!-- 未激活图标 -->
      <view :class="ui.icon()" class="opacity-30">
        <slot name="icon" :index="index" :active="false">
          <view :class="props.icon" class="size-full" />
        </slot>
      </view>

      <!-- 激活图标（整星 / 半星） -->
      <view v-if="currentValue >= index - (allowHalf ? 0.5 : 0) && currentValue >= index - 0.5" class="absolute inset-0"
        :class="[ui.iconActive(), isHalf(index) && `
          w-1/2 overflow-hidden
        `]">
        <slot name="icon" :index="index" :active="true" :style="isHalf(index) ? { width: '200%' } : {}">
          <view :class="activeIcon(index)" class="size-full" :style="isHalf(index) ? { width: '200%' } : {}" />
        </slot>
      </view>
    </view>

    <!-- 分数显示 -->
    <slot name="value" :value="currentValue">
      <view v-if="showValue" :class="ui.value()">{{ currentValue }}</view>
    </slot>
  </view>
</template>
