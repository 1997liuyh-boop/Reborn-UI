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
        const top = tabRect.top - listRect.top + listRef.value.scrollTop;
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

    if (isHorizontal) {
        // horizontal
        const containerWidth = container.clientWidth;
        const scrollLeft = container.scrollLeft;
        const tabLeft = activeTab.offsetLeft;
        const tabWidth = activeTab.offsetWidth;

        // Calculate target scroll position to center the tab
        const targetScrollLeft = tabLeft - (containerWidth / 2) + (tabWidth / 2);

        container.scrollTo({
            left: targetScrollLeft,
            behavior: "smooth"
        });
    } else {
        // vertical
        const containerHeight = container.clientHeight;
        const scrollTop = container.scrollTop;
        const tabTop = activeTab.offsetTop;
        const tabHeight = activeTab.offsetHeight;

        // Calculate target scroll position to center the tab
        const targetScrollTop = tabTop - (containerHeight / 2) + (tabHeight / 2);

        container.scrollTo({
            top: targetScrollTop,
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
