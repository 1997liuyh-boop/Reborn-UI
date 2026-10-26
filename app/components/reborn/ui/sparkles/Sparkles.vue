<script setup lang="ts">
import { useRafFn } from "@vueuse/core";
import { onBeforeUnmount, onMounted, useTemplateRef } from "vue";

interface Props {
  background?: string;
  particleColor?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleDensity?: number;
}

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: number;
  vx: number;
  vy: number;
  phase: number;
  phaseSpeed: number;
}

const props = withDefaults(defineProps<Props>(), {
  background: "#0d47a1",
  particleColor: "#ffffff",
  minSize: 1,
  maxSize: 3,
  speed: 4,
  particleDensity: 120,
});

const containerRef = useTemplateRef<HTMLDivElement>("containerRef");
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");

// 粒子与画布上下文只给 canvas 绘制用、不参与渲染：用普通变量并原地修改，
// 放在深层 ref 里每帧都要经过响应式代理，还会整体重建对象带来持续的 GC 压力
let particles: Particle[] = [];
let ctx: CanvasRenderingContext2D | null = null;
/** 画布的 CSS 尺寸：上下文已按 DPR 缩放，绘制坐标必须用 CSS 像素，否则高 DPR 下坐标被缩放两次 */
let cssWidth = 0;
let cssHeight = 0;

// 挂载与容器尺寸变化时同步画布尺寸
function resizeCanvas() {
  if (!canvasRef.value || !containerRef.value) return;

  const dpr = window.devicePixelRatio || 1;
  const rect = containerRef.value.getBoundingClientRect();

  cssWidth = rect.width;
  cssHeight = rect.height;
  // 重设宽高会把上下文变换复位为单位矩阵，所以这里每次只缩放一次
  canvasRef.value.width = rect.width * dpr;
  canvasRef.value.height = rect.height * dpr;

  if (ctx) {
    ctx.scale(dpr, dpr);
  }
}

function generateParticles(): void {
  const newParticles: Particle[] = [];
  const count = props.particleDensity;

  for (let i = 0; i < count; i++) {
    const baseSpeed = 0.05;
    const speedVariance = Math.random() * 0.3 + 0.7;

    newParticles.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * (props.maxSize - props.minSize) + props.minSize,
      opacity: Math.random() * 0.5 + 0.3,
      vx: (Math.random() - 0.5) * baseSpeed * speedVariance * props.speed,
      vy: ((Math.random() - 0.5) * baseSpeed - baseSpeed * 0.3) * speedVariance * props.speed,
      phase: Math.random() * Math.PI * 2,
      phaseSpeed: 0.015,
    });
  }

  particles = newParticles;
}

function updateAndDrawParticles() {
  if (!ctx) return;

  ctx.clearRect(0, 0, cssWidth, cssHeight);

  for (const particle of particles) {
    let newX = particle.x + particle.vx;
    let newY = particle.y + particle.vy;

    if (newX < -2) newX = 102;
    if (newX > 102) newX = -2;
    if (newY < -2) newY = 102;
    if (newY > 102) newY = -2;

    const newPhase = (particle.phase + particle.phaseSpeed) % (Math.PI * 2);
    const opacity = 0.3 + (Math.sin(newPhase) * 0.3 + 0.3);

    particle.x = newX;
    particle.y = newY;
    particle.phase = newPhase;
    particle.opacity = opacity;

    // 绘制粒子：坐标按 CSS 尺寸换算
    ctx.beginPath();
    ctx.arc((newX * cssWidth) / 100, (newY * cssHeight) / 100, particle.size, 0, Math.PI * 2);
    ctx.fillStyle = `${props.particleColor}${Math.floor(opacity * 255)
      .toString(16)
      .padStart(2, "0")}`;
    ctx.fill();
  }
}

const { pause, resume } = useRafFn(updateAndDrawParticles, { immediate: false });

// 监听容器尺寸变化
let resizeObserver: ResizeObserver | undefined;

onMounted(() => {
  if (!canvasRef.value) return;

  ctx = canvasRef.value.getContext("2d");
  resizeCanvas();
  generateParticles();

  // 注册尺寸观察
  resizeObserver = new ResizeObserver(resizeCanvas);
  if (containerRef.value) {
    resizeObserver.observe(containerRef.value);
  }

  resume();
});

onBeforeUnmount(() => {
  pause();
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  ctx = null;
});
</script>

<template>
  <div ref="containerRef" class="relative size-full overflow-hidden will-change-transform" :style="{ background }">
    <canvas ref="canvasRef" class="absolute inset-0 size-full" />
  </div>
</template>
