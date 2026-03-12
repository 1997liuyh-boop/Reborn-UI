<template>
    <view :class="ui.root()" :style="rootStyle">
        <!-- Ring / Outline -->
        <view v-if="props.type === 'ring' || props.type === 'outline'" :class="ui.container()">
            <view :class="ui.indicator()" />
        </view>

        <!-- Spinner -->
        <view v-else-if="props.type === 'spinner'" :class="ui.container()">
            <view v-for="i in 12" :key="i" :class="ui.spinnerItem()"
                :style="{ transform: `rotate(${(i - 1) * 30}deg)`, animationDelay: `${(i - 1) * 0.08}s` }" />
        </view>

        <!-- Bars Scale -->
        <view v-else-if="props.type === 'bars-scale'" :class="ui.container()">
            <view v-for="i in 5" :key="i" :class="ui.barItem()" :style="{ animationDelay: `${(i - 1) * 0.12}s` }" />
        </view>

        <!-- Blocks Shuffle -->
        <view v-else-if="props.type === 'blocks-shuffle'" :class="ui.container()">
            <view :class="ui.blockItem()" style="left: 0; top: 0; animation: rb-blocks-shuffle 1s linear infinite;" />
            <view :class="ui.blockItem()"
                style="left: 0; top: 0; animation: rb-blocks-shuffle 1s linear infinite -0.5s;" />
        </view>

        <!-- Blocks Wave -->
        <view v-else-if="props.type === 'blocks-wave'" :class="ui.container()">
            <view v-for="i in 9" :key="i" :class="ui.waveItem()"
                :style="{ animationDelay: `${((i - 1) % 3 + Math.floor((i - 1) / 3)) * 0.12}s` }" />
        </view>

        <!-- Gooey Balls -->
        <view v-else-if="props.type === 'gooey-balls'" :class="ui.container()">
            <view :class="ui.gooeyItem()" style="animation: rb-gooey-1 0.75s ease-in-out infinite;" />
            <view :class="ui.gooeyItem()" style="animation: rb-gooey-2 0.75s ease-in-out infinite;" />
        </view>
    </view>
</template>

<script lang="ts">
export default {
    name: 'reborn-loading',
    options: {
        virtualHost: true,
        addGlobalClass: true,
        styleIsolation: 'shared'
    }
}
</script>

<script lang="ts" setup>
import { computed, watch, ref, type PropType } from 'vue'
import { addUnit, isDef, objToStyle } from '@/lib/util'
import { tv } from '@/lib/tv'
import { cn } from '@/lib/utils'
import theme, { type LoadingUI, LoadingColor, LoadingType } from './reborn-loading.config'

export type RebornLoadingProps = {
    ui?: LoadingUI
    type?: LoadingType
    color?: LoadingColor
    size?: string | number
    customClass?: string
}

const props = withDefaults(defineProps<RebornLoadingProps>(), {
    ui: () => ({}),
    type: 'ring',
    color: 'primary',
    size: '30px'
})

const iconSize = ref<string>('30px')

watch(
    () => props.size,
    (newVal) => {
        iconSize.value = addUnit(newVal)
    },
    { deep: true, immediate: true }
)

const rootStyle = computed(() => {
    const style: Record<string, any> = {}
    if (isDef(iconSize.value)) {
        style.width = iconSize.value
        style.height = iconSize.value
    }
    return objToStyle(style)
})

const b = tv({
    extend: tv(theme),
    slots: props.ui
})

const ui = computed(() => {
    const styles = b({ color: props.color, type: props.type })
    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.customClass, props.ui?.root) }),
        container: (opts?: { class?: any }) => styles.container({ class: cn(opts?.class, props.ui?.container) }),
        indicator: (opts?: { class?: any }) => styles.indicator({ class: cn(opts?.class, props.ui?.indicator) }),
        spinnerItem: (opts?: { class?: any }) => styles.spinnerItem({ class: cn(opts?.class, props.ui?.spinnerItem) }),
        barItem: (opts?: { class?: any }) => styles.barItem({ class: cn(opts?.class, props.ui?.barItem) }),
        blockItem: (opts?: { class?: any }) => styles.blockItem({ class: cn(opts?.class, props.ui?.blockItem) }),
        waveItem: (opts?: { class?: any }) => styles.waveItem({ class: cn(opts?.class, props.ui?.waveItem) }),
        gooeyItem: (opts?: { class?: any }) => styles.gooeyItem({ class: cn(opts?.class, props.ui?.gooeyItem) }),
    }
})

</script>

<style>
/* Use non-scoped style for keyframes so Tailwind arbitrary values can find them */
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
</style>
