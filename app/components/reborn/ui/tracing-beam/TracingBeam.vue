<script lang="ts" setup>
import type { HTMLAttributes } from "vue";
import { useEventListener, useResizeObserver } from "@vueuse/core";
import { Motion } from "motion-v";
import { computed, onBeforeUnmount, onMounted, shallowRef, useId, useTemplateRef, watch } from "vue";
import { useSpring } from "vue-use-spring";

interface Props {
  /** 根容器的自定义类名 */
  class?: HTMLAttributes["class"];
}
defineProps<Props>();

const tracingBeamRef = useTemplateRef<HTMLDivElement>("tracingBeamRef");
const tracingBeamContentRef = useTemplateRef<HTMLDivElement>("tracingBeamContentRef");

/** 渐变定义的唯一 id：写死的 id 在同页多实例时会解析到第一个实例的渐变，光束跟着别的实例走 */
const gradientId = `${useId()}-tracing-beam-gradient`;

const scrollYProgress = shallowRef(0);
const svgHeight = shallowRef(0);
const scrollPercentage = shallowRef(0);

const computedY1 = computed(
  () =>
    mapRange(scrollYProgress.value, 0, 0.8, scrollYProgress.value, svgHeight.value) *
    (1.4 - scrollPercentage.value),
);

const computedY2 = computed(
  () =>
    mapRange(scrollYProgress.value, 0, 1, scrollYProgress.value, svgHeight.value - 500) *
    (1.4 - scrollPercentage.value),
);

const spring = useSpring(
  { y1: computedY1.value, y2: computedY2.value },
  { tension: 80, friction: 26, precision: 0.01 },
);

watch(computedY1, (newY1) => {
  spring.y1 = newY1;
});

watch(computedY2, (newY2) => {
  spring.y2 = newY2;
});

function updateScrollYProgress() {
  if (tracingBeamRef.value) {
    const boundingRect = tracingBeamRef.value.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    const elementHeight = boundingRect.height;

    scrollPercentage.value = (windowHeight - boundingRect.top) / (windowHeight + elementHeight);

    scrollYProgress.value = (boundingRect.y / windowHeight) * -1;
  }
}

/** 滚动与缩放按帧合并：一帧内多次事件只测量、更新一次 */
let frame = 0;
function scheduleUpdate() {
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    updateScrollYProgress();
  });
}

function updateSVGHeight() {
  if (!tracingBeamContentRef.value) return;

  svgHeight.value = tracingBeamContentRef.value.offsetHeight;
}

// 监听都随组件作用域自动移除：不传目标时默认挂到 window 且服务端不执行，scroll 用 passive 不阻塞滚动
useEventListener("scroll", scheduleUpdate, { passive: true });
useEventListener("resize", scheduleUpdate, { passive: true });
useResizeObserver(tracingBeamContentRef, updateSVGHeight);

onMounted(() => {
  updateScrollYProgress();
  updateSVGHeight();
});

onBeforeUnmount(() => {
  if (frame) cancelAnimationFrame(frame);
});

function mapRange(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}
</script>

<template>
  <div
    ref="tracingBeamRef"
    class="relative mx-auto h-full w-full max-w-4xl"
    :class="[$props.class]"
  >
    <div class="absolute top-3 -left-4 md:-left-12">
      <div
        :style="{
          boxShadow: scrollYProgress > 0 ? 'none' : 'rgba(0, 0, 0, 0.24) 0px 3px 8px',
        }"
        class="border-netural-200 ml-[27px] flex size-4 items-center justify-center rounded-full border shadow-sm"
      >
        <Motion
          :animate="{
            backgroundColor: scrollYProgress > 0 ? 'white' : 'var(--emerald-500)',
            borderColor: scrollYProgress > 0 ? 'white' : 'var(--emerald-600)',
          }"
          class="size-2 rounded-full border border-neutral-300 bg-white"
        />
      </div>
      <svg
        :viewBox="`0 0 20 ${svgHeight}`"
        width="20"
        :height="svgHeight"
        class="ml-4 block"
        aria-hidden="true"
      >
        <path
          :d="`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`"
          fill="none"
          stroke="#9091A0"
          stroke-opacity="0.16"
        />
        <path
          :d="`M 1 0V -36 l 18 24 V ${svgHeight * 0.8} l -18 24V ${svgHeight}`"
          fill="none"
          :stroke="`url(#${gradientId})`"
          stroke-width="1.25"
          class="motion-reduce:hidden"
        />
        <defs>
          <linearGradient
            :id="gradientId"
            gradientUnits="userSpaceOnUse"
            x1="0"
            x2="0"
            :y1="spring.y1"
            :y2="spring.y2"
          >
            <stop
              stop-color="#18CCFC"
              stop-opacity="0"
            />
            <stop stop-color="#18CCFC" />
            <stop
              offset="0.325"
              stop-color="#6344F5"
            />
            <stop
              offset="1"
              stop-color="#AE48FF"
              stop-opacity="0"
            />
          </linearGradient>
        </defs>
      </svg>
    </div>
    <div ref="tracingBeamContentRef">
      <slot />
    </div>
  </div>
</template>
