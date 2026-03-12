<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted, toRef } from "vue"
import { tv } from "~/lib/tv"
import theme, { popoverAnimations } from "./reborn-popover.config"
import { cn } from "~/lib/utils"

defineOptions({
    name: "RebornPopover"
})

/**
 * Popover 内容配置
 */
export interface PopoverContentProps {
    /** Popover 相对于触发器的显示位置 */
    side?: "top" | "right" | "bottom" | "left"
    /** Popover 沿触发器轴线的对齐方式 */
    align?: "start" | "center" | "end"
    /** Popover 与触发器之间的间距 */
    sideOffset?: number
}

/**
 * RebornPopover 组件属性
 */
export interface PopoverProps {
    /** 触发模式：'click' (默认) 或 'hover' */
    mode?: "click" | "hover"
    /** 内容位置与偏移配置 */
    content?: PopoverContentProps
    /** 是否显示箭头 */
    arrow?: boolean
    /** 是否将 Popover 渲染到指定的 DOM 节点 (通常为 'body') */
    portal?: boolean | string
    /** 点击外部时是否关闭 Popover */
    dismissible?: boolean
    /** 受控显示状态 */
    open?: boolean
    /** 非受控默认显示状态 */
    defaultOpen?: boolean
    /** 是否显示遮罩层并捕获焦点 */
    modal?: boolean
    /** 延迟打开时间 (ms) - 适用于 hover 模式 */
    openDelay?: number
    /** 延迟关闭时间 (ms) - 适用于 hover 模式，防止意外关闭 */
    closeDelay?: number
    /** 额外的类名 */
    class?: any
    /** UI 覆盖配置 */
    ui?: any
}

const props = withDefaults(defineProps<PopoverProps>(), {
    mode: "click",
    portal: true,
    arrow: false,
    dismissible: true,
    modal: false,
    openDelay: 0,
    closeDelay: 120,
    content: () => ({
        side: "bottom",
        align: "center",
        sideOffset: 8
    })
})

const emit = defineEmits<{
    /** 当显示状态发生变化时触发 */
    (e: "update:open", v: boolean): void
}>()

/* ---------------- 显示状态 ---------------- */

/** 内部状态，与 props.defaultOpen 或 props.open 同步 */
const internalOpen = ref(props.defaultOpen ?? props.open ?? false)

watch(() => props.open, v => {
    if (v !== undefined) internalOpen.value = v
})

/** 计算后的显示状态，处理 v-model 同步 */
const open = computed({
    get: () => internalOpen.value,
    set: v => {
        internalOpen.value = v
        emit("update:open", v)
    }
})

/* ---------------- refs ---------------- */

const wrapperRef = ref<HTMLElement>()
const triggerRef = ref<HTMLElement>()
const contentRef = ref<HTMLElement>()

/* ---------------- 悬停逻辑 ---------------- */

let hoverCount = 0
let hoverTimer: any = null

/** 处理 hover 模式下的鼠标移入，支持延迟打开 */
const onMouseEnter = () => {
    if (props.mode !== "hover") return

    hoverCount++
    clearTimeout(hoverTimer)

    hoverTimer = setTimeout(() => {
        open.value = true
    }, props.openDelay)
}

/** 处理 hover 模式下的鼠标移出，支持延迟关闭并检查连续性 */
const onMouseLeave = () => {
    if (props.mode !== "hover") return

    hoverCount--

    hoverTimer = setTimeout(() => {
        if (hoverCount <= 0) open.value = false
    }, props.closeDelay)
}

/* ---------------- click trigger ---------------- */

const onClickTrigger = () => {
    if (props.mode === "click") {
        open.value = !open.value
    }
}

/* ---------------- 点击外部关闭 ---------------- */

const onClickOutside = (e: MouseEvent) => {
    if (!open.value || !props.dismissible) return

    const target = e.target as Node

    if (
        wrapperRef.value?.contains(target) ||
        contentRef.value?.contains(target)
    ) {
        return
    }

    open.value = false
}

/* ---------------- 位置计算 ---------------- */

const style = ref<Record<string, string>>({
    transform: "translate3d(0,0,0)"
})

/**
 * 根据触发器的边界动态计算 Popover 的位置。
 * 使用 offsetWidth/Height 以排除绝对定位箭头的溢出干扰。
 */
const calculatePosition = () => {
    if (!triggerRef.value || !contentRef.value) return

    const rect = triggerRef.value.getBoundingClientRect()
    // 不直接测量 contentRef 的 bounds，因为它包含了绝对定位出的箭头，
    // 我们需要测量定义的视觉边界内容盒子。
    const contentBox = contentRef.value.firstElementChild as HTMLElement
    const cWidth = contentBox.offsetWidth
    const cHeight = contentBox.offsetHeight

    const side = props.content?.side || "bottom"
    const align = props.content?.align || "center"
    const offset = props.content?.sideOffset ?? 8

    let x = rect.left
    let y = rect.bottom + offset

    // 基于 'side' 属性的坐标计算
    if (side === "top") {
        y = rect.top - cHeight - offset
    }

    if (side === "left") {
        x = rect.left - cWidth - offset
        y = rect.top + rect.height / 2 - cHeight / 2
    }

    if (side === "right") {
        x = rect.right + offset
        y = rect.top + rect.height / 2 - cHeight / 2
    }

    // side 轴线上的对齐逻辑
    if (side === "bottom" || side === "top") {
        if (align === "center") {
            x = rect.left + rect.width / 2 - cWidth / 2
        }

        if (align === "end") {
            x = rect.right - cWidth
        }
    }

    if (side === "left" || side === "right") {
        if (align === "start") {
            y = rect.top
        }

        if (align === "end") {
            y = rect.bottom - cHeight
        }
    }

    // 屏幕碰撞排查逻辑（防止 Popover 超出视口）
    const vWidth = window.innerWidth
    const vHeight = document.documentElement.clientHeight

    if (x < 8) x = 8
    if (x + cWidth > vWidth - 8) x = vWidth - cWidth - 8
    if (y < 8) y = 8
    if (y + cHeight > vHeight - 8) y = vHeight - cHeight - 8

    style.value = {
        transform: `translate3d(${x}px, ${y}px, 0)`
    }
}


let frame: number | null = null

const updatePosition = () => {
    if (frame) return

    frame = requestAnimationFrame(() => {
        calculatePosition()
        frame = null
    })
}


let resizeObserver: ResizeObserver | null = null;

/** 当内容元素被检测到或尺寸变化时自动更新位置 */
watch(contentRef, (el) => {
    if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
    }
    if (el) {
        resizeObserver = new ResizeObserver(() => {
            if (open.value) updatePosition()
        })
        resizeObserver.observe(el)

        if (open.value) {
            // 使用双重 requestAnimationFrame 确保在显示状态切换（display:block）后的布局重计算已完成
            requestAnimationFrame(() => {
                requestAnimationFrame(() => calculatePosition())
            })
        }
    }
}, { immediate: true })

onMounted(() => {
    document.addEventListener("mousedown", onClickOutside)
    window.addEventListener("resize", updatePosition)
    window.addEventListener("scroll", updatePosition, true)
})

onUnmounted(() => {
    document.removeEventListener("mousedown", onClickOutside)
    window.removeEventListener("resize", updatePosition)
    window.removeEventListener("scroll", updatePosition, true)
    if (resizeObserver) resizeObserver.disconnect()
})

watch(open, v => {
    if (v) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                calculatePosition()
            })
        })
    }
})


/**
 * 计算指示箭头的精确样式。
 * 使用 clip-path 渲染一个真正的三角形，并隐藏旋转正方形中不需要的边缘。
 */
const arrowStyle = computed(() => {
    const side = props.content?.side || "bottom"
    const offsetScale = "-6px"

    // 为了形成完美的三角形并防止重叠，我们在旋转后的正方形上使用 clip-path 裁剪。
    if (side === "bottom")
        return {
            top: offsetScale, left: "50%", transform: "translateX(-50%) rotate(45deg)",
            clipPath: "polygon(0 0, 100% 0, 0 100%)",
            borderBottomWidth: "0", borderRightWidth: "0"
        }

    if (side === "top")
        return {
            bottom: offsetScale, left: "50%", transform: "translateX(-50%) rotate(45deg)",
            clipPath: "polygon(100% 100%, 100% 0, 0 100%)",
            borderTopWidth: "0", borderLeftWidth: "0"
        }

    if (side === "left")
        return {
            right: offsetScale, top: "50%", transform: "translateY(-50%) rotate(45deg)",
            clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            borderBottomWidth: "0", borderLeftWidth: "0"
        }

    if (side === "right")
        return {
            left: offsetScale, top: "50%", transform: "translateY(-50%) rotate(45deg)",
            clipPath: "polygon(0 100%, 0 0, 100% 100%)",
            borderTopWidth: "0", borderRightWidth: "0"
        }
})

/* ---------------- styles ---------------- */

const b = tv(theme)
const ui = computed(() => {
    return b({
        side: props.content?.side,
        align: props.content?.align
    })
})

/**
 * 计算动画类名，根据 side 动态选择方向性动画偏移
 */
const ani = computed(() => {
    const side = props.content?.side || "bottom"
    const specific = popoverAnimations[side]
    return {
        ...popoverAnimations.base,
        enterFromClass: cn(popoverAnimations.base.enterActiveClass && "", specific.enterFromClass),
        leaveToClass: cn(popoverAnimations.base.leaveActiveClass && "", specific.leaveToClass)
    }
})

defineExpose({
    close: () => (open.value = false)
})
</script>

<template>
    <div ref="wrapperRef" :class="ui.wrapper({ class: props.class })" @mouseenter="onMouseEnter"
        @mouseleave="onMouseLeave">
        <div ref="triggerRef" :class="ui.trigger()" @click="onClickTrigger">
            <slot :open="open" />
        </div>

        <Teleport :to="typeof portal === 'string' ? portal : 'body'" :disabled="!portal">

            <!-- mask -->
            <div v-if="open && modal" :class="ui.mask()" @click="props.dismissible && (open = false)" />

            <Transition :enter-active-class="ani.enterActiveClass" :enter-from-class="ani.enterFromClass"
                :enter-to-class="ani.enterToClass" :leave-active-class="ani.leaveActiveClass"
                :leave-from-class="ani.leaveFromClass" :leave-to-class="ani.leaveToClass">
                <div v-show="open" ref="contentRef" :class="ui.contentWrapper()" :style="style"
                    @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
                    <div :class="ui.content()">
                        <slot name="content" />

                        <!-- 隐形的悬停桥接层，用于通过间隙时保持鼠标连续性 -->
                        <div v-if="props.mode === 'hover'" :class="ui.bridge()"
                            :style="{ margin: `-${props.content?.sideOffset ?? 8}px` }" />

                        <div v-if="arrow" :class="ui.arrow()" :style="arrowStyle" />
                    </div>
                </div>
            </Transition>

        </Teleport>
    </div>
</template>