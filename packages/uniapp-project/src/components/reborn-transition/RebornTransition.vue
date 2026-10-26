<script lang="ts">
export default {
    name: 'reborn-transition',
    options: {
        addGlobalClass: true,
        virtualHost: true,
        styleIsolation: 'shared'
    }
}
</script>

<script lang="ts" setup>
import { computed, onBeforeUnmount, shallowRef, watch } from 'vue'
import { isObj, isPromise } from '../../lib/util'
import { AbortablePromise } from '../../lib/AbortablePromise'
import { transitionStyles } from './reborn-transition.config'

export type TransitionName =
    | 'fade'
    | 'fade-down'
    | 'fade-left'
    | 'fade-right'
    | 'fade-up'
    | 'slide-down'
    | 'slide-left'
    | 'slide-right'
    | 'slide-up'
    | 'zoom-in'
    | 'zoom-out'
    | 'badge-custom'

export interface TransitionProps {
    customClass?: string
    customStyle?: string
    show?: boolean
    duration?: Record<string, number> | number | boolean
    lazyRender?: boolean
    name?: TransitionName | TransitionName[]
    destroy?: boolean
    enterClass?: string
    enterActiveClass?: string
    enterToClass?: string
    leaveClass?: string
    leaveActiveClass?: string
    leaveToClass?: string
    disableTouchMove?: boolean
}
const props = withDefaults(defineProps<TransitionProps>(), {
    customClass: '', customStyle: '', show: false, duration: 300, lazyRender: false,
    name: 'fade', destroy: true, enterClass: '', enterActiveClass: '', enterToClass: '',
    leaveClass: '', leaveActiveClass: '', leaveToClass: '', disableTouchMove: false,
})
const emit = defineEmits<{
    click: []
    'before-enter': []
    enter: []
    'before-leave': []
    leave: []
    'after-leave': []
    'after-enter': []
}>()

const inited = shallowRef<boolean>(false)
const display = shallowRef<boolean>(false)
const status = shallowRef<string>('')
const transitionEnded = shallowRef<boolean>(false)
const currentDuration = shallowRef<number>(300)
const classes = shallowRef<string>('')
const enterPromise = shallowRef<AbortablePromise<void> | null>(null)
const enterLifeCyclePromises = shallowRef<AbortablePromise<unknown> | null>(null)
const leaveLifeCyclePromises = shallowRef<AbortablePromise<unknown> | null>(null)

const getClassNames = (name?: TransitionName | TransitionName[]) => {
    let enter: string = `${props.enterClass} ${props.enterActiveClass}`
    let enterTo: string = `${props.enterToClass} ${props.enterActiveClass}`
    let leave: string = `${props.leaveClass} ${props.leaveActiveClass}`
    let leaveTo: string = `${props.leaveToClass} ${props.leaveActiveClass}`

    const addClass = (n: string) => {
        const config = transitionStyles[n]
        if (config) {
            enter = `rb-transition-${n}-enter ${config.enter} rb-transition-${n}-enter-active ${config['enter-active']} ${enter}`
            enterTo = `rb-transition-${n}-enter-to ${config['enter-to']} rb-transition-${n}-enter-active ${config['enter-active']} ${enterTo}`
            leave = `rb-transition-${n}-leave ${config.leave} rb-transition-${n}-leave-active ${config['leave-active']} ${leave}`
            leaveTo = `rb-transition-${n}-leave-to ${config['leave-to']} rb-transition-${n}-leave-active ${config['leave-active']} ${leaveTo}`
        } else {
            enter = `rb-${n}-enter rb-${n}-enter-active ${enter}`
            enterTo = `rb-${n}-enter-to rb-${n}-enter-active ${enterTo}`
            leave = `rb-${n}-leave rb-${n}-leave-active ${leave}`
            leaveTo = `rb-${n}-leave-to rb-${n}-leave-active ${leaveTo}`
        }
    }

    if (Array.isArray(name)) {
        name.forEach(n => addClass(n))
    } else if (name) {
        addClass(name as string)
    }

    return { enter, 'enter-to': enterTo, leave, 'leave-to': leaveTo }
}

const style = computed(() => {
    return `-webkit-transition-duration:${currentDuration.value}ms;transition-duration:${currentDuration.value}ms;${display.value || !props.destroy ? '' : 'display: none;'
        }${props.customStyle}`
})

const rootClass = computed(() => `rb-transition ease-in-out ${props.customClass} ${classes.value}`)

const isShow = computed(() => !props.lazyRender || inited.value)

let disposed = false
const timers = new Set<ReturnType<typeof setTimeout>>()
watch(() => props.show, (newVal, previous) => {
    if (newVal || previous !== undefined) handleShow(newVal)
}, { immediate: true })
onBeforeUnmount(() => {
    disposed = true
    handleAbortPromise()
    timers.forEach(clearTimeout)
    timers.clear()
})
function handleClick() { emit('click') }
function handleShow(value: boolean) {
    if (value) { handleAbortPromise(); enter() } else leave()
}
function handleAbortPromise() {
    enterPromise.value?.catch(() => {})
    isPromise(enterPromise.value) && enterPromise.value.abort()
    isPromise(enterLifeCyclePromises.value) && enterLifeCyclePromises.value.abort()
    isPromise(leaveLifeCyclePromises.value) && leaveLifeCyclePromises.value.abort()
    enterPromise.value = null
    enterLifeCyclePromises.value = null
    leaveLifeCyclePromises.value = null
}
function enter() {
    enterPromise.value = new AbortablePromise(async (resolve) => {
        try {
            const classNames = getClassNames(props.name)
            const duration = isObj(props.duration) ? (props.duration as any).enter : props.duration
            status.value = 'enter'
            emit('before-enter')
            enterLifeCyclePromises.value = setPromise(1000 / 30)
            await enterLifeCyclePromises.value
            emit('enter')
            classes.value = classNames.enter
            currentDuration.value = typeof duration === 'number' ? duration : 0
            enterLifeCyclePromises.value = setPromise(1000 / 30)
            await enterLifeCyclePromises.value
            inited.value = true
            display.value = true
            enterLifeCyclePromises.value = setPromise(1000 / 30)
            await enterLifeCyclePromises.value
            enterLifeCyclePromises.value = null
            transitionEnded.value = false
            classes.value = classNames['enter-to']
            resolve()
        } catch (error) { }
    })
}
async function leave() {
    if (!enterPromise.value) {
        transitionEnded.value = false
        return onTransitionEnd()
    }
    try {
        await enterPromise.value
        if (!display.value) return
        const classNames = getClassNames(props.name)
        const duration = isObj(props.duration) ? (props.duration as any).leave : props.duration
        status.value = 'leave'
        emit('before-leave')
        currentDuration.value = typeof duration === 'number' ? duration : 0
        leaveLifeCyclePromises.value = setPromise(1000 / 30)
        await leaveLifeCyclePromises.value
        emit('leave')
        classes.value = classNames.leave
        leaveLifeCyclePromises.value = setPromise(1000 / 30)
        await leaveLifeCyclePromises.value
        transitionEnded.value = false
        classes.value = classNames['leave-to']
        leaveLifeCyclePromises.value = setPromise(currentDuration.value)
        await leaveLifeCyclePromises.value
        leaveLifeCyclePromises.value = null
        onTransitionEnd()
        enterPromise.value = null
    } catch (error) { }
}
function setPromise(duration: number) {
    return new AbortablePromise<void>((resolve) => {
        const timer = setTimeout(() => { timers.delete(timer); resolve() }, duration)
        timers.add(timer)
    })
}
function onTransitionEnd() {
    if (disposed) return
    if (transitionEnded.value) return
    transitionEnded.value = true
    // 先将 display 置为 false，再触发 after-leave 事件。
    // 这样外部监听 after-leave 时，display.value=false 已被标记 dirty，
    // Vue 调度器会在下一个 nextTick（flush）前先把 setData({display:none})
    // 发往渲染层，确保渲染层隐藏元素的时序早于任何重置逻辑。
    if (!props.show && display.value) display.value = false
    if (status.value === 'leave') {
        emit('after-leave')
    } else if (status.value === 'enter') { emit('after-enter') }
}
function noop() { }
</script>

<template>
    <view :class="rootClass" :style="style" @transitionend="onTransitionEnd" @click="handleClick"
        @touchmove.stop.prevent="noop" v-if="isShow && disableTouchMove">
        <slot />
    </view>
    <view :class="rootClass" :style="style" @transitionend="onTransitionEnd" @click="handleClick"
        v-else-if="isShow && !disableTouchMove">
        <slot />
    </view>
</template>

<style lang="scss" scoped>
:deep(.rb-transition-fade-enter-active) {
    transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
    will-change: opacity;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
}

:deep(.rb-transition-fade-leave-active) {
    transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
    will-change: opacity;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
}

:deep(.rb-transition-zoom-in-enter-active),
:deep(.rb-transition-zoom-in-leave-active),
:deep(.rb-transition-zoom-out-enter-active),
:deep(.rb-transition-zoom-out-leave-active) {
    transform-origin: center;
    will-change: transform, opacity;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
}

:deep(.rb-transition-zoom-in-enter-active),
:deep(.rb-transition-zoom-out-enter-active) {
    transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
}

:deep(.rb-transition-zoom-in-leave-active),
:deep(.rb-transition-zoom-out-leave-active) {
    transition-timing-function: cubic-bezier(0.4, 0, 1, 1);
}
</style>
