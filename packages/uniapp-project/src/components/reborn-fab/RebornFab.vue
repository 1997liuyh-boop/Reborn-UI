<script lang="ts" setup>
import { computed, getCurrentInstance, nextTick, onMounted, provide, reactive, ref, watch } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import { getSafeAreaBottomInset, getSystemInfo, isH5 } from '@/lib/device'
import theme, { fabColors, fabDirections, fabPositions, type FabActionItem } from './reborn-fab.config'

/**
 * RebornFab 悬浮按钮组件
 * 提供固定位置的操作按钮，支持拖拽、展开菜单。
 * 展开菜单推荐传入 `items` 由组件内渲染（多端样式一致）；无 `items` 时使用默认插槽。
 */

type FabPosition = typeof fabPositions[number]
type FabDirection = typeof fabDirections[number]
type FabColor = typeof fabColors[number]

interface UiMap {
    root: string
    trigger: string
    icon: string
    actions: string
    action: string
}

interface Props {
    /** 绑定值，控制展开状态 */
    modelValue?: boolean
    /** 是否默认展开 */
    active?: boolean
    /** 预设位置 */
    position?: FabPosition
    /** 自定义位置 */
    top?: string | number
    bottom?: string | number
    left?: string | number
    right?: string | number
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
    ui?: Partial<UiMap>
    /**
     * 动作列表：有数据时由组件内 v-for 渲染（推荐小程序端使用），无数据时回退为默认插槽。
     */
    items?: FabActionItem[]
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
    gap: () => ({ top: 16, left: 16, right: 16, bottom: 16 }),
    inactiveIcon: 'i-lucide-plus',
    activeIcon: 'i-lucide-plus',
    zIndex: 99,
    items: () => [],
    ui: () => ({
        root: '',
        trigger: '',
        icon: '',
        actions: '',
        action: ''
    })
})

const emit = defineEmits<{
    'update:modelValue': [boolean]
    click: []
    /** 点击某条 items 动作 */
    action: [payload: { name: string; index: number }]
}>()

const { proxy } = getCurrentInstance() as any
const isActive = defineModel<boolean>({ default: false })

// 监听 active 属性初始化状态
watch(() => props.active, (val) => {
    isActive.value = val
}, { immediate: true })

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
        action: (opts?: any) => styles.action({ class: cn(opts?.class, uiOverrides.value.action) }),
    }
})

const hasItems = computed(() => props.items.length > 0)

function onActionItemTap(item: FabActionItem, index: number) {
    if (props.disabled || item.disabled)
        return
    emit('action', { name: item.name, index })
}

// 获取位置边界
async function updateBounding() {
    const sysInfo = getSystemInfo()
    screen.width = sysInfo.windowWidth
    screen.height = isH5() ? sysInfo.windowHeight : sysInfo.windowHeight

    await nextTick()

    const query = uni.createSelectorQuery().in(proxy)
    query.select('#trigger').boundingClientRect()
    query.exec((res) => {
        if (res && res[0]) {
            fabSize.width = res[0].width || 56
            fabSize.height = res[0].height || 56
        }

        const { top = 16, left: left = 16, right = 16, bottom = 16 } = props.gap
        screen.width = sysInfo.windowWidth
        screen.height = isH5() ? sysInfo.windowTop + sysInfo.windowHeight : sysInfo.windowHeight
        bounding.minTop = isH5() ? sysInfo.windowTop + top : top
        bounding.minLeft = left
        bounding.maxLeft = screen.width - fabSize.width - right

        // App 等端：优先 uni.getWindowInfo + 屏幕坐标 safeArea，避免仅用 getSystemInfoSync 时 inset 恒为 0 导致贴底
        const safeBottomInset = isH5() ? 0 : getSafeAreaBottomInset()

        bounding.maxTop = screen.height - fabSize.height - bottom - safeBottomInset

        const presetAnchors = props.top === undefined && props.bottom === undefined && props.left === undefined && props.right === undefined

        if (!inited.value) {
            initPosition()
            inited.value = true
        }
        else if (!props.draggable && presetAnchors) {
            initPosition()
        }
    })
}

// 初始化位置
function initPosition() {
    const { minLeft, minTop, maxLeft, maxTop } = bounding

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
    }
}

// 拖拽逻辑
const touchOffset = reactive({ x: 0, y: 0 })
const touchStart = reactive({ x: 0, y: 0 })
/** 移动超过阈值才算拖拽，否则保持为点按（利于小程序端正常出 tap） */
const touchDidDrag = ref(false)
const DRAG_THRESHOLD_PX = 8

function handleTouchStart(e: TouchEvent) {
    if (!props.draggable || props.disabled) return
    const touch = e.touches[0]
    touchStart.x = touch.clientX
    touchStart.y = touch.clientY
    touchDidDrag.value = false
    touchOffset.x = touch.clientX - left.value
    touchOffset.y = touch.clientY - top.value
    attractTransition.value = false
}

function handleTouchMove(e: TouchEvent) {
    if (!props.draggable || props.disabled) return
    const touch = e.touches[0]
    const dx = touch.clientX - touchStart.x
    const dy = touch.clientY - touchStart.y

    if (!touchDidDrag.value) {
        if ((dx * dx + dy * dy) < DRAG_THRESHOLD_PX * DRAG_THRESHOLD_PX)
            return
        touchDidDrag.value = true
    }

    // 拖拽过程中阻隔冒泡（仅确认为拖拽后再 stop），避免在根节点使用 catch 阻断子级 tap
    e.stopPropagation()
    // H5：仅在此处 preventDefault；模板禁止使用 .prevent，否则易被编译成 catch，破坏小程序 tap
    if (isH5())
        e.preventDefault()

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

watch(() => props.position, () => {
    if (!props.draggable) {
        initPosition()
    }
})

function handleTouchEnd() {
    if (!props.draggable || props.disabled) return
    if (!touchDidDrag.value) return

    // 自动吸附逻辑（仅真实拖动后执行）
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

/** 小程序等端上 tap / click 可能短时间双发，合并为一次切换 */
let lastTriggerAt = 0
function activateTrigger() {
    if (props.disabled) return
    const t = Date.now()
    if (t - lastTriggerAt < 45) return
    lastTriggerAt = t
    if (props.expandable) {
        isActive.value = !isActive.value
    } else {
        emit('click')
    }
}

function handleMouseEnter() {
    // H5 触摸后会合成 mouse 事件：若先触发 enter 再触发 tap，会把「已展开」再 toggle 成关闭，表现为要点两次。
    // 可展开菜单按点击语义控制，不参与悬浮预览展开。
    if (props.disabled || isH5() || props.expandable) return
    isActive.value = true
}

function handleMouseLeave() {
    if (props.disabled || isH5() || props.expandable) return
    isActive.value = false
}

const rootStyle = computed(() => {
    const style: any = {
        top: `${top.value}px`,
        left: `${left.value}px`,
        zIndex: props.zIndex,
        transition: attractTransition.value ? 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)' : 'none'
    }

    if (props.top !== undefined) style.top = typeof props.top === 'number' ? `${props.top}px` : props.top
    if (props.bottom !== undefined) style.bottom = typeof props.bottom === 'number' ? `${props.bottom}px` : props.bottom
    if (props.left !== undefined) style.left = typeof props.left === 'number' ? `${props.left}px` : props.left
    if (props.right !== undefined) style.right = typeof props.right === 'number' ? `${props.right}px` : props.right

    return style
})

/** H5 拖拽：触摸目标声明不交给浏览器滚动，与 touchmove preventDefault 配合避免与页面纵向滚动冲突 */
const triggerTouchStyle = computed(() => {
    if (!props.draggable || props.disabled) {
        return {}
    }
    return { touchAction: 'none' as const }
})

/** 根层为 pointer-events-none，触发区需显式可命中；合并 H5 拖拽用 touch-action */
const triggerWrapperStyle = computed(() => ({
    ...(triggerTouchStyle.value as Record<string, unknown>),
    pointerEvents: 'auto' as const
}))

// 外层：仅负责定位与 transform 动画（与 flex 拆开，避免微信小程序上横向展开异常）
const actionsShellStyle = computed(() => {
    const isVisible = isActive.value
    const offset = isVisible ? 'calc(100% + 12px)' : '0px'
    const opacity = isVisible ? 1 : 0
    const scale = isVisible ? 1 : 0.3

    const base: Record<string, string | number> = {
        opacity,
        transformOrigin: 'center center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        // 祖先 .actions 为 pointer-events-none 时，H5 上子节点若未显式写 pointer-events:auto 会命中穿透；
        // 展开时让动作条整体参与命中，避免 Toast 不触发、点击落到下层页面。
        pointerEvents: isVisible ? 'auto' : 'none'
    }

    switch (fabDirection.value) {
        case 'top':
            return {
                ...base,
                bottom: offset,
                left: '50%',
                transform: `translateX(-50%) scale(${scale})`
            }
        case 'bottom':
            return {
                ...base,
                top: offset,
                left: '50%',
                transform: `translateX(-50%) scale(${scale})`
            }
        case 'left':
            return {
                ...base,
                right: offset,
                top: '50%',
                transform: `translateY(-50%) scale(${scale})`
            }
        case 'right':
            return {
                ...base,
                left: offset,
                top: '50%',
                transform: `translateY(-50%) scale(${scale})`
            }
        default:
            return base
    }
})

// 内层：纯 flex 布局；使用 kebab-case 键，提升各端小程序样式序列化兼容性
const actionsFlexStyle = computed(() => {
    const flexDirection: Record<FabDirection, string> = {
        top: 'column-reverse',
        bottom: 'column',
        left: 'row-reverse',
        right: 'row'
    }
    return {
        display: 'flex',
        'flex-direction': flexDirection[fabDirection.value],
        'flex-wrap': 'nowrap',
        'align-items': 'center'
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
    <view :class="uiClasses.root()" :style="[rootStyle as any, customStyle]" @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave">
        <!-- 动作按钮组 -->
        <view v-show="expandable" :class="uiClasses.actions()" :style="[actionsShellStyle as any]">
            <view class="reborn-fab-actions-inner" :class="`reborn-fab-actions-inner--${fabDirection}`"
                :style="actionsFlexStyle as any">
                <template v-if="hasItems">
                    <view v-for="(item, index) in items" :key="`${item.name}-${index}`" :class="cn(
                        uiClasses.action(),
                        item.disabled ? 'opacity-40 pointer-events-none' : '',
                        `bg-${item.color ?? 'primary'}`
                    )" @tap.stop="onActionItemTap(item, index)" @click.stop="onActionItemTap(item, index)">
                        <view :class="['pointer-events-none', 'text-32', item.icon]" />
                    </view>
                </template>
                <slot v-else :isActive="isActive" />
            </view>
        </view>

        <!-- 主触发按钮：勿在根节点绑定 touch + .prevent（易编译为 catch，阻断子级 tap）。uni-app 不支持 v-on="对象"，此处显式绑定。 -->
        <view id="trigger" :style="triggerWrapperStyle as any" @touchstart="handleTouchStart"
            @touchmove="handleTouchMove" @touchend="handleTouchEnd" @touchcancel="handleTouchEnd"
            @tap.stop="activateTrigger" @click.stop="activateTrigger">
            <slot name="trigger">
                <view :class="uiClasses.trigger()">
                    <view class="pointer-events-none"
                        :class="[isActive ? activeIcon : inactiveIcon, uiClasses.icon()]" />
                </view>
            </slot>
        </view>
    </view>
</template>

<style scoped>
/* items 模式：子项带 .reborn-fab-action，直接写兄弟间距（不依赖 :deep） */
.reborn-fab-actions-inner--right>.reborn-fab-action:not(:first-child) {
    margin-left: 12px;
}

.reborn-fab-actions-inner--left>.reborn-fab-action:not(:first-child) {
    margin-right: 12px;
}

.reborn-fab-actions-inner--bottom>.reborn-fab-action:not(:first-child) {
    margin-top: 12px;
}

.reborn-fab-actions-inner--top>.reborn-fab-action:not(:first-child) {
    margin-bottom: 12px;
}

/* 默认插槽：槽内节点由父级编译，须 :deep；排除已由上一组规则处理的 .reborn-fab-action，避免 items 模式下间距翻倍 */
.reborn-fab-actions-inner--right> :deep(*:not(:first-child):not(.reborn-fab-action)) {
    margin-left: 12px;
}

.reborn-fab-actions-inner--left> :deep(*:not(:first-child):not(.reborn-fab-action)) {
    margin-right: 12px;
}

.reborn-fab-actions-inner--bottom> :deep(*:not(:first-child):not(.reborn-fab-action)) {
    margin-top: 12px;
}

.reborn-fab-actions-inner--top> :deep(*:not(:first-child):not(.reborn-fab-action)) {
    margin-bottom: 12px;
}
</style>
