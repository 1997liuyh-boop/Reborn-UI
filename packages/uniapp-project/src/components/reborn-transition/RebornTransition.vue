<script lang="ts">
export default {
  name: 'reborn-transition',
  options: {
    virtualHost: true,
    addGlobalClass: true,
    styleIsolation: 'shared',
  },
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { AbortablePromise } from '@/lib/reborn-common/AbortablePromise'
import { isObj, isPromise, pause } from '@/lib/reborn-common/util'
import { transitionTheme } from './reborn-transition.config'

interface TransitionDuration { enter: number, leave: number }
type TransitionName = 'fade' | 'slide-up' | 'zoom-in'
interface TransitionProps {
  show?: boolean
  duration?: number | boolean | TransitionDuration
  name?: TransitionName
  destroy?: boolean
  lazyRender?: boolean
  customClass?: string
  customStyle?: string
  enterClass?: string
  enterActiveClass?: string
  enterToClass?: string
  leaveClass?: string
  leaveActiveClass?: string
  leaveToClass?: string
  disableTouchMove?: boolean
}

const props = withDefaults(defineProps<TransitionProps>(), {
  show: false,
  duration: 300,
  destroy: true,
  lazyRender: false,
  name: 'fade',
  customClass: '',
  customStyle: '',
  enterClass: '',
  enterActiveClass: '',
  enterToClass: '',
  leaveClass: '',
  leaveActiveClass: '',
  leaveToClass: '',
  disableTouchMove: false,
})
const emit = defineEmits(['click', 'before-enter', 'enter', 'before-leave', 'leave', 'after-leave', 'after-enter'])
const inited = ref(false)
const display = ref(false)
const classes = ref('')
const currentDuration = ref(300)
const enterPromise = ref<AbortablePromise<void> | null>(null)

const rootClass = computed(() => `${transitionTheme.base} ${props.customClass} ${classes.value}`)
const style = computed(() => `transition-duration:${currentDuration.value}ms;${display.value || !props.destroy ? '' : 'display:none;'}${props.customStyle}`)
const isShow = computed(() => !props.lazyRender || inited.value)

watch(() => props.show, handleShow, { immediate: true })

function animation(type: 'enter' | 'leave') {
  const preset = transitionTheme.animations[props.name]
  const base = type === 'enter'
    ? `${preset.enter} ${preset.enterActive}`
    : `${preset.leave} ${preset.leaveActive}`
  const to = type === 'enter'
    ? `${preset.enterTo} ${preset.enterActive}`
    : `${preset.leaveTo} ${preset.leaveActive}`
  return { base, to }
}
function transitionDuration(type: 'enter' | 'leave') {
  return isObj(props.duration) ? Number((props.duration as TransitionDuration)[type]) : Number(props.duration)
}
function handleShow(value: boolean) {
  if (value) enter()
  else leave()
}
function enter() {
  isPromise(enterPromise.value) && enterPromise.value.abort()
  enterPromise.value = new AbortablePromise(async (resolve) => {
    emit('before-enter')
    const cls = animation('enter')
    currentDuration.value = transitionDuration('enter')
    classes.value = `${cls.base} ${props.enterClass} ${props.enterActiveClass}`
    await pause()
    inited.value = true
    display.value = true
    emit('enter')
    await pause()
    classes.value = `${cls.to} ${props.enterToClass} ${props.enterActiveClass}`
    resolve()
  })
}
async function leave() {
  if (!enterPromise.value) return
  await enterPromise.value
  if (!display.value) return
  emit('before-leave')
  const cls = animation('leave')
  currentDuration.value = transitionDuration('leave')
  classes.value = `${cls.base} ${props.leaveClass} ${props.leaveActiveClass}`
  await pause()
  emit('leave')
  classes.value = `${cls.to} ${props.leaveToClass} ${props.leaveActiveClass}`
}
function onTransitionEnd() {
  if (props.show) emit('after-enter')
  else {
    display.value = false
    emit('after-leave')
  }
}
</script>

<template>
  <view v-if="isShow" :class="rootClass" :style="style" @transitionend="onTransitionEnd" @click="emit('click')" @touchmove.stop.prevent="() => {}">
    <slot />
  </view>
</template>
