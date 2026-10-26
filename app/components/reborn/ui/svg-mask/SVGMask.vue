<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { computed, shallowRef, useTemplateRef } from "vue";

interface Props {
  class?: HTMLAttributes["class"];
  size?: number;
  revealSize?: number;
}

const props = withDefaults(defineProps<Props>(), {
  size: 10,
  revealSize: 600,
});

const isHovered = shallowRef(false);
const svgMaskContainerRef = useTemplateRef<HTMLDivElement>("svgMaskContainerRef");
const mousePosition = shallowRef<{ x: null | number; y: null | number }>({ x: null, y: null });

const maskSize = computed(() => {
  return isHovered.value ? props.revealSize : props.size;
});

const maskStyle = computed(() => {
  const { x, y } = mousePosition.value;
  return {
    maskSize: `${maskSize.value}px`,
    maskPosition: `${x !== null ? x - maskSize.value / 2 : 0}px ${y !== null ? y - maskSize.value / 2 : 0}px`,
    transition: "mask-size 0.2s ease-in-out",
  };
});

function updateMousePosition(event: MouseEvent) {
  if (!svgMaskContainerRef.value) return;

  const rect = svgMaskContainerRef.value.getBoundingClientRect();
  mousePosition.value = { x: event.clientX - rect.left, y: event.clientY - rect.top };
}
</script>

<template>
  <div
    ref="svgMaskContainerRef"
    class="relative h-screen"
    :class="[isHovered ? 'bg-slate-900' : 'bg-white', props.class]"
    @mousemove="updateMousePosition"
  >
    <div
      :style="maskStyle"
      class="bg-grid-white/[0.2] absolute flex size-full items-center justify-center bg-black [mask-image:url(https://cdn.reborn-ui.com/images/mask.svg)] [mask-size:40px] [mask-repeat:no-repeat] text-6xl text-white"
    >
      <div class="absolute inset-0 z-0 size-full bg-black opacity-50" />
      <!-- 用标准事件绑定：小写的 :onmouseenter 不会被识别为事件，只写进 DOM 属性，SSR 水合时不会挂上 -->
      <div
        class="relative z-20 mx-auto max-w-4xl text-center text-4xl font-bold text-white"
        @mouseenter="isHovered = true"
        @mouseleave="isHovered = false"
      >
        <slot name="base" />
      </div>
    </div>

    <div class="flex size-full items-center justify-center text-white">
      <slot name="reveal" />
    </div>
  </div>
</template>
