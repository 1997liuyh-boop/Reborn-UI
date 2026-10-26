<script lang="ts" setup>
import { Motion, useAnimate } from "motion-v";
import { computed, nextTick, onMounted, onUnmounted, shallowRef, useTemplateRef, watch } from "vue";

const props = withDefaults(defineProps<Props>(), {
  gradientColors: () => ["#A97CF8", "#F38CB8", "#FDCC92"],
  minScratchPercentage: 50,
});

const emit = defineEmits<{
  complete: [];
}>();

const cursorImg =
  "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNSIgc3R5bGU9ImZpbGw6I2ZmZjtzdHJva2U6IzAwMDtzdHJva2Utd2lkdGg6MXB4OyIgLz4KPC9zdmc+'), auto";

interface Props {
  class?: string;
  width: number;
  height: number;
  minScratchPercentage?: number;
  gradientColors?: [string, string, string];
}

const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");

const containerWidth = computed(() => `${props.width}px`);
const containerHeight = computed(() => `${props.height}px`);

/** 画布上下文是外部实例、不参与渲染，用普通变量，避免被深层响应式代理 */
let context: CanvasRenderingContext2D | null = null;

const isScratching = shallowRef(false);
const isComplete = shallowRef(false);

function handleMouseDown() {
  isScratching.value = true;
}
function handleTouchStart() {
  isScratching.value = true;
}

// 画布的宽高属性不是响应式数据，每次实时读取，width / height 变化后也能拿到新尺寸
function canvasWidth() {
  return canvasRef.value?.width || props.width;
}
function canvasHeight() {
  return canvasRef.value?.height || props.height;
}

/** 绘制刮层：先铺底色，再盖一层渐变 */
function drawCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  context = canvas.getContext("2d");
  if (!context) return;
  context.globalCompositeOperation = "source-over";
  context.fillStyle = "#ccc";
  context.fillRect(0, 0, canvasWidth(), canvasHeight());
  const gradient = context.createLinearGradient(0, 0, canvasWidth(), canvasHeight());
  gradient.addColorStop(0, props.gradientColors[0]);
  gradient.addColorStop(0.5, props.gradientColors[1]);
  gradient.addColorStop(1, props.gradientColors[2]);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvasWidth(), canvasHeight());
}

function scratch(clientX: number, clientY: number) {
  if (canvasRef.value && context) {
    const rect = canvasRef.value.getBoundingClientRect();
    const x = clientX - rect.left + 16;
    const y = clientY - rect.top + 16;

    context.globalCompositeOperation = "destination-out";
    context.beginPath();
    context.arc(x, y, 30, 0, Math.PI * 2);
    context.fill();
  }
}

function handleDocumentMouseMove(event: MouseEvent) {
  if (!isScratching.value) return;
  scratch(event.clientX, event.clientY);
}

function handleDocumentTouchMove(event: TouchEvent) {
  if (!isScratching.value) return;
  const touch = event.touches[0];
  scratch(touch.clientX, touch.clientY);
}

/**
 * 结束刮擦：document 上任意位置松开都会触发，只有本卡片确实在刮（isScratching 由 true 变 false）时
 * 才检查完成度，避免每次点击页面都读取并遍历整张画布的像素
 */
function finishScratch() {
  const wasScratching = isScratching.value;
  isScratching.value = false;
  if (wasScratching) checkCompletion();
}
function handleDocumentMouseUp() {
  finishScratch();
}
function handleDocumentTouchEnd() {
  finishScratch();
}

function addEventListeners() {
  document.addEventListener("mousedown", handleDocumentMouseMove);
  document.addEventListener("mousemove", handleDocumentMouseMove);
  document.addEventListener("touchstart", handleDocumentTouchMove);
  document.addEventListener("touchmove", handleDocumentTouchMove);
  document.addEventListener("mouseup", handleDocumentMouseUp);
  document.addEventListener("touchend", handleDocumentTouchEnd);
  document.addEventListener("touchcancel", handleDocumentTouchEnd);
}

function checkCompletion() {
  if (isComplete.value) return;

  if (canvasRef.value && context) {
    const imageData = context.getImageData(0, 0, canvasWidth(), canvasHeight());
    const pixels = imageData.data;
    const totalPixels = pixels.length / 4;
    let clearPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] === 0) {
        clearPixels++;
      }
    }

    const percentage = (clearPixels / totalPixels) * 100;

    if (percentage >= props.minScratchPercentage) {
      isComplete.value = true;
      context.clearRect(0, 0, canvasWidth(), canvasHeight());

      startAnimation();
    } else {
      isScratching.value = false;
    }
  }
}

const [containerRef, animate] = useAnimate();
async function startAnimation() {
  if (!containerRef.value) return;
  animate(containerRef.value, {
    scale: 1,
    rotate: [0, 10, -10, 10, -10, 0],
  });

  emit("complete");
}

onMounted(() => {
  if (!canvasRef.value) return;

  drawCanvas();

  addEventListeners();
});

// 尺寸变化会重设画布宽高并清空画布，未刮开时等 DOM 更新后重绘刮层，否则内容会直接露出来
watch([() => props.width, () => props.height], async () => {
  await nextTick();
  if (!isComplete.value) drawCanvas();
});

function removeEventListeners() {
  document.removeEventListener("mousedown", handleDocumentMouseMove);
  document.removeEventListener("mousemove", handleDocumentMouseMove);
  document.removeEventListener("touchstart", handleDocumentTouchMove);
  document.removeEventListener("touchmove", handleDocumentTouchMove);
  document.removeEventListener("mouseup", handleDocumentMouseUp);
  document.removeEventListener("touchend", handleDocumentTouchEnd);
  document.removeEventListener("touchcancel", handleDocumentTouchEnd);
}
onUnmounted(() => {
  removeEventListeners();
});
</script>

<template>
  <Motion
    ref="containerRef"
    class="relative select-none"
    :class="[props.class]"
    :style="{
      width: containerWidth,
      height: containerHeight,
      cursor: cursorImg,
    }"
    :initial="{
      scale: 1,
      rotate: [0, 10, -10, 10, -10, 0],
    }"
    :transition="{ duration: 0.5 }"
  >
    <canvas
      ref="canvasRef"
      :width="width"
      :height="height"
      class="absolute top-0 left-0"
      @mousedown="handleMouseDown"
      @touchstart="handleTouchStart"
    />

    <slot />
  </Motion>
</template>

<style></style>
