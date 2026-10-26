<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import type { DataOrientation, Direction } from "./types";
import { computed, provide, readonly, shallowRef, toRef } from "vue";

import {
  DISTANCE_INJECTION_KEY,
  MAGNIFICATION_INJECTION_KEY,
  MOUSE_X_INJECTION_KEY,
  MOUSE_Y_INJECTION_KEY,
  ORIENTATION_INJECTION_KEY,
} from "./injectionKeys";

interface DockProps {
  class?: HTMLAttributes["class"];
  magnification?: number;
  distance?: number;
  direction?: Direction;
  orientation?: DataOrientation;
}

const props = withDefaults(defineProps<DockProps>(), {
  magnification: 60,
  distance: 140,
  direction: "middle",
  orientation: "horizontal",
});

const mouseX = shallowRef(Infinity);
const mouseY = shallowRef(Infinity);
const magnification = computed(() => props.magnification);
const distance = computed(() => props.distance);

const dockClass = computed(() => ({
  "items-start": props.direction === "top",
  "items-center": props.direction === "middle",
  "items-end": props.direction === "bottom",
}));

// 记录视口坐标：DockIcon 用 getBoundingClientRect（同为视口坐标）计算距离，
// 用 pageX / pageY 会在页面滚动后整体偏移 scrollX / scrollY
function onMouseMove(e: MouseEvent) {
  requestAnimationFrame(() => {
    mouseX.value = e.clientX;
    mouseY.value = e.clientY;
  });
}

function onMouseLeave() {
  requestAnimationFrame(() => {
    mouseX.value = Infinity;
    mouseY.value = Infinity;
  });
}
provide(MOUSE_X_INJECTION_KEY, readonly(mouseX));
provide(MOUSE_Y_INJECTION_KEY, readonly(mouseY));
// 下发引用而不是字符串快照，切换方向后子组件同步更新
provide(ORIENTATION_INJECTION_KEY, toRef(props, "orientation"));
provide(MAGNIFICATION_INJECTION_KEY, magnification);
provide(DISTANCE_INJECTION_KEY, distance);
</script>

<template>
  <div
    class="mx-auto mt-8 flex h-[58px] w-max gap-4 rounded-2xl border p-2 backdrop-blur-md transition-all supports-backdrop-blur:bg-white/10 supports-backdrop-blur:dark:bg-black/10"
    :class="[orientation === 'vertical' && 'h-max w-[58px] flex-col', props.class, dockClass]"
    @mousemove="onMouseMove"
    @mouseleave="onMouseLeave"
  >
    <slot />
  </div>
</template>
