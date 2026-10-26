<script setup lang="ts">
import { useResizeObserver } from "@vueuse/core";
import { computed, onUnmounted, shallowRef, useTemplateRef, watch } from "vue";

export type DitheringMode = "bayer" | "halftone" | "noise" | "crosshatch";
export type ColorMode = "original" | "grayscale" | "duotone" | "custom";

export interface Props {
  /** 源图片地址 */
  src: string;
  /** 抖动网格单元的尺寸，单位 px */
  gridSize?: number;
  /** 抖动图案类型 */
  ditherMode?: DitheringMode;
  /** 颜色处理模式 */
  colorMode?: ColorMode;
  /** 反转抖动后的输出颜色 */
  invert?: boolean;
  /** 像素化倍数（1 为不额外像素化，越大颗粒越粗） */
  pixelRatio?: number;
  /** duotone 模式的主色 */
  primaryColor?: string;
  /** duotone 模式的副色 */
  secondaryColor?: string;
  /** custom 模式使用的调色板 */
  customPalette?: string[];
  /** 亮度调整（-1 到 1） */
  brightness?: number;
  /** 对比度调整（0 到 2，1 为原始对比度） */
  contrast?: number;
  /** 抖动图像背后的背景色 */
  backgroundColor?: string;
  /** 图片在容器内的适配方式，同 CSS object-fit */
  objectFit?: "cover" | "contain" | "fill" | "none";
  /** 抖动阈值偏移（0 到 1） */
  threshold?: number;
  /** 开启动画效果 */
  animated?: boolean;
  /** 动画速度（越小越慢） */
  animationSpeed?: number;
  /** 容器追加的类名 */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  gridSize: 4,
  ditherMode: "bayer",
  colorMode: "original",
  invert: false,
  pixelRatio: 1,
  primaryColor: "#000000",
  secondaryColor: "#ffffff",
  customPalette: () => ["#000000", "#ffffff"],
  brightness: 0,
  contrast: 1,
  backgroundColor: "transparent",
  objectFit: "cover",
  threshold: 0.5,
  animated: false,
  animationSpeed: 0.02,
});

// 有序抖动用的 4x4 Bayer 矩阵
const BAYER_MATRIX_4x4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

// 更细腻抖动用的 8x8 Bayer 矩阵
const BAYER_MATRIX_8x8 = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
];

const containerRef = useTemplateRef<HTMLDivElement>("containerRef");
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");
// 容器尺寸只整体替换
const dimensions = shallowRef({ width: 0, height: 0 });

// 帧循环与离屏绘制使用的内部状态不参与模板渲染，用普通变量保存，避免每帧经过响应式代理
let sourceImage: HTMLImageElement | null = null;
let imageData: ImageData | null = null;
let animationFrame: number | null = null;
let time = 0;

function parseColor(color: string): [number, number, number] {
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    if (hex.length === 3) {
      return [
        Number.parseInt(hex[0] + hex[0], 16),
        Number.parseInt(hex[1] + hex[1], 16),
        Number.parseInt(hex[2] + hex[2], 16),
      ];
    }
    return [
      Number.parseInt(hex.slice(0, 2), 16),
      Number.parseInt(hex.slice(2, 4), 16),
      Number.parseInt(hex.slice(4, 6), 16),
    ];
  }
  const match = color.match(/rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/i);
  if (match) {
    return [Number.parseInt(match[1]), Number.parseInt(match[2]), Number.parseInt(match[3])];
  }
  return [0, 0, 0];
}

function getLuminance(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const parsedPrimaryColor = computed(() => parseColor(props.primaryColor));
const parsedSecondaryColor = computed(() => parseColor(props.secondaryColor));
const parsedCustomPalette = computed(() => props.customPalette?.map(parseColor));

function applyDithering(
  ctx: CanvasRenderingContext2D,
  displayWidth: number,
  displayHeight: number,
  time: number = 0,
) {
  const canvas = canvasRef.value;
  if (!canvas || !imageData) return;

  // 用背景色清空画布
  if (props.backgroundColor !== "transparent") {
    ctx.fillStyle = props.backgroundColor;
    ctx.fillRect(0, 0, displayWidth, displayHeight);
  } else {
    ctx.clearRect(0, 0, displayWidth, displayHeight);
  }

  const sourceData = imageData.data;
  const sourceWidth = imageData.width;
  const sourceHeight = imageData.height;

  const effectivePixelSize = Math.max(1, Math.floor(props.gridSize * props.pixelRatio));
  const matrixSize = props.gridSize <= 4 ? 4 : 8;
  const bayerMatrix = props.gridSize <= 4 ? BAYER_MATRIX_4x4 : BAYER_MATRIX_8x8;
  const matrixScale = matrixSize === 4 ? 16 : 64;

  // 逐块处理像素
  for (let y = 0; y < displayHeight; y += effectivePixelSize) {
    for (let x = 0; x < displayWidth; x += effectivePixelSize) {
      // 把显示坐标映射到源图坐标
      const srcX = Math.floor((x / displayWidth) * sourceWidth);
      const srcY = Math.floor((y / displayHeight) * sourceHeight);
      const srcIdx = (srcY * sourceWidth + srcX) * 4;

      let r = sourceData[srcIdx] || 0;
      let g = sourceData[srcIdx + 1] || 0;
      let b = sourceData[srcIdx + 2] || 0;
      const a = sourceData[srcIdx + 3] || 0;

      // 跳过几乎全透明的像素
      if (a < 10) continue;

      // 应用亮度与对比度
      r = clamp((r - 128) * props.contrast + 128 + props.brightness * 255, 0, 255);
      g = clamp((g - 128) * props.contrast + 128 + props.brightness * 255, 0, 255);
      b = clamp((b - 128) * props.contrast + 128 + props.brightness * 255, 0, 255);

      // 计算亮度
      const luminance = getLuminance(r, g, b) / 255;

      // 按模式取抖动阈值
      let ditherThreshold: number;
      const matrixX = Math.floor(x / props.gridSize) % matrixSize;
      const matrixY = Math.floor(y / props.gridSize) % matrixSize;

      switch (props.ditherMode) {
        case "bayer":
          ditherThreshold = bayerMatrix[matrixY][matrixX] / matrixScale;
          break;
        case "halftone": {
          const angle = Math.PI / 4;
          const scale = props.gridSize * 2;
          const rotX = x * Math.cos(angle) + y * Math.sin(angle);
          const rotY = -x * Math.sin(angle) + y * Math.cos(angle);
          const pattern = (Math.sin(rotX / scale) + Math.sin(rotY / scale) + 2) / 4;
          ditherThreshold = pattern;
          break;
        }
        case "noise": {
          const noiseVal = Math.sin(x * 12.9898 + y * 78.233 + time * 100) * 43758.5453;
          ditherThreshold = noiseVal - Math.floor(noiseVal);
          break;
        }
        case "crosshatch": {
          const line1 = (x + y) % (props.gridSize * 2) < props.gridSize ? 1 : 0;
          const line2 =
            (x - y + props.gridSize * 4) % (props.gridSize * 2) < props.gridSize ? 1 : 0;
          ditherThreshold = (line1 + line2) / 2;
          break;
        }
        default:
          ditherThreshold = bayerMatrix[matrixY][matrixX] / matrixScale;
      }

      // 叠加用户设置的阈值偏移
      ditherThreshold = ditherThreshold * (1 - props.threshold) + props.threshold * 0.5;

      // 按颜色模式决定输出颜色
      let outputColor: [number, number, number];

      switch (props.colorMode) {
        case "grayscale": {
          const shouldBeDark = luminance < ditherThreshold;
          outputColor = shouldBeDark ? [0, 0, 0] : [255, 255, 255];
          break;
        }
        case "duotone": {
          const shouldBeDark = luminance < ditherThreshold;
          outputColor = shouldBeDark ? parsedPrimaryColor.value : parsedSecondaryColor.value;
          break;
        }
        case "custom": {
          if (parsedCustomPalette.value.length === 2) {
            const shouldBeDark = luminance < ditherThreshold;
            outputColor = shouldBeDark
              ? parsedCustomPalette.value[0]
              : parsedCustomPalette.value[1];
          } else {
            // 抖动后量化到最接近的调色板颜色
            const adjustedLuminance = luminance + (ditherThreshold - 0.5) * 0.5;
            const paletteIndex = Math.floor(
              clamp(adjustedLuminance, 0, 1) * (parsedCustomPalette.value.length - 1),
            );
            outputColor = parsedCustomPalette.value[paletteIndex];
          }
          break;
        }
        case "original":
        default: {
          // 保留原色的同时做抖动
          const ditherAmount = ditherThreshold - 0.5;
          const adjustedR = clamp(r + ditherAmount * 64, 0, 255);
          const adjustedG = clamp(g + ditherAmount * 64, 0, 255);
          const adjustedB = clamp(b + ditherAmount * 64, 0, 255);

          // 量化到较少的色阶，形成抖动质感
          const levels = 4;
          outputColor = [
            Math.round(adjustedR / (255 / levels)) * (255 / levels),
            Math.round(adjustedG / (255 / levels)) * (255 / levels),
            Math.round(adjustedB / (255 / levels)) * (255 / levels),
          ];
          break;
        }
      }

      // 应用反色
      if (props.invert) {
        outputColor = [255 - outputColor[0], 255 - outputColor[1], 255 - outputColor[2]];
      }

      // 绘制像素块
      ctx.fillStyle = `rgb(${outputColor[0]}, ${outputColor[1]}, ${outputColor[2]})`;
      ctx.fillRect(x, y, effectivePixelSize, effectivePixelSize);
    }
  }
}

/** 取已按 dpr 缩放好的画布上下文 */
function getContext(): CanvasRenderingContext2D | null {
  return canvasRef.value?.getContext("2d") ?? null;
}

/** 只重绘：抖动参数变化时调用，不重新读取像素 */
function redraw() {
  const ctx = getContext();
  const { width, height } = dimensions.value;
  if (!ctx || !imageData || width === 0 || height === 0) return;
  applyDithering(ctx, width, height, time);
}

/** 重新离屏绘制并读取像素：只有图片、容器尺寸或 objectFit 变化时才需要 */
function rebuildImageData() {
  const canvas = canvasRef.value;
  const img = sourceImage;
  if (!canvas || !img || dimensions.value.width === 0 || dimensions.value.height === 0) return;

  // 注意：此处禁止用 typeof 直接判断 window 是否存在（含注释在内都不能出现该字面量组合）。
  // 本文件会被源码面板以 ?raw 内联成字符串常量，而 Nitro 的 rollup replace 会把该组合
  // 整体替换成 "undefined"，注入的双引号会截断字符串字面量，导致构建报 Expected a semicolon
  const dpr = globalThis.window ? window.devicePixelRatio || 1 : 1;
  const displayWidth = dimensions.value.width;
  const displayHeight = dimensions.value.height;

  canvas.width = Math.floor(displayWidth * dpr);
  canvas.height = Math.floor(displayHeight * dpr);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.resetTransform();
  ctx.scale(dpr, dpr);

  // 用离屏画布按 objectFit 绘制后读取像素
  const offscreen = document.createElement("canvas");
  const iw = img.naturalWidth || displayWidth;
  const ih = img.naturalHeight || displayHeight;

  let dw = displayWidth;
  let dh = displayHeight;
  let dx = 0;
  let dy = 0;

  if (props.objectFit === "cover") {
    const scale = Math.max(displayWidth / iw, displayHeight / ih);
    dw = Math.ceil(iw * scale);
    dh = Math.ceil(ih * scale);
    dx = Math.floor((displayWidth - dw) / 2);
    dy = Math.floor((displayHeight - dh) / 2);
  } else if (props.objectFit === "contain") {
    const scale = Math.min(displayWidth / iw, displayHeight / ih);
    dw = Math.ceil(iw * scale);
    dh = Math.ceil(ih * scale);
    dx = Math.floor((displayWidth - dw) / 2);
    dy = Math.floor((displayHeight - dh) / 2);
  } else if (props.objectFit === "fill") {
    dw = displayWidth;
    dh = displayHeight;
  } else {
    dw = iw;
    dh = ih;
    dx = Math.floor((displayWidth - dw) / 2);
    dy = Math.floor((displayHeight - dh) / 2);
  }

  offscreen.width = displayWidth;
  offscreen.height = displayHeight;
  const offCtx = offscreen.getContext("2d");
  if (!offCtx) return;

  offCtx.drawImage(img, dx, dy, dw, dh);

  try {
    imageData = offCtx.getImageData(0, 0, displayWidth, displayHeight);
  } catch {
    console.error("Could not get image data. CORS issue?");
    imageData = null;
    return;
  }

  redraw();
}

function stopLoop() {
  if (animationFrame !== null) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

/** 开启动画循环；开新循环前先停掉旧的，任何时候最多只有一条 rAF 循环 */
function startLoop() {
  stopLoop();
  if (!props.animated) return;
  const animate = () => {
    time += props.animationSpeed;
    redraw();
    animationFrame = requestAnimationFrame(animate);
  };
  animationFrame = requestAnimationFrame(animate);
}

// 加载图片：src 变化时重新加载，watcher 清理时把旧请求标记为过期，晚到的旧图不会覆盖新图。
// 只在客户端执行，服务端没有 Image
watch(
  () => props.src,
  (src, _oldSrc, onCleanup) => {
    if (!import.meta.client) return;
    let stale = false;
    onCleanup(() => {
      stale = true;
    });

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;

    img.onload = () => {
      if (stale) return;
      sourceImage = img;
      rebuildImageData();
      startLoop();
    };

    img.onerror = () => {
      if (stale) return;
      console.error("Failed to load image for DitherShader ", src);
    };
  },
  { immediate: true },
);

// 容器尺寸观察：卸载时自动断开
useResizeObserver(containerRef, (entries) => {
  for (const entry of entries) {
    const { width, height } = entry.contentRect;
    if (width > 0 && height > 0) {
      dimensions.value = { width, height };
    }
  }
});

// 影响像素读取的量：重新离屏绘制
watch([dimensions, () => props.objectFit], rebuildImageData);

// 开关动画
watch(
  () => props.animated,
  (animated) => {
    if (animated) startLoop();
    else {
      stopLoop();
      redraw();
    }
  },
);

// 只影响抖动计算的参数：动画模式下一帧自然生效，静态模式重绘一次即可
watch(
  [
    () => props.gridSize,
    () => props.ditherMode,
    () => props.colorMode,
    () => props.invert,
    () => props.pixelRatio,
    () => props.primaryColor,
    () => props.secondaryColor,
    () => props.customPalette,
    () => props.brightness,
    () => props.contrast,
    () => props.backgroundColor,
    () => props.threshold,
  ],
  () => {
    if (animationFrame === null) redraw();
  },
  { deep: true },
);

onUnmounted(stopLoop);
</script>

<template>
  <div
    ref="containerRef"
    :class="props.class"
    class="relative h-full w-full"
  >
    <canvas
      ref="canvasRef"
      class="absolute inset-0 h-full w-full"
      style="image-rendering: pixelated"
      aria-label="Dithered image"
      role="img"
    />
  </div>
</template>
