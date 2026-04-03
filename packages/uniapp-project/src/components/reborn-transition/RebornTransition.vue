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
import { computed, onBeforeMount, ref, watch, type PropType } from 'vue'
import { isObj, isPromise, pause } from '../../lib/util'
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

const props = defineProps({
    customClass: { type: String, default: '' },
    customStyle: { type: String, default: '' },
    show: { type: Boolean, default: false },
    duration: { type: [Object, Number, Boolean] as PropType<Record<string, number> | number | boolean>, default: 300 },
    lazyRender: { type: Boolean, default: false },
    name: { type: [String, Array] as PropType<TransitionName | TransitionName[]>, default: 'fade' },
    destroy: { type: Boolean, default: true },
    enterClass: { type: String, default: '' },
    enterActiveClass: { type: String, default: '' },
    enterToClass: { type: String, default: '' },
    leaveClass: { type: String, default: '' },
    leaveActiveClass: { type: String, default: '' },
    leaveToClass: { type: String, default: '' },
    disableTouchMove: { type: Boolean, default: false }
})

const emit = defineEmits(['click', 'before-enter', 'enter', 'before-leave', 'leave', 'after-leave', 'after-enter'])

const inited = ref<boolean>(false)
const display = ref<boolean>(false)
const status = ref<string>('')
const transitionEnded = ref<boolean>(false)
const currentDuration = ref<number>(300)
const classes = ref<string>('')
const enterPromise = ref<AbortablePromise<void> | null>(null)
const enterLifeCyclePromises = ref<AbortablePromise<unknown> | null>(null)
const leaveLifeCyclePromises = ref<AbortablePromise<unknown> | null>(null)

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

onBeforeMount(() => { if (props.show) enter() })
watch(() => props.show, (newVal) => handleShow(newVal), { deep: true })
function handleClick() { emit('click') }
function handleShow(value: boolean) {
    if (value) { handleAbortPromise(); enter() } else leave()
}
function handleAbortPromise() {
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
            enterLifeCyclePromises.value = pause()
            await enterLifeCyclePromises.value
            emit('enter')
            classes.value = classNames.enter
            currentDuration.value = duration
            enterLifeCyclePromises.value = pause()
            await enterLifeCyclePromises.value
            inited.value = true
            display.value = true
            enterLifeCyclePromises.value = pause()
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
        currentDuration.value = duration
        leaveLifeCyclePromises.value = pause()
        await leaveLifeCyclePromises.value
        emit('leave')
        classes.value = classNames.leave
        leaveLifeCyclePromises.value = pause()
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
        const timer = setTimeout(() => { clearTimeout(timer); resolve() }, duration)
    })
}
function onTransitionEnd() {
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
