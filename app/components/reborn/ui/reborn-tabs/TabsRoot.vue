<script setup lang="ts">
import type { ClassValue } from "clsx";
import { computed, provide, ref, toRef } from "vue";
import { useVModel } from "@vueuse/core";
import { cn } from "~/lib/utils";
import { tv } from "~/lib/tv";
import theme, { tabsTypes, tabsVariants, tabsSizes, tabsOrientations } from "./reborn-tabs.config";

export interface TabsProps {
    active?: number
    defaultActive?: number
    type?: typeof tabsTypes[number]
    variant?: typeof tabsVariants[number]
    size?: typeof tabsSizes[number]
    orientation?: typeof tabsOrientations[number]
    sticky?: boolean
    swipeable?: boolean
    shrink?: boolean
    scrollspy?: boolean
    activationMode?: "automatic" | "manual"
    class?: ClassValue
    ui?: Partial<{
        root: ClassValue
        list: ClassValue
        indicator: ClassValue
        trigger: ClassValue
        leadingIcon: ClassValue
        leadingAvatar: ClassValue
        leadingAvatarSize: ClassValue
        label: ClassValue
        trailingBadge: ClassValue
        trailingBadgeSize: ClassValue
        content: ClassValue
    }>
}

const props = withDefaults(defineProps<TabsProps>(), {
    defaultActive: 0,
    type: "line",
    variant: "primary",
    size: "md",
    orientation: "horizontal",
    sticky: false,
    swipeable: false,
    shrink: false,
    scrollspy: false,
    activationMode: "automatic"
});

const emit = defineEmits<{
    (e: "update:active", value: number): void
    (e: "click-tab", value: number, event: MouseEvent): void
}>();

const activeIndex = useVModel(props, "active", emit, {
    defaultValue: props.defaultActive,
    passive: true,
});

const b = tv(theme);
const type = toRef(props, "type");
const variant = toRef(props, "variant");
const size = toRef(props, "size");
const orientation = toRef(props, "orientation");
const sticky = toRef(props, "sticky");
const swipeable = toRef(props, "swipeable");
const shrink = toRef(props, "shrink");
const scrollspy = toRef(props, "scrollspy");
const uiOverrides = computed(() => props.ui ?? {});

const ui = computed(() => b({
    type: type.value,
    variant: variant.value,
    size: size.value,
    orientation: orientation.value,
    sticky: sticky.value,
    shrink: shrink.value,
    scrollspy: scrollspy.value
}));

const triggerCounter = ref(0);
const contentCounter = ref(0);

function registerTrigger(index?: number) {
    if (typeof index === "number") {
        triggerCounter.value = Math.max(triggerCounter.value, index + 1);
        return index;
    }
    const value = triggerCounter.value;
    triggerCounter.value += 1;
    return value;
}

function registerContent(index?: number) {
    if (typeof index === "number") {
        contentCounter.value = Math.max(contentCounter.value, index + 1);
        return index;
    }
    const value = contentCounter.value;
    contentCounter.value += 1;
    return value;
}

const contentRefs = ref<Record<number, HTMLElement | null>>({});

function registerContentRef(index: number, el: HTMLElement | null) {
    contentRefs.value[index] = el;
}

function unregisterContentRef(index: number) {
    if (contentRefs.value[index]) {
        delete contentRefs.value[index];
    }
}



function getScrollParent(node: HTMLElement | null): HTMLElement | Window {
    if (typeof window === 'undefined' || !node) return { scrollTo: () => { } } as any;
    let parent = node.parentElement;
    while (parent) {
        const style = window.getComputedStyle(parent);
        const overflowY = style.overflowY;
        if (overflowY === 'auto' || overflowY === 'scroll') {
            return parent;
        }
        parent = parent.parentElement;
    }
    return window;
}

function scrollToContent(index: number) {
    if (typeof window === 'undefined') return;
    const el = contentRefs.value[index];
    if (!el) return;

    const scrollParent = getScrollParent(el);

    // 手动计算：
    const elRect = el.getBoundingClientRect();
    let currentScrollTop = 0;
    let parentRectTop = 0;

    if (scrollParent === window) {
        currentScrollTop = window.scrollY;
        parentRectTop = 0;
    } else {
        const p = scrollParent as HTMLElement;
        currentScrollTop = p.scrollTop;
        if (p.getBoundingClientRect) {
            parentRectTop = p.getBoundingClientRect().top;
        }
    }

    // 相对于滚动父元素顶部的目标位置
    const relativeTop = elRect.top - parentRectTop + currentScrollTop;

    // 从元素样式中读取 scroll-margin-top（在配置中定义）
    const style = window.getComputedStyle(el);
    const scrollMarginTop = parseFloat(style.scrollMarginTop) || 0;

    const target = relativeTop - scrollMarginTop;

    scrollParent.scrollTo({
        top: target,
        behavior: 'smooth'
    });
}

const direction = ref<'next' | 'prev'>('next');

function setActiveIndex(value: number) {
    const currentDefault = activeIndex.value ?? 0;
    if (value > currentDefault) {
        direction.value = 'next';
    } else if (value < currentDefault) {
        direction.value = 'prev';
    }
    activeIndex.value = value;
}

function onTabClick(value: number, event: MouseEvent) {
    if (props.activationMode === "manual") {
        // 手动模式由 Trigger 处理
    }
    emit("click-tab", value, event);
}


provide('TabsContext', {
    activeIndex,
    type,
    variant,
    size,
    orientation,
    swipeable,
    contentCounter,
    activationMode: toRef(props, "activationMode"),
    sticky,
    scrollspy,
    registerTrigger,
    registerContent,
    registerContentRef,
    unregisterContentRef,
    scrollToContent,
    setActiveIndex,
    onTabClick,
    ui,
    uiOverrides,
    direction // 向上下文提供方向
});

defineExpose({
    activeIndex
})
</script>

<template>
    <div :class="cn(ui.root(), uiOverrides.root, props.class)">
        <slot :ui="ui" :ui-overrides="uiOverrides"></slot>
    </div>
</template>
