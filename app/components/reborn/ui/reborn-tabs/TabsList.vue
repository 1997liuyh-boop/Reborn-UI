<script setup lang="ts">
import { inject, ref, onMounted, watch, nextTick, computed } from 'vue'
import { useResizeObserver } from '@vueuse/core'

const context = inject('TabsContext') as any

const props = defineProps<{
    class?: any
}>()

const listRef = ref<HTMLElement | null>(null)
const indicatorStyle = ref({})

// --- Indicator logic ---
function updateIndicator() {
    if (!listRef.value) return

    const activeTab = listRef.value.querySelector('[data-state="active"]') as HTMLElement
    if (!activeTab) {
        indicatorStyle.value = {
            '--radix-tabs-indicator-position': '0px',
            '--radix-tabs-indicator-width': '0px',
            '--radix-tabs-indicator-height': '0px',
            opacity: 0
        }
        return
    }

    const listRect = listRef.value.getBoundingClientRect()
    const tabRect = activeTab.getBoundingClientRect()

    // Try to get the text span for precise width measurement
    const textSpan = activeTab.querySelector('[data-tab-text]') as HTMLElement
    const textRect = textSpan?.getBoundingClientRect() || tabRect

    const isHorizontal = context.orientation.value === 'horizontal'

    if (isHorizontal) {
        // Calculate position based on text span, centered under the text
        const left = textRect.left - listRect.left + listRef.value.scrollLeft
        indicatorStyle.value = {
            '--radix-tabs-indicator-position': `${left}px`,
            '--radix-tabs-indicator-width': `${textRect.width}px`,
            opacity: 1
        }
    } else {
        const top = tabRect.top - listRect.top + listRef.value.scrollTop
        indicatorStyle.value = {
            '--radix-tabs-indicator-position': `${top}px`,
            '--radix-tabs-indicator-height': `${tabRect.height}px`,
            opacity: 1
        }
    }
}

// --- Scrolling Logic ---
function scrollToActiveTab() {
    if (!listRef.value) return
    const activeTab = listRef.value.querySelector('[data-state="active"]') as HTMLElement
    if (!activeTab) return

    const isHorizontal = context.orientation.value === 'horizontal'

    // Simple centering logic
    if (isHorizontal) {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    } else {
        activeTab.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' })
    }
}

// Watchers
watch(() => context.modelValue.value, async () => {
    await nextTick()
    scrollToActiveTab()
    updateIndicator()
})

useResizeObserver(listRef, () => {
    updateIndicator()
})

onMounted(async () => {
    await nextTick()
    updateIndicator()
    // Initial scroll might not be needed if default is handled, but good to ensure
})

</script>

<template>
    <div ref="listRef" role="tablist" :class="context.ui.value.list({ class: $props.class })" :style="indicatorStyle">
        <slot></slot>
        <slot name="indicator" :style="indicatorStyle" :class="context.ui.value.indicator()">
            <span :class="context.ui.value.indicator()" aria-hidden="true"></span>
        </slot>
    </div>
</template>
