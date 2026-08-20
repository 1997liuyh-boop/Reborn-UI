<script setup lang="ts">
import { inject, computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { useIntersectionObserver } from "@vueuse/core";
import { cn } from "~/lib/utils";

const props = defineProps<{
    index?: number
    /** 追加到内容面板的自定义类名 */
    class?: any
}>();

const context = inject("TabsContext") as any;
const localIndex = ref<number>(context.registerContent(props.index));
const contentRef = ref<HTMLElement | null>(null);

// 方向逻辑：
// 水平：下一个 -> 向左滑动（从右侧进入）
// 垂直：下一个 -> 向上滑动（从底部进入）

const transitionName = computed(() => {
    if (isScrollspy.value) return undefined;

    const isVertical = context.orientation.value === 'vertical';
    const dir = context.direction.value;

    if (isVertical) {
        return dir === 'next' ? 'tabs-slide-up' : 'tabs-slide-down';
    }
    return dir === 'next' ? 'tabs-slide-left' : 'tabs-slide-right';
});

// 通过确保父容器裁剪内容来修复溢出闪烁。
// 理想情况下，这应该在 TabsRoot 上，但我们可以尝试在这里强制执行或提出建议。
// 由于我们无法轻易更改父级，我们将尝试依赖全局配置更改来处理溢出。
// 然而，确保离开的元素是绝对定位是关键。


const isActive = computed(() => context.activeIndex.value === localIndex.value);
const isScrollspy = computed(() => context.scrollspy.value);
const stopObserver = ref<null | (() => void)>(null);

import { usePointerSwipe } from "@vueuse/core";

const { distanceX, distanceY } = usePointerSwipe(contentRef, {
    disableTextSelect: true,
    onSwipeEnd(e: PointerEvent, direction) {
        if (!context.swipeable.value) return;

        const isHorizontal = context.orientation.value === 'horizontal';
        const isVertical = context.orientation.value === 'vertical';
        const maxIndex = context.contentCounter.value;
        const currentIndex = context.activeIndex.value;

        // 定义滑动手势阈值（例如 50px）
        const threshold = 50;

        if (isHorizontal) {
            if (direction === 'left' && Math.abs(distanceX.value) > threshold) {
                // 向左滑动 -> 下一个选项卡
                if (currentIndex < maxIndex - 1) {
                    context.setActiveIndex(currentIndex + 1);
                }
            } else if (direction === 'right' && Math.abs(distanceX.value) > threshold) {
                // 向右滑动 -> 上一个选项卡
                if (currentIndex > 0) {
                    context.setActiveIndex(currentIndex - 1);
                }
            }
        } else if (isVertical) {
            if (direction === 'up' && Math.abs(distanceY.value) > threshold) {
                // 向上滑动 -> 下一个选项卡
                if (currentIndex < maxIndex - 1) {
                    context.setActiveIndex(currentIndex + 1);
                }
            } else if (direction === 'down' && Math.abs(distanceY.value) > threshold) {
                // 向下滑动 -> 上一个选项卡
                if (currentIndex > 0) {
                    context.setActiveIndex(currentIndex - 1);
                }
            }
        }
    },
});

// 用于查找滚动父元素的辅助函数
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
    return document; // 如果没有滚动父元素，则使用 document/viewport
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

        // 查找滚动容器（包装器 div）
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
                threshold: [0, 0.1, 0.2, 1], // 根据要求提供更好的阈值
                rootMargin: "-40% 0px -55% 0px" // 根据要求调整边距
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