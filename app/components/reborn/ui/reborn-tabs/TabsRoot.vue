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
        // Manual mode handled by Trigger
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
    scrollspy,
    registerTrigger,
    registerContent,
    setActiveIndex,
    onTabClick,
    ui,
    uiOverrides,
    direction // Provide direction to context
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
