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
  /** 自定义根元素类名 */
  customClass?: string
  /** 自定义根元素样式 */
  customStyle?: string
  /** 是否显示弹出层 (v-model) */
  modelValue?: boolean
  /** 弹出位置：top, bottom, left, right, center */
  position?: PopupPosition
  /** 自定义过渡动画名称 */
  transition?: TransitionName
  /** 是否可以通过点击遮罩层关闭 */
  closeOnClickModal?: boolean
  /** 是否可以通过点击遮罩层关闭 (别名) */
  maskClosable?: boolean
  /** 动画时长 (单位ms)，设为 false 则禁用动画 */
  duration?: number | boolean
  /** 是否需要遮罩层 */
  modal?: boolean
  /** 是否需要遮罩层 (别名) */
  showMask?: boolean
  /** 弹出层的层级 z-index */
  zIndex?: number
  /** 弹出层的层级 z-index (别名) */
  overlayZIndex?: number
  /** 遮罩层的自定义样式 */
  modalStyle?: string
  /** 是否开启底部安全区域适配 */
  safeAreaInsetBottom?: boolean
  /** 是否开启顶部安全区域适配 */
  safeAreaInsetTop?: boolean
  /** 是否在显示时才渲染内容 */
  lazyRender?: boolean
  /** 是否在出现时将 body 滚动锁定 */
  lockScroll?: boolean
  /** 弹出层的标题 */
  title?: string
  /** 是否显示头部（包含标题和关闭按钮） */
  showHeader?: boolean
  /** 是否显示关闭按钮 */
  showClose?: boolean;
  /** 弹出层的大小 (宽度或高度) */
  size?: number | string;
  /** 是否开启手势滑动关闭 (仅限底部位置) */
  swipeClose?: boolean;
  /** 手势滑动关闭的触发阈值（手指竖直位移 px，不与阻尼位移混用） */
  swipeCloseThreshold?: number
  /** 自定义 UI 配置 */
  ui?: any
  /** 是否使用 reborn-root-portal (别名) */
  rootPortal?: boolean
  /** 是否使用 reborn-root-portal */
  enablePortal?: boolean
  /** 主题色 (影响手势滑块等) */
  color?: PopupColor
  /** 是否显示圆角样式 */
  round?: boolean
}

const props = withDefaults(defineProps<PopupProps>(), {
  customClass: '',
  customStyle: '',
  modelValue: false,
  position: 'bottom',
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
  size: '30%',
  swipeClose: true,
  swipeCloseThreshold: 120,
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
  'close',
  'open',
  'opened',
  'closed'
])

const actualPosition = computed(() => props.position)
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
  /** 当前手势下手指相对 touchstart 向下的位移（不受阻尼缩放），用于关闭阈值判定 */
  rawOffsetY: 0,
  lastY: 0,
  lastTime: 0,
  velocityY: 0,   // 瞬时速度 px/ms，用于检测 flick 手势
  releasing: false,
  exiting: false, // 触发关闭后的退场滑出阶段，保持 transform 避免闪现
})

let releaseTimer: ReturnType<typeof setTimeout> | null = null

function clearReleaseTimer() {
  if (releaseTimer) {
    clearTimeout(releaseTimer)
    releaseTimer = null
  }
}

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

/** 超过关闭阈值后的橡皮筋阻尼（0~1，越小阻力越大） */
const DRAG_OVERFLOW_DAMPING = 0.55
/** flick 轻扫关闭的速度阈值（px/ms） */
const FLICK_VELOCITY_THRESHOLD = 1
/** EMA 速度平滑系数：越小越平滑，越大越灵敏 */
const VELOCITY_EMA_ALPHA = 0.25

/**
 * 松手回弹：不用 y>1 的「过冲」贝塞尔，否则 translateY 会短暂 <0，底部与遮罩之间出现缝隙。
 */
const RELEASE_EASING = 'cubic-bezier(0.25, 0.82, 0.25, 1)'

/** 退场滑出动画时长（ms），需与 onTouchEnd 里的 setTimeout 保持一致 */
const EXIT_DURATION = 220

const isHorizontal = computed(() => actualPosition.value === 'left' || actualPosition.value === 'right')
const targetSize = computed(() => (typeof props.size === 'number' ? `${props.size}px` : props.size))
const sizeStyle = computed(() => {
  if (actualPosition.value === 'center' || isHorizontal.value) {
    return `width: ${targetSize.value};`
  }
  return `height: ${targetSize.value};`
})

const style = computed(() => {
  const base = `z-index:${actualZIndex.value}; padding-top: ${safeTop.value}px; padding-bottom: ${safeBottom.value}px;`
  if (swipe.exiting) {
    // 退场：ease-in 加速滑出屏幕，offsetY 会被设为超大值驱动此动画
    return `${base} transition: transform ${EXIT_DURATION}ms ease-in; transform: translateY(${swipe.offsetY}px); ${props.customStyle}`
  }
  if (swipe.isTouch) {
    // 真机触摸需即时跟手；CSS transition 滞后易触发 touchcancel（鼠标无此事件，故电脑正常）
    return `${base} transition: none; transform: translateY(${swipe.offsetY}px); ${props.customStyle}`
  }
  if (swipe.releasing) {
    // 回弹：由 JS 将 offsetY 归零，曲线需严格无过冲，否则会露出遮罩缝隙
    return `${base} transition: transform 0.45s ${RELEASE_EASING}; transform: translateY(${swipe.offsetY}px); ${props.customStyle}`
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


/**
 * 点击遮罩层回调
 */
function handleClickModal() {
  emit('click-modal')
  if (actualCloseOnClick.value) {
    close()
  }
}

/**
 * 手动关闭弹窗
 */
function close() {
  emit('close')
  emit('update:modelValue', false)
}

/**
 * 动画进入前处理
 */
function onBeforeEnter() {
  emit('before-enter')
  emit('open')
}

/**
 * 动画进入中处理
 */
function onEnter() {
  emit('enter')
}

/**
 * 动画进入后处理
 */
function onAfterEnter() {
  emit('after-enter')
  emit('opened')
}

/**
 * 动画离开前处理
 */
function onBeforeLeave() {
  emit('before-leave')
}

/**
 * 动画离开中处理
 */
function onLeave() {
  emit('leave')
}

/**
 * 处理动画离开后的清理逻辑
 */
function onAfterLeave() {
  emit('after-leave')
  emit('closed')
  if (swipe.exiting) {
    nextTick(() => {
      swipe.exiting = false
      swipe.offsetY = 0
      internalDuration.value = null
    })
  }
}

/**
 * 触摸开始处理 (手势滑动关闭)
 */
function onTouchStart(e: any) {
  if (!isSwipeClose.value) return
  if (swipe.exiting) return
  if (swipe.isTouch) {
    if (Date.now() - swipe.lastTime > 80) {
      finishDrag()
    }
    return
  }
  clearReleaseTimer()
  const touch = e.touches[0]
  swipe.isTouch = true
  swipe.releasing = false
  swipe.startY = touch.clientY
  swipe.lastY = touch.clientY
  swipe.lastTime = Date.now()
  swipe.velocityY = 0
  swipe.offsetY = 0
  swipe.rawOffsetY = 0
}

/**
 * 触摸移动处理 (手势滑动关闭)
 */
function onTouchMove(e: any) {
  if (!swipe.isTouch) return
  clearReleaseTimer()
  swipe.releasing = false
  // 由这里按需阻止默认滚动，避免在模板层全局 .prevent 误伤微信小程序 picker-view 等可滚动内容
  if (typeof e?.preventDefault === 'function' && e.cancelable) {
    e.preventDefault()
  }
  const touch = e.touches[0]
  const rawOffset = touch.clientY - swipe.startY
  swipe.rawOffsetY = Math.max(0, rawOffset)

  // EMA 平滑速度：避免相邻帧距离过小导致速度值噪声大
  const now = Date.now()
  const dt = now - swipe.lastTime
  if (dt > 0) {
    const instant = (touch.clientY - swipe.lastY) / dt
    swipe.velocityY = VELOCITY_EMA_ALPHA * instant + (1 - VELOCITY_EMA_ALPHA) * swipe.velocityY
  }
  swipe.lastY = touch.clientY
  swipe.lastTime = now

  // 阈值内 1:1 跟手；超出阈值后施加橡皮筋阻尼，避免拉得过远
  const threshold = props.swipeCloseThreshold
  if (rawOffset <= 0) {
    swipe.offsetY = 0
  } else if (rawOffset <= threshold) {
    swipe.offsetY = rawOffset
  } else {
    swipe.offsetY = threshold + (rawOffset - threshold) * DRAG_OVERFLOW_DAMPING
  }
}

/**
 * 结束拖拽：仅手指真正抬起时判定关闭或回弹
 */
function finishDrag() {
  if (!swipe.isTouch) return
  swipe.isTouch = false

  const isFlick = swipe.velocityY > FLICK_VELOCITY_THRESHOLD
  // 必须与手指真实位移比较：offsetY 经分段阻尼后会远小于同向手指距离，旧逻辑导致需下拉极长才可关闭
  const isThresholdReached = swipe.rawOffsetY >= props.swipeCloseThreshold

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
    // 叠加松手惯性（仅向下）：幅度略小，避免与回弹衔接时位移过大、放大过冲观感
    const inertia = Math.max(0, Math.min(swipe.velocityY * 50, 24))
    swipe.offsetY = swipe.offsetY + inertia
    swipe.releasing = true
    // 等下一帧渲染出惯性位置后，再将 offsetY 归零触发 spring 动画
    nextTick(() => {
      swipe.offsetY = 0
      clearReleaseTimer()
      releaseTimer = setTimeout(() => {
        swipe.releasing = false
        releaseTimer = null
      }, 500)
    })
  }
}

function onTouchEnd(e: any) {
  if (e?.touches?.length > 0) return
  finishDrag()
}

/** 真机专属事件：误触发时不能当作松手，否则手指还在屏幕上弹窗就回弹 */
function onTouchCancel() {
  // intentionally noop
}

defineExpose({
  handleClose: close
});
</script>



<template>
  <!-- 渲染到根节点门户 (Root Portal) -->
  <!-- 解决小程序中原生组件层级过高（如 map, video）、或被父级 overflow:hidden 截断的问题 -->
  <reborn-root-portal v-if="actualRootPortal">
    <view class="rb-popup-wrapper">
      <reborn-overlay v-if="actualModal" :model-value="modelValue" :z-index="actualZIndex" :lock-scroll="lockScroll"
        :duration="duration" :custom-style="overlayDragStyle" @click="handleClickModal" />
      <reborn-transition :lazy-render="lazyRender" :custom-class="rootClass.base()" :custom-style="style"
        :duration="effectiveDuration" :show="modelValue" :name="transitionName" @before-enter="onBeforeEnter"
        @enter="onEnter" @after-enter="onAfterEnter" @before-leave="onBeforeLeave" @leave="onLeave"
        @after-leave="onAfterLeave">
        <view :class="rootClass.inner()">
          <view
            v-if="isSwipeClose"
            class="rb-popup-drag-zone"
            @touchstart="onTouchStart"
            @touchmove.stop="onTouchMove"
            @touchend="onTouchEnd"
            @touchcancel="onTouchCancel"
          >
            <view class="flex w-full justify-center py-2">
              <view :class="rootClass.draw()" />
            </view>
            <view v-if="showHeader" :class="rootClass.header()">
              <slot name="header">
                <text :class="rootClass.title()">{{ title }}</text>
              </slot>
              <text v-if="showClose" :class="rootClass.closeIcon()" class="i-lucide-x" @click.stop="close" />
            </view>
          </view>
          <view v-else-if="showHeader" :class="rootClass.header()">
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


  <!-- 当禁用 portal 功能或在某些不支持 portal 的渲染引擎下，保持在 DOM 流的当前位置渲染 -->
  <view v-else class="rb-popup-wrapper">
    <reborn-overlay v-if="actualModal" :model-value="modelValue" :z-index="actualZIndex" :lock-scroll="lockScroll"
      :duration="duration" :custom-style="overlayDragStyle" @click="handleClickModal" />
    <reborn-transition :lazy-render="lazyRender" :custom-class="rootClass.base()" :custom-style="style"
      :duration="effectiveDuration" :show="modelValue" :name="transitionName" @before-enter="onBeforeEnter"
      @enter="onEnter" @after-enter="onAfterEnter" @before-leave="onBeforeLeave" @leave="onLeave"
      @after-leave="onAfterLeave">
      <view :class="rootClass.inner()">
        <view
          v-if="isSwipeClose"
          class="rb-popup-drag-zone"
          @touchstart="onTouchStart"
          @touchmove.stop="onTouchMove"
          @touchend="onTouchEnd"
          @touchcancel="onTouchCancel"
        >
          <view class="flex w-full justify-center py-2">
            <view :class="rootClass.draw()" />
          </view>
          <view v-if="showHeader" :class="rootClass.header()">
            <slot name="header">
              <text :class="rootClass.title()">{{ title }}</text>
            </slot>
            <text v-if="showClose" :class="rootClass.closeIcon()" class="i-lucide-x" @click.stop="close" />
          </view>
        </view>
        <view v-else-if="showHeader" :class="rootClass.header()">
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

<style lang="scss">
/* 避免弹层手势与浏览器下拉刷新 / overscroll 串联 */
/* #ifdef H5 */
.rb-popup-wrapper {
  overscroll-behavior: none;
}
/* #endif */

/* 真机触摸：禁止浏览器接管纵向滑动手势 */
.rb-popup-drag-zone {
  touch-action: none;
}
</style>

