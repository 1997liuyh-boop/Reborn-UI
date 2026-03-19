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
import { computed, onBeforeMount, ref, reactive, type PropType } from 'vue'
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
  zIndex: 10,
  overlayZIndex: 10,
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
})

const isSwipeClose = computed(() => actualPosition.value === 'bottom' && props.swipeClose)

const style = computed(() => {
  let transform = ''
  if (swipe.isTouch && swipe.offsetY > 0) {
    transform = `transform: translateY(${swipe.offsetY}px);`
  }
  return `z-index:${actualZIndex.value}; padding-top: ${safeTop.value}px; padding-bottom: ${safeBottom.value}px; ${transform} ${props.customStyle}`
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

function onTouchStart(e: any) {
  if (isSwipeClose.value) {
    swipe.isTouch = true
    swipe.startY = e.touches[0].clientY
  }
}

function onTouchMove(e: any) {
  if (swipe.isTouch) {
    const offsetY = e.touches[0].clientY - swipe.startY
    if (offsetY > 0) {
      swipe.offsetY = offsetY
    }
  }
}

function onTouchEnd() {
  if (swipe.isTouch) {
    swipe.isTouch = false
    if (swipe.offsetY > props.swipeCloseThreshold) {
      close()
    }
    swipe.offsetY = 0
  }
}
</script>

<template>
  <reborn-root-portal v-if="actualRootPortal">
    <view class="rb-popup-wrapper">
      <reborn-overlay v-if="actualModal" :model-value="modelValue" :z-index="actualZIndex" :lock-scroll="lockScroll"
        :duration="duration" :custom-style="modalStyle" @click="handleClickModal" />
      <reborn-transition :lazy-render="lazyRender" :custom-class="rootClass.base()" :custom-style="style"
        :duration="duration" :show="modelValue" :name="transitionName" @before-enter="emit('before-enter')"
        @enter="emit('enter')" @after-enter="emit('after-enter')" @before-leave="emit('before-leave')"
        @leave="emit('leave')" @after-leave="emit('after-leave')" @touchstart="onTouchStart" @touchmove="onTouchMove"
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
      :duration="duration" :custom-style="modalStyle" @click="handleClickModal" />
    <reborn-transition :lazy-render="lazyRender" :custom-class="rootClass.base()" :custom-style="style"
      :duration="duration" :show="modelValue" :name="transitionName" @before-enter="emit('before-enter')"
      @enter="emit('enter')" @after-enter="emit('after-enter')" @before-leave="emit('before-leave')"
      @leave="emit('leave')" @after-leave="emit('after-leave')" @touchstart="onTouchStart" @touchmove="onTouchMove"
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
