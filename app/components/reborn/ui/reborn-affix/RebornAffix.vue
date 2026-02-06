<template>
    <div class="fixed touch-none z-[9999]" :style="viewStyle" @pointerdown="onPointerDown"
        @pointermove.stop.prevent="onPointerMove" @pointerup="onPointerUp" @pointercancel="onPointerUp">
        <slot></slot>
    </div>
</template>

<script setup lang="ts">
import { computed, nextTick, reactive, type CSSProperties, onMounted } from "vue";
import { useWindowSize } from '@vueuse/core'

defineOptions({
    name: "RebornAffix"
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
    // Web 端通常不需要 manifest 的 safeArea，但保留 API 兼容
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

// 使用 VueUse 获取响应式窗口大小
const { width: screenWidth, height: screenHeight } = useWindowSize()

// Web 端安全区域通常为 0，除非是 PWA standalone 模式
// 这里简化处理，Web 端一般默认为 0
const safeAreaBottom = 0;
const safeAreaTop = 0;

const position = reactive({
    x: props.right !== undefined ? (screenWidth.value - props.size - props.right) : props.left,
    y: props.top !== undefined
        ? (screenHeight.value - props.size - props.top - safeAreaTop)
        : (props.bottom + safeAreaBottom),
    isDragging: false
});

// 监听窗口大小变化修正位置 (防止 resize 后按钮消失)
watch([screenWidth, screenHeight], () => {
    performEdgeSnapping()
})

onMounted(() => {
    // 修正初始位置：如果是 right 定位，确保根据当前屏幕宽度计算
    // 避免 SSR/初始 width 为 0 导致被 snap 到左边
    if (props.right !== undefined) {
        position.x = screenWidth.value - props.size - props.right;
    }
    nextTick(() => {
        performEdgeSnapping();
    })
})

const dragState = reactive({
    startX: 0,
    startY: 0
});

// 动态样式计算
const viewStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
        left: `${position.x}px`,
        bottom: `${position.y}px`,
        zIndex: props.zIndex,
        width: `${props.size}px`,
        height: `${props.size}px`,
        position: "fixed",
        touchAction: "none", // 关键：禁用浏览器默认手势
        userSelect: "none"
    };

    if (position.isDragging) {
        style.transition = "none";
    } else {
        style.transition = "left 300ms, bottom 300ms";
    }

    return style;
});

function onPointerDown(e: PointerEvent) {
    if (props.disabled) return;
    if (e.isPrimary === false) return;

    // 捕获指针
    (e.target as Element).setPointerCapture(e.pointerId);

    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    position.isDragging = true;
}

function onPointerMove(e: PointerEvent) {
    if (props.disabled || !position.isDragging) return;

    const deltaX = e.clientX - dragState.startX;
    // Y轴逻辑：Web 坐标系 Y 轴向下，clientX/Y 也是左上角为原点
    // 但是我们的 CSS bottom 是相对于底部的。
    // 当鼠标 Y 变大 (向下移)，e.clientY 变大，diff > 0
    // 此时距离底部应该变小 (position.y 变小)
    // 所以 deltaY = startY - clientY 没问题
    const deltaY = dragState.startY - e.clientY;

    let newX = position.x + deltaX;
    let newY = position.y + deltaY;

    // --- 水平边界限制 ---
    newX = Math.max(0, Math.min(screenWidth.value - props.size, newX));

    // --- 垂直边界限制 ---
    const minY = safeAreaBottom;
    const maxY = screenHeight.value - props.size - safeAreaTop;

    newY = Math.max(minY, Math.min(maxY, newY));

    position.x = newX;
    position.y = newY;

    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
}

function onPointerUp(e: PointerEvent) {
    if (props.disabled || !position.isDragging) return;

    (e.target as Element).releasePointerCapture(e.pointerId);

    nextTick(() => {
        position.isDragging = false;
        if (!props.noSnapping) {
            performEdgeSnapping();
        }
    });
}

function performEdgeSnapping() {
    const { size, gap } = props;
    const edgeThreshold = 60;
    const centerX = screenWidth.value / 2;

    // 水平吸附
    if (position.x < edgeThreshold) {
        position.x = gap;
    } else if (position.x > screenWidth.value - size - edgeThreshold) {
        position.x = screenWidth.value - size - gap;
    } else {
        position.x = position.x < centerX ? gap : screenWidth.value - size - gap;
    }

    // 垂直吸附修正
    const maxY = screenHeight.value - size - safeAreaTop;
    const minSafeY = gap + safeAreaBottom;

    if (position.y > maxY - gap) position.y = maxY - gap;
    if (position.y < minSafeY) position.y = minSafeY;
}
</script>
