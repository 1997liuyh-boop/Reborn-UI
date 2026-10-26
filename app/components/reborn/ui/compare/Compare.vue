<script setup lang="ts">
import { onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from "vue";
import { useControlledModel } from "~/composables/useControlledModel";

interface Props {
  firstImage?: string;
  secondImage?: string;
  firstImageAlt?: string;
  secondImageAlt?: string;
  class?: string;
  firstContentClass?: string;
  secondContentClass?: string;
  initialSliderPercentage?: number;
  slideMode?: "hover" | "drag";
  showHandlebar?: boolean;
  autoplay?: boolean;
  autoplayDuration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  firstImage: "",
  secondImage: "",
  firstImageAlt: "First image",
  secondImageAlt: "Second image",
  class: "",
  firstContentClass: "",
  secondContentClass: "",
  initialSliderPercentage: 50,
  slideMode: "hover",
  showHandlebar: true,
  autoplay: false,
  autoplayDuration: 5000,
});

const emit = defineEmits<{
  (e: "drag:start"): void;
  (e: "drag:end"): void;
  (e: "hover:enter"): void;
  (e: "hover:leave"): void;
}>();

/** 滑块位置（0-100），支持 v-model:percentage；未绑定时以 initialSliderPercentage 为初值、由组件内部维护 */
defineModel<number | null>("percentage");
const sliderXPercent = useControlledModel<number>("percentage", {
  initial: props.initialSliderPercentage,
  // 数值比例的显式空值复位到初始比例，不沿用交互副本。
  resolve: value => (value as number | null | undefined) ?? props.initialSliderPercentage,
});

const sliderRef = useTemplateRef<HTMLDivElement>("sliderRef");
const isDragging = shallowRef(false);
const isMouseOver = shallowRef(false);
const isInteracting = shallowRef(false);
let autoplayRAF: number | null = null;
// 指针移动的位置更新合并到下一帧，句柄保存下来以便离开或卸载时取消
let moveRAF: number | null = null;

function startAutoplay(): void {
  if (!props.autoplay || isMouseOver.value || isDragging.value) return;

  const startTime = Date.now();
  function animate(): void {
    if (isMouseOver.value || isDragging.value) {
      if (autoplayRAF) cancelAnimationFrame(autoplayRAF);
      return;
    }

    const elapsedTime = Date.now() - startTime;
    const progress = (elapsedTime % (props.autoplayDuration * 2)) / props.autoplayDuration;
    sliderXPercent.value = progress <= 1 ? progress * 100 : (2 - progress) * 100;
    autoplayRAF = requestAnimationFrame(animate);
  }

  animate();
}

function stopAutoplay(): void {
  if (autoplayRAF) {
    cancelAnimationFrame(autoplayRAF);
    autoplayRAF = null;
  }
}

function cancelPendingMove(): void {
  if (moveRAF) {
    cancelAnimationFrame(moveRAF);
    moveRAF = null;
  }
}

function mouseEnterHandler(): void {
  isMouseOver.value = true;
  emit("hover:enter");
  if (props.autoplay) {
    stopAutoplay();
  }
}

function mouseLeaveHandler(): void {
  isMouseOver.value = false;
  isInteracting.value = false;
  emit("hover:leave");

  if (props.slideMode === "hover") {
    // 丢弃尚未执行的移动帧，避免离开后又被它改回指针位置
    cancelPendingMove();
    sliderXPercent.value = props.initialSliderPercentage;
  }
  if (props.slideMode === "drag") {
    isDragging.value = false;
  }

  if (props.autoplay) {
    startAutoplay();
  }
}

function handleStart(): void {
  if (props.slideMode === "drag") {
    isDragging.value = true;
    isInteracting.value = true;
    emit("drag:start");
    stopAutoplay();
  }
}

function handleEnd(): void {
  if (props.slideMode === "drag") {
    isDragging.value = false;
    isInteracting.value = false;
    emit("drag:end");
    if (props.autoplay && !isMouseOver.value) {
      startAutoplay();
    }
  }
}

function handleMove(clientX: number): void {
  if (!sliderRef.value) return;

  if (props.slideMode === "hover" || (props.slideMode === "drag" && isDragging.value)) {
    isInteracting.value = true;
    stopAutoplay();

    const rect = sliderRef.value.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = (x / rect.width) * 100;

    cancelPendingMove();
    moveRAF = requestAnimationFrame(() => {
      moveRAF = null;
      sliderXPercent.value = Math.max(0, Math.min(100, percent));
    });
  }
}

function handleMouseDown(): void {
  handleStart();
}

function handleMouseMove(e: MouseEvent): void {
  handleMove(e.clientX);
}

function handleTouchStart(): void {
  if (!props.autoplay) handleStart();
}

function handleTouchEnd(): void {
  if (!props.autoplay) handleEnd();
}

function handleTouchMove(e: TouchEvent): void {
  const touch = e.touches[0];
  if (!props.autoplay && touch) handleMove(touch.clientX);
}

onMounted(() => {
  startAutoplay();
});

// 卸载时取消自动播放与待执行的移动帧，卸载后不再写入位置、不再派发 update:percentage
onBeforeUnmount(() => {
  stopAutoplay();
  cancelPendingMove();
});

// 初始位置变化时回到新的初始位置，与悬停离开时的复位一致（同样派发 update:percentage）
watch(
  () => props.initialSliderPercentage,
  (newValue) => {
    sliderXPercent.value = newValue;
  },
);

watch(
  () => props.autoplay,
  (newValue) => {
    if (newValue && !isMouseOver.value && !isDragging.value) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
  },
);
</script>

<template>
  <div
    ref="sliderRef"
    class="h-[400px] w-[400px] overflow-hidden"
    :class="[props.slideMode === 'drag' ? 'cursor-grab' : 'cursor-col-resize', props.class]"
    :style="{ position: 'relative' }"
    @mousemove="handleMouseMove"
    @mouseleave="mouseLeaveHandler"
    @mouseenter="mouseEnterHandler"
    @mousedown="handleMouseDown"
    @mouseup="handleEnd"
    @touchstart="handleTouchStart"
    @touchend="handleTouchEnd"
    @touchmove="handleTouchMove"
  >
    <!-- 分割线 -->
    <div
      class="absolute top-0 z-30 m-auto h-full w-px bg-gradient-to-b from-transparent from-5% via-indigo-500 to-transparent to-95%"
      :style="{
        left: `${sliderXPercent}%`,
        top: '0',
        zIndex: 40,
        pointerEvents: 'none',
      }"
    >
      <!-- 装饰光效 -->
      <div
        class="absolute top-1/2 left-0 z-20 h-full w-36 -translate-y-1/2 bg-gradient-to-r from-indigo-400 via-transparent to-transparent [mask-image:radial-gradient(100px_at_left,white,transparent)] opacity-50"
      />
      <div
        class="absolute top-1/2 left-0 z-10 h-1/2 w-10 -translate-y-1/2 bg-gradient-to-r from-cyan-400 via-transparent to-transparent [mask-image:radial-gradient(50px_at_left,white,transparent)] opacity-100"
      />
      <div
        class="absolute top-1/2 -right-10 h-3/4 w-10 -translate-y-1/2 [mask-image:radial-gradient(100px_at_left,white,transparent)]"
      >
        <StarField
          :stars-count="120"
          class="size-full"
        />
      </div>

      <!-- 自定义手柄插槽 -->
      <slot name="handle">
        <div
          v-if="props.showHandlebar"
          class="pointer-events-auto absolute top-1/2 -right-2.5 z-30 flex size-5 -translate-y-1/2 cursor-grab items-center justify-center rounded-md bg-white shadow-[0px_-1px_0px_0px_#FFFFFF40]"
        >
          <Icon
            name="heroicons:ellipsis-vertical"
            class="size-4 text-black"
          />
        </div>
      </slot>
    </div>

    <!-- 第一侧内容 -->
    <div
      class="relative z-20 size-full overflow-hidden"
      :style="{ pointerEvents: isInteracting ? 'none' : 'auto' }"
    >
      <div
        class="absolute inset-0 z-20 h-full w-full flex-shrink-0 overflow-hidden rounded-2xl select-none"
        :class="[props.firstContentClass]"
        :style="{
          clipPath: `inset(0 ${100 - sliderXPercent}% 0 0)`,
        }"
      >
        <slot name="first-content">
          <img
            v-if="props.firstImage"
            :alt="props.firstImageAlt"
            :src="props.firstImage"
            class="absolute inset-0 z-20 h-full w-full flex-shrink-0 rounded-2xl select-none"
            :class="[firstContentClass]"
            :draggable="false"
          >
        </slot>
      </div>
    </div>

    <!-- 第二侧内容 -->
    <div
      class="absolute top-0 left-0 z-[19] h-full w-full rounded-2xl select-none"
      :class="[props.secondContentClass]"
      :style="{ pointerEvents: isInteracting ? 'none' : 'auto' }"
    >
      <slot name="second-content">
        <img
          v-if="props.secondImage"
          :alt="props.secondImageAlt"
          :src="props.secondImage"
          class="h-full w-full object-cover"
          :class="[secondContentClass]"
          :draggable="false"
        >
      </slot>
    </div>
  </div>
</template>
