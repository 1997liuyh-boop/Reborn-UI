<script setup lang="ts">
import type { HTMLAttributes } from "vue";
import { computed, onBeforeUnmount, shallowRef, useTemplateRef } from "vue";

interface Props {
  class?: HTMLAttributes["class"];
  starsCount?: number;
  starsClass?: HTMLAttributes["class"];
}
const props = withDefaults(defineProps<Props>(), {
  starsCount: 130,
});

const cardRef = useTemplateRef<HTMLElement>("cardRef");
const widthPercentage = shallowRef(0);
const isMouseOver = shallowRef(false);

const rotateDeg = computed(() => (widthPercentage.value - 50) * 0.1);

/** 离开后延时收起揭示区的定时器；记下句柄，再次离开或卸载时清除 */
let leaveTimer: ReturnType<typeof setTimeout> | undefined;

function clearLeaveTimer() {
  if (leaveTimer !== undefined) {
    clearTimeout(leaveTimer);
    leaveTimer = undefined;
  }
}

function mouseMoveHandler(event: MouseEvent) {
  event.preventDefault();
  if (cardRef.value) {
    // 每次实时读取卡片位置，页面滚动或缩放后也准确，无需监听 resize 缓存尺寸
    const rect = cardRef.value.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    widthPercentage.value = (relativeX / rect.width) * 100;
  }
}

function mouseLeaveHandler() {
  isMouseOver.value = false;
  clearLeaveTimer();
  leaveTimer = setTimeout(() => {
    leaveTimer = undefined;
    if (!isMouseOver.value) {
      widthPercentage.value = 0;
    }
  }, 100);
}

onBeforeUnmount(clearLeaveTimer);

function mouseEnterHandler() {
  isMouseOver.value = true;
}

function touchMoveHandler(event: TouchEvent) {
  event.preventDefault();
  if (cardRef.value) {
    const rect = cardRef.value.getBoundingClientRect();
    const relativeX = event.touches[0]!.clientX - rect.left;
    widthPercentage.value = (relativeX / rect.width) * 100;
  }
}
</script>

<template>
  <div
    ref="cardRef"
    class="relative w-full max-w-[40rem] overflow-hidden rounded-lg border border-white/[0.08] bg-[#1d1c20] p-4 sm:p-6 md:p-8"
    :class="[props.class]"
    @mouseenter="mouseEnterHandler"
    @mouseleave="mouseLeaveHandler"
    @mousemove="mouseMoveHandler"
    @touchstart="mouseEnterHandler"
    @touchend="mouseLeaveHandler"
    @touchmove="touchMoveHandler"
  >
    <slot name="header" />
    <div class="relative flex h-40 items-center overflow-hidden">
      <div
        :style="{
          width: '100%',
          opacity: widthPercentage > 0 ? 1 : 0,
          clipPath: `inset(0 ${100 - widthPercentage}% 0 0)`,
          transition: isMouseOver ? 'none' : 'all 0.4s ease-out',
        }"
        class="absolute z-20 bg-[#1d1c20] will-change-transform"
      >
        <slot name="text" />
      </div>

      <div
        :style="{
          left: `${widthPercentage}%`,
          transform: `rotate(${rotateDeg}deg)`,
          opacity: widthPercentage > 0 ? 1 : 0,
          transition: isMouseOver ? 'none' : 'all 0.4s ease-out',
        }"
        class="absolute z-50 h-40 w-[8px] bg-gradient-to-b from-transparent via-neutral-800 to-transparent will-change-transform"
      />

      <div
        class="overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,white,transparent)]"
      >
        <slot name="revealText" />

        <TextRevealStars
          :stars-count="starsCount"
          :class="starsClass"
        />
      </div>
    </div>
  </div>
</template>
