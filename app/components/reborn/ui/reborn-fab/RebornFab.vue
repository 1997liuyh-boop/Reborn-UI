<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme, { fabColors, fabDirections, fabPositions, fabTriggers } from './reborn-fab.config'

type FabPosition = typeof fabPositions[number]
type FabDirection = typeof fabDirections[number]
type FabColor = typeof fabColors[number]
type FabTrigger = typeof fabTriggers[number]

interface UiMap {
    root: string
    trigger: string
    icon: string
    actions: string
}

interface Props {
    modelValue?: boolean
    active?: boolean
    position?: FabPosition
    top?: string | number
    bottom?: string | number
    left?: string | number
    right?: string | number
    trigger?: FabTrigger
    direction?: FabDirection
    color?: FabColor
    disabled?: boolean
    draggable?: boolean
    expandable?: boolean
    gap?: { top?: number; left?: number; right?: number; bottom?: number }
    inactiveIcon?: string
    activeIcon?: string
    zIndex?: number
    customStyle?: CSSProperties
    customClass?: string
    ui?: UiMap
}

const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    active: false,
    position: 'right-bottom',
    trigger: 'click',
    direction: 'top',
    color: 'primary',
    disabled: false,
    draggable: false,
    expandable: false,
    gap: () => ({ top: 32, left: 32, right: 32, bottom: 32 }),
    inactiveIcon: 'lucide:plus',
    activeIcon: 'lucide:plus',
    zIndex: 99,
    ui: () => ({
        root: '',
        trigger: '',
        icon: '',
        actions: ''
    })
})

const emit = defineEmits(['update:modelValue', 'click'])

const isActive = ref(props.modelValue || props.active)

watch(() => props.modelValue, (val) => {
    isActive.value = val
})

watch(isActive, (val) => {
    emit('update:modelValue', val)
})

import { provide } from 'vue'
provide('reborn-fab-active', isActive)

const inited = ref(false)
const topPos = ref<string | number>(0)
const leftPos = ref<string | number>(0)
const fabSize = reactive({ width: 56, height: 56 })
const screen = reactive({ width: 0, height: 0 })
const attractTransition = ref(false)

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
    }
})

const triggerRef = ref<HTMLElement | null>(null)

function updateBounding() {
    screen.width = window.innerWidth
    screen.height = window.innerHeight

    if (triggerRef.value) {
        const rect = triggerRef.value.getBoundingClientRect()
        fabSize.width = rect.width || 56
        fabSize.height = rect.height || 56
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
}

function initPosition() {
    const { minLeft, minTop, maxLeft, maxTop } = bounding

    switch (props.position) {
        case 'left-top':
            leftPos.value = minLeft
            topPos.value = minTop
            break
        case 'right-top':
            leftPos.value = maxLeft
            topPos.value = minTop
            break
        case 'left-bottom':
            leftPos.value = minLeft
            topPos.value = maxTop
            break
        case 'right-bottom':
            leftPos.value = maxLeft
            topPos.value = maxTop
            break
    }
}

const isDragging = ref(false)
const dragOffset = reactive({ x: 0, y: 0 })

function handlePointerDown(e: PointerEvent) {
    if (!props.draggable || props.disabled) return
    e.preventDefault()

    isDragging.value = true
    attractTransition.value = false
    const currentLeft = typeof leftPos.value === 'number' ? leftPos.value : parseFloat(String(leftPos.value))
    const currentTop = typeof topPos.value === 'number' ? topPos.value : parseFloat(String(topPos.value))

    dragOffset.x = e.clientX - currentLeft
    dragOffset.y = e.clientY - currentTop

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
}

function handlePointerMove(e: PointerEvent) {
    if (!isDragging.value || !props.draggable || props.disabled) return
    let x = e.clientX - dragOffset.x
    let y = e.clientY - dragOffset.y

    x = Math.max(bounding.minLeft, Math.min(x, bounding.maxLeft))
    y = Math.max(bounding.minTop, Math.min(y, bounding.maxTop))

    leftPos.value = x
    topPos.value = y
}

const fabDirection = ref(props.direction)

watch(() => props.direction, (val) => {
    fabDirection.value = val
    isActive.value = false
})

watch(() => props.position, () => {
    if (!props.draggable) {
        initPosition()
    }
})

function handlePointerUp() {
    if (!isDragging.value || !props.draggable || props.disabled) return
    isDragging.value = false

    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    window.removeEventListener('pointercancel', handlePointerUp)

    attractTransition.value = true
    const centerX = screen.width / 2
    const currentLeft = typeof leftPos.value === 'number' ? leftPos.value : parseFloat(String(leftPos.value))
    const fabX = currentLeft + fabSize.width / 2

    if (fabX < centerX) {
        leftPos.value = bounding.minLeft
        fabDirection.value = 'right'
    } else {
        leftPos.value = bounding.maxLeft
        fabDirection.value = 'left'
    }
}

function handleClick() {
    if (props.disabled || props.trigger === 'hover') return
    if (props.expandable) {
        isActive.value = !isActive.value
    } else {
        emit('click')
    }
}

function handleMouseEnter() {
    if (props.disabled || props.trigger !== 'hover') return
    isActive.value = true
}

function handleMouseLeave() {
    if (props.disabled || props.trigger !== 'hover') return
    isActive.value = false
}

const rootStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
        zIndex: props.zIndex,
        transition: attractTransition.value ? 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)' : 'none',
        ...props.customStyle
    }

    if (props.top !== undefined) style.top = typeof props.top === 'number' ? `${props.top}px` : props.top
    else if (props.bottom !== undefined) style.bottom = typeof props.bottom === 'number' ? `${props.bottom}px` : props.bottom
    else style.top = typeof topPos.value === 'number' ? `${topPos.value}px` : topPos.value

    if (props.left !== undefined) style.left = typeof props.left === 'number' ? `${props.left}px` : props.left
    else if (props.right !== undefined) style.right = typeof props.right === 'number' ? `${props.right}px` : props.right
    else style.left = typeof leftPos.value === 'number' ? `${leftPos.value}px` : leftPos.value

    return style
})

const actionsStyle = computed<CSSProperties>(() => {
    const isVisible = isActive.value
    const offset = isVisible ? 'calc(100% + 12px)' : '0px'
    const opacity = isVisible ? 1 : 0
    const scale = isVisible ? 1 : 0.3

    const base: CSSProperties = {
        opacity,
        transformOrigin: 'center center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }

    switch (fabDirection.value) {
        case 'top':
            return {
                ...base,
                bottom: offset,
                left: '50%',
                transform: `translateX(-50%) scale(${scale})`,
                flexDirection: 'column-reverse'
            }
        case 'bottom':
            return {
                ...base,
                top: offset,
                left: '50%',
                transform: `translateX(-50%) scale(${scale})`,
                flexDirection: 'column'
            }
        case 'left':
            return {
                ...base,
                right: offset,
                top: '50%',
                transform: `translateY(-50%) scale(${scale})`,
                flexDirection: 'row-reverse'
            }
        case 'right':
            return {
                ...base,
                left: offset,
                top: '50%',
                transform: `translateY(-50%) scale(${scale})`,
                flexDirection: 'row'
            }
        default: return {}
    }
})

onMounted(() => {
    updateBounding()
    window.addEventListener('resize', updateBounding)
})

onUnmounted(() => {
    window.removeEventListener('resize', updateBounding)
    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    window.removeEventListener('pointercancel', handlePointerUp)
})

defineExpose({
    open: () => (isActive.value = true),
    close: () => (isActive.value = false)
})
</script>

<template>
    <div :class="uiClasses.root()" :style="rootStyle" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
        <div v-show="expandable" :class="uiClasses.actions()" :style="actionsStyle">
            <slot :isActive="isActive" />
        </div>

        <div ref="triggerRef" @click.stop="handleClick" @pointerdown="handlePointerDown">
            <slot name="trigger">
                <div :class="uiClasses.trigger()">
                    <Icon :name="isActive ? activeIcon : inactiveIcon" :class="uiClasses.icon()" />
                </div>
            </slot>
        </div>
    </div>
</template>

<style scoped>
.reborn-fab-active .reborn-fab-action {
    transform: scale(1);
}
</style>
