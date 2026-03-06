<script lang="ts">
export default {
    name: 'reborn-tabbar-trigger',
    options: {
        virtualHost: true,
        styleIsolation: 'shared'
    }
}
</script>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme from './reborn-tabbar-trigger.config'
import RebornImage from '@/components/reborn-image/RebornImage.vue'
import { useParent } from '@/composables/useChildren'
import { TABBAR_KEY } from '@/components/reborn-tabbar/types'
import type { tabbarShapes } from '@/components/reborn-tabbar/reborn-tabbar.config'

export interface TabbarTriggerProps {
    /** 标签页标题 */
    title?: string
    /** 唯一标识符 */
    name?: number | string
    /** 图标名称或图片链接 */
    icon?: string
    /** 未选中时的图标名称或图片链接 */
    inactive?: string
    /** 是否禁用 */
    disabled?: boolean
    /** 自定义样式类 */
    customClass?: any
    /** 自定义内联样式 */
    customStyle?: string
    /** 颜色 */
    color?: string
    /** 图片大小 */
    imageSize?: number
    /** UI 样式覆盖 */
    ui?: Partial<Record<'root' | 'body' | 'icon' | 'activeIcon' | 'inactiveIcon' | 'iconInner' | 'title' | 'glowLayer' | 'bodyGlowLayer', string>>
}

const props = withDefaults(defineProps<TabbarTriggerProps>(), {
    disabled: false,
    customStyle: '',
})

const { parent: tabbar, index } = useParent(TABBAR_KEY)

const active = computed(() => {
    const itemName = props.name !== undefined ? props.name : index.value
    if (tabbar) {
        return tabbar.props.modelValue === itemName
    }
    return false
})

const parentColor = computed(() => {
    if (props.color) {
        return props.color
    }
    if (tabbar && tabbar.props.color) {
        return tabbar.props.color
    }
    return 'primary'
})

const parentShape = computed(() => {
    if (tabbar && tabbar.props.shape) {
        return tabbar.props.shape as (typeof tabbarShapes)[number]
    }
    return 'normal'
})

const parentAnimation = computed(() => {
    if (tabbar && tabbar.props.animation) {
        return tabbar.props.animation as 'fade' | 'flip' | 'reveal' | 'creative' | 'glass' | 'fly-balls'
    }
    return 'fade'
})

const b = tv(theme)

const uiOverrides = computed(() => props.ui || {})

const ui = computed(() => {
    const styles = b({
        active: active.value,
        disabled: props.disabled,
        color: parentColor.value as any,
        shape: parentShape.value as any,
        animation: parentAnimation.value as any,
    })

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, uiOverrides.value.root) }),
        body: (opts?: { class?: any }) => styles.body({ class: cn(opts?.class, uiOverrides.value.body) }),
        icon: (opts?: { class?: any }) => styles.icon({ class: cn(opts?.class, uiOverrides.value.icon) }),
        activeIcon: (opts?: { class?: any }) => styles.activeIcon({ class: cn(opts?.class, uiOverrides.value.activeIcon) }),
        inactiveIcon: (opts?: { class?: any }) => styles.inactiveIcon({ class: cn(opts?.class, uiOverrides.value.inactiveIcon) }),
        iconInner: (opts?: { class?: any }) => styles.iconInner({ class: cn(opts?.class, uiOverrides.value.iconInner) }),
        title: (opts?: { class?: any }) => styles.title({ class: cn(opts?.class, uiOverrides.value.title) }),
        glowLayer: (opts?: { class?: any }) => styles.glowLayer({ class: cn(opts?.class, uiOverrides.value.glowLayer) }),
        bodyGlowLayer: (opts?: { class?: any }) => styles.bodyGlowLayer({ class: cn(opts?.class, uiOverrides.value.bodyGlowLayer) }),
    }
})

const textStyle = computed(() => {
    if (tabbar) {
        if (active.value && tabbar.props.activeColor) {
            return { color: tabbar.props.activeColor }
        }
        if (!active.value && tabbar.props.inactiveColor) {
            return { color: tabbar.props.inactiveColor }
        }
    }
    return {}
})

const isImage = (name?: string) => {
    if (!name) return false
    return name.includes('/') || name.includes('.') || name.startsWith('http') || name.startsWith('data:image')
}

const isShaking = ref(false)
let shakeTimer: any = null

const isJelly = ref(false)
const showActiveImage = ref(active.value)

watch(() => active.value, (newVal) => {
    if (parentAnimation.value === 'fly-balls') {
        if (newVal) {
            isJelly.value = true
            showActiveImage.value = false
            setTimeout(() => {
                isJelly.value = false
                showActiveImage.value = true
            }, 500)
        } else {
            showActiveImage.value = false
        }
    } else {
        showActiveImage.value = newVal
    }
}, { immediate: true })

/**
 * 点击 tabbar 选项
 */
function handleClick() {
    if (props.disabled) return
    const itemName: string | number = props.name !== undefined ? props.name : index.value

    if (active.value) {
        if (shakeTimer) clearTimeout(shakeTimer)
        isShaking.value = false
        setTimeout(() => {
            isShaking.value = true
            shakeTimer = setTimeout(() => {
                isShaking.value = false
            }, 300)
        }, 10)
        return
    }

    if (tabbar) {
        tabbar.setChange({ name: itemName })
    }
}
</script>

<template>
    <view :class="ui.root({ class: cn(customClass) })" :style="customStyle" @click="handleClick">
        <slot :active="active" :ui="ui">
            <!-- round + glass: bodyGlowLayer 包裹 body，提供颜色背景；默认 display:contents 不影响布局 -->
            <view :class="ui.bodyGlowLayer()">
                <view :class="ui.body()">
                    <!-- Icon area with animation -->
                    <view v-if="$slots.icon || icon"
                        :class="[ui.icon(), isShaking ? 'animate-[shake_0.3s_ease-in-out]' : '', isJelly ? 'fly-balls-jelly' : '']">
                        <slot name="icon" :active="active" :ui="ui">
                            <!-- 选中时 -->
                            <view
                                :class="[ui.activeIcon(), parentAnimation === 'fly-balls' ? 'transition-opacity duration-300' : '']"
                                :style="[textStyle, parentAnimation === 'fly-balls' ? { opacity: showActiveImage ? 1 : 0 } : {}]">
                                <RebornImage v-if="isImage(icon)" :width="imageSize || 40" :height="imageSize || 40"
                                    :src="icon!" mode="scaleToFill" />
                                <view v-else :class="['text-40', icon]" />
                            </view>
                            <!-- 未选中时 -->
                            <view
                                :class="[ui.inactiveIcon(), parentAnimation === 'fly-balls' ? 'transition-opacity duration-300' : '']"
                                :style="[textStyle, parentAnimation === 'fly-balls' ? { opacity: showActiveImage ? 0 : 1 } : {}]">
                                <RebornImage v-if="isImage(inactive || icon)" :width="imageSize || 40"
                                    :height="imageSize || 40" :src="inactive! || icon!" mode="scaleToFill" />
                                <view v-else :class="['text-40', inactive || icon]" />
                            </view>
                        </slot>
                        <!-- Glass 动画: icon 级别渐变光影背景层 (normal + glass) -->
                        <view :class="ui.glowLayer()" />
                    </view>

                    <!-- 标题 -->
                    <view v-if="title" :class="ui.title()" :style="textStyle">
                        {{ title }}
                    </view>
                </view>
            </view>
        </slot>
    </view>
</template>

<style scoped>
.fly-balls-jelly {
    animation: jelly 0.5s ease-in-out;
}

@keyframes jelly {

    0%,
    100% {
        transform: scale(1, 1);
    }

    25% {
        transform: scale(1, 0.5);
    }

    50% {
        transform: scale(0.75, 1);
    }

    75% {
        transform: scale(1, 0.75);
    }
}
</style>
