<script setup lang="ts">
import { computed, shallowRef, useId, useTemplateRef } from "vue";

interface Props {
  strokeWidth?: number;
  text: string;
  duration?: number;
  opacity?: number;
}

const props = withDefaults(defineProps<Props>(), {
  strokeWidth: 0.75,
  // 单位为秒（下方会 ×1000 转毫秒）；旧默认值 200 会产生 200s 的过渡，属于错误值
  duration: 0.2,
  opacity: 0.75,
});

const svgRef = useTemplateRef<SVGSVGElement>("svgRef");
const hovered = shallowRef(false);

/**
 * SVG 定义的 id 前缀：写死的 id 在同页多实例时，url(#…) 总是解析到文档里第一个同名定义，
 * 第二个实例会用第一个实例的揭示圆与渐变
 */
const uid = useId();
const textGradientId = `${uid}-text-gradient`;
const revealMaskId = `${uid}-reveal-mask`;
const textMaskId = `${uid}-text-mask`;

// 过渡时长：秒转毫秒，duration 为 0 时回退 200ms；用 computed 让 duration 变化后生效
const transitionDuration = computed(() => (props.duration ? props.duration * 1000 : 200));

/** 揭示圆心相对 SVG 的百分比位置，在指针事件里结合当时的布局算好，computed 只负责格式化 */
const maskPercent = shallowRef({ cx: 50, cy: 50 });

const maskPosition = computed(() => ({
  cx: `${maskPercent.value.cx}%`,
  cy: `${maskPercent.value.cy}%`,
}));

/** 按指针坐标更新揭示圆心：每次实时读取 SVG 的位置，页面滚动后也准确 */
function updateMaskPosition(clientX: number, clientY: number) {
  const svg = svgRef.value;
  if (!svg) return;
  const svgRect = svg.getBoundingClientRect();
  if (!svgRect.width || !svgRect.height) return;
  maskPercent.value = {
    cx: ((clientX - svgRect.left) / svgRect.width) * 100,
    cy: ((clientY - svgRect.top) / svgRect.height) * 100,
  };
}

// 描边动画的样式
const strokeStyle = computed(() => ({
  strokeDashoffset: hovered.value ? "0" : "1000",
  strokeDasharray: "1000",
  transition: "stroke-dashoffset 4s ease-in-out, stroke-dasharray 4s ease-in-out",
}));

function handleMouseEnter() {
  hovered.value = true;
}

function handleMouseLeave() {
  hovered.value = false;
}

function handleMouseMove(e: MouseEvent) {
  updateMaskPosition(e.clientX, e.clientY);
}

// 触摸支持
function handleTouchStart(e: TouchEvent) {
  hovered.value = true;
  handleTouchMove(e); // 触摸开始时同步一次位置
}

function handleTouchMove(e: TouchEvent) {
  const touch = e.touches[0];
  if (!touch) return;
  updateMaskPosition(touch.clientX, touch.clientY);
}

function handleTouchEnd() {
  hovered.value = false;
}
</script>

<template>
  <svg
    ref="svgRef"
    width="100%"
    height="100%"
    viewBox="0 0 300 100"
    xmlns="http://www.w3.org/2000/svg"
    class="select-none"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMove"
    @touchstart="handleTouchStart"
    @touchmove="handleTouchMove"
    @touchend="handleTouchEnd"
  >
    <defs>
      <linearGradient
        :id="textGradientId"
        gradientUnits="userSpaceOnUse"
        cx="50%"
        cy="50%"
        r="25%"
      >
        <stop
          v-if="hovered"
          offset="0%"
          stop-color="var(--yellow-500)"
        />
        <stop
          v-if="hovered"
          offset="25%"
          stop-color="var(--red-500)"
        />
        <stop
          v-if="hovered"
          offset="50%"
          stop-color="var(--blue-500)"
        />
        <stop
          v-if="hovered"
          offset="75%"
          stop-color="var(--cyan-500)"
        />
        <stop
          v-if="hovered"
          offset="100%"
          stop-color="var(--violet-500)"
        />
      </linearGradient>

      <!-- 跟随指针的径向揭示渐变 -->
      <radialGradient
        :id="revealMaskId"
        gradientUnits="userSpaceOnUse"
        r="20%"
        :cx="maskPosition.cx"
        :cy="maskPosition.cy"
        :style="{
          transition: `cx ${transitionDuration}ms ease-out, cy ${transitionDuration}ms ease-out`,
        }"
      >
        <stop
          offset="0%"
          stop-color="white"
        />
        <stop
          offset="100%"
          stop-color="black"
        />
      </radialGradient>

      <mask :id="textMaskId">
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          :fill="`url(#${revealMaskId})`"
        />
      </mask>
    </defs>

    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      :stroke-width="strokeWidth"
      :style="{ opacity: hovered ? opacity : 0 }"
      class="fill-transparent stroke-neutral-200 font-[helvetica] text-7xl font-bold dark:stroke-neutral-800"
    >
      {{ text }}
    </text>

    <!-- 描边动画文字 -->
    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      :stroke-width="strokeWidth"
      :style="strokeStyle"
      class="fill-transparent stroke-neutral-200 font-[helvetica] text-7xl font-bold dark:stroke-neutral-800"
    >
      {{ text }}
    </text>

    <text
      x="50%"
      y="50%"
      text-anchor="middle"
      dominant-baseline="middle"
      :stroke="`url(#${textGradientId})`"
      :stroke-width="strokeWidth"
      :mask="`url(#${textMaskId})`"
      class="fill-transparent font-[helvetica] text-7xl font-bold"
    >
      {{ text }}
    </text>
  </svg>
</template>

<style scoped>
.select-none {
  user-select: none;
}
</style>
