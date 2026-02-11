<template>
    <view class="fixed touch-none" :style="viewStyle" @touchstart="onTouchStart" @touchmove="onTouchMove"
        @touchend="onTouchEnd" @touchcancel="onTouchEnd">
        <slot></slot>
    </view>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, type CSSProperties } from "vue";

defineOptions({
    name: "reborn-affix"
});

export interface FloatViewProps {
    zIndex?: number;
    size?: number;
    left?: number;
    right?: number;
    top?: number;
    bottom?: number;
    gap?: number;
    disabled?: boolean;
    noSnapping?: boolean;
    // 新增：是否考虑安全区域（默认为 true）
    safeArea?: boolean;
}

const props = withDefaults(defineProps<FloatViewProps>(), {
    zIndex: 500,
    size: 40,
    left: 10,
    bottom: 10,
    gap: 10,
    disabled: false,
    noSnapping: false,
    safeArea: true
});

// 获取屏幕信息和安全区域
// 获取屏幕信息和安全区域
const windowInfo = uni.getWindowInfo() || {};
const screenWidth = windowInfo.screenWidth || 0;
const screenHeight = windowInfo.screenHeight || 0;

// 获取底部安全区域高度 (iPhone X+ 的底部黑条)
const safeAreaBottom = props.safeArea ? (windowInfo.safeAreaInsets?.bottom || 0) : 0;
// 获取顶部安全区域高度 (状态栏/刘海屏)
const safeAreaTop = props.safeArea ? (windowInfo.safeAreaInsets?.top || 0) : 0;

const position = reactive({
    x: props.right !== undefined ? (screenWidth - props.size - props.right) : props.left,
    // 初始位置：
    // 如果指定了 top，则 y = 屏幕高度 - size - top - 顶部安全区域
    // 否则使用 bottom + 底部安全区域
    y: props.top !== undefined
        ? (screenHeight - props.size - props.top - safeAreaTop)
        : (props.bottom + safeAreaBottom),
    isDragging: false
});

const dragState = reactive({
    startX: 0,
    startY: 0
});

// 动态样式计算
const viewStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
        left: `${position.x}px`,
        bottom: `${position.y}px`, // 直接使用 position.y，逻辑在内部处理
        zIndex: props.zIndex,
        width: `${props.size}px`,
        height: `${props.size}px`,
        position: "fixed"
    };

    if (position.isDragging) {
        style.transitionProperty = "none";
    } else {
        style.transitionProperty = "left, bottom";
        style.transitionDuration = "300ms";
    }

    return style;
});

function onTouchStart(e: TouchEvent) {
    if (props.disabled) return;
    if (e.touches.length > 0) {
        const touch = e.touches[0];
        dragState.startX = touch.clientX;
        dragState.startY = touch.clientY;
        position.isDragging = true;
    }
}

function onTouchMove(e: TouchEvent) {
    if (props.disabled || !position.isDragging || e.touches.length === 0) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - dragState.startX;
    // Y轴逻辑：手指往上滑(clientY变小)，bottom值应该变大
    const deltaY = dragState.startY - touch.clientY;

    // 增加拖拽阈值判断，避免误触点击事件
    if (Math.abs(deltaX) < 5 && Math.abs(deltaY) < 5) return;

    // 确认为拖拽行为，阻止默认事件
    if (e.cancelable) {
        e.preventDefault();
    }

    let newX = position.x + deltaX;
    let newY = position.y + deltaY;

    // --- 水平边界限制 ---
    newX = Math.max(0, Math.min(screenWidth - props.size, newX));

    // --- 垂直边界限制 ---
    // 最小值：如果有安全区域，则不能拖到安全区域以下
    let minY = safeAreaBottom;
    // 最大值：屏幕高度减去自身高度 - 顶部安全区域
    const maxY = screenHeight - props.size - safeAreaTop;

    newY = Math.max(minY, Math.min(maxY, newY));

    position.x = newX;
    position.y = newY;
    dragState.startX = touch.clientX;
    dragState.startY = touch.clientY;
}

function performEdgeSnapping() {
    const { size, gap } = props;
    const edgeThreshold = 60;
    const centerX = screenWidth / 2;

    // 水平吸附
    if (position.x < edgeThreshold) {
        position.x = gap;
    } else if (position.x > screenWidth - size - edgeThreshold) {
        position.x = screenWidth - size - gap;
    } else {
        position.x = position.x < centerX ? gap : screenWidth - size - gap;
    }

    // 垂直吸附修正
    const maxY = screenHeight - size - safeAreaTop;
    // 底部最小值：Gap + 安全区域高度
    const minSafeY = gap + safeAreaBottom;

    if (position.y > maxY - gap) position.y = maxY - gap;
    if (position.y < minSafeY) position.y = minSafeY;
}

function onTouchEnd() {
    if (props.disabled || !position.isDragging) return;
    nextTick(() => {
        position.isDragging = false;
        if (!props.noSnapping) {
            performEdgeSnapping();
        }
    });
}
</script>
<style></style>