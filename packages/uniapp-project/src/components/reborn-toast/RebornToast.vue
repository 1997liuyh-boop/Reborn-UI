<script setup lang="ts">
import type { ToastDirection, ToastOptions } from './index'
import { computed, inject, ref, watch } from 'vue'
import RebornLoading from '@/components/reborn-loading/RebornLoading.vue'
import RebornOverlay from '@/components/reborn-overlay/RebornOverlay.vue'
import RebornTransition from '@/components/reborn-transition/RebornTransition.vue'
import base64 from '@/lib/base64'
import { tv } from '@/lib/tv'
import { addUnit, isDef, isFunction } from '@/lib/util'
import { cn } from '@/lib/utils'
import { getToastOptionKey, globalOptionRef, toastIcon } from './index'
import theme from './reborn-toast.config'

defineOptions({
  name: 'RebornToast',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
})

const props = withDefaults(defineProps<ToastProps>(), {
  selector: '',
  msg: '',
  direction: 'horizontal',
  iconName: '',
  loadingType: 'outline',
  loadingColor: '#4D80F0',
  position: 'middle-top',
  zIndex: 100,
  cover: false,
  iconClass: '',
  classPrefix: 'rb-icon',
  customClass: '',
  color: '',
  loadingSize: 40,
  iconSize: 40,
  ui: () => ({}),
})

interface ToastProps {
  selector?: string
  msg?: string
  direction?: ToastDirection
  iconName?: 'success' | 'error' | 'warning' | 'loading' | 'info' | ''
  iconSize?: number
  loadingType?: 'outline' | 'ring' | 'spinner'
  loadingColor?: string
  loadingSize?: number
  position?: 'top' | 'middle-top' | 'middle' | 'bottom'
  zIndex?: number
  cover?: boolean
  iconClass?: string
  classPrefix?: string
  color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral' | ''
  opened?: () => void
  closed?: () => void
  customClass?: string
  ui?: any
}

const show = ref(false)
const msg = ref('')
const iconName = ref<ToastProps['iconName']>('')
const svgStr = ref('')
const cover = ref(false)
const position = ref(props.position)
const zIndex = ref(props.zIndex)
const direction = ref(props.direction)
const loadingType = ref(props.loadingType)
const loadingColor = ref(props.loadingColor)
const loadingSize = ref<string | undefined>(undefined)
const iconSize = ref<string | undefined>(undefined)
const color = ref<ToastProps['color']>(props.color)
let opened: (() => void) | null = null
let closed: (() => void) | null = null

const b = tv(theme)
const transitionStyle = computed(() => `z-index:${zIndex.value};position:fixed;left:0;top:50%;width:100%;transform:translate(0,-50%);text-align:center;pointer-events:none;`)
const ui = computed(() => {
  const styles = b({
    position: position.value,
    direction: direction.value,
    withIcon: !!(iconName.value && (iconName.value !== 'loading' || msg.value)),
    color: color.value || 'default',
  })

  return {
    root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
    msg: (opts?: { class?: any }) => styles.msg({ class: cn(opts?.class, props.ui?.msg) }),
    icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, props.iconClass, props.ui?.icon) }),
  }
})

const svgStyle = computed(() => {
  const size = iconSize.value || '30rpx'
  return `background-image:url(${svgStr.value});width:${size};height:${size};`
})

const onAfterEnter = () => isFunction(opened) && opened()
const onAfterLeave = () => isFunction(closed) && closed()

function buildSvg() {
  if (!iconName.value || iconName.value === 'loading') {
    return
  }
  svgStr.value = `data:image/svg+xml;base64,${base64(toastIcon[iconName.value as keyof typeof toastIcon]())}`
}

function reset(option: ToastOptions) {
  show.value = !!option.show
  if (!show.value) {
    return
  }
  iconName.value = option.iconName ?? props.iconName
  msg.value = option.msg ?? props.msg
  position.value = option.position ?? props.position
  zIndex.value = option.zIndex ?? props.zIndex
  cover.value = option.cover ?? props.cover
  direction.value = option.direction ?? props.direction
  loadingType.value = option.loadingType ?? props.loadingType
  loadingColor.value = option.loadingColor ?? props.loadingColor
  color.value = option.color ?? props.color
  iconSize.value = isDef(option.iconSize)
    ? addUnit(option.iconSize)
    : isDef(props.iconSize)
      ? addUnit(props.iconSize)
      : undefined
  loadingSize.value = isDef(option.loadingSize)
    ? addUnit(option.loadingSize)
    : isDef(props.loadingSize)
      ? addUnit(props.loadingSize)
      : undefined
  closed = option.closed ?? props.closed ?? null
  opened = option.opened ?? props.opened ?? null
}

const key = getToastOptionKey(props.selector)
const toastOption = inject(key, globalOptionRef)
watch(() => toastOption.value, val => reset(val), { immediate: true, deep: true })
watch(() => iconName.value, buildSvg, { immediate: true })
</script>

<template>
  <RebornOverlay
    v-if="cover" :show="show" :z-index="zIndex" lock-scroll
    custom-style="background-color:transparent;pointer-events:auto;"
  />
  <RebornTransition
    name="fade" :show="show" :custom-style="transitionStyle" @after-enter="onAfterEnter"
    @after-leave="onAfterLeave"
  >
    <view :class="ui.root()">
      <RebornLoading
        v-if="iconName === 'loading'" :type="loadingType" :color="loadingColor as any" :size="loadingSize"
        :custom-class="direction === 'vertical' ? 'mb-2' : 'mr-2'"
      />
      <view
        v-else-if="iconName" :class="ui.icon({ class: direction === 'vertical' ? 'mb-2 mx-auto' : 'mr-2' })"
        :style="svgStyle"
      />
      <view v-if="msg" :class="ui.msg()">
        {{ msg }}
      </view>
    </view>
  </RebornTransition>
</template>
