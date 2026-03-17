<script lang="ts">
export default {
  name: 'reborn-popup-new',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared'
  }
}
</script>

<script lang="ts" setup>
import { computed, onBeforeMount, ref, type PropType } from 'vue'
import RebornOverlay from '../reborn-overlay/RebornOverlay.vue'
import RebornTransition from '../reborn-transition/RebornTransition.vue'
import type { TransitionName } from '../reborn-transition/RebornTransition.vue'
import { tv } from '@/lib/tv'
import theme from './reborn-popup-new.config'

type PopupPosition = 'center' | 'top' | 'right' | 'bottom' | 'left'

interface PopupProps {
  customClass?: string
  customStyle?: string
  modelValue?: boolean
  position?: PopupPosition
  transition?: TransitionName
  closeOnClickModal?: boolean
  duration?: number | boolean
  modal?: boolean
  zIndex?: number
  modalStyle?: string
  safeAreaInsetBottom?: boolean
  safeAreaInsetTop?: boolean
  lazyRender?: boolean
  lockScroll?: boolean
}

const props = withDefaults(defineProps<PopupProps>(), {
  customClass: '',
  customStyle: '',
  modelValue: false,
  position: 'center',
  closeOnClickModal: true,
  duration: 300,
  modal: true,
  zIndex: 10,
  modalStyle: '',
  safeAreaInsetBottom: true,
  safeAreaInsetTop: true,
  lazyRender: true,
  lockScroll: true,
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

const transitionName = computed<TransitionName | TransitionName[]>(() => {
  if (props.transition) return props.transition
  if (props.position === 'center') return ['zoom-in', 'fade']
  if (props.position === 'left') return 'slide-left'
  if (props.position === 'right') return 'slide-right'
  if (props.position === 'bottom') return 'slide-up'
  if (props.position === 'top') return 'slide-down'
  return 'slide-up'
})

const safeTop = ref<number>(0)
const safeBottom = ref<number>(0)

const style = computed(() => {
  return `z-index:${props.zIndex}; margin-top: ${safeTop.value}px; margin-bottom: ${safeBottom.value}px;${props.customStyle}`
})

const b = tv(theme)
const rootClass = computed(() => {
  return b({ position: props.position, class: props.customClass })
})

onBeforeMount(() => {
  const { safeArea, screenHeight, safeAreaInsets } = uni.getSystemInfoSync()
  console.log(props.safeAreaInsetTop, safeArea)
  if (props.safeAreaInsetTop && safeArea) {
    // #ifdef MP-WEIXIN
    safeTop.value = safeArea.top || 44
    // #endif
    // #ifndef MP-WEIXIN
    safeTop.value = safeAreaInsets?.top || 44
    // #endif
  }

  if (props.safeAreaInsetBottom && safeArea) {
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
  if (props.closeOnClickModal) {
    close()
  }
}

function close() {
  emit('close')
  emit('update:modelValue', false)
}
</script>

<template>
  <view class="rb-popup-wrapper">
    <reborn-overlay v-if="modal" :model-value="modelValue" :z-index="zIndex" :lock-scroll="lockScroll"
      :duration="duration" :custom-style="modalStyle" @click="handleClickModal" />
    <reborn-transition :lazy-render="lazyRender" :custom-class="rootClass.base()" :custom-style="style"
      :duration="duration" :show="modelValue" :name="transitionName" @before-enter="emit('before-enter')"
      @enter="emit('enter')" @after-enter="emit('after-enter')" @before-leave="emit('before-leave')"
      @leave="emit('leave')" @after-leave="emit('after-leave')">
      <slot />
    </reborn-transition>
  </view>
</template>
