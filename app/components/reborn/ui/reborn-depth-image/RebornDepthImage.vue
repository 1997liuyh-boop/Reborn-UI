<script setup lang="ts">
import type { CSSProperties } from "vue";
import type { DepthImageUI } from "./reborn-depth-image.config";
import type { DepthRenderer } from "./reborn-depth-image.utils";
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef, watch } from "vue";
import { cn } from "~/lib/utils";
import { depthImageTheme } from "./reborn-depth-image.config";
import { createDepthRenderer } from "./reborn-depth-image.utils";

/** 图片在容器内的对齐方式 */
export type DepthImagePosition = "center" | "top" | "bottom" | "bottom-left" | "bottom-right";

/** 监听指针的范围 */
export type DepthImageTrigger = "self" | "parent" | "window";

/** 退回静态图的原因 */
export type DepthImageFallbackReason = "unsupported" | "load-error" | "context-lost" | "reduced-motion";

export interface DepthImageProps {
  /** 彩色图地址。建议带透明通道（PNG / WebP），透明区域不参与视差与补光 */
  src: string;
  /** 深度图地址：灰度图，白色最近、黑色最远，宽高比须与 src 一致；分辨率可以低很多（原图的 1/3 即可） */
  depthSrc: string;
  /**
   * 替代文本，挂在静态图上；画布接管显示后静态图只是变透明，仍留在无障碍树里
   * @defaultValue ''
   */
  alt?: string;
  /**
   * 指针移到触发区边缘时，最近处（深度为 1）的最大位移，单位 px。0 关闭视差、只保留补光
   * @defaultValue 12
   */
  parallax?: number;
  /**
   * 不随指针移动的深度层（0~1）：比它近的朝指针方向移，比它远的反向移
   * @defaultValue 0.5
   */
  focus?: number;
  /**
   * 是否在指针附近按表面朝向补光
   * @defaultValue true
   */
  light?: boolean;
  /**
   * 补光颜色，可写任意 CSS 颜色，包括 var(--xxx)；每次指针进入时重新读取，跟随主题切换
   * @defaultValue '#ffffff'
   */
  lightColor?: string;
  /**
   * 补光强度（0~1）
   * @defaultValue 0.5
   */
  lightIntensity?: number;
  /**
   * 图片在容器内的对齐方式，等同 object-position；图片始终按 contain 完整显示
   * @defaultValue 'center'
   */
  position?: DepthImagePosition;
  /**
   * 监听指针的范围：组件自身、父元素、整个窗口，也可以直接传一个元素（如外层头图）
   * @defaultValue 'self'
   */
  trigger?: DepthImageTrigger | HTMLElement | null;
  /** 追加到根元素的类名，尺寸一般写在这里 */
  class?: any;
  /** 按结构键覆盖各节点样式 */
  ui?: DepthImageUI;
}

defineOptions({
  name: "RebornDepthImage",
});

const props = withDefaults(defineProps<DepthImageProps>(), {
  alt: "",
  parallax: 12,
  focus: 0.5,
  light: true,
  lightColor: "#ffffff",
  lightIntensity: 0.5,
  position: "center",
  trigger: "self",
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 画布就绪、开始接管显示时触发 */
  ready: [];
  /** 无法启用效果、退回静态图时触发 */
  fallback: [reason: DepthImageFallbackReason];
}>();

const rootRef = useTemplateRef<HTMLElement>("rootRef");
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvasRef");
const probeRef = useTemplateRef<HTMLElement>("probeRef");
/** 画布是否已接管显示；为 false 时显示静态图 */
const active = shallowRef(false);
const canvasStyle = shallowRef<CSSProperties>({});

/** 对齐方式 → 横纵向偏移比例（与 object-position 的百分比含义一致） */
const ALIGN: Record<DepthImagePosition, [number, number]> = {
  "center": [0.5, 0.5],
  "top": [0.5, 0],
  "bottom": [0.5, 1],
  "bottom-left": [0, 1],
  "bottom-right": [1, 1],
};
const objectPosition = computed(() => {
  const [x, y] = ALIGN[props.position];
  return `${x * 100}% ${y * 100}%`;
});

let renderer: DepthRenderer | null = null;
/** 原图宽高比，用于按 contain 推算显示区域 */
let imageRatio = 1;
/** 图片在容器内的实际显示尺寸（px） */
let drawWidth = 0;
let drawHeight = 0;
let frame = 0;
let lastTime = 0;
let inView = false;
let disposed = false;
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
/** 每次初始化的序号：素材地址变化后，旧的加载结果到达时直接丢弃 */
let session = 0;

/**
 * 指针状态：x / y 为指针相对触发区中心的偏移（-1~1），lx / ly 为光源在画布上的 uv 坐标，lit 为补光显现程度。
 * target 是指针当下的位置，current 每帧向它逼近，视差与补光都读 current，移动起来才有跟手的惯性
 */
const target = { x: 0, y: 0, lx: 0.5, ly: 0.5, lit: 0 };
const current = { ...target };
const KEYS = ["x", "y", "lx", "ly", "lit"] as const;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    // 跨域图片要声明匿名请求，否则上传成贴图时会被浏览器拒绝（对方需返回 CORS 头）
    if (new URL(src, window.location.href).origin !== window.location.origin) image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`图片加载失败：${src}`));
    image.src = src;
  });
}

/**
 * 把 lightColor 解析成 0~1 的 rgb：先借一个隐藏节点让浏览器解析 CSS 变量，
 * 再用 2D 画布把任意颜色写法（rgb / oklch / 命名色）统一成像素值
 */
let colorCanvas: CanvasRenderingContext2D | null = null;
function resolveLightColor() {
  if (!renderer || !probeRef.value) return;
  const computedColor = getComputedStyle(probeRef.value).color;
  colorCanvas ||= document.createElement("canvas").getContext("2d", { willReadFrequently: true });
  if (!colorCanvas) return;
  colorCanvas.clearRect(0, 0, 1, 1);
  colorCanvas.fillStyle = computedColor;
  colorCanvas.fillRect(0, 0, 1, 1);
  const [r = 255, g = 255, b = 255, a = 255] = colorCanvas.getImageData(0, 0, 1, 1).data;
  const strength = props.light ? clamp(props.lightIntensity, 0, 1) * (a / 255) : 0;
  renderer.setLightColor([r / 255, g / 255, b / 255, strength]);
}

/** 按 contain + position 推算图片显示区域，让画布与静态图逐像素重合 */
function layout() {
  const root = rootRef.value;
  if (!root || !renderer) return;
  const width = root.clientWidth;
  const height = root.clientHeight;
  if (!width || !height) return;
  if (width / height > imageRatio) {
    drawHeight = height;
    drawWidth = height * imageRatio;
  }
  else {
    drawWidth = width;
    drawHeight = width / imageRatio;
  }
  const [alignX, alignY] = ALIGN[props.position];
  canvasStyle.value = {
    left: `${(width - drawWidth) * alignX}px`,
    top: `${(height - drawHeight) * alignY}px`,
    width: `${drawWidth}px`,
    height: `${drawHeight}px`,
  };
  renderer.resize(drawWidth, drawHeight);
  draw();
}

function draw() {
  if (!renderer || !drawWidth || !drawHeight) return;
  // 位移换算：指针到边缘（|x| = 1）时，深度为 1 的像素正好移动 parallax 像素
  const reach = Math.max(0.05, 1 - props.focus);
  renderer.render({
    shiftX: (current.x * props.parallax) / (reach * drawWidth),
    shiftY: (-current.y * props.parallax) / (reach * drawHeight),
    focus: props.focus,
    lightX: current.lx,
    lightY: current.ly,
    lit: current.lit,
  });
}

/** 逼近目标值，静止后停掉循环，不在后台空转 */
function tick(time: number) {
  const delta = lastTime ? Math.min(0.05, (time - lastTime) / 1000) : 1 / 60;
  lastTime = time;
  // 指数平滑：约 0.3 秒追上指针，既跟手又不发飘
  const factor = 1 - Math.exp(-delta * 9);
  let moving = false;
  for (const key of KEYS) {
    const gap = target[key] - current[key];
    current[key] += gap * factor;
    if (Math.abs(gap) > 0.0005) moving = true;
    else current[key] = target[key];
  }
  draw();
  if (moving && inView) {
    frame = requestAnimationFrame(tick);
  }
  else {
    frame = 0;
    lastTime = 0;
  }
}

function start() {
  if (!renderer || frame || !inView) return;
  frame = requestAnimationFrame(tick);
}

/** 实际监听指针的元素；window 模式返回 null，改由 window 监听 */
function triggerElement(): HTMLElement | null {
  const value = props.trigger;
  if (value instanceof HTMLElement) return value;
  if (value === "parent") return rootRef.value?.parentElement ?? null;
  if (value === "window") return null;
  return rootRef.value;
}

function onPointerMove(event: PointerEvent) {
  // 触屏没有悬停，按下时的位移会被当成误触，只响应鼠标与触控笔
  if (event.pointerType === "touch" || !renderer || !canvasRef.value) return;
  const element = triggerElement();
  const area = element
    ? element.getBoundingClientRect()
    : { left: 0, top: 0, width: window.innerWidth, height: window.innerHeight };
  if (!area.width || !area.height) return;
  if (target.lit === 0) resolveLightColor();
  target.x = clamp((event.clientX - area.left - area.width / 2) / (area.width / 2), -1, 1);
  target.y = clamp((event.clientY - area.top - area.height / 2) / (area.height / 2), -1, 1);
  const canvas = canvasRef.value.getBoundingClientRect();
  target.lx = canvas.width ? (event.clientX - canvas.left) / canvas.width : 0.5;
  target.ly = canvas.height ? 1 - (event.clientY - canvas.top) / canvas.height : 0.5;
  target.lit = 1;
  start();
}

function onPointerLeave() {
  target.x = 0;
  target.y = 0;
  target.lit = 0;
  start();
}

/** window 模式下，指针移出页面时 relatedTarget 为空 */
function onWindowOut(event: PointerEvent) {
  if (!event.relatedTarget) onPointerLeave();
}

let boundElement: HTMLElement | null = null;
let boundWindow = false;
function bindPointer() {
  unbindPointer();
  const element = triggerElement();
  if (element) {
    element.addEventListener("pointermove", onPointerMove, { passive: true });
    element.addEventListener("pointerleave", onPointerLeave);
    boundElement = element;
  }
  else if (props.trigger === "window") {
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("pointerout", onWindowOut);
    boundWindow = true;
  }
}
function unbindPointer() {
  boundElement?.removeEventListener("pointermove", onPointerMove);
  boundElement?.removeEventListener("pointerleave", onPointerLeave);
  boundElement = null;
  if (boundWindow) {
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerout", onWindowOut);
    boundWindow = false;
  }
}

function onContextLost(event: Event) {
  event.preventDefault();
  teardown();
  emit("fallback", "context-lost");
}

/** 释放画布与监听，回到静态图；素材地址变化重建、卸载、上下文丢失都走这里 */
function teardown() {
  cancelAnimationFrame(frame);
  frame = 0;
  lastTime = 0;
  unbindPointer();
  canvasRef.value?.removeEventListener("webglcontextlost", onContextLost);
  renderer?.dispose();
  renderer = null;
  active.value = false;
  Object.assign(current, { x: 0, y: 0, lx: 0.5, ly: 0.5, lit: 0 });
  Object.assign(target, current);
}

async function setup() {
  const canvas = canvasRef.value;
  if (!canvas || !props.src || !props.depthSrc) return;
  const id = ++session;
  let images: [HTMLImageElement, HTMLImageElement];
  try {
    images = await Promise.all([loadImage(props.src), loadImage(props.depthSrc)]);
  }
  catch {
    if (id === session && !disposed) emit("fallback", "load-error");
    return;
  }
  if (id !== session || disposed) return;
  const [color, depth] = images;
  imageRatio = color.naturalWidth / color.naturalHeight || 1;
  renderer = createDepthRenderer(canvas, color, depth);
  if (!renderer) {
    emit("fallback", "unsupported");
    return;
  }
  canvas.addEventListener("webglcontextlost", onContextLost);
  bindPointer();
  resolveLightColor();
  layout();
  active.value = true;
  emit("ready");
}

onMounted(() => {
  // 「减少动态效果」下整段效果都不启用：视差就是位移动画，补光单独留着意义不大
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
    emit("fallback", "reduced-motion");
    return;
  }
  const root = rootRef.value;
  if (!root) return;
  resizeObserver = new ResizeObserver(() => layout());
  resizeObserver.observe(root);
  // 进入视口附近才加载素材、建上下文；离开视口暂停逼近循环
  intersectionObserver = new IntersectionObserver(([entry]) => {
    inView = !!entry?.isIntersecting;
    if (inView && !renderer && session === 0) setup();
    if (inView) start();
  }, { rootMargin: "200px 0px" });
  intersectionObserver.observe(root);
});

watch(() => [props.src, props.depthSrc], () => {
  if (!renderer && session === 0) return;
  teardown();
  setup();
});
watch(() => props.trigger, () => {
  if (renderer) bindPointer();
});
// post：颜色要从探针节点的计算样式里读，得等它的行内 color 先更新到 DOM
watch(() => [props.lightColor, props.lightIntensity, props.light], () => resolveLightColor(), { flush: "post" });
watch(() => [props.position, props.parallax, props.focus], () => layout());

onBeforeUnmount(() => {
  disposed = true;
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  teardown();
});

const ui = computed(() => {
  const s = depthImageTheme();
  return {
    root: () => s.root({ class: cn(props.ui.root, props.class) }),
    image: () => s.image({ class: cn(props.ui.image) }),
    canvas: () => s.canvas({ class: cn(props.ui.canvas) }),
  };
});
</script>

<template>
  <div ref="rootRef" :class="ui.root()">
    <img
      :src="props.src"
      :alt="props.alt"
      :class="ui.image()"
      :style="{ objectPosition, opacity: active ? 0 : undefined }"
      draggable="false"
    >
    <canvas v-show="active" ref="canvasRef" aria-hidden="true" :class="ui.canvas()" :style="canvasStyle" />
    <!-- 颜色探针：只用来让浏览器解析 lightColor 里的 CSS 变量 -->
    <span
      ref="probeRef"
      aria-hidden="true"
      class="pointer-events-none absolute size-0 overflow-hidden"
      :style="{ color: props.lightColor }"
    />
  </div>
</template>
