<template>
    <div :class="ui.root()" :style="rootStyle">
        <div v-if="props.type === 'ring' || props.type === 'outline'" :key="props.type" :class="ui.container()"
            :style="containerStyle">
            <div v-if="props.type === 'outline'" :class="ui.outlineTrack()" />
            <div :class="ui.indicator()" :style="ringIndicatorStyle" />
        </div>

        <div v-else-if="props.type === 'spinner'" key="loading-spinner" :class="ui.container()" :style="containerStyle">
            <div v-for="i in 12" :key="i" :class="ui.spinnerItem()" :style="{ '--i': (i as any) }" />
        </div>

        <div v-else-if="props.type === 'bars-scale'" key="loading-bars-scale" :class="ui.container()"
            :style="containerStyle">
            <div v-for="i in 5" :key="i" :class="ui.barItem()" :style="{ '--i': (i as any) }" />
        </div>

        <div v-else-if="props.type === 'blocks-shuffle'" key="loading-blocks-shuffle" :class="ui.container()"
            :style="containerStyle">
            <div :class="ui.blockItem()" class="rb-shuffle-1" />
            <div :class="ui.blockItem()" class="rb-shuffle-2" />
        </div>

        <div v-else-if="props.type === 'blocks-wave'" key="loading-blocks-wave" :class="ui.container()"
            :style="containerStyle">
            <div v-for="i in 9" :key="i" :class="ui.waveItem()" :style="{ '--d': getWaveDelay(i) }" />
        </div>

        <div v-else-if="props.type === 'gooey-balls'" key="loading-gooey-balls" :class="ui.container()"
            :style="containerStyle">
            <div :class="ui.gooeyItem()" class="rb-gooey-1" />
            <div :class="ui.gooeyItem()" class="rb-gooey-2" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { tv } from '~/lib/tv'
import { cn } from '~/lib/utils'
import theme, { type LoadingUI, LoadingColors, LoadingTypes } from './reborn-loading.config'

export type RebornLoadingProps = {
    ui?: LoadingUI
    type?: typeof LoadingTypes[number]
    color?: typeof LoadingColors[number] | string
    size?: string | number
    customClass?: string
}

const props = withDefaults(defineProps<RebornLoadingProps>(), {
    ui: () => ({}),
    type: 'ring',
    color: 'primary',
    size: '1.2em'
})

const isPresetColor = computed(() => LoadingColors.includes(props.color as typeof LoadingColors[number]))

const addUnit = (val: string | number) => {
    if (typeof val === 'number') return `${val}px`
    return val
}

const iconSize = computed(() => addUnit(props.size))

// bars-scale / blocks-wave 用百分比布局，尺寸过小时子元素会接近 0 不显示，故设最小宽高
const MIN_SIZE_FOR_GRID = '24px'
const rootStyle = computed(() => {
    const style: Record<string, string> = {
        width: iconSize.value,
        height: iconSize.value,
    }
    if (props.type === 'bars-scale' || props.type === 'blocks-wave') {
        style.minWidth = MIN_SIZE_FOR_GRID
        style.minHeight = MIN_SIZE_FOR_GRID
    }
    return style
})
const containerStyle = computed(() => {
    const style: Record<string, string> = {}
    if (props.color && !isPresetColor.value) {
        style.color = props.color as string
    }

    return style
})

// ring 在自定义颜色时直接给 indicator 设边框色
const ringIndicatorStyle = computed(() => {
    if (props.type !== 'ring' || isPresetColor.value) return {}
    const c = props.color as string
    if (!c) return {}
    return {
        borderColor: c,
        borderTopColor: 'transparent',
    }
})

const b = tv(theme)
const ui = computed(() => {
    const styles = b({
        color: isPresetColor.value ? props.color as typeof LoadingColors[number] : undefined,
        type: props.type
    })
    // 映射所有 slots
    const slots = ['root', 'container', 'indicator', 'outlineTrack', 'spinnerItem', 'barItem', 'blockItem', 'waveItem', 'gooeyItem'] as const
    const res: any = {}
    slots.forEach(slot => {
        res[slot] = (opts?: { class?: any }) => styles[slot]({ class: cn(opts?.class, slot === 'root' ? props.customClass : undefined, (props.ui as any)?.[slot]) })
    })
    return res as Record<keyof LoadingUI, (opts?: { class?: any }) => string>
})

// 仅保留复杂的延迟算法在 JS 中，其余交给 CSS
function getWaveDelay(index: number) {
    return ((index - 1) % 3 + Math.floor((index - 1) / 3)) * 0.12 + 's'
}
</script>

<style scoped>
/* 1. 性能基础设置 */
.rb-loading div {
    box-sizing: border-box;
    backface-visibility: hidden;
    transform: translateZ(0);
}

/* 2. 动画定义 */
@keyframes rb-rotate {
    from {
        transform: rotate(0deg);
    }

    to {
        transform: rotate(360deg);
    }
}

@keyframes rb-spinner {
    0% {
        opacity: 1;
    }

    100% {
        opacity: 0.15;
    }
}

@keyframes rb-bars-scale {

    0%,
    100% {
        transform: scaleY(0.5);
        opacity: 0.5;
    }

    50% {
        transform: scaleY(1.2);
        opacity: 1;
    }
}

@keyframes rb-blocks-shuffle {
    0% {
        transform: translate(0, 0);
    }

    25% {
        transform: translate(120%, 0);
    }

    50% {
        transform: translate(120%, 120%);
    }

    75% {
        transform: translate(0, 120%);
    }

    100% {
        transform: translate(0, 0);
    }
}

@keyframes rb-blocks-wave {

    0%,
    100% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(0.3);
        opacity: 0.3;
    }
}

@keyframes rb-gooey-1 {

    0%,
    100% {
        transform: translateX(-50%) scale(1);
    }

    50% {
        transform: translateX(20%) scale(1.5);
    }
}

@keyframes rb-gooey-2 {

    0%,
    100% {
        transform: translateX(50%) scale(1.5);
    }

    50% {
        transform: translateX(-20%) scale(1);
    }
}

/* 3. 动画逻辑应用 */
.rb-loading :deep(.rb-loading-indicator) {
    border-color: currentColor;
    border-top-color: transparent !important;
    animation: rb-rotate 0.8s linear infinite;
    will-change: transform;
}

.rb-loading :deep(.rb-loading-spinnerItem) {
    transform: rotate(calc((var(--i) - 1) * 30deg));
    animation: rb-spinner 1s linear infinite;
    animation-delay: calc((var(--i) - 1) * 0.08s);
    will-change: opacity;
}

.rb-loading :deep(.rb-loading-barItem) {
    animation: rb-bars-scale 1s ease-in-out infinite;
    animation-delay: calc((var(--i) - 1) * 0.12s);
    will-change: transform, opacity;
}

.rb-shuffle-1 {
    animation: rb-blocks-shuffle 1s linear infinite;
}

.rb-shuffle-2 {
    animation: rb-blocks-shuffle 1s linear infinite -0.5s;
}

.rb-loading :deep(.rb-loading-waveItem) {
    animation: rb-blocks-wave 1s ease-in-out infinite;
    animation-delay: var(--d);
    will-change: transform, opacity;
}

.rb-gooey-1 {
    animation: rb-gooey-1 0.75s ease-in-out infinite;
}

.rb-gooey-2 {
    animation: rb-gooey-2 0.75s ease-in-out infinite;
}
</style>
