<template>
    <Transition :enter-active-class="maskTransition.enterActive" :enter-from-class="maskTransition.hidden"
        :leave-active-class="maskTransition.leaveActive" :leave-to-class="maskTransition.hidden" appear
        @after-leave="emit('afterLeave')">
        <div v-if="props.visible" :class="ui.root({ class: cn(props.customClass, props.ui?.root) })"
            :style="rootStyle">
            <!-- 可视区容器：局部模式为 sticky，随宿主滚动钉在可视区域（尺寸由 viewportStyle 内联注入） -->
            <div :class="ui.viewport({ class: cn(props.ui?.viewport) })" :style="props.viewportStyle">
                <div :class="ui.content({ class: cn(props.ui?.content) })">
                    <RebornLoading :type="props.type" :color="props.color" :size="props.size" />
                    <div v-if="props.text" :class="ui.text({ class: cn(props.ui?.text) })" :style="textStyle">
                        {{ props.text }}
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<script lang="ts" setup>
/**
 * RebornLoadingMask（内部组件）
 * v-loading 指令与 useLoading 共用的遮罩层：半透明背景 + RebornLoading 图标 + 可选文字。
 * 显隐由外部核心逻辑（useLoading 的 createLoading）通过 visible prop 控制，
 * 退场过渡结束后触发 afterLeave 事件，由外部决定何时真正卸载。
 */
import { computed } from 'vue'
import type { ClassValue } from 'tailwind-variants'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import RebornLoading from './RebornLoading.vue'
import theme, { maskTransition, type LoadingMaskUI } from './reborn-loading-mask.config'
import { LoadingColors, type LoadingTypes } from './reborn-loading.config'

export interface RebornLoadingMaskProps {
    /** 是否可见（false 时走淡出过渡，过渡结束触发 afterLeave） */
    visible?: boolean
    /** 是否 fixed 定位：全屏遮罩或 body 挂载模式为 true，局部遮罩为 false */
    fixed?: boolean
    /** 加载文字（显示在图标下方） */
    text?: string
    /** 加载图标类型（透传 RebornLoading） */
    type?: (typeof LoadingTypes)[number]
    /** 图标与文字颜色：预设色名或任意 CSS 颜色 */
    color?: string
    /** 图标尺寸（透传 RebornLoading） */
    size?: string | number
    /** 遮罩背景色（任意 CSS 颜色，内联覆盖默认半透明背景类） */
    background?: string
    /** 可视区容器内联样式：局部模式下由 useLoading 注入宿主可视区宽高，供 sticky 图标区定位 */
    viewportStyle?: Record<string, string>
    /** 遮罩根节点附加类名 */
    customClass?: ClassValue
    /** Slots 覆盖 */
    ui?: LoadingMaskUI
    /** 遮罩层级 */
    zIndex?: number
}

const props = withDefaults(defineProps<RebornLoadingMaskProps>(), {
    visible: false,
    fixed: false,
    type: 'ring',
    color: 'primary',
    size: '24px',
    zIndex: 2000,
})

const emit = defineEmits<{
    /** 退场过渡结束（外部据此安全卸载实例） */
    (e: 'afterLeave'): void
}>()

/** 是否为预设色名（预设色走 config 变体类，自定义颜色走内联样式） */
const isPresetColor = computed(() => LoadingColors.includes(props.color as (typeof LoadingColors)[number]))

const b = tv(theme)
const ui = computed(() => b({
    fixed: props.fixed,
    color: isPresetColor.value ? props.color as (typeof LoadingColors)[number] : undefined,
}))

/** 根节点内联样式：层级 + 可选背景色覆盖 */
const rootStyle = computed(() => {
    const style: Record<string, string> = {
        zIndex: String(props.zIndex),
    }
    if (props.background) {
        style.backgroundColor = props.background
    }
    return style
})

/** 自定义颜色时文字颜色内联跟随（预设色由 config 的 color 变体处理） */
const textStyle = computed(() => {
    if (props.color && !isPresetColor.value) {
        return { color: props.color }
    }
    return {}
})
</script>
