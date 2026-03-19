<script lang="ts" setup>
import { computed, getCurrentInstance, onMounted, reactive, ref, watch, CSSProperties } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import { getSystemInfo, isH5 } from '@/lib/device'
import theme, { fabColors, fabPositions, fabDirections } from './reborn-fab.config'

/**
 * RebornFab 悬浮按钮组件
 * 提供固定位置的操作按钮，支持拖拽、展开菜单。
 */

type FabPosition = typeof fabPositions[number]
type FabDirection = typeof fabDirections[number]
type FabColor = typeof fabColors[number]

interface Props {
    /** 绑定值，控制展开状态 */
    modelValue?: boolean
    /** 是否默认展开 */
    active?: boolean
    /** 预设位置 */
    position?: FabPosition
    /** 展开方向 */
    direction?: FabDirection
    /** 主题颜色 */
    color?: FabColor
    /** 是否禁用 */
    disabled?: boolean
    /** 是否可拖拽 */
    draggable?: boolean
    /** 是否可展开 */
    expandable?: boolean
    /** 距离边缘的间距 */
    gap?: { top?: number; left?: number; right?: number; bottom?: number }
    /** 非激活状态图标 */
    inactiveIcon?: string
    /** 激活状态图标 */
    activeIcon?: string
    /** 层级 */
    zIndex?: number
    /** 自定义样式 */
    customStyle?: string
    /** 自定义类名 */
    customClass?: string
    /** UI 配置 */
    ui?: any
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    active: false,
    position: 'right-bottom',
    direction: 'top',
    color: 'primary',
    disabled: false,
    draggable: false,
    expandable: false,
    gap: () => ({ top: 32, left: 32, right: 32, bottom: 32 }),
    inactiveIcon: 'i-lucide-plus',
    activeIcon: 'i-lucide-plus',
    zIndex: 99,
    ui: () => ({})
})

const emit = defineEmits(['update:modelValue', 'click'])

const { proxy } = getCurrentInstance() as any
const isActive = defineModel<boolean>({ default: false })

// 监听 active 属性初始化状态
watch(() => props.active, (val) => {
    isActive.value = val
}, { immediate: true })

import { provide } from 'vue'
provide('reborn-fab-active', isActive)

const inited = ref(false)
const top = ref(0)
const left = ref(0)
const fabSize = reactive({ width: 56, height: 56 })
const screen = reactive({ width: 0, height: 0 })
const attractTransition = ref(false)

// 边界限制
const bounding = reactive({
    minTop: 0,
    minLeft: 0,
    maxTop: 0,
    maxLeft: 0
})

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})
const uiClasses = computed(() => {
    const styles = b({
        color: props.color,
        active: isActive.value
    })
    return {
        root: (opts?: any) => styles.root({ class: cn(opts?.class, uiOverrides.value.root, props.customClass) }),
        trigger: (opts?: any) => styles.trigger({ class: cn(opts?.class, uiOverrides.value.trigger) }),
        icon: (opts?: any) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
        actions: (opts?: any) => styles.actions({ class: cn(opts?.class, uiOverrides.value.actions) }),
        action: (opts?: any) => styles.action({ class: cn(opts?.class, uiOverrides.value.action) })
    }
})

// 获取位置边界
async function updateBounding() {
    const sysInfo = getSystemInfo()
    screen.width = sysInfo.windowWidth
    screen.height = isH5() ? sysInfo.windowHeight : sysInfo.windowHeight

    const query = uni.createSelectorQuery().in(proxy)
    query.select('#trigger').boundingClientRect()
    query.exec((res) => {
        if (res && res[0]) {
            fabSize.width = res[0].width || 56
            fabSize.height = res[0].height || 56
        }

        const { top = 32, left: gLeft = 32, right = 32, bottom = 32 } = props.gap
        bounding.minTop = top
        bounding.minLeft = gLeft
        bounding.maxLeft = screen.width - fabSize.width - right
        bounding.maxTop = screen.height - fabSize.height - bottom

        if (!inited.value) {
            initPosition()
            inited.value = true
        }
    })
}

// 初始化位置
function initPosition() {
    const { minLeft, minTop, maxLeft, maxTop } = bounding
    const centerX = (minLeft + maxLeft) / 2
    const centerY = (minTop + maxTop) / 2

    switch (props.position) {
        case 'left-top':
            left.value = minLeft
            top.value = minTop
            break
        case 'right-top':
            left.value = maxLeft
            top.value = minTop
            break
        case 'left-bottom':
            left.value = minLeft
            top.value = maxTop
            break
        case 'right-bottom':
            left.value = maxLeft
            top.value = maxTop
            break
        case 'left-center':
            left.value = minLeft
            top.value = centerY
            break
        case 'right-center':
            left.value = maxLeft
            top.value = centerY
            break
        case 'top-center':
            left.value = centerX
            top.value = minTop
            break
        case 'bottom-center':
            left.value = centerX
            top.value = maxTop
            break
    }
}

// 拖拽逻辑
const touchOffset = reactive({ x: 0, y: 0 })

function handleTouchStart(e: TouchEvent) {
    if (!props.draggable || props.disabled) return
    const touch = e.touches[0]
    touchOffset.x = touch.clientX - left.value
    touchOffset.y = touch.clientY - top.value
    attractTransition.value = false
}

function handleTouchMove(e: TouchEvent) {
    if (!props.draggable || props.disabled) return
    const touch = e.touches[0]
    let x = touch.clientX - touchOffset.x
    let y = touch.clientY - touchOffset.y

    // 边界约束
    x = Math.max(bounding.minLeft, Math.min(x, bounding.maxLeft))
    y = Math.max(bounding.minTop, Math.min(y, bounding.maxTop))

    left.value = x
    top.value = y
}

// 内部映射方向以便拖拽调整
const fabDirection = ref(props.direction)

// 监听方向变化，自动关闭菜单
watch(() => props.direction, (val) => {
    fabDirection.value = val
    isActive.value = false
})

function handleTouchEnd() {
    if (!props.draggable || props.disabled) return

    // 自动吸附逻辑
    attractTransition.value = true
    const centerX = screen.width / 2
    const fabX = left.value + fabSize.width / 2

    if (fabX < centerX) {
        left.value = bounding.minLeft
        fabDirection.value = 'right'
    } else {
        left.value = bounding.maxLeft
        fabDirection.value = 'left'
    }
}

function handleClick() {
    if (props.disabled) return
    if (props.expandable) {
        isActive.value = !isActive.value
    } else {
        emit('click')
    }
}

const rootStyle = computed(() => {
    const style: CSSProperties = {
        top: `${top.value}px`,
        left: `${left.value}px`,
        zIndex: props.zIndex,
        transition: attractTransition.value ? 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)' : 'none'
    }
    return style
})

// 动作面板偏移样式
const actionsStyle = computed(() => {
    const offset = 80 // 展开间距
    switch (fabDirection.value) {
        case 'top': return { bottom: `${offset}px`, flexDirection: 'column-reverse', left: '50%', transform: 'translateX(-50%)' }
        case 'bottom': return { top: `${offset}px`, flexDirection: 'column', left: '50%', transform: 'translateX(-50%)' }
        case 'left': return { right: `${offset}px`, flexDirection: 'row-reverse', top: '50%', transform: 'translateY(-50%)' }
        case 'right': return { left: `${offset}px`, flexDirection: 'row', top: '50%', transform: 'translateY(-50%)' }
        default: return {}
    }
})

onMounted(() => {
    updateBounding()
})

defineExpose({
    open: () => (isActive.value = true),
    close: () => (isActive.value = false)
})
</script>

<template>
    <view :class="uiClasses.root()" :style="[rootStyle as any, customStyle]" @touchmove.stop.prevent="handleTouchMove"
        @touchstart="handleTouchStart" @touchend="handleTouchEnd">
        <!-- 动作按钮组 -->
        <view v-if="expandable"
            :class="[uiClasses.actions(), isActive ? 'opacity-100' : 'opacity-0 pointer-events-none']"
            :style="[actionsStyle as any]">
            <slot />
        </view>

        <!-- 主触发按钮 -->
        <view id="trigger" @tap.stop="handleClick">
            <slot name="trigger">
                <view :class="uiClasses.trigger()">
                    <view :class="[isActive ? activeIcon : inactiveIcon, uiClasses.icon()]" />
                </view>
            </slot>
        </view>
    </view>
</template>

<style scoped>
/* 这里处理展开动画的微操 */
.reborn-fab-active .reborn-fab-action {
    transform: scale(1);
}
</style>
