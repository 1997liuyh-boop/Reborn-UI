<script setup lang="ts">
import { computed, provide, toRef } from 'vue'
// Re-trigger build
import { useVModel } from '@vueuse/core'
import { tv } from '~/lib/tv'
import theme, { tabsVariants, tabsSizes, tabsOrientations, tabsShrinkDirections } from './reborn-tabs.config'

export interface TabsProps {
    modelValue?: string | number
    defaultValue?: string | number
    variant?: typeof tabsVariants[number]
    size?: typeof tabsSizes[number]
    orientation?: typeof tabsOrientations[number]
    sticky?: boolean
    shrink?: boolean
    shrinkDir?: typeof tabsShrinkDirections[number]
    activationMode?: 'automatic' | 'manual'
    class?: any
    ui?: any
}

const props = withDefaults(defineProps<TabsProps>(), {
    variant: 'line',
    size: 'md',
    orientation: 'horizontal',
    sticky: false,
    shrink: false,
    shrinkDir: 'start',
    activationMode: 'automatic'
})

const emit = defineEmits<{
    (e: 'update:modelValue', value: string | number): void
    (e: 'click-tab', value: string | number, event: MouseEvent): void
}>()

const modelValue = useVModel(props, 'modelValue', emit, {
    defaultValue: props.defaultValue,
    passive: true
})

const b = tv(theme)
const variant = toRef(props, 'variant')
const size = toRef(props, 'size')
const orientation = toRef(props, 'orientation')
const sticky = toRef(props, 'sticky')
const shrink = toRef(props, 'shrink')
const shrinkDir = toRef(props, 'shrinkDir')

const ui = computed(() => b({
    variant: variant.value,
    size: size.value,
    orientation: orientation.value,
    sticky: sticky.value,
    shrink: shrink.value,
    shrinkDir: shrinkDir.value
}))

function onTabClick(value: string | number, event: MouseEvent) {
    if (props.activationMode === 'manual') {
        // Manual mode handled by Trigger
    }
    emit('click-tab', value, event)
}


provide('TabsContext', {
    modelValue,
    variant,
    orientation,
    activationMode: toRef(props, 'activationMode'),
    onTabClick,
    ui
})

defineExpose({
    modelValue
})
</script>

<template>
    <div :class="ui.base({ class: props.class })">
        <slot :ui="ui"></slot>
    </div>
</template>
