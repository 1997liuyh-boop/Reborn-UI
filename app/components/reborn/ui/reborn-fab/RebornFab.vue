<script lang="ts" setup>
import { computed, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import type { CSSProperties } from 'vue'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme, { fabColors, fabDirections, fabPositions, fabTriggers } from './reborn-fab.config'

// 类型定义
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

/**
 * 悬浮按钮属性定义
 */
interface Props {
    modelValue?: boolean        // 是否展开（v-model）
    active?: boolean            // 是否激活
    position?: FabPosition      // 固定位置
    top?: string | number       // 自定义顶部距离
    bottom?: string | number    // 自定义底部距离
    left?: string | number      // 自定义左侧距离
    right?: string | number     // 自定义右侧距离
    trigger?: FabTrigger        // 触发方式 (click | hover)
    direction?: FabDirection    // 展开方向
    color?: FabColor            // 按钮颜色
    disabled?: boolean          // 是否禁用
    draggable?: boolean         // 是否可拖拽
    attract?: boolean           // 是否开启自动吸边
    expandable?: boolean        // 是否可展开
    gap?: { top?: number; left?: number; right?: number; bottom?: number } // 拖拽的安全间距
    inactiveIcon?: string       // 未展开时的图标
    activeIcon?: string         // 展开时的图标
    zIndex?: number             // 层级
    customStyle?: CSSProperties // 自定义根元素样式
    customClass?: string        // 自定义根元素类名
    ui?: UiMap                  // 自定义各部分样式类
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
    attract: true,
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

// 响应式状态：是否展开
const isActive = ref(props.modelValue || props.active)

// 监听外界 modelValue 变化
watch(() => props.modelValue, (val) => {
    isActive.value = val
})

// 向外界同步状态变化
watch(isActive, (val) => {
    emit('update:modelValue', val)
})

import { provide } from 'vue'
// 提供给子组件（FabAction）的状态
provide('reborn-fab-active', isActive)

// 拖拽相关内部状态
const inited = ref(false)              // 是否已初始化位置
const topPos = ref<string | number>(0)  // 实时顶部像素
const leftPos = ref<string | number>(0) // 实时左侧像素
const fabSize = reactive({ width: 56, height: 56 }) // 按钮尺寸
const screen = reactive({ width: 0, height: 0 })     // 屏幕尺寸
const attractTransition = ref(false)    // 是否处于吸边动画中

/**
 * 拖拽边界限制
 */
const bounding = reactive({
    minTop: 0,   // 最小顶部距离 (gap.top)
    minLeft: 0,  // 最小左侧距离 (gap.left)
    maxTop: 0,   // 最大顶部距离 (视口高度 - 按钮高度 - gap.bottom)
    maxLeft: 0   // 最大左侧距离 (视口宽度 - 按钮宽度 - gap.right)
})

const b = tv(theme)
const uiOverrides = computed(() => props.ui || {})

// 样式类生成
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

/**
 * 更新屏幕和按钮尺寸，并重新计算可拖拽的边界范围
 */
function updateBounding() {
    screen.width = window.innerWidth
    screen.height = window.innerHeight

    if (triggerRef.value) {
        const rect = triggerRef.value.getBoundingClientRect()
        fabSize.width = rect.width || 56
        fabSize.height = rect.height || 56
    }

    const { top = 32, left: gLeft = 32, right = 32, bottom = 32 } = props.gap

    // 计算边界约束条件
    bounding.minTop = top // 顶部坐标不得小于 gap.top
    bounding.minLeft = gLeft // 左侧坐标不得小于 gap.left

    // 屏幕宽度 - 自身宽度 - 右边距 = 允许的最大左侧偏移量
    bounding.maxLeft = screen.width - fabSize.width - right

    // 屏幕高度 - 自身高度 - 下边距 = 允许的最大顶部偏移量
    bounding.maxTop = screen.height - fabSize.height - bottom

    if (!inited.value) {
        initPosition()
        inited.value = true
    }
}

/**
 * 根据 position 预设或显式坐标初始化按钮位置
 */
function initPosition() {
    const { minLeft, minTop, maxLeft, maxTop } = bounding

    // --- 1. 计算初始 Top ---
    if (props.top !== undefined) {
        topPos.value = typeof props.top === 'number' ? props.top : parseFloat(String(props.top))
    } else if (props.bottom !== undefined) {
        const bVal = typeof props.bottom === 'number' ? props.bottom : parseFloat(String(props.bottom))
        topPos.value = screen.height - fabSize.height - bVal
    } else {
        // 使用预设位置的 Y 轴
        topPos.value = props.position.includes('top') ? minTop : maxTop
    }

    // --- 2. 计算初始 Left ---
    if (props.left !== undefined) {
        leftPos.value = typeof props.left === 'number' ? props.left : parseFloat(String(props.left))
    } else if (props.right !== undefined) {
        const rVal = typeof props.right === 'number' ? props.right : parseFloat(String(props.right))
        leftPos.value = screen.width - fabSize.width - rVal
    } else {
        // 使用预设位置的 X 轴
        leftPos.value = props.position.includes('left') ? minLeft : maxLeft
    }
}

// 拖拽控制逻辑
const isDragging = ref(false)
const hasMoved = ref(false)
const dragOffset = reactive({ x: 0, y: 0 })
const startPointerPos = reactive({ x: 0, y: 0 })

/**
 * 指针按下：初始化拖拽状态
 */
function handlePointerDown(e: PointerEvent) {
    if (!props.draggable || props.disabled) return

    isDragging.value = true
    hasMoved.value = false
    attractTransition.value = false

    const currentLeft = typeof leftPos.value === 'number' ? leftPos.value : parseFloat(String(leftPos.value))
    const currentTop = typeof topPos.value === 'number' ? topPos.value : parseFloat(String(topPos.value))

    // 记录点击位置相对于按钮左上角的偏移
    dragOffset.x = e.clientX - currentLeft
    dragOffset.y = e.clientY - currentTop
    startPointerPos.x = e.clientX
    startPointerPos.y = e.clientY

    // 注册全局事件
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
}

/**
 * 指针移动：更新按钮位置并在越界时应用限制
 */
function handlePointerMove(e: PointerEvent) {
    if (!isDragging.value || !props.draggable || props.disabled) return

    const moveX = Math.abs(e.clientX - startPointerPos.x)
    const moveY = Math.abs(e.clientY - startPointerPos.y)

    // 只有当位移超过 5px 时，才认为发生了拖拽，此时应关闭展开态以防干扰
    if (!hasMoved.value && (moveX > 5 || moveY > 5)) {
        hasMoved.value = true
        isActive.value = false
    }

    if (!hasMoved.value) return

    let x = e.clientX - dragOffset.x
    let y = e.clientY - dragOffset.y

    // 边界限制
    x = Math.max(bounding.minLeft, Math.min(x, bounding.maxLeft))
    y = Math.max(bounding.minTop, Math.min(y, bounding.maxTop))

    leftPos.value = x
    topPos.value = y
}

const fabDirection = ref(props.direction)

// 响应方向 prop 变化
watch(() => props.direction, (val) => {
    fabDirection.value = val
    isActive.value = false
})

// 响应位置 prop 变化（在不可拖拽时生效）
watch(() => props.position, () => {
    if (!props.draggable) {
        initPosition()
    }
})

/**
 * 指针抬起：重置状态并执行吸边动画
 */
function handlePointerUp() {
    if (!isDragging.value || !props.draggable || props.disabled) return
    isDragging.value = false

    window.removeEventListener('pointermove', handlePointerMove)
    window.removeEventListener('pointerup', handlePointerUp)
    window.removeEventListener('pointercancel', handlePointerUp)

    // 开启吸边过渡
    if (props.attract) {
        attractTransition.value = true
        const centerX = screen.width / 2
        const currentLeft = typeof leftPos.value === 'number' ? leftPos.value : parseFloat(String(leftPos.value))
        const fabX = currentLeft + fabSize.width / 2

        // 根据中心点位置决定向左或向右吸附
        if (fabX < centerX) {
            leftPos.value = bounding.minLeft
            fabDirection.value = 'right'
        } else {
            leftPos.value = bounding.maxLeft
            fabDirection.value = 'left'
        }
    }
}

/**
 * 点击触发：切换展开状态或触发点击事件
 */
function handleClick() {
    if (props.disabled || props.trigger === 'hover' || hasMoved.value) return
    if (props.expandable) {
        isActive.value = !isActive.value
    } else {
        emit('click')
    }
}

/**
 * 鼠标进入：Hover 模式下展开
 */
function handleMouseEnter() {
    if (props.disabled || props.trigger !== 'hover' || isDragging.value) return
    isActive.value = true
}

/**
 * 鼠标离开：Hover 模式下收回
 */
function handleMouseLeave() {
    if (props.disabled || props.trigger !== 'hover') return
    isActive.value = false
}

// 按钮根元素样式计算
const rootStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
        position: 'fixed',
        zIndex: props.zIndex,
        transition: attractTransition.value ? 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)' : 'none',
        ...props.customStyle
    }

    // 默认展示逻辑
    if (!inited.value) {
        if (props.top !== undefined) style.top = typeof props.top === 'number' ? `${props.top}px` : props.top
        else if (props.bottom !== undefined) style.bottom = typeof props.bottom === 'number' ? `${props.bottom}px` : props.bottom

        if (props.left !== undefined) style.left = typeof props.left === 'number' ? `${props.left}px` : props.left
        else if (props.right !== undefined) style.right = typeof props.right === 'number' ? `${props.right}px` : props.right
    } else {
        // 初始化后或拖拽过程中，统一转为 top/left 绝对定位
        style.top = typeof topPos.value === 'number' ? `${topPos.value}px` : topPos.value
        style.left = typeof leftPos.value === 'number' ? `${leftPos.value}px` : leftPos.value
        style.bottom = 'auto'
        style.right = 'auto'
    }

    return style
})

// 展开后子列表视图的样式与方向控制
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

// 暴露 API
defineExpose({
    open: () => (isActive.value = true),
    close: () => (isActive.value = false)
})
</script>

<template>
    <div :class="uiClasses.root()" :style="rootStyle" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
        <!-- 悬浮操作项插槽 -->
        <div v-show="expandable" :class="uiClasses.actions()" :style="actionsStyle">
            <slot :isActive="isActive" :isDragging="isDragging" :isAttracting="attractTransition" />
        </div>

        <!-- 主按钮触发区域 -->
        <div ref="triggerRef" class="pointer-events-auto" @click.stop="handleClick" @pointerdown="handlePointerDown">
            <slot name="trigger" :isActive="isActive" :isDragging="isDragging" :isAttracting="attractTransition">
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
