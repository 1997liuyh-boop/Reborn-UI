<script setup lang="ts">
import { inject, computed } from 'vue'

const props = defineProps<{
    value: string | number
    disabled?: boolean
    class?: any
}>()

const context = inject('TabsContext') as any

const isActive = computed(() => context.modelValue.value === props.value)

function handleClick(event: MouseEvent) {
    if (props.disabled) return

    context.modelValue.value = props.value
    context.onTabClick(props.value, event)

    const target = event.target as HTMLElement
    // Ensure we are scrolling the button itself
    const button = target.closest('button')
    if (button) {
        button.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'center'
        })
    }
}

function handleKeydown(event: KeyboardEvent) {
    if (props.disabled) return

    // Basic keyboard support could normally go here (Arrow keys), 
    // but typically requires managing focus across the list.
    // Given the constraints and usage, we might rely on default browser behavior + click.
    // For Reka parity, focusing next/prev ref in list would be needed.
    // For now, implementing basic focus triggering for 'automatic' mode if we were managing focus.
}
</script>

<template>
    <button type="button" role="tab" :aria-selected="isActive" :tabindex="isActive ? 0 : -1" :disabled="props.disabled"
        :data-state="isActive ? 'active' : 'inactive'" :data-orientation="context.orientation.value"
        :class="context.ui.value.trigger({ class: props.class })" @click="handleClick" @keydown="handleKeydown">
        <span data-tab-text class="relative z-30">
            <slot></slot>
        </span>
    </button>
</template>
