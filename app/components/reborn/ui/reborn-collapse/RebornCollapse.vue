<script lang="ts">
import type { ClassValue } from 'tailwind-variants'

export interface RebornCollapseProps {
    disabled?: boolean
    position?: 'bottom' | 'top'
    absolute?: boolean
    customClass?: ClassValue
    ui?: {
        root?: ClassValue
        trigger?: ClassValue
        content?: ClassValue
    }
}
</script>
<script setup lang="ts">
import { computed, ref, onBeforeUnmount } from 'vue'
import { cn } from '@/lib/utils'
import { tv } from '@/lib/tv'
import theme from './reborn-collapse.config'

const props = withDefaults(defineProps<RebornCollapseProps>(), {
    disabled: false,
    position: 'bottom',
    absolute: false,
    customClass: '',
    ui: () => ({})
})

const collapse = defineModel("modelValue", {
    type: Boolean,
    default: false
})
const emit = defineEmits<{
    (e: 'toggle', value: boolean): void
}>()

const b = tv(theme)
const ui = computed(() => b({
    open: collapse.value,
    position: props.position,
    absolute: props.absolute,
    animating: isAnimating.value
}))
const overrides = computed(() => props.ui || {})

const isAnimating = ref(false)
let animatingTimer: ReturnType<typeof setTimeout> | null = null
const ANIMATION_DURATION = 300

function markAnimating() {
    isAnimating.value = true
    if (animatingTimer) clearTimeout(animatingTimer)
    animatingTimer = setTimeout(() => {
        isAnimating.value = false
        animatingTimer = null
    }, ANIMATION_DURATION)
}

function show() { collapse.value = true; markAnimating() }
function hide() { collapse.value = false; markAnimating() }

function toggle() {
    if (props.disabled) return
    if (collapse.value) { hide() } else { show() }
    emit('toggle', collapse.value)
}

function resize() { }

onBeforeUnmount(() => {
    if (animatingTimer) clearTimeout(animatingTimer)
})

defineExpose({ show, hide, toggle, resize, isAnimating })
</script>

<template>
    <div :class="ui.root({ class: cn(props.customClass, overrides?.root) })">
        <div v-if="position === 'top'" :class="ui.trigger({ class: overrides?.trigger })">
            <div :class="cn(ui.content({ class: overrides?.content }))">
                <slot name="content" />
            </div>
        </div>

        <div @click="toggle">
            <slot :open="collapse" />
        </div>

        <div v-if="position === 'bottom'" :class="ui.trigger({ class: overrides?.trigger })">
            <div :class="cn(ui.content({ class: overrides?.content }))">
                <slot name="content" />
            </div>
        </div>
    </div>
</template>
