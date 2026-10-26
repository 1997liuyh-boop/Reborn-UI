<script setup lang="ts">
import type { CSSProperties } from "vue";
import { useEventListener, useResizeObserver } from '@vueuse/core'
import { computed, nextTick, onMounted, reactive, shallowRef, watch } from "vue";

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

defineOptions({
    name: "RebornAffix"
});

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
/**
 * 可视区尺寸：取 documentElement 的 clientWidth / clientHeight，不含滚动条。
 * 不能用 window.innerWidth：它把页面的竖向滚动条算进宽度，right 定位与贴右缘时按钮会压到滚动条上，
 * 左右留边不一致（左侧留 gap，右侧几乎贴边）。fixed 元素的 left / bottom 本身也是相对不含滚动条的可视区计算的。
 * 滚动条出现或消失（内容增减、弹窗锁定滚动）不会触发 resize，所以再观察 html 元素的尺寸变化。
 */
const screenWidth = shallowRef(0)
const screenHeight = shallowRef(0)
function readViewport() {
    if (typeof document === "undefined") return
    const root = document.documentElement
    screenWidth.value = root.clientWidth
    screenHeight.value = root.clientHeight
}
useEventListener("resize", readViewport, { passive: true })
useResizeObserver(() => (typeof document === "undefined" ? null : document.documentElement), readViewport)

// Web 端安全区域通常为 0，除非是 PWA standalone 模式
// 这里简化处理，Web 端一般默认为 0
const safeAreaBottom = 0;
const safeAreaTop = 0;

const hydrated = shallowRef(false);
const position = reactive({ x: 0, y: 0, isDragging: false });
function clampPosition() {
    position.x = Math.max(0, Math.min(Math.max(0, screenWidth.value - props.size), position.x));
    position.y = Math.max(0, Math.min(Math.max(0, screenHeight.value - props.size), position.y));
}
function resetPosition() {
    if (!hydrated.value) return;
    position.x = props.right !== undefined ? screenWidth.value - props.size - props.right : props.left;
    position.y = props.top !== undefined ? screenHeight.value - props.size - props.top : props.bottom;
    clampPosition();
}

// 指针累计移动达到该距离才算「拖动过」，与 UniApp 端区分点击与拖动的 5px 阈值一致
const DRAG_THRESHOLD = 5;
// 用户是否拖动过（与 UniApp 端同名）：拖动过之后窗口变化保留拖拽位置，否则按定位 props 重新锚定
let userMoved = false;

// 定位参数变化：按新参数重新锚定，丢弃拖拽位置
watch(() => [props.left, props.right, props.top, props.bottom, props.size], () => {
    userMoved = false;
    resetPosition();
});
// 窗口尺寸变化：未拖动过时按 props 重新锚定，right / top 锚点随窗口移动；
// 拖动过后只把当前位置夹回新边界，开启吸附时再贴回原来那一侧的边缘，不回到初始位置
watch([screenWidth, screenHeight], (_, [previousWidth]) => {
    if (!hydrated.value) return;
    if (!userMoved) {
        resetPosition();
        return;
    }
    // 吸附侧按变化前的中线判断：窗口大幅变宽时，贴右缘的按钮不会被新中线判到左侧
    const wasRight = position.x + props.size / 2 > previousWidth / 2;
    clampPosition();
    if (props.noSnapping || position.isDragging) return;
    const { size, gap } = props;
    position.x = wasRight ? screenWidth.value - size - gap : gap;
    position.y = Math.max(gap + safeAreaBottom, Math.min(screenHeight.value - size - safeAreaTop - gap, position.y));
});
onMounted(() => { readViewport(); hydrated.value = true; resetPosition(); });

const dragState = reactive({
    startX: 0,
    startY: 0,
    // 本次按下时的指针坐标，用于判断累计移动是否超过拖动阈值
    downX: 0,
    downY: 0
});

// 动态样式计算
const viewStyle = computed<CSSProperties>(() => {
    const style: CSSProperties = {
        left: hydrated.value ? `${position.x}px` : props.right === undefined ? `${props.left}px` : undefined,
        right: !hydrated.value && props.right !== undefined ? `${props.right}px` : undefined,
        top: !hydrated.value && props.top !== undefined ? `${props.top}px` : undefined,
        bottom: hydrated.value ? `${position.y}px` : props.top === undefined ? `${props.bottom}px` : undefined,
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
    dragState.downX = e.clientX;
    dragState.downY = e.clientY;
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

    // 点击时的细微抖动不算拖动，避免窗口变化后锚点失效
    if (!userMoved && Math.hypot(e.clientX - dragState.downX, e.clientY - dragState.downY) >= DRAG_THRESHOLD) {
        userMoved = true;
    }

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

    // 水平吸附：按元素中心落在可视区中线的哪一侧决定贴左还是贴右，两侧都留 gap。
    // 用左上角坐标比较会让元素中心已过中线、左边缘还没过的按钮被判到左侧
    position.x = position.x + size / 2 < screenWidth.value / 2 ? gap : screenWidth.value - size - gap;

    // 垂直吸附修正
    const maxY = screenHeight.value - size - safeAreaTop;
    const minSafeY = gap + safeAreaBottom;

    if (position.y > maxY - gap) position.y = maxY - gap;
    if (position.y < minSafeY) position.y = minSafeY;
}
</script>

<template>
  <div
    class="fixed touch-none z-[9999]"
    :style="viewStyle"
    @pointerdown="onPointerDown"
    @pointermove.stop.prevent="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="onPointerUp"
  >
    <slot />
  </div>
</template>
