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

const isActive = computed(() => context.activeIndex.value === localIndex.value);
const isScrollspy = computed(() => context.scrollspy.value);
const stopObserver = ref<null | (() => void)>(null);

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

        const { stop } = useIntersectionObserver(
            contentRef,
            ([entry]) => {
                if (entry.isIntersecting) {
                    context.setActiveIndex(localIndex.value);
                }
            },
            {
                threshold: [0.1, 0.5],
                rootMargin: "-20% 0px -50% 0px"
            }
        );

        stopObserver.value = stop;
    },
    { immediate: true }
);

onBeforeUnmount(() => {
    stopObserver.value?.();
});
</script>

<template>
    <div ref="contentRef" v-show="isScrollspy || isActive" role="tabpanel"
        :data-state="isActive ? 'active' : 'inactive'" :data-index="localIndex"
        :class="context.ui.value.content({ class: cn(props.class, context.uiOverrides.value?.content) })">
        <slot></slot>
    </div>
</template>
