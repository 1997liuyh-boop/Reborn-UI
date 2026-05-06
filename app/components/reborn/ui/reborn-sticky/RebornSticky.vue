<template>
    <!-- 包装器容器：负责占位，防止吸顶时页面内容跳动 -->
    <div ref="wrapperRef" class="reborn-sticky-wrapper" :class="ui.wrapper()" :style="{
        height: isSticky ? rect.height + 'px' : 'auto',
        zIndex: isSticky ? zIndex : 'auto'
    }">
        <!-- 实际内容容器：负责执行吸顶定位 -->
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
import { computed, ref, reactive, watch } from 'vue';
import { tv } from 'tailwind-variants';
import { useWindowScroll, useElementBounding, useResizeObserver, useEventListener } from '@vueuse/core';
import theme from './reborn-sticky.config';

defineOptions({
    name: "RebornSticky"
});

/**
 * 插槽定义
 * @slot default 默认插槽，返回当前是否处于吸顶状态
 */
defineSlots<{
    default(props: { isSticky: boolean }): any;
}>();

/**
 * 事件定义
 * @event change 当吸顶状态发生改变时触发
 * @event resize 当组件尺寸或位置发生改变时触发
 */
const emit = defineEmits<{
    (e: 'change', isSticky: boolean): void;
    (e: 'resize', rect: { height: number; width: number; left: number; top: number }): void;
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
    navbarHeight: 0 // Web 端默认值通常为 0，除非存在固定的导航栏
});

const b = tv(theme);

const wrapperRef = ref<HTMLElement | null>(null);

const contentRef = ref<HTMLElement | null>(null);

// 使用 VueUse 获取滚动位置和元素边界数据
const { y: scrollTop } = useWindowScroll();
const { top: wrapperTop, width: wrapperWidth, left: wrapperLeft, update: updateRect } = useElementBounding(wrapperRef);
const { height: contentHeight } = useElementBounding(contentRef);

// 响应式对象，用于存储吸顶开始时的包装器尺寸信息
const rect = reactive({
    height: 0,
    width: 0,
    left: 0,
    top: 0
});

// 触发吸顶状态的阈值计算
const stickyThreshold = computed(() => {
    let offset = props.offsetTop;
    if (props.isNeedNavbarHeight) {
        offset += props.navbarHeight;
    }
    return offset;
});

// 判断当前是否处于吸顶状态
const isSticky = computed(() => {
    if (!wrapperRef.value) return false;
    return wrapperTop.value <= stickyThreshold.value;
});

/**
 * 更新元素位置和尺寸信息
 * 用于吸顶时保持内容容器与原占位容器一致
 */
const updateDimensions = () => {
    updateRect();
    // 使用 content 的真实高度，防止 wrapper 在吸顶后高度塌陷为0
    rect.height = contentHeight.value || (contentRef.value ? contentRef.value.getBoundingClientRect().height : 0);
    rect.width = wrapperWidth.value;
    rect.left = wrapperLeft.value;
    rect.top = wrapperTop.value + scrollTop.value;
    emit('resize', { ...rect });
};

// 监听吸顶状态变化，更新尺寸
watch(isSticky, (newValue) => {
    if (newValue) {
        updateDimensions();
    }
    emit('change', newValue);
});

// 监听窗口大小变化 (SSR 安全)
if (import.meta.client) {
    useEventListener(window, 'resize', updateDimensions);
}

// 监听内容尺寸变化，实时更新占位高度
useResizeObserver(wrapperRef, updateDimensions);

/**
 * 样式管理
 */
const ui = computed(() => {
    const styles = b({
        sticky: isSticky.value
    });
    return {
        wrapper: () => styles.wrapper(),
        content: () => styles.content(),
    };
});

/**
 * 计算吸顶时的顶距位置
 */
const stickyTop = computed(() => {
    return isSticky.value ? stickyThreshold.value : 0;
});

/**
 * 暴露给外部的属性和状态
 */
defineExpose({
    /** 组件当前高度 */
    height: computed(() => rect.height),
    /** 是否处于吸顶状态 */
    isSticky,
    /** 位置和尺寸矩形对象 */
    rect
});

</script>
