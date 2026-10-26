

<script lang="ts" setup>
import type { PopoverContentProps, PopoverExpose, PopoverProps } from './types'
import { computed, getCurrentInstance, inject, nextTick, onBeforeMount, onBeforeUnmount, onMounted, shallowRef, watch } from 'vue'
import { useBooleanModel } from '@/composables/useBooleanModel'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import { usePopover } from './composables/usePopover'
import { closeOther, pushToQueue, removeFromQueue } from './composables/clickoutside'
import { queueKey } from './composables/useQueue'
import theme from './reborn-popover.config'

import RebornTransition from '@/components/reborn-transition/RebornTransition.vue'

defineOptions({
    name: 'RebornPopover',
    options: { virtualHost: true, addGlobalClass: true, styleIsolation: 'shared' }
})

const props = withDefaults(defineProps<PopoverProps>(), {
  content: () => ({ side: 'bottom', align: 'center', sideOffset: 0 }),
  arrow: true, portal: false, dismissible: true, defaultOpen: false,
  modal: false, openDelay: 0, closeDelay: 0, customClass: '', ui: () => ({}),
  disabled: false, title: '', displayMode: 'normal',
})
const emit = defineEmits<{
  menuclick: [payload: { item: Record<string, any>; index: number }]
  change: [payload: { show: boolean }]
  open: []
  close: []
}>()
defineModel<boolean>('open', { default: undefined })
const showPopover = useBooleanModel('open', props.defaultOpen)


const positioned = shallowRef(false)
const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
    const styles = b({})
    return {
        base: (opts?: { class?: any }) => styles.base({ class: cn(opts?.class, uiOverrides.value.base) }),
        target: (opts?: { class?: any }) => styles.target({ class: cn(opts?.class, uiOverrides.value.target) }),
        pos: (opts?: { class?: any }) => styles.pos({ class: cn(opts?.class, uiOverrides.value.pos) }),
        hidden: (opts?: { class?: any }) => styles.hidden({ class: cn(opts?.class, uiOverrides.value.hidden) }),
        container: (opts?: { class?: any }) => styles.container({ class: cn(opts?.class, uiOverrides.value.container) }),
        inner: (opts?: { class?: any }) => styles.inner({ class: cn(opts?.class, uiOverrides.value.inner) }),
        arrow: (opts?: { class?: any }) => styles.arrow({ class: cn(opts?.class, uiOverrides.value.arrow) }),
        closeIcon: (opts?: { class?: any }) => styles.closeIcon({ class: cn(opts?.class, uiOverrides.value.closeIcon) }),
        menu: (opts?: { class?: any }) => styles.menu({ class: cn(opts?.class, uiOverrides.value.menu) }),
        menuInner: (opts?: { class?: any }) => styles.menuInner({ class: cn(opts?.class, uiOverrides.value.menuInner) })
    }
})

const queue = inject(queueKey, null)
const { proxy } = getCurrentInstance() as any
const popover = usePopover()


/** 解析后的方位：placement 优先，未传时回落到旧的 content 对象，都没有则在下方居中 */
const placementParts = computed<Required<Pick<PopoverContentProps, 'side' | 'align'>>>(() => {
    if (props.placement) {
        const [placementSide, placementAlign] = props.placement.split('-')
        return {
            side: placementSide === 'top' || placementSide === 'right' || placementSide === 'left' ? placementSide : 'bottom',
            align: placementAlign === 'start' || placementAlign === 'end' ? placementAlign : 'center'
        }
    }
    return { side: props.content?.side || 'bottom', align: props.content?.align || 'center' }
})
const side = computed(() => placementParts.value.side)
const align = computed(() => placementParts.value.align)
const sideOffset = computed(() => props.sideOffset ?? props.content?.sideOffset ?? 0)

watch(
    () => props.title,
    (newVal) => {
        const mode = props.displayMode
        if (mode === 'normal' && typeof newVal !== 'string') {
            console.error('The title type must be a string type in normal mode')
        } else if (mode === 'menu' && !isArray(newVal)) {
            console.error('The title type must be an Array type in menu mode')
        }
    }
)

let mounted = false
let positioningVersion = 0
watch([showPopover, side, align, sideOffset, () => props.arrow], async ([visible], previous, onCleanup) => {
    positioned.value = false
    if (!mounted) return
    const version = ++positioningVersion
    let stale = false
    onCleanup(() => { stale = true })
    if (visible) {
        if (queue) queue.closeOther(proxy)
        else closeOther(proxy)
    }
    // 显隐事件与测量结果无关，在 await 之前同步派发：测量期间若被新一轮（快速开关、方位变化）打断，
    // 旧一轮会因过期直接返回，事件放在 await 之后就会连同这次 open / change(true) 一起丢掉
    if (!previous || visible !== previous[0]) {
        emit('change', { show: visible })
        if (visible) emit('open')
        else emit('close')
    }
    if (!visible) return
    await nextTick()
    await popover.init(side.value, align.value, props.arrow)
    if (stale || version !== positioningVersion) return
    popover.control(side.value, align.value, sideOffset.value, props.arrow)
    positioned.value = true
}, { flush: 'post' })

function isArray(value: any): value is Array<any> {
    if (typeof Array.isArray === 'function') {
        return Array.isArray(value)
    }
    return Object.prototype.toString.call(value) === '[object Array]'
}

onMounted(() => {
    mounted = true
    if (showPopover.value) {
        const version = ++positioningVersion
        popover.init(side.value, align.value, props.arrow).then(() => {
            if (!mounted || version !== positioningVersion) return
            popover.control(side.value, align.value, sideOffset.value, props.arrow)
            positioned.value = true
        })
    }
})

onBeforeMount(() => {
    if (queue && queue.pushToQueue) {
        queue.pushToQueue(proxy)
    } else {
        pushToQueue(proxy)
    }
})

onBeforeUnmount(() => {
    mounted = false
    positioningVersion++
    if (queue && queue.removeFromQueue) {
        queue.removeFromQueue(proxy)
    } else {
        removeFromQueue(proxy)
    }
})

function menuClick(index: number) {
    updateModelValue(false)
    if (isArray(props.title)) {
        emit('menuclick', {
            item: props.title[index],
            index
        })
    }
}

function toggle() {
    if (props.disabled) return
    updateModelValue(!showPopover.value)
}

function open() {
    updateModelValue(true)
}

function close() {
    if (!showPopover.value) return
    updateModelValue(false)
}

function updateModelValue(value: boolean) {
    showPopover.value = value
}

defineExpose<PopoverExpose>({
    open, // 手动打开 Popover
    close // 手动关闭 Popover
})
</script>

<template>
    <view :class="[ui.base({ class: customClass })]" id="popover" @click.stop="popover.noop">
        <RebornTransition :custom-class="ui.pos()" :custom-style="popover.popStyle.value" :show="showPopover && positioned"
            name="fade" :duration="200">
            <view :class="ui.container()">
                <view v-if="props.arrow" :class="[ui.arrow(), theme.variants.arrowSide[popover.arrowSide.value]]"
                    :style="popover.arrowStyle.value" />

                <!-- 普通模式 -->
                <view v-if="!$slots.content && displayMode === 'normal'" :class="ui.inner()">
                    {{ title }}
                </view>

                <!-- 列表模式 -->
                <view v-if="!$slots.content && displayMode === 'menu'" :class="ui.menu()">
                    <view v-for="(item, index) in title" :key="index" :class="ui.menuInner()" @click="menuClick(index)">
                        <view style="display: inline-block">{{ typeof item === 'object' && (item.content || item.title)
                            ? (item.content || item.title) : '' }}</view>
                    </view>
                </view>

                <!-- 用户自定义样式 -->
                <view v-if="$slots.content">
                    <slot name="content" />
                </view>
            </view>

        </RebornTransition>

        <!-- 点击透明遮罩关闭气泡。 -->
        <view v-if="showPopover && dismissible" class="fixed inset-0 z-490 bg-transparent" @click.stop="close"
            @touchmove.stop.prevent="() => { }"></view>

        <view @click.stop="toggle" :class="ui.target()" id="target">
            <slot />
        </view>
    </view>
</template>
