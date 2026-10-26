<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '~/lib/utils'
import rebornMarquee, { type RebornMarqueeOrientation, type RebornMarqueeUI } from './reborn-marquee.config'

export interface RebornMarqueeProps {
    class?: any
    reverse?: boolean
    pauseOnHover?: boolean
    vertical?: boolean
    orientation?: RebornMarqueeOrientation
    repeat?: number
    overlay?: boolean
    ui?: RebornMarqueeUI
}

const props = withDefaults(defineProps<RebornMarqueeProps>(), {
    reverse: false,
    pauseOnHover: false,
    vertical: false,
    orientation: 'horizontal',
    repeat: 4,
    overlay: true,
    ui: () => ({}),
})

defineSlots<{
    default(props: { ui: any }): any
}>()

const resolvedOrientation = computed<RebornMarqueeOrientation>(() => {
    return props.vertical ? 'vertical' : props.orientation
})

// 悬停暂停只靠 config 里的 group-hover 类实现，不再用 JS 记录悬停状态：内联值压不过 !important，悬停变化还会触发重渲染
const contentStyle = computed(() => ({
    animationDirection: props.reverse ? 'reverse' : 'normal',
}))

const ui = computed(() => {
    const styles = rebornMarquee({
        orientation: resolvedOrientation.value,
        pauseOnHover: props.pauseOnHover,
    })

    return {
        root: (opts?: { class?: any }) => styles.root({ class: cn(opts?.class, props.ui.root) }),
        content: (opts?: { class?: any }) => styles.content({ class: cn(opts?.class, props.ui.content) }),
        overlayStart: (opts?: { class?: any }) => styles.overlayStart({ class: cn(opts?.class, props.ui.overlayStart) }),
        overlayEnd: (opts?: { class?: any }) => styles.overlayEnd({ class: cn(opts?.class, props.ui.overlayEnd) }),
    }
})
</script>

<template>
    <div
        :class="cn(ui.root({ class: props.class }), props.pauseOnHover ? 'cursor-pointer' : '')"
        :data-orientation="resolvedOrientation"
    >
        <div
            v-for="index in repeat"
            :key="index"
            :class="ui.content()"
            :style="contentStyle"
        >
            <slot :ui="ui" />
        </div>

        <div v-if="overlay" aria-hidden="true" :class="ui.overlayStart()" />
        <div v-if="overlay" aria-hidden="true" :class="ui.overlayEnd()" />
    </div>
</template>

<style scoped>
.animate-marquee {
    animation: marquee var(--duration) linear infinite;
}

.animate-marquee-vertical {
    animation: marquee-vertical var(--duration) linear infinite;
}

@keyframes marquee {
    from {
        transform: translate3d(0, 0, 0);
    }

    to {
        transform: translate3d(calc(-100% - var(--gap)), 0, 0);
    }
}

@keyframes marquee-vertical {
    from {
        transform: translate3d(0, 0, 0);
    }

    to {
        transform: translate3d(0, calc(-100% - var(--gap)), 0);
    }
}
</style>
