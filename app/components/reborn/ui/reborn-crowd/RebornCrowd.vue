<script setup lang="ts">
/**
 * RebornCrowd —— 路人走过的画布装饰
 *
 * 把一张人物精灵图按 cols × rows 切格，每格一个人物：人物从左右两侧随机走进走出、边走边上下颠，
 * 越靠下的人画在越前面。参考 aarivi.com 页脚的 ff-crowd，由 gsap 时间线驱动、2D 画布绘制。
 *
 * 纯装饰：根节点 aria-hidden、不拦截指针；进入视口附近才加载精灵图，滚出视口时暂停，
 * 系统开启「减少动态效果」时只画一帧静止的人群。
 */
import type { CrowdUI } from "./reborn-crowd.config";
import { useIntersectionObserver, useMediaQuery, useResizeObserver } from "@vueuse/core";
import { gsap } from "gsap";
import { computed, onBeforeUnmount, useTemplateRef, watch } from "vue";
import { cn } from "~/lib/utils";
import { crowdTheme } from "./reborn-crowd.config";

export interface CrowdProps {
  /** 精灵图地址：透明背景，按 cols × rows 等分，每格一个人物，底边贴着格子底边；有朝向时统一面朝右，向左走的人会被水平翻转 */
  src: string;
  /**
   * 精灵图的列数
   * @defaultValue 15
   */
  cols?: number;
  /**
   * 精灵图的行数
   * @defaultValue 7
   */
  rows?: number;
  /** 同时在场的人数上限，超过格子总数时按格子总数算；不传时全部人物同时上场 */
  count?: number;
  /**
   * 走完一趟（从一侧走到另一侧）的基础时长，单位秒；每人再随机放慢到约 1.05~2.6 倍，快慢错开
   * @defaultValue 14
   */
  duration?: number;
  /** 追加到根元素的类名，尺寸一般写在这里 */
  class?: any;
  /** 按结构键覆盖各节点样式 */
  ui?: CrowdUI;
}

defineOptions({
  name: "RebornCrowd",
});

const props = withDefaults(defineProps<CrowdProps>(), {
  cols: 15,
  rows: 7,
  duration: 14,
  ui: () => ({}),
});

const emit = defineEmits<{
  /** 精灵图加载完成、人群就位时触发 */
  ready: [];
  /** 精灵图加载失败时触发 */
  error: [event: Event];
}>();

/** 上下颠的半个周期（秒），即一步的时长 */
const STEP_DURATION = 0.32;
/** 画布宽度达到该值（px）时人物按精灵图原始尺寸绘制，更窄时等比缩小 */
const FULL_SCALE_WIDTH = 1440;
/** 人物身高最多占画布高度的比例，留出上沿给后排的人和上下颠的幅度 */
const MAX_HEIGHT_RATIO = 0.72;
/** 人物缩放下限：保证手机等窄画布上仍认得出是人 */
const MIN_SCALE = 0.28;

interface Peep {
  /** 在精灵图上的裁切区域：x、y、宽、高 */
  rect: [number, number, number, number];
  x: number;
  y: number;
  /** 本趟行走的基准高度，用来排前后：越靠下越靠前 */
  baseY: number;
  width: number;
  height: number;
  /** 向左走时水平翻转，人物始终面朝前进方向 */
  flip: boolean;
  walk: gsap.core.Timeline | null;
}

const rootRef = useTemplateRef<HTMLElement>("root");
const canvasRef = useTemplateRef<HTMLCanvasElement>("canvas");
const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

let sheet: HTMLImageElement | null = null;
/** 每次加载递增：src 变化或卸载后，旧图片迟到的 load / error 回调据此丢弃 */
let loadId = 0;
/** 是否已经开始加载：进入视口附近才加载，之前改 src 不发请求 */
let started = false;
const stage = { width: 0, height: 0, dpr: 1, scale: 1 };
let peeps: Peep[] = [];
/** 正在走的人，按 baseY 升序排列，绘制时后画的盖住先画的 */
const walking: Peep[] = [];
/** 候场的人：走完一趟回到这里，再被随机挑出来重新上场 */
let idle: Peep[] = [];
let ready = false;
let visible = false;
let ticking = false;

const random = (min: number, max: number) => min + Math.random() * (max - min);
/** 大多数人站在最前排，少数往后站：power2.in 让随机值集中在小的一端 */
const depthEase = gsap.parseEase("power2.in");

function sliceSheet(image: HTMLImageElement) {
  const cols = Math.max(1, Math.floor(props.cols));
  const rows = Math.max(1, Math.floor(props.rows));
  const cellWidth = image.naturalWidth / cols;
  const cellHeight = image.naturalHeight / rows;
  peeps = Array.from({ length: cols * rows }, (_, i) => ({
    rect: [(i % cols) * cellWidth, Math.floor(i / cols) * cellHeight, cellWidth, cellHeight],
    x: 0,
    y: 0,
    baseY: 0,
    width: cellWidth,
    height: cellHeight,
    flip: false,
    walk: null,
  }));
}

/** 随机一个方向与站位，生成这一趟的行走时间线 */
function startWalk(peep: Peep) {
  peep.width = peep.rect[2] * stage.scale;
  peep.height = peep.rect[3] * stage.scale;

  // 精灵多为半身像，底边是腰部的切口：最前排底边贴住画布底边把切口藏起来，往后站的人整体上移、被前排挡住下半身
  const offset = peep.height * (0.31 - 0.77 * depthEase(Math.random()));
  const top = Math.max(12, stage.height * 0.2);
  peep.baseY = Math.max(top, Math.min(stage.height - peep.height, stage.height - peep.height + offset));
  peep.y = peep.baseY;

  const toRight = Math.random() > 0.5;
  peep.flip = !toRight;
  peep.x = toRight ? -peep.width : stage.width + peep.width;
  const endX = toRight ? stage.width : 0;

  const duration = Math.max(1, props.duration);
  const bob = Math.max(3, peep.height * 0.03);
  const walk = gsap.timeline({
    onComplete: () => {
      finishWalk(peep);
      spawn();
    },
  });
  walk.timeScale(random(0.38, 0.95));
  walk.to(peep, { duration, x: endX, ease: "none" }, 0);
  walk.to(peep, { duration: STEP_DURATION, repeat: Math.floor(duration / STEP_DURATION), yoyo: true, y: peep.baseY - bob }, 0);
  peep.walk = walk;
}

/** 从候场的人里随机挑一个上场 */
function spawn() {
  const peep = idle.splice(Math.floor(Math.random() * idle.length), 1)[0];
  if (!peep) return undefined;
  startWalk(peep);
  walking.push(peep);
  walking.sort((a, b) => a.baseY - b.baseY);
  return peep;
}

function finishWalk(peep: Peep) {
  walking.splice(walking.indexOf(peep), 1);
  peep.walk = null;
  idle.push(peep);
}

/** 清场：停掉所有人的时间线，全部回到候场 */
function clearStage() {
  for (const peep of walking) peep.walk?.kill();
  walking.length = 0;
}

function render() {
  const el = canvasRef.value;
  const ctx = el?.getContext("2d");
  if (!el || !ctx) return;
  ctx.clearRect(0, 0, el.width, el.height);
  if (!sheet) return;
  ctx.save();
  ctx.scale(stage.dpr, stage.dpr);
  for (const peep of walking) {
    ctx.save();
    ctx.translate(peep.x, peep.y);
    ctx.scale(peep.flip ? -1 : 1, 1);
    ctx.drawImage(sheet, ...peep.rect, 0, 0, peep.width, peep.height);
    ctx.restore();
  }
  ctx.restore();
}

/**
 * 只在精灵图就绪、处于视口附近且允许动效时播放：其余时候暂停全部时间线并摘掉绘制回调，
 * 不在视口里的实例不占 CPU。
 */
function syncPlayback() {
  const running = ready && visible && !reducedMotion.value;
  for (const peep of walking) peep.walk?.paused(!running);
  if (running === ticking) return;
  ticking = running;
  if (running) gsap.ticker.add(render);
  else gsap.ticker.remove(render);
}

/** 按画布尺寸重排：清场后让人物一起上场，并各自随机快进到走了一段的位置，避免开场时空无一人 */
function layout() {
  const el = canvasRef.value;
  if (!ready || !el || !peeps.length) return;
  stage.width = el.clientWidth;
  stage.height = el.clientHeight;
  if (!stage.width || !stage.height) return;
  stage.dpr = Math.min(2, window.devicePixelRatio || 1);
  // 画布越窄、越矮，人物越小；不超过精灵图原始尺寸，避免放大发虚
  const cellHeight = peeps[0]!.rect[3];
  stage.scale = Math.max(MIN_SCALE, Math.min(1, stage.width / FULL_SCALE_WIDTH, (stage.height * MAX_HEIGHT_RATIO) / cellHeight));
  el.width = Math.round(stage.width * stage.dpr);
  el.height = Math.round(stage.height * stage.dpr);

  clearStage();
  idle = [...peeps];
  const total = props.count === undefined ? peeps.length : Math.min(peeps.length, Math.max(0, Math.floor(props.count)));
  for (let i = 0; i < total; i++) spawn()?.walk?.progress(Math.random());

  syncPlayback();
  // 改尺寸会清空画布，立即补画一帧：暂停状态（减少动态效果、不在视口）下也有画面
  render();
}

function load() {
  const id = ++loadId;
  ready = false;
  sheet = null;
  peeps = [];
  clearStage();
  syncPlayback();
  render();

  const image = new Image();
  image.decoding = "async";
  image.addEventListener("load", () => {
    if (id !== loadId) return;
    sheet = image;
    sliceSheet(image);
    ready = true;
    layout();
    emit("ready");
  });
  image.addEventListener("error", (event) => {
    if (id !== loadId) return;
    emit("error", event);
  });
  image.src = props.src;
}

// 视口上下各留 200px 提前量：快滚到时就开始加载与播放，进入视口时人群已经在走
useIntersectionObserver(rootRef, ([entry]) => {
  visible = Boolean(entry?.isIntersecting);
  if (visible && !started) {
    started = true;
    load();
  }
  syncPlayback();
}, { rootMargin: "200px 0px" });

let resizeFrame = 0;
useResizeObserver(canvasRef, () => {
  cancelAnimationFrame(resizeFrame);
  resizeFrame = requestAnimationFrame(layout);
});

watch(() => props.src, () => {
  if (started) load();
});

watch([() => props.cols, () => props.rows], () => {
  if (!sheet) return;
  sliceSheet(sheet);
  layout();
});

watch([() => props.count, () => props.duration], layout);

watch(reducedMotion, syncPlayback);

onBeforeUnmount(() => {
  loadId++;
  cancelAnimationFrame(resizeFrame);
  gsap.ticker.remove(render);
  clearStage();
});

const ui = computed(() => {
  const s = crowdTheme();
  return {
    root: () => s.root({ class: cn(props.ui.root, props.class) }),
    canvas: () => s.canvas({ class: cn(props.ui.canvas) }),
  };
});
</script>

<template>
  <div ref="root" :class="ui.root()" aria-hidden="true">
    <canvas ref="canvas" :class="ui.canvas()" />
  </div>
</template>
