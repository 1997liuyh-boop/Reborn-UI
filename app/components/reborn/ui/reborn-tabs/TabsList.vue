<script setup lang="ts">
import { inject, ref, onMounted, watch, nextTick } from "vue";
import { useResizeObserver } from "@vueuse/core";
import { cn } from "~/lib/utils";

const context = inject("TabsContext") as any;

const props = defineProps<{
    class?: any
}>();

const listRef = ref<HTMLElement | null>(null);
const indicatorStyle = ref({});

// --- Indicator logic ---
function updateIndicator() {
    if (!listRef.value) return;

    const activeTab = listRef.value.querySelector('[data-state="active"]') as HTMLElement;
    if (!activeTab) {
        indicatorStyle.value = {
            '--radix-tabs-indicator-position': '0px',
            '--radix-tabs-indicator-width': '0px',
            '--radix-tabs-indicator-height': '0px',
            opacity: 0
        };
        return;
    }

    const listRect = listRef.value.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    // Try to get the text span for precise width measurement
    const textSpan = activeTab.querySelector('[data-tab-label]') as HTMLElement;
    const textRect = textSpan?.getBoundingClientRect() || tabRect;

    const isHorizontal = context.orientation.value === "horizontal";

    if (isHorizontal) {
        // Calculate position based on text span, centered under the text
        const left = textRect.left - listRect.left + listRef.value.scrollLeft;
        indicatorStyle.value = {
            '--radix-tabs-indicator-position': `${left}px`,
            '--radix-tabs-indicator-width': `${textRect.width}px`,
            opacity: 1
        };
    } else {
        const top = textRect.top - listRect.top + listRef.value.scrollTop
        indicatorStyle.value = {
            '--radix-tabs-indicator-position': `${top}px`,
            '--radix-tabs-indicator-height': `${tabRect.height}px`,
            opacity: 1
        };
    }
}

// --- Scrolling Logic ---
function scrollToActiveTab() {
    if (!listRef.value) return;
    const activeTab = listRef.value.querySelector('[data-state="active"]') as HTMLElement;
    if (!activeTab) return;

    const isHorizontal = context.orientation.value === "horizontal";
    const container = listRef.value;

    const listRect = listRef.value.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    if (isHorizontal) {
        // Horizontal: Calculate target scrollLeft to center the tab
        // relativeLeft = distance from left edge of container visible area
        const relativeLeft = tabRect.left - listRect.left;
        const centerOffset = (listRect.width - tabRect.width) / 2;
        const diff = relativeLeft - centerOffset;

        container.scrollTo({
            left: container.scrollLeft + diff,
            behavior: "smooth"
        });
    } else {
        // Vertical: Calculate target scrollTop to center the tab
        // relativeTop = distance from top edge of container visible area
        const relativeTop = tabRect.top - listRect.top;
        const centerOffset = (listRect.height - tabRect.height) / 2;
        const diff = relativeTop - centerOffset;

        container.scrollTo({
            top: container.scrollTop + diff,
            behavior: "smooth"
        });
    }
}

// Watchers
watch(() => context.activeIndex.value, async () => {
    await nextTick();
    scrollToActiveTab();
    updateIndicator();
});

useResizeObserver(listRef, () => {
    updateIndicator();
});

onMounted(async () => {
    await nextTick();
    scrollToActiveTab();
    updateIndicator();
    // Initial scroll might not be needed if default is handled, but good to ensure
});

</script>

<template>
    <div ref="listRef" role="tablist"
        :data-sticky-tabs="context.sticky.value || context.scrollspy.value ? 'true' : undefined"
        :class="context.ui.value.list({ class: cn(props.class, context.uiOverrides.value?.list) })"
        :style="indicatorStyle">
        <slot></slot>
        <slot name="indicator" :style="indicatorStyle"
            :class="context.ui.value.indicator({ class: context.uiOverrides.value?.indicator })">
            <span :class="context.ui.value.indicator({ class: context.uiOverrides.value?.indicator })"
                aria-hidden="true"></span>
        </slot>
    </div>
</template>
