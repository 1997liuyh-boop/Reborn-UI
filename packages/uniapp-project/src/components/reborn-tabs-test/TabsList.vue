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

    const globalQuery = uni.createSelectorQuery(); // Try global first or in root?

    globalQuery.select(`${triggerId} .rb-tabs__trigger-inner`).boundingClientRect();
    globalQuery.select(triggerId).boundingClientRect(); // Fallback
    globalQuery.select(`#${context.rootId}-list`).boundingClientRect();


    globalQuery.exec((res) => {
        if (!res || res.length < 3) return;

        const innerRect = res[0] as UniApp.NodeInfo;
        const fallbackTriggerRect = res[1] as UniApp.NodeInfo;
        const listRect = res[2] as UniApp.NodeInfo;

        if (!fallbackTriggerRect || !listRect) return;
        const triggerRect = (innerRect && (innerRect.width ?? 0) > 0) ? innerRect : fallbackTriggerRect;


        const isHorizontal = context.orientation.value === "horizontal";

        if (isHorizontal) {

            uni.createSelectorQuery().in(instance).select(`#${context.rootId}-list`).scrollOffset((scrollRes) => {
                const res = scrollRes as any;
                const scrollLeft = res.scrollLeft || 0;
                const scrollTop = res.scrollTop || 0;

                const left = (triggerRect.left || 0) - (listRect.left || 0) + scrollLeft;
                const top = (triggerRect.top || 0) - (listRect.top || 0) + scrollTop;

                if (isHorizontal) {
                    indicatorStyle.value = {
                        '--radix-tabs-indicator-position': `${left}px`,
                        '--radix-tabs-indicator-width': `${triggerRect.width}px`,
                        opacity: 1
                    };
                } else {
                    indicatorStyle.value = {
                        '--radix-tabs-indicator-position': `${top}px`,
                        '--radix-tabs-indicator-height': `${triggerRect.height}px`,
                        opacity: 1
                    };
                }
            }).exec();
        } else {

            uni.createSelectorQuery().in(instance).select(`#${context.rootId}-list`).scrollOffset((scrollRes) => {
                const res = scrollRes as any;
                const scrollTop = res.scrollTop || 0;
                const top = (triggerRect.top || 0) - (listRect.top || 0) + scrollTop;

                indicatorStyle.value = {
                    '--radix-tabs-indicator-position': `${top}px`,
                    '--radix-tabs-indicator-height': `${triggerRect.height}px`,
                    opacity: 1
                };
            }).exec();
        }
    });
}

// --- Scrolling Logic ---
function scrollToActiveTab() {
    const activeIdx = context.activeIndex.value;
    scrollIntoId.value = `${context.rootId}-trigger-${activeIdx}`;
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
            <text :class="context.ui.value.indicator({ class: context.uiOverrides.value?.indicator })"
                aria-hidden="true" :style="indicatorStyle"></text>
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
