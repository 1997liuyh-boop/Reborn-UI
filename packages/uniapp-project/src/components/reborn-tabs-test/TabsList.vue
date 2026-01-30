<script setup lang="ts">
import { inject, ref, onMounted, watch, nextTick, getCurrentInstance } from "vue";
// import { useResizeObserver } from "@vueuse/core"; // Removed non-uniapp compatible observer
import { cn } from "@/lib/utils";

const context = inject("TabsContext") as any;

const props = defineProps<{
    customClass?: any
}>();

const instance = getCurrentInstance();
const indicatorStyle = ref({});
const scrollIntoId = ref("");

// --- Indicator logic ---
function updateIndicator() {

    const activeIdx = context.activeIndex.value;
    const triggerId = `#${context.rootId}-trigger-${activeIdx}`;
    const query = uni.createSelectorQuery().in(instance);
    query.select(`${triggerId} .rb-tabs__trigger-inner`).boundingClientRect();
    query.select(triggerId).boundingClientRect(); // Fallback
    query.select(`#${context.rootId}-list`).boundingClientRect();
    query.select(`#${context.rootId}-list`).scrollOffset();

    query.exec((res) => {
        if (!res || res.length < 4) return;

        const innerRect = res[0] as UniApp.NodeInfo;
        const fallbackTriggerRect = res[1] as UniApp.NodeInfo;
        const listRect = res[2] as UniApp.NodeInfo;
        const scrollRes = res[3] as any;

        if (!fallbackTriggerRect || !listRect) return;
        const triggerRect = (innerRect && (innerRect.width ?? 0) > 0) ? innerRect : fallbackTriggerRect;

        const isHorizontal = context.orientation.value === "horizontal";
        const scrollLeft = scrollRes?.scrollLeft || 0;
        const scrollTop = scrollRes?.scrollTop || 0;

        if (isHorizontal) {
            const left = (triggerRect.left || 0) - (listRect.left || 0) + scrollLeft;
            indicatorStyle.value = {
                '--radix-tabs-indicator-position': `${left}px`,
                '--radix-tabs-indicator-width': `${triggerRect.width}px`,
                opacity: 1
            };
        } else {
            const top = (triggerRect.top || 0) - (listRect.top || 0) + scrollTop;
            indicatorStyle.value = {
                '--radix-tabs-indicator-position': `${top}px`,
                '--radix-tabs-indicator-height': `${triggerRect.height}px`,
                opacity: 1
            };
        }
    });
}

// --- Scrolling Logic ---
function scrollToActiveTab() {
    const activeIdx = context.activeIndex.value;
    const nextId = `${context.rootId}-trigger-${activeIdx}`;
    if (scrollIntoId.value === nextId) {
        scrollIntoId.value = "";
        nextTick(() => {
            scrollIntoId.value = nextId;
        });
        return;
    }
    scrollIntoId.value = nextId;
}

// Watchers
watch(() => context.activeIndex.value, async () => {
    await nextTick();
    setTimeout(() => {
        scrollToActiveTab();
        updateIndicator();
    }, 50);
});

onMounted(async () => {
    await nextTick();
    setTimeout(() => {
        scrollToActiveTab();
        updateIndicator();
    }, 100);
});


</script>

<template>
    <scroll-view :id="`${context.rootId}-list`" :scroll-x="context.orientation.value === 'horizontal'"
        :scroll-y="context.orientation.value === 'vertical'" :scroll-into-view="scrollIntoId" scroll-with-animation
        role="tablist" :enable-flex="true"
        :data-sticky-tabs="context.sticky.value || context.scrollspy.value ? 'true' : undefined"
        :class="context.ui.value.list({ class: cn(props.customClass, context.uiOverrides.value?.list) })"
        :style="indicatorStyle">
        <slot></slot>
        <slot name="indicator" :style="indicatorStyle"
            :class="context.ui.value.indicator({ class: context.uiOverrides.value?.indicator })">
            <view :class="context.ui.value.indicator({ class: context.uiOverrides.value?.indicator })"
                aria-hidden="true" :style="indicatorStyle"></view>
        </slot>
    </scroll-view>
</template>

<style scoped>
:deep(::-webkit-scrollbar) {
    display: none;
    width: 0;
    height: 0;
}

:deep(.uni-scroll-view-content) {
    display: flex;
}
</style>
