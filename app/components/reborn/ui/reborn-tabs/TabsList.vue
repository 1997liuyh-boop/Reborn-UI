<script setup lang="ts">
import { inject, ref, onMounted, watch, nextTick } from "vue";
import { useResizeObserver } from "@vueuse/core";
import { cn } from "~/lib/utils";

const context = inject("TabsContext") as any;

const props = defineProps<{
    /** 追加到标签列表容器的自定义类名 */
    class?: any
}>();

const listRef = ref<HTMLElement | null>(null);
const indicatorStyle = ref({});

// --- 指示器逻辑 ---
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

    // 尝试获取文本 span 以进行精确的宽度测量
    const textSpan = activeTab.querySelector('[data-tab-label]') as HTMLElement;
    const textRect = textSpan?.getBoundingClientRect() || tabRect;

    const isHorizontal = context.orientation.value === "horizontal";

    if (isHorizontal) {
        // 根据文本 span 计算位置，居中显示在文本下方
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

// --- 滚动逻辑 ---
function scrollToActiveTab() {
    if (!listRef.value) return;
    const activeTab = listRef.value.querySelector('[data-state="active"]') as HTMLElement;
    if (!activeTab) return;

    const isHorizontal = context.orientation.value === "horizontal";
    const container = listRef.value;

    const listRect = listRef.value.getBoundingClientRect();
    const tabRect = activeTab.getBoundingClientRect();

    if (isHorizontal) {
        // 水平：计算目标 scrollLeft 以使选项卡居中
        // relativeLeft = 距离容器可见区域左边缘的距离
        const relativeLeft = tabRect.left - listRect.left;
        const centerOffset = (listRect.width - tabRect.width) / 2;
        const diff = relativeLeft - centerOffset;

        container.scrollTo({
            left: container.scrollLeft + diff,
            behavior: "smooth"
        });
    } else {
        // 垂直：计算目标 scrollTop 以使选项卡居中
        // relativeTop = 距离容器可见区域上边缘的距离
        const relativeTop = tabRect.top - listRect.top;
        const centerOffset = (listRect.height - tabRect.height) / 2;
        const diff = relativeTop - centerOffset;

        container.scrollTo({
            top: container.scrollTop + diff,
            behavior: "smooth"
        });
    }
}

// 监听器
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
    // 如果处理了默认值，可能不需要初始滚动，但为了确保万一
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
