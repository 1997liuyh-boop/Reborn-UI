<template>
    <div ref="wrapperRef" class="reborn-sticky-wrapper" :class="ui.wrapper()" :style="{
        height: isSticky ? rect.height + 'px' : 'auto',
        zIndex: isSticky ? zIndex : 'auto'
    }">
        <div ref="contentRef" :class="ui.content()" :style="{
            width: isSticky ? rect.width + 'px' : '100%',
            left: isSticky ? rect.left + 'px' : 0,
            top: stickyTop + 'px'
        }">
            <slot :is-sticky="isSticky"></slot>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed, ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { tv } from 'tailwind-variants';
import { useWindowScroll, useElementBounding, useResizeObserver } from '@vueuse/core';
import theme from './reborn-sticky.config';

defineOptions({
    name: "RebornSticky"
});

defineSlots<{
    default(props: { isSticky: boolean }): any;
}>();

export interface RebornStickyProps {
    // 吸顶偏移量, 单位px
    offsetTop?: number;
    // 层级
    zIndex?: number;
    // 是否需要减去导航栏高度
    isNeedNavbarHeight?: boolean;
    // 导航栏高度
    navbarHeight?: number;
}

const props = withDefaults(defineProps<RebornStickyProps>(), {
    offsetTop: 0,
    zIndex: 100,
    isNeedNavbarHeight: true,
    navbarHeight: 0 // Default for web might be 0 unless there's a fixed header
});

const b = tv(theme);

const wrapperRef = ref<HTMLElement | null>(null);

// Use VueUse for scroll and bounding
const { y: scrollTop } = useWindowScroll();
const { top: wrapperTop, height: wrapperHeight, width: wrapperWidth, left: wrapperLeft, update: updateRect } = useElementBounding(wrapperRef);

// Reactive rect to store wrapper dimensions when sticky starts
const rect = reactive({
    height: 0,
    width: 0,
    left: 0,
    top: 0
});

// Threshold for becoming sticky
const stickyThreshold = computed(() => {
    let offset = props.offsetTop;
    if (props.isNeedNavbarHeight) {
        offset += props.navbarHeight;
    }
    return offset;
});

// Determine if sticky
const isSticky = computed(() => {
    if (!wrapperRef.value) return false;
    return wrapperTop.value <= stickyThreshold.value;
});

// 监听吸顶状态变化，更新尺寸
watch(isSticky, (newValue) => {
    if (newValue) {
        rect.height = wrapperHeight.value;
        rect.width = wrapperWidth.value;
        rect.left = wrapperLeft.value;
        rect.top = wrapperTop.value + scrollTop.value;
    }
});

// 监听内容尺寸变化，实时更新占位高度
useResizeObserver(wrapperRef, () => {
    if (isSticky.value) {
        rect.height = wrapperHeight.value;
        rect.width = wrapperWidth.value;
        rect.left = wrapperLeft.value;
    }
});

const ui = computed(() => {
    const styles = b({
        sticky: isSticky.value
    });
    return {
        wrapper: () => styles.wrapper(),
        content: () => styles.content(),
    };
});

const stickyTop = computed(() => {
    return isSticky.value ? stickyThreshold.value : 0;
});

</script>
