<script setup lang="ts">
import { inject, computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useIntersectionObserver } from "@vueuse/core";
import { cn } from "~/lib/utils";

const props = defineProps<{
    index?: number
    class?: any
}>();

const context = inject("TabsContext") as any;
const localIndex = ref<number>(context.registerContent(props.index));
const contentRef = ref<HTMLElement | null>(null);

// Direction logic:
// Horizontal: Next -> Slide Left (Enter from Right)
// Vertical: Next -> Slide Up (Enter from Bottom)

const transitionName = computed(() => {
    if (isScrollspy.value) return undefined;

    const isVertical = context.orientation.value === 'vertical';
    const dir = context.direction.value;

    if (isVertical) {
        return dir === 'next' ? 'tabs-slide-up' : 'tabs-slide-down';
    }
    return dir === 'next' ? 'tabs-slide-left' : 'tabs-slide-right';
});

// Fix overflow flashing by ensuring the parent container clips content.
// Ideally, this should be on the TabsRoot, but we can try to enforce it here or suggest it.
// Since we can't easily change the parent, we'll try to rely on the global config change for overflow.
// However, ensuring the leaving element is absolute is key.


const isActive = computed(() => context.activeIndex.value === localIndex.value);
const isScrollspy = computed(() => context.scrollspy.value);
const stopObserver = ref<null | (() => void)>(null);

import { usePointerSwipe } from "@vueuse/core";

const { distanceX, distanceY } = usePointerSwipe(contentRef, {
    disableTextSelect: true,
    onSwipeEnd(e: PointerEvent, direction) {
        if (!context.swipeable.value) return;

        console.log('Swipe Debug:', { direction, dx: distanceX.value, dy: distanceY.value });

        const isHorizontal = context.orientation.value === 'horizontal';
        const isVertical = context.orientation.value === 'vertical';
        const maxIndex = context.contentCounter.value;
        const currentIndex = context.activeIndex.value;

        // Define threshold for swipe (e.g., 50px)
        const threshold = 50;

        if (isHorizontal) {
            if (direction === 'left' && Math.abs(distanceX.value) > threshold) {
                // Swiping Left -> Next Tab
                if (currentIndex < maxIndex - 1) {
                    context.setActiveIndex(currentIndex + 1);
                }
            } else if (direction === 'right' && Math.abs(distanceX.value) > threshold) {
                // Swiping Right -> Prev Tab
                if (currentIndex > 0) {
                    context.setActiveIndex(currentIndex - 1);
                }
            }
        } else if (isVertical) {
            if (direction === 'up' && Math.abs(distanceY.value) > threshold) {
                // Swiping Up -> Next Tab
                if (currentIndex < maxIndex - 1) {
                    context.setActiveIndex(currentIndex + 1);
                }
            } else if (direction === 'down' && Math.abs(distanceY.value) > threshold) {
                // Swiping Down -> Prev Tab
                if (currentIndex > 0) {
                    context.setActiveIndex(currentIndex - 1);
                }
            }
        }
    },
});

// Helper to find scroll parent
function getScrollParent(node: HTMLElement | null): HTMLElement | Document | null {
    if (typeof window === 'undefined' || !node) return null;
    let parent = node.parentElement;
    while (parent) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
            return parent;
        }
        parent = parent.parentElement;
    }
    return document; // Use document/viewport if no scroll parent
}

watch(
    isScrollspy,
    async (enabled) => {
        if (!enabled) {
            stopObserver.value?.();
            stopObserver.value = null;
            return;
        }

        await nextTick();
        if (!contentRef.value) return;

        // Find the scroll container (the wrapper div)
        const scrollParent = getScrollParent(contentRef.value);

        const { stop } = useIntersectionObserver(
            contentRef,
            (entries) => {
                const entry = entries[0];
                if (entry?.isIntersecting) {
                    context.setActiveIndex(localIndex.value);
                }
            },
            {
                root: scrollParent === document ? null : scrollParent as HTMLElement,
                threshold: [0, 0.1, 0.2, 1], // Better threshold as requested
                rootMargin: "-40% 0px -55% 0px" // Adjusted margin as requested
            }
        );

        stopObserver.value = stop;
    },
    { immediate: true }
);

watch(contentRef, (el) => {
    if (localIndex.value !== undefined) {
        if (el) {
            context.registerContentRef(localIndex.value, el);
        } else {
            context.unregisterContentRef(localIndex.value);
        }
    }
}, { immediate: true });

onBeforeUnmount(() => {
    stopObserver.value?.();
    if (localIndex.value !== undefined) {
        context.unregisterContentRef(localIndex.value);
    }
});
</script>

<template>
    <div ref="contentRef" v-show="isScrollspy || isActive" role="tabpanel"
        :data-state="isActive ? 'active' : 'inactive'" :data-index="localIndex"
        :class="context.ui.value.content({ class: cn(props.class, context.uiOverrides.value?.content) })">
        <slot></slot>
    </div>
</template>