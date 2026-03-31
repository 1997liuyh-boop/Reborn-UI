<script lang="ts">
export default {
  name: 'reborn-popup',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared'
  }
}
</script>

<script lang="ts" setup>
import { computed, onBeforeMount, ref, reactive, nextTick, type PropType } from 'vue'
import RebornOverlay from '../reborn-overlay/RebornOverlay.vue'
import RebornTransition from '../reborn-transition/RebornTransition.vue'
import RebornRootPortal from '../reborn-root-portal/RebornRootPortal.vue'
import type { TransitionName } from '../reborn-transition/RebornTransition.vue'
import { tv } from '@/lib/tv'
import { getSystemInfo } from '@/lib/device'
import theme, { PopupPosition, PopupColor } from './reborn-popup.config'

interface PopupProps {
  customClass?: string
  customStyle?: string
  modelValue?: boolean
  position?: PopupPosition
  direction?: PopupPosition
  transition?: TransitionName
  closeOnClickModal?: boolean
  maskClosable?: boolean
  duration?: number | boolean
  modal?: boolean
  showMask?: boolean
  zIndex?: number
  overlayZIndex?: number
  modalStyle?: string
  safeAreaInsetBottom?: boolean
  safeAreaInsetTop?: boolean
  lazyRender?: boolean
  lockScroll?: boolean
  title?: string
  showHeader?: boolean
  showClose?: boolean
  swipeClose?: boolean
  swipeCloseThreshold?: number
  ui?: any
  rootPortal?: boolean
  enablePortal?: boolean
  color?: PopupColor
  round?: boolean
}

const props = withDefaults(defineProps<PopupProps>(), {
  customClass: '',
  customStyle: '',
  modelValue: false,
  position: 'bottom',
  direction: 'bottom',
  closeOnClickModal: true,
  maskClosable: true,
  duration: 300,
  modal: true,
  showMask: true,
  zIndex: 25,
  overlayZIndex: 25,
  modalStyle: '',
  safeAreaInsetBottom: true,
  safeAreaInsetTop: true,
  lazyRender: true,
  lockScroll: true,
  title: '',
  showHeader: true,
  showClose: true,
  swipeClose: true,
  swipeCloseThreshold: 150,
  rootPortal: false,
  enablePortal: false,
  color: 'neutral',
  round: true,
})

const emit = defineEmits([
  'update:modelValue',
  'before-enter',
  'enter',
  'before-leave',
  'leave',
  'after-leave',
  'after-enter',
  'click-modal',
  'close'
])

// 兼容旧参数
const actualPosition = computed(() => props.direction || props.position)
const actualModal = computed(() => props.showMask ?? props.modal)
const actualCloseOnClick = computed(() => props.maskClosable ?? props.closeOnClickModal)
const actualZIndex = computed(() => props.overlayZIndex || props.zIndex)
const actualRootPortal = computed(() => props.enablePortal || props.rootPortal)

const transitionName = computed<TransitionName | TransitionName[]>(() => {
  if (props.transition) return props.transition
  if (actualPosition.value === 'center') return ['zoom-in', 'fade']
  if (actualPosition.value === 'left') return 'slide-left'
  if (actualPosition.value === 'right') return 'slide-right'
  if (actualPosition.value === 'bottom') return 'slide-up'
  if (actualPosition.value === 'top') return 'slide-down'
  return 'slide-up'
})

const safeTop = ref<number>(0)
const safeBottom = ref<number>(0)

const swipe = reactive({
  isTouch: false,
  startY: 0,
  offsetY: 0,
  lastY: 0,
  lastTime: 0,
  velocityY: 0,   // 瞬时速度 px/ms，用于检测 flick 手势
  releasing: false,
  exiting: false, // 触发关闭后的退场滑出阶段，保持 transform 避免闪现
})

/**
 * 拖拽滑动触发关闭时，由本组件接管退场动画（ease-in 滑出屏幕），
 * 动画结束后以 duration=0 静默调用 close，跳过 RebornTransition 的离场效果。
 * 这样可彻底避免"先跳回 0 再离场"的闪现问题。
 */
const internalDuration = ref<number | boolean | null>(null)
const effectiveDuration = computed(() =>
  internalDuration.value !== null ? internalDuration.value : props.duration
)


const isSwipeClose = computed(() => actualPosition.value === 'bottom' && props.swipeClose)

/** 跟手阻尼系数（0~1，越小阻力越大） */
const DRAG_DAMPING = 0.9
/** flick 轻扫关闭的速度阈值（px/ms） */
const FLICK_VELOCITY_THRESHOLD = 1
/** EMA 速度平滑系数：越小越平滑，越大越灵敏 */
const VELOCITY_EMA_ALPHA = 0.25

/** 拖拽跟手 / 回弹共用的 spring 曲线，保持视觉风格统一 */
const SPRING_EASING = 'cubic-bezier(0.34, 1.3, 0.64, 1)'

/** 退场滑出动画时长（ms），需与 onTouchEnd 里的 setTimeout 保持一致 */
const EXIT_DURATION = 220

const style = computed(() => {
  const base = `z-index:${actualZIndex.value}; padding-top: ${safeTop.value}px; padding-bottom: ${safeBottom.value}px;`
  if (swipe.exiting) {
    // 退场：ease-in 加速滑出屏幕，offsetY 会被设为超大值驱动此动画
    return `${base} transition: transform ${EXIT_DURATION}ms ease-in; transform: translateY(${swipe.offsetY}px); ${props.customStyle}`
  }
  if (swipe.isTouch) {
    // 拖拽中：100ms spring 过渡，每帧位移都带弹簧感，与回弹风格统一
    return `${base} transition: transform 100ms ${SPRING_EASING}; transform: translateY(${swipe.offsetY}px); ${props.customStyle}`
  }
  if (swipe.releasing) {
    // 回弹：以当前 offsetY 为起点播 spring 动画，由 JS 将 offsetY 归零来驱动
    return `${base} transition: transform 0.45s ${SPRING_EASING}; transform: translateY(${swipe.offsetY}px); ${props.customStyle}`
  }
  return `${base} ${props.customStyle}`
})

/**
 * 拖拽/回弹时遮罩透明度随 offsetY 联动，增强"弹窗从遮罩中分离"的层次感
 */
const overlayDragStyle = computed(() => {
  if (swipe.exiting) {
    // 退场时遮罩同步淡出到全透明
    return `${props.modalStyle} transition: opacity ${EXIT_DURATION}ms ease-in; opacity: 0;`
  }
  const trackOffset = swipe.isTouch || swipe.releasing ? swipe.offsetY : 0
  if (trackOffset > 0) {
    const progress = Math.min(trackOffset / (props.swipeCloseThreshold * 1.5), 1)
    const opacity = (1 - progress * 0.6).toFixed(2)
    const tr = swipe.releasing ? 'transition: opacity 0.45s ease; ' : ''
    return `${props.modalStyle} ${tr}opacity: ${opacity};`
  }
  if (swipe.releasing) {
    // offsetY 已归零，带 transition 让遮罩平滑恢复全不透明
    return `${props.modalStyle} transition: opacity 0.45s ease;`
  }
  return props.modalStyle
})


const b = tv(theme)
const rootClass = computed(() => {
  return b({ position: actualPosition.value, color: props.color, class: props.customClass, round: props.round })
})

onBeforeMount(() => {
  const { safeArea, screenHeight, safeAreaInsets } = getSystemInfo()
  if (props.safeAreaInsetTop && safeArea && actualPosition.value === 'top') {
    // #ifdef MP-WEIXIN
    safeTop.value = safeArea.top || 44
    // #endif
    // #ifndef MP-WEIXIN
    safeTop.value = safeAreaInsets?.top || 44
    // #endif
  }
  if (props.safeAreaInsetBottom && safeArea && actualPosition.value === 'bottom') {
    // #ifdef MP-WEIXIN
    safeBottom.value = screenHeight - (safeArea.bottom || 0)
    // #endif
    // #ifndef MP-WEIXIN
    safeBottom.value = safeAreaInsets ? safeAreaInsets.bottom : 0
    // #endif
  }
})


function handleClickModal() {
  emit('click-modal')
  if (actualCloseOnClick.value) {
    close()
  }
}

function close() {
  emit('close')
  emit('update:modelValue', false)
}

/**
 * 拦截 RebornTransition 的 after-leave 事件。
 * 在滑动关闭场景中，RebornTransition.onTransitionEnd 会先将 display.value=false
 * 标记为 dirty，再触发此回调。因此调用 nextTick 时，Vue 调度器的 currentFlushPromise
 * 已指向包含 display.value=false 变更的那次 flush，nextTick 回调会在该 flush
 * 完成（setData({display:none}) 已发往渲染层）之后才执行，
 * 确保重置 exiting/offsetY 的 setData 始终晚于 display:none 到达渲染层，消除闪现。
 */
function handleAfterLeave() {
  emit('after-leave')
  if (swipe.exiting) {
    nextTick(() => {
      swipe.exiting = false
      swipe.offsetY = 0
      internalDuration.value = null
    })
  }
}

function onTouchStart(e: any) {
  if (!isSwipeClose.value) return
  const touch = e.touches[0]
  swipe.isTouch = true
  swipe.releasing = false
  swipe.startY = touch.clientY
  swipe.lastY = touch.clientY
  swipe.lastTime = Date.now()
  swipe.velocityY = 0
  swipe.offsetY = 0
}

function onTouchMove(e: any) {
  if (!swipe.isTouch) return
  const touch = e.touches[0]
  const rawOffset = touch.clientY - swipe.startY

  // EMA 平滑速度：避免相邻帧距离过小导致速度值噪声大
  const now = Date.now()
  const dt = now - swipe.lastTime
  if (dt > 0) {
    const instant = (touch.clientY - swipe.lastY) / dt
    swipe.velocityY = VELOCITY_EMA_ALPHA * instant + (1 - VELOCITY_EMA_ALPHA) * swipe.velocityY
  }
  swipe.lastY = touch.clientY
  swipe.lastTime = now

  // 分段阻尼：前 80px 近乎 1:1 跟手，超出后阻力逐渐增加
  if (rawOffset <= 0) {
    swipe.offsetY = 0
  } else if (rawOffset <= 80) {
    swipe.offsetY = rawOffset * DRAG_DAMPING
  } else {
    swipe.offsetY = 80 * DRAG_DAMPING + (rawOffset - 80) * DRAG_DAMPING * 0.5
  }
}

function onTouchEnd() {
  if (!swipe.isTouch) return
  swipe.isTouch = false

  const isFlick = swipe.velocityY > FLICK_VELOCITY_THRESHOLD
  const isThresholdReached = swipe.offsetY > props.swipeCloseThreshold

  if (isFlick || isThresholdReached) {
    // 退场两步触发，兼容微信小程序的 JS/渲染双线程模型：
    //
    // 第一帧 setData：只切换到 exiting 状态，offsetY 保持当前拖拽位置
    //        → 渲染层记录此刻的 transform 为动画起点
    // 第二帧 setData（nextTick）：再将 offsetY 设为 1500 触发 CSS 过渡
    //        → 渲染层从拖拽位置平滑滑出到屏幕外
    swipe.exiting = true
    // offsetY 此时仍保持拖拽位置，待下一帧再设置目标值
    nextTick(() => {
      swipe.offsetY = 1500
      setTimeout(() => {
        // 弹窗已在屏幕外：以 duration=0 静默关闭，跳过 RebornTransition 离场动画。
        // 拖拽状态的重置由 handleAfterLeave 通过 nextTick 完成，
        // 确保 RebornTransition 的 display:none setData 先于 exiting=false 到达渲染层，
        // 彻底避免微信小程序双线程异步渲染导致的弹窗闪现。
        internalDuration.value = 0
        close()
      }, EXIT_DURATION + 30)
    })
  } else if (swipe.offsetY > 0) {
    // 有实际位移才触发回弹；纯点击（offsetY === 0）不处理，让 click 事件正常触发
    // 叠加松手惯性：按释放速度顺势多推一段距离，再由 spring 拉回，手感更连贯
    const inertia = Math.max(0, Math.min(swipe.velocityY * 60, 40))
    swipe.offsetY = swipe.offsetY + inertia
    swipe.releasing = true
    // 等下一帧渲染出惯性位置后，再将 offsetY 归零触发 spring 动画
    nextTick(() => {
      swipe.offsetY = 0
      setTimeout(() => { swipe.releasing = false }, 500)
    })
  }
}
</script>



<template>
  <reborn-root-portal v-if="actualRootPortal">
    <view class="rb-popup-wrapper">
      <reborn-overlay v-if="actualModal" :model-value="modelValue" :z-index="actualZIndex" :lock-scroll="lockScroll"
        :duration="duration" :custom-style="overlayDragStyle" @click="handleClickModal" />
      <reborn-transition :lazy-render="lazyRender" :custom-class="rootClass.base()" :custom-style="style"
        :duration="effectiveDuration" :show="modelValue" :name="transitionName" @before-enter="emit('before-enter')"
        @enter="emit('enter')" @after-enter="emit('after-enter')" @before-leave="emit('before-leave')"
        @leave="emit('leave')" @after-leave="handleAfterLeave" @touchstart="onTouchStart" @touchmove.stop.prevent="onTouchMove"
        @touchend="onTouchEnd" @touchcancel="onTouchEnd">
        <view :class="rootClass.inner()">
          <view v-if="isSwipeClose" :class="rootClass.draw()" />
          <view v-if="showHeader" :class="rootClass.header()">
            <slot name="header">
              <text :class="rootClass.title()">{{ title }}</text>
            </slot>
            <text v-if="showClose" :class="rootClass.closeIcon()" class="i-lucide-x" @click="close" />
          </view>
          <slot />
        </view>
      </reborn-transition>
    </view>
  </reborn-root-portal>

  
  <view v-else class="rb-popup-wrapper">
    <reborn-overlay v-if="actualModal" :model-value="modelValue" :z-index="actualZIndex" :lock-scroll="lockScroll"
      :duration="duration" :custom-style="overlayDragStyle" @click="handleClickModal" />
    <reborn-transition :lazy-render="lazyRender" :custom-class="rootClass.base()" :custom-style="style"
      :duration="effectiveDuration" :show="modelValue" :name="transitionName" @before-enter="emit('before-enter')"
      @enter="emit('enter')" @after-enter="emit('after-enter')" @before-leave="emit('before-leave')"
      @leave="emit('leave')" @after-leave="handleAfterLeave" @touchstart="onTouchStart" @touchmove.stop.prevent="onTouchMove"
      @touchend="onTouchEnd" @touchcancel="onTouchEnd">
      <view :class="rootClass.inner()">
        <view v-if="isSwipeClose" :class="rootClass.draw()" />
        <view v-if="showHeader" :class="rootClass.header()">
          <slot name="header">
            <text :class="rootClass.title()">{{ title }}</text>
          </slot>
          <text v-if="showClose" :class="rootClass.closeIcon()" class="i-lucide-x" @click="close" />
        </view>
        <slot />
      </view>
    </reborn-transition>
  </view>
</template>
