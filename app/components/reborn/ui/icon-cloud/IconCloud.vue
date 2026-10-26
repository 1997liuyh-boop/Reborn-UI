<script lang="ts" setup>
import type { IconCloudProps, SphereIcon } from "./index";
import { computed, onBeforeUnmount, onMounted, useTemplateRef, watch } from "vue";
import { cn } from "~/lib/utils";

interface TargetRotation {
  x: number;
  y: number;
  startX: number;
  startY: number;
  distance: number;
  startTime: number;
  duration: number;
}

const props = withDefaults(defineProps<IconCloudProps>(), {
  images: () => [],
});

const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");

// 以下状态只在事件处理与 rAF 帧循环里读写，不参与模板渲染：用普通变量保存，避免每帧对每个图标做多次响应式代理读取
let animationFrame = 0;
let imageCanvases: HTMLCanvasElement[] = [];
let imagesLoaded: boolean[] = [];
const rotation = { x: 0, y: 0 };
let isDragging = false;
const lastMousePos = { x: 0, y: 0 };
const mousePos = { x: 0, y: 0 };
let targetRotation: TargetRotation | null = null;

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

watch(
  () => props.images,
  (currentImages, _oldImages, onCleanup) => {
    if (!import.meta.client) {
      imageCanvases = [];
      imagesLoaded = [];
      return;
    }

    // images 变化后旧图片晚到的 onload 不再按下标标记新数组
    let stale = false;
    onCleanup(() => {
      stale = true;
    });

    const images = currentImages ?? [];
    const loaded: boolean[] = new Array(images.length).fill(false);
    imagesLoaded = loaded;

    const newImageCanvases = images.map((url, idx) => {
      const offscreen = document.createElement("canvas");
      offscreen.width = 40;
      offscreen.height = 40;

      const offCtxRaw = offscreen.getContext("2d");
      if (!offCtxRaw) {
        return offscreen;
      }

      const offCtx: CanvasRenderingContext2D = offCtxRaw;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      img.onload = () => {
        if (stale) return;
        offCtx.clearRect(0, 0, offscreen.width, offscreen.height);
        offCtx.beginPath();
        offCtx.arc(20, 20, 20, 0, Math.PI * 2);
        offCtx.closePath();
        offCtx.clip();
        offCtx.drawImage(img, 0, 0, 40, 40);

        loaded[idx] = true;
      };

      return offscreen;
    });

    imageCanvases = newImageCanvases;
  },
  {
    immediate: true,
  },
);

// 图标在球面上的位置只由图标数量决定，是派生值，用 computed
const imagePositions = computed<SphereIcon[]>(() => {
  const count = props.images.length;
  if (count === 0) return [];

  const newPositions: SphereIcon[] = [];
  const offset = 2 / count;
  const increment = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = i * offset - 1 + offset / 2;
    const r = Math.sqrt(1 - y * y);
    const phi = i * increment;
    const x = Math.cos(phi) * r;
    const z = Math.sin(phi) * r;

    newPositions.push({
      x: x * 100,
      y: y * 100,
      z: z * 100,
      scale: 1,
      opacity: 1,
      id: i,
    });
  }

  return newPositions;
});

function handleMouseDown(e: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  imagePositions.value.forEach((icon) => {
    const cosX = Math.cos(rotation.x);
    const sinX = Math.sin(rotation.x);
    const cosY = Math.cos(rotation.y);
    const sinY = Math.sin(rotation.y);

    const rotatedX = icon.x * cosY - icon.z * sinY;
    const rotatedZ = icon.x * sinY + icon.z * cosY;
    const rotatedY = icon.y * cosX + rotatedZ * sinX;

    const screenX = canvas.width / 2 + rotatedX;
    const screenY = canvas.height / 2 + rotatedY;
    const scale = (rotatedZ + 200) / 300;
    const radius = 20 * scale;
    const dx = x - screenX;
    const dy = y - screenY;

    if (dx * dx + dy * dy < radius * radius) {
      const targetX = -Math.atan2(icon.y, Math.sqrt(icon.x * icon.x + icon.z * icon.z));
      const targetY = Math.atan2(icon.x, icon.z);
      const currentX = rotation.x;
      const currentY = rotation.y;
      const distance = Math.sqrt((targetX - currentX) ** 2 + (targetY - currentY) ** 2);
      const duration = Math.min(2000, Math.max(800, distance * 1000));

      targetRotation = {
        x: targetX,
        y: targetY,
        startX: currentX,
        startY: currentY,
        distance,
        startTime: performance.now(),
        duration,
      };
    }
  });

  isDragging = true;
  lastMousePos.x = e.clientX;
  lastMousePos.y = e.clientY;
}

function handleMouseMove(e: MouseEvent) {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const rect = canvas.getBoundingClientRect();
  mousePos.x = e.clientX - rect.left;
  mousePos.y = e.clientY - rect.top;

  if (isDragging) {
    const deltaX = e.clientX - lastMousePos.x;
    const deltaY = e.clientY - lastMousePos.y;

    rotation.x += deltaY * 0.002;
    rotation.y += deltaX * 0.002;

    lastMousePos.x = e.clientX;
    lastMousePos.y = e.clientY;
  }
}

function handleMouseUp() {
  isDragging = false;
}

onMounted(() => {
  const canvas = canvasRef.value;
  if (!canvas) return;

  const ctxRaw = canvas.getContext("2d");
  if (!ctxRaw) return;

  const ctx: CanvasRenderingContext2D = ctxRaw;
  const safeCanvas: HTMLCanvasElement = canvas;

  function animate() {
    ctx.clearRect(0, 0, safeCanvas.width, safeCanvas.height);

    const centerX = safeCanvas.width / 2;
    const centerY = safeCanvas.height / 2;
    const dx = mousePos.x - centerX;
    const dy = mousePos.y - centerY;
    const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
    const distance = Math.sqrt(dx * dx + dy * dy);
    const speed = 0.003 + (distance / maxDistance) * 0.01;

    if (targetRotation) {
      const { startX, startY, x: tx, y: ty, startTime, duration } = targetRotation;
      const elapsed = performance.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeOutCubic(progress);

      rotation.x = startX + (tx - startX) * eased;
      rotation.y = startY + (ty - startY) * eased;

      if (progress >= 1) {
        targetRotation = null;
      }
    } else if (!isDragging) {
      rotation.x += (dy / safeCanvas.height) * speed;
      rotation.y += (dx / safeCanvas.width) * speed;
    }

    imagePositions.value.forEach((icon, index) => {
      const cosX = Math.cos(rotation.x);
      const sinX = Math.sin(rotation.x);
      const cosY = Math.cos(rotation.y);
      const sinY = Math.sin(rotation.y);

      const rotatedX = icon.x * cosY - icon.z * sinY;
      const rotatedZ = icon.x * sinY + icon.z * cosY;
      const rotatedY = icon.y * cosX + rotatedZ * sinX;

      const scale = (rotatedZ + 200) / 300;
      const opacity = Math.max(0.2, Math.min(1, (rotatedZ + 150) / 200));
      const imageCanvas = imageCanvases[index];
      const isLoaded = imagesLoaded[index] === true;

      ctx.save();
      ctx.translate(centerX + rotatedX, centerY + rotatedY);
      ctx.scale(scale, scale);
      ctx.globalAlpha = opacity;

      if (imageCanvas && isLoaded) {
        ctx.drawImage(imageCanvas, -20, -20, 40, 40);
      }

      ctx.restore();
    });

    animationFrame = requestAnimationFrame(animate);
  }

  animationFrame = requestAnimationFrame(animate);
});

onBeforeUnmount(() => {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
  }
});
</script>

<template>
  <canvas
    ref="canvasRef"
    width="300"
    height="300"
    role="img"
    aria-label="Interactive 3D Image Cloud"
    :class="cn('rounded-lg', props.class)"
    @mousedown="handleMouseDown"
    @mousemove="handleMouseMove"
    @mouseup="handleMouseUp"
    @mouseleave="handleMouseUp"
  />
</template>
