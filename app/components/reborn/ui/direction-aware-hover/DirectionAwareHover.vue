<script setup lang="ts">
import { computed, onMounted, onUnmounted, shallowRef, useTemplateRef } from "vue";

interface Props {
  imageUrl: string;
  childrenClass?: string;
  imageClass?: string;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  childrenClass: undefined,
  imageClass: undefined,
  class: undefined,
});

const divRef = useTemplateRef<HTMLDivElement>("divRef");
const direction = shallowRef<"top" | "bottom" | "left" | "right" | null>(null);
const isTouched = shallowRef(false);
const isMobile = shallowRef(false);

// 移动端触摸交互的定时器：自动隐藏与离开后的延迟复位，句柄都保存下来以便卸载时取消
let touchTimer: ReturnType<typeof setTimeout> | null = null;
let resetTimer: ReturnType<typeof setTimeout> | null = null;

function detectMobile() {
  isMobile.value = window.matchMedia("(max-width: 768px)").matches || "ontouchstart" in window;
}

function handleMouseEnter(event: MouseEvent) {
  if (isMobile.value) return;

  if (!divRef.value) return;
  const fetchedDirection = getDirection(event, divRef.value);

  switch (fetchedDirection) {
    case 0:
      direction.value = "top";
      break;
    case 1:
      direction.value = "right";
      break;
    case 2:
      direction.value = "bottom";
      break;
    case 3:
      direction.value = "left";
      break;
    default:
      direction.value = "left";
      break;
  }
}

function handleMouseLeave() {
  if (isMobile.value) return;
  direction.value = null;
}

function handleTouchStart(event: TouchEvent) {
  if (!isMobile.value) return;

  isTouched.value = true;

  if (!divRef.value) return;
  const touch = event.touches[0];
  const mouseEvent = new MouseEvent("mouseenter", {
    clientX: touch.clientX,
    clientY: touch.clientY,
  });

  const fetchedDirection = getDirection(mouseEvent, divRef.value);

  switch (fetchedDirection) {
    case 0:
      direction.value = "top";
      break;
    case 1:
      direction.value = "right";
      break;
    case 2:
      direction.value = "bottom";
      break;
    case 3:
      direction.value = "left";
      break;
    default:
      direction.value = "left";
      break;
  }

  // 移动端 3 秒后自动隐藏
  if (touchTimer) clearTimeout(touchTimer);
  touchTimer = setTimeout(() => {
    handleTouchEnd();
  }, 3000);
}

function handleTouchEnd() {
  if (touchTimer) {
    clearTimeout(touchTimer);
    touchTimer = null;
  }

  if (resetTimer) clearTimeout(resetTimer);
  resetTimer = setTimeout(() => {
    resetTimer = null;
    direction.value = null;
    isTouched.value = false;
  }, 300);
}

function getDirection(ev: MouseEvent, obj: HTMLElement) {
  const { width: w, height: h, left, top } = obj.getBoundingClientRect();
  const x = ev.clientX - left - (w / 2) * (w > h ? h / w : 1);
  const y = ev.clientY - top - (h / 2) * (h > w ? w / h : 1);
  const d = Math.round(Math.atan2(y, x) / 1.57079633 + 5) % 4;
  return d;
}

const containerClass = computed(() => [
  "group/card relative overflow-hidden rounded-lg bg-transparent transition-all duration-300",
  // 移动优先的响应式尺寸：基础、xs、sm、md、lg、xl 逐级放大
  "h-48 w-48",
  "xs:h-56 xs:w-56",
  "sm:h-64 sm:w-64",
  "md:h-80 md:w-80",
  "lg:h-96 lg:w-96",
  "xl:h-[28rem] xl:w-[28rem]",
  // 触摸优化：按下时轻微缩小，桌面端不缩放
  "touch-manipulation",
  "active:scale-[0.98]",
  "md:active:scale-100",
  props.class,
]);

const imageClass = computed(() => [
  "h-full w-full object-cover transition-transform duration-300",
  // 响应式缩放：移动端、小屏、桌面逐级放大
  "scale-125",
  "sm:scale-135",
  "md:scale-150",
  props.imageClass,
]);

const childrenClass = computed(() => [
  "absolute z-40 text-white transition-opacity duration-300",
  // 响应式定位：移动端、小屏、桌面逐级加大边距与字号
  "bottom-2 left-2 text-sm",
  "sm:bottom-3 sm:left-3 sm:text-base",
  "md:bottom-4 md:left-4 md:text-lg",
  props.childrenClass,
]);

const overlayClass = computed(() => {
  const baseClasses = "absolute inset-0 z-10 transition-all duration-300";
  const backgroundClasses = "bg-black/40 dark:bg-black/60";

  let transformClasses = "";

  switch (direction.value) {
    case "top":
      transformClasses = "-translate-y-full";
      break;
    case "bottom":
      transformClasses = "translate-y-full";
      break;
    case "left":
      transformClasses = "-translate-x-full";
      break;
    case "right":
      transformClasses = "translate-x-full";
      break;
    default:
      transformClasses = "";
  }

  return [baseClasses, backgroundClasses, transformClasses];
});

const imageContainerClass = computed(() => ({
  // 移动端减小位移幅度
  "translate-y-2 md:translate-y-5": direction.value === "top",
  "-translate-y-2 md:-translate-y-5": direction.value === "bottom",
  "translate-x-2 md:translate-x-5": direction.value === "left",
  "-translate-x-2 md:-translate-x-5": direction.value === "right",
}));

onMounted(() => {
  detectMobile();
  window.addEventListener("resize", detectMobile);
});

onUnmounted(() => {
  window.removeEventListener("resize", detectMobile);
  if (touchTimer) {
    clearTimeout(touchTimer);
  }
  if (resetTimer) {
    clearTimeout(resetTimer);
  }
});
</script>

<template>
  <div
    ref="divRef"
    :class="containerClass"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
  >
    <div class="relative size-full overflow-hidden">
      <transition name="fade">
        <div
          v-show="direction !== null"
          :class="overlayClass"
        />
      </transition>
      <div
        class="relative size-full bg-gray-50 transition-transform duration-300 dark:bg-black"
        :class="imageContainerClass"
      >
        <img
          :src="imageUrl"
          alt="image"
          :class="imageClass"
          width="1000"
          height="1000"
        />
      </div>
      <transition name="fade">
        <div
          v-show="direction !== null || isTouched"
          :class="childrenClass"
        >
          <slot />
        </div>
      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Enhanced mobile touch targets */
@media (max-width: 768px) {
  .group\/card {
    min-height: 44px; /* iOS minimum touch target */
    min-width: 44px;
  }
}

/* Smooth transitions for mobile */
@media (prefers-reduced-motion: reduce) {
  * {
    transition-duration: 0.1s !important;
  }
}
</style>
