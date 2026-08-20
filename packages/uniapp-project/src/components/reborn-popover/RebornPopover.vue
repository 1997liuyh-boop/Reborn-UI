<template>
    <view :class="[ui.base({ class: customClass })]" id="popover" @click.stop="popover.noop">
        <!-- 使用插槽时无法获取正确宽高 -->
        <view :class="cn(ui.pos(), ui.hidden())" id="pos">
            <view :class="ui.container()">
                <view v-if="!useContentSlot && displayMode === 'normal'" :class="ui.inner()">
                    {{ title }}
                </view>
                <view v-if="!useContentSlot && displayMode === 'menu' && typeof title === 'object'" :class="ui.menu()">
                    <view v-for="(item, index) in title" :key="index" :class="ui.menuInner()" @click="menuClick(index)">
                        <text>{{ item.content || item.title }}</text>
                    </view>
                </view>
            </view>
        </view>

        <RebornTransition :custom-class="ui.pos()" :custom-style="popover.popStyle.value" :show="showPopover"
            name="fade" :duration="200">
            <view :class="ui.container()">
                <view v-if="props.arrow" :class="[ui.arrow(), theme.variants.arrowSide[popover.arrowSide.value]]"
                    :style="popover.arrowStyle.value" />

                <!-- 普通模式 -->
                <view v-if="!useContentSlot && displayMode === 'normal'" :class="ui.inner()">
                    {{ title }}
                </view>

                <!-- 列表模式 -->
                <view v-if="!useContentSlot && displayMode === 'menu'" :class="ui.menu()">
                    <view v-for="(item, index) in title" :key="index" :class="ui.menuInner()" @click="menuClick(index)">
                        <view style="display: inline-block">{{ typeof item === 'object' && (item.content || item.title)
                            ? (item.content || item.title) : '' }}</view>
                    </view>
                </view>

                <!-- 用户自定义样式 -->
                <view v-if="useContentSlot">
                    <slot name="content" />
                </view>
            </view>

        </RebornTransition>

        <!-- Click-away mask to handle closing -->
        <view v-if="showPopover && dismissible" class="fixed inset-0 z-490 bg-transparent" @click.stop="close"
            @touchmove.stop.prevent="() => { }"></view>

        <view @click.stop="toggle" :class="ui.target()" id="target">
            <slot />
        </view>
    </view>
</template>

<script lang="ts">
export default {
    name: 'RebornPopover',
    options: {
        virtualHost: true,
        addGlobalClass: true,
        styleIsolation: 'shared'
    }
}
</script>

<script lang="ts" setup>
import { computed, getCurrentInstance, inject, onBeforeMount, onBeforeUnmount, onMounted, ref, watch, useSlots } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import { popoverProps, type PopoverExpose } from './types'
import { usePopover } from './composables/usePopover'
import { closeOther, pushToQueue, removeFromQueue } from './composables/clickoutside'
import { type Queue, queueKey } from './composables/useQueue'
import theme from './reborn-popover.config'

import RebornTransition from '@/components/reborn-transition/RebornTransition.vue'

const props = defineProps(popoverProps)
const emit = defineEmits([
    'update:modelValue', // 显隐状态变化时触发，参数为最新的显示状态（v-model 同步）
    'update:open', // 显隐状态变化时触发，参数为最新的 open 值（对应 v-model:open）
    'menuclick', // menu 模式下点击菜单项时触发，参数为 { item, index }
    'change', // 显隐状态切换时触发，参数为 { show: boolean }
    'open', // 气泡打开时触发
    'close' // 气泡关闭时触发
])
const slots = useSlots()
const useContentSlot = computed(() => !!slots.content)

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

const queue = inject<Queue | null>(queueKey, null)
const { proxy } = getCurrentInstance() as any
const popover = usePopover()

const showPopover = ref<boolean>(props.open || props.defaultOpen)

const side = computed(() => props.content?.side || 'bottom')
const align = computed(() => props.content?.align || 'center')
const sideOffset = computed(() => props.content?.sideOffset || 0)

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

watch([side, align, () => props.arrow], () => {
    popover.init(side.value, align.value, props.arrow)
})

watch(
    () => props.open,
    (newValue) => {
        showPopover.value = newValue
    }
)

watch(
    () => showPopover.value,
    (newValue) => {
        if (newValue) {
            popover.control(side.value, align.value, sideOffset.value, props.arrow)
            if (queue && queue.closeOther) {
                queue.closeOther(proxy)
            } else {
                closeOther(proxy)
            }
        }
        popover.showStyle.value = newValue ? 'display: inline-block;' : 'display: none;'
        emit('change', { show: newValue })
        emit(newValue ? 'open' : 'close')
    }
)

function isArray(value: any): value is Array<any> {
    if (typeof Array.isArray === 'function') {
        return Array.isArray(value)
    }
    return Object.prototype.toString.call(value) === '[object Array]'
}

onMounted(() => {
    popover.init(side.value, align.value, props.arrow)
})

onBeforeMount(() => {
    if (queue && queue.pushToQueue) {
        queue.pushToQueue(proxy)
    } else {
        pushToQueue(proxy)
    }
    popover.showStyle.value = showPopover.value ? 'opacity: 1;' : 'opacity: 0;'
})

onBeforeUnmount(() => {
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
    updateModelValue(false)
}

function updateModelValue(value: boolean) {
    showPopover.value = value
    emit('update:modelValue', value)
    emit('update:open', value)
}

defineExpose<PopoverExpose>({
    open, // 手动打开 Popover
    close // 手动关闭 Popover
})
</script>
