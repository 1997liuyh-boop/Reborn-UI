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
    // In UniApp, we must use createSelectorQuery
    // We need to measure the List relative to the active Trigger.
    // Or rather the Active Trigger relative to the List.
    const activeIdx = context.activeIndex.value;
    const triggerId = `#${context.rootId}-trigger-${activeIdx}`;

    // We assume the root of TabsList has a specific class or ID we can target if needed, 
    // but better to target the trigger directly and the list container.
    // However, in UniApp customized component, selecting 'in(instance)' is best.

    const query = uni.createSelectorQuery().in(instance);

    // Select the List container (this component's root or the scroll-view)
    // Select the List container (this component's root or the scroll-view)
    // query.select(`#${context.rootId}-list`).boundingClientRect(); // legacy check

    // Select the active trigger (inside the slot)
    // Note: Since Trigger is in a SLOT, selection might be tricky if it's not part of this component's shadow DOM.
    // But in Vue/UniApp MP, slots are part of the page/parent usually. 
    // Wait, if TabsList is a component, and Trigger is passed in slot, 
    // `query.in(instance)` might NOT find the trigger if it is not in `TabsList`'s template?
    // Actually, in default slot, it IS children.
    // If it fails, we might need to query from the Page context or ask `TabsRoot` to query?
    // Let's try `in(instance)` first, if that fails, we might need a workaround.
    // Another approach: coordinate via TabsRoot. Note that Refs don't work across slots comfortably in MP.
    // Trying global selection (without .in(instance)) might work if IDs are unique.

    const globalQuery = uni.createSelectorQuery(); // Try global first or in root?
    // actually `uni.createSelectorQuery()` in a component is scoped to component? No.
    // Without `in`, it is global in H5, but page-scoped in MP.

    // Select the active trigger content wrapper if available, otherwise fallback to trigger.
    // In UniApp, we can try selecting the descendant.
    // If we select `#id .class`, it should work.

    // Changing logic: Query BOTH the trigger and the inner content.
    // If inner content exists, use it. If not, use trigger.
    // But `exec` returns array order.

    // Let's select the inner content primarily.
    globalQuery.select(`${triggerId} .rb-tabs__trigger-inner`).boundingClientRect();
    globalQuery.select(triggerId).boundingClientRect(); // Fallback
    globalQuery.select(`#${context.rootId}-list`).boundingClientRect();


    globalQuery.exec((res) => {
        if (!res || res.length < 3) {
            // If array length is small, maybe inner query failed or elements not ready.
            // We expect [innerRect, triggerRect, listRect].
            // If innerRect is null, we use triggerRect.
            return;
        }

        const innerRect = res[0] as UniApp.NodeInfo;
        const fallbackTriggerRect = res[1] as UniApp.NodeInfo; // Was triggerRect
        const listRect = res[2] as UniApp.NodeInfo;

        if (!fallbackTriggerRect || !listRect) return; // Critical elements missing

        // Prefer innerRect if valid (width > 0), else use triggerRect
        const triggerRect = (innerRect && (innerRect.width ?? 0) > 0) ? innerRect : fallbackTriggerRect;


        const isHorizontal = context.orientation.value === "horizontal";

        if (isHorizontal) {
            // Relative left: trigger.left - list.left
            // However, if list is scrolled, `list.left` is visible window.
            // `trigger.left` is also visible window.
            // So `trigger.left - list.left` is the visual offset from left edge.
            // But for `indicator` (which is likely inside the scroll-view?), 
            // we want position relative to the CONTENT start.
            // If indicator is `absolute` inside `relative` list, it moves with scroll.
            // So we need `visual offset + current scroll-left`.

            // To get current scroll-left? We can listen to scroll event or query it.
            // Let's query scroll offset of the list.

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
            // Vertical logic similar
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
    // Use scroll-into-view
    // The ID to scroll to is the trigger ID
    const activeIdx = context.activeIndex.value;
    scrollIntoId.value = `${context.rootId}-trigger-${activeIdx}`;
}

// Watchers
watch(() => context.activeIndex.value, async () => {
    // Wait for DOM update
    await nextTick();
    // In MP, sometimes need double tick or slight delay
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

// Since we removed ResizeObserver, we might want to listen to window resize? 
// Or just rely on updates.

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

/* Ensure scroll view content container behaves correctly for flex items */
:deep(.uni-scroll-view-content) {
    display: flex;
}
</style>
