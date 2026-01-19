<script setup lang="ts">
import { inject, computed, nextTick, onBeforeUnmount, ref, watch, getCurrentInstance } from "vue";
import { cn } from "@/lib/utils";

const props = defineProps<{
    index?: number
    class?: any
}>();

const context = inject("TabsContext") as any;
const localIndex = ref<number>(context.registerContent(props.index));
const instance = getCurrentInstance();

// Register ID for scroll handling (if page scroll logic is used)
const contentId = computed(() => `${context.rootId}-content-${localIndex.value}`);
watch(contentId, (id) => {
    if (localIndex.value !== undefined) {
        context.registerContentId(localIndex.value, id);
    }
}, { immediate: true });

// Direction logic
const transitionName = computed(() => {
    if (isScrollspy.value) return undefined;

    const isVertical = context.orientation.value === 'vertical';
    const dir = context.direction.value;

    if (isVertical) {
        return dir === 'next' ? 'tabs-slide-up' : 'tabs-slide-down';
    }
    return dir === 'next' ? 'tabs-slide-left' : 'tabs-slide-right';
});

const isActive = computed(() => context.activeIndex.value === localIndex.value);
const isScrollspy = computed(() => context.scrollspy.value);
let observer: UniApp.IntersectionObserver | null = null;

// --- Swipe Logic ---
let startX = 0;
let startY = 0;

function onTouchStart(e: any) {
    if (!context.swipeable.value) return;
    if (e.changedTouches && e.changedTouches.length > 0) {
        startX = e.changedTouches[0].clientX;
        startY = e.changedTouches[0].clientY;
    }
}

function onTouchEnd(e: any) {
    if (!context.swipeable.value) return;
    if (e.changedTouches && e.changedTouches.length > 0) {
        const endX = e.changedTouches[0].clientX;
        const endY = e.changedTouches[0].clientY;
        const dx = endX - startX;
        const dy = endY - startY;
        const threshold = 50;

        const isHorizontal = context.orientation.value === 'horizontal';
        const isVertical = context.orientation.value === 'vertical';
        const maxIndex = context.contentCounter.value;
        const currentIndex = context.activeIndex.value;

        if (isHorizontal) {
            if (Math.abs(dx) > threshold && Math.abs(dy) < threshold) { // horizontal swipe
                if (dx < 0) {
                    // Swipe Left -> Next
                    if (currentIndex < maxIndex - 1) context.setActiveIndex(currentIndex + 1);
                } else {
                    // Swipe Right -> Prev
                    if (currentIndex > 0) context.setActiveIndex(currentIndex - 1);
                }
            }
        } else if (isVertical) {
            if (Math.abs(dy) > threshold && Math.abs(dx) < threshold) {
                if (dy < 0) {
                    // Swipe Up -> Next
                    if (currentIndex < maxIndex - 1) context.setActiveIndex(currentIndex + 1);
                } else {
                    // Swipe Down -> Prev
                    if (currentIndex > 0) context.setActiveIndex(currentIndex - 1);
                }
            }
        }
    }
}


watch(
    isScrollspy,
    async (enabled) => {
        if (!enabled) {
            if (observer) {
                observer.disconnect();
                observer = null;
            }
            return;
        }

        await nextTick();

        // In UniApp, we create observer from the instance
        if (observer) observer.disconnect();

        observer = uni.createIntersectionObserver(instance);

        // We observe relative to viewport (or a scroll view if we knew it).
        // Since we don't know the scroll parent, observing relative to viewport is safest default for scrollspy.
        observer.relativeToViewport({ bottom: -100 }); // Adjust margins as needed
        observer.observe(`#${contentId.value}`, (res) => {
            if (res.intersectionRatio > 0) {
                // intersection
                // If we have multiple contents intersecting, the last one usually wins or the first one?
                // Simple logic: if intersecting, set active.
                // Debounce might be needed if scrolling fast.
                context.setActiveIndex(localIndex.value);
            }
        });
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    if (observer) observer.disconnect();
    if (localIndex.value !== undefined) {
        context.unregisterContentId(localIndex.value);
    }
});
</script>

<template>
    <view :id="contentId" v-show="isScrollspy || isActive" role="tabpanel"
        :data-state="isActive ? 'active' : 'inactive'" :data-index="localIndex"
        :class="context.ui.value.content({ class: cn(props.class, context.uiOverrides.value?.content) })"
        @touchstart="onTouchStart" @touchend="onTouchEnd">
        <slot></slot>
    </view>
</template>