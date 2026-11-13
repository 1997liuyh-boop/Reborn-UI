<script setup lang="ts">
/**
 * 组件总览里一个系列的目录：左侧分类列表 + 右侧分类卡片
 * - 列表模式（live = false）：分类卡片顺序排开，服务端渲染、窄屏、减弱动效时使用
 * - 场景模式（live = true）：整栏钉住，分类叠在一个画框里随滚动切换，转场见 catalogTransitions
 */
import type { Directive } from "vue";
import type { CardGeometry, CatalogTransition, TransitionBox } from "./catalogTransitions";
import type { OverviewItem } from "./types";
import type { SeriesGroup } from "~/utils/componentsCatalog";
import { vFlyIn } from "~/lib/flyIn";
import { onceNearViewport } from "~/lib/nearViewport";
import { transitionFor } from "./catalogTransitions";
import ComponentsOverviewCard from "./ComponentsOverviewCard.vue";

interface Props {
  /** 系列数据，为空时渲染占位 */
  series?: SeriesGroup<OverviewItem> | null;
  /** 是否启用场景模式 */
  live?: boolean;
}

const { series = null, live = false } = defineProps<Props>();

const categories = computed(() => series?.categories ?? []);

function frameId(name: string) {
  return `series-${series?.id}-${name}`;
}

/** 分类下的组件名，用于左侧说明行 */
function componentNames(items: OverviewItem[]) {
  return items.map((item) => item.title).join("、");
}

/** 占位数量 */
const PLACEHOLDER_STEPS = 6;
const PLACEHOLDER_CARDS = 6;

/* ── 列表模式：按需渲染 ─────────────────────────────────────────────── */

/** 分类接近视口才渲染真卡片；服务端渲染与水合时全部直出 */
const nuxtApp = useNuxtApp();
const progressive = import.meta.client && !nuxtApp.isHydrating;
const revealed = shallowRef(new Set<string>());

function isRevealed(name: string) {
  return !progressive || revealed.value.has(name);
}

function reveal(name: string) {
  if (revealed.value.has(name)) return;
  revealed.value = new Set(revealed.value).add(name);
}

const nearStops = new WeakMap<HTMLElement, () => void>();

/** 元素接近视口时调用一次 */
const vNear: Directive<HTMLElement, () => void> = {
  mounted(element, binding) {
    nearStops.set(element, onceNearViewport(element, binding.value));
  },
  unmounted(element) {
    nearStops.get(element)?.();
    nearStops.delete(element);
  },
};

/* ── 当前分类 ───────────────────────────────────────────────────────── */

/** 列表模式下滚到的分类序号 */
const spiedIndex = shallowRef<number | null>(null);
/** 场景模式下当前展示的分类序号 */
const current = shallowRef(0);

const activeIndex = computed(() => (live ? current.value : (spiedIndex.value ?? 0)));

let spyObserver: IntersectionObserver | undefined;

/** 列表模式：分类卡片经过视口上部时记为当前分类 */
function getSpyObserver() {
  spyObserver ??= new IntersectionObserver(
    (entries) => {
      if (live) return;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const index = Number((entry.target as HTMLElement).dataset.index);
        if (!Number.isNaN(index)) spiedIndex.value = index;
      }
    },
    { rootMargin: "-25% 0px -65% 0px" },
  );
  return spyObserver;
}

/** 把分类卡片交给滚动高亮观察器 */
const vSpy: Directive<HTMLElement> = {
  mounted(element) {
    if (typeof IntersectionObserver === "undefined") return;
    getSpyObserver().observe(element);
  },
  unmounted(element) {
    spyObserver?.unobserve(element);
  },
};

const sceneRef = useTemplateRef<HTMLElement>("scene");
const mainRef = useTemplateRef<HTMLElement>("main");
const ringRef = useTemplateRef<HTMLElement>("ring");

/** 当前分类变化时，把它滚到左侧列表的可见位置（只滚列表，不滚整页） */
watch(activeIndex, async () => {
  if (!import.meta.client) return;
  await nextTick();
  const step = sceneRef.value?.querySelector<HTMLElement>(".ov-ba-step[data-on]");
  const list = step?.parentElement;
  if (!step || !list) return;
  list.scrollTo({
    top: step.offsetTop - (list.clientHeight - step.clientHeight) / 2,
    left: step.offsetLeft - (list.clientWidth - step.clientWidth) / 2,
    behavior: "smooth",
  });
});

/** 写入鼠标相对卡片的位置，供悬停泛光使用 */
function onCardMove(event: PointerEvent) {
  if (event.pointerType !== "mouse") return;
  const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(".overview-card");
  if (!card) return;
  const rect = card.getBoundingClientRect();
  card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
  card.style.setProperty("--my", `${event.clientY - rect.top}px`);
}

/* ── 场景模式：版面换算 ─────────────────────────────────────────────── */

/** 一行卡片数 */
const COLS = 3;
/** 卡片高度、行距与底部留白（px），与 LIVE.cards 保持一致 */
const CARD_HEIGHT = 256;
const CARD_GAP = 12;
const CARDS_PADDING = 18;
/** 两个系列的转场起点错开 */
const TRANSITION_OFFSET = series?.id === "community" ? 3 : 0;

/** 切入后的停顿距离（占视口高度） */
const DWELL_RATIO = 0.12;
/** 切换占用的滚动距离（占视口高度） */
const SWITCH_RATIO = 0.6;
/** 最后一个分类的收尾停顿（占视口高度） */
const TAIL_RATIO = 0.3;
/** 滚动跟随的平滑系数，越小越慢 */
const SMOOTHING = 0.2;
/** 页内锚点的滚动偏移，与 plugins/anchor-scroll.client.ts 一致 */
const ANCHOR_OFFSET = 136;

interface SceneMetrics {
  viewportHeight: number;
  /** 卡片可视窗口高度 */
  windowHeight: number;
  /** 画框尺寸 */
  box: TransitionBox;
  /** 卡片宽度 */
  cardWidth: number;
  dwell: number;
  switchLength: number;
  /** 各分类需要上移的距离 */
  overflow: number[];
  /** 各分类的起始滚动位置 */
  starts: number[];
  /** 场景总滚动距离 */
  total: number;
}

let metrics: SceneMetrics | undefined;

/** 场景高度与各分类起点 */
const sceneHeight = shallowRef(0);
const starts = shallowRef<number[]>([]);

/** 只渲染当前分类及前后各一个分类的卡片 */
function isInWindow(index: number) {
  return Math.abs(index - current.value) <= 1;
}

function measure() {
  const main = mainRef.value;
  if (!main || !series) return;
  const frame = main.querySelector<HTMLElement>(".ov-ba-frame");
  const cardsWindow = main.querySelector<HTMLElement>(".ov-ba-window");
  if (!frame || !cardsWindow) return;

  const viewportHeight = window.innerHeight;
  const windowHeight = cardsWindow.clientHeight;
  const dwell = Math.round(viewportHeight * DWELL_RATIO);
  const switchLength = Math.round(viewportHeight * SWITCH_RATIO);

  const overflow = categories.value.map((category) => {
    const rows = Math.ceil(category.items.length / COLS);
    const contentHeight = rows * CARD_HEIGHT + (rows - 1) * CARD_GAP + CARDS_PADDING;
    return Math.max(0, contentHeight - windowHeight);
  });

  // 每个分类占用：停顿 + 上移 + 切换（最后一个换成收尾停顿）
  const sceneStarts: number[] = [];
  let cursor = 0;
  overflow.forEach((distance, index) => {
    sceneStarts.push(cursor);
    const isLast = index === overflow.length - 1;
    cursor += dwell + distance + (isLast ? Math.round(viewportHeight * TAIL_RATIO) : switchLength);
  });

  metrics = {
    viewportHeight,
    windowHeight,
    box: { width: frame.clientWidth, height: frame.clientHeight },
    cardWidth: (cardsWindow.clientWidth - (COLS - 1) * CARD_GAP) / COLS,
    dwell,
    switchLength,
    overflow,
    starts: sceneStarts,
    total: cursor,
  };
  starts.value = sceneStarts;
  sceneHeight.value = viewportHeight + cursor;
}

/* ── 场景模式：逐帧渲染 ─────────────────────────────────────────────── */

/** 缓存已写入的内联样式，值不变就不重复写 */
type SceneElement = HTMLElement & { __ovStyles?: Record<string, string> };

function setStyle(element: HTMLElement, property: string, value: string) {
  const cache = ((element as SceneElement).__ovStyles ??= {});
  if (cache[property] === value) return;
  cache[property] = value;
  if (value) element.style.setProperty(property, value);
  else element.style.removeProperty(property);
}

/** 清除写过的内联样式 */
function clearStyles(element: HTMLElement) {
  const cache = (element as SceneElement).__ovStyles;
  if (!cache) return;
  for (const property of Object.keys(cache)) element.style.removeProperty(property);
  delete (element as SceneElement).__ovStyles;
}

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value: number) {
  return 1 - (1 - value) ** 3;
}

/** 平滑后的滚动位置与画框入场进度 */
let scrollNow = 0;
let entryNow = 0;
let frameRequest = 0;
/** 下一帧直接跳到目标位置 */
let snapNext = true;

/** 卡片入场进度：所在行从窗口底边露出时开始，同一行按列错开 */
function cardProgress(index: number, offset: number, windowHeight: number) {
  const row = Math.floor(index / COLS);
  const column = index % COLS;
  const top = row * (CARD_HEIGHT + CARD_GAP) - offset;
  return easeOutCubic(clamp((windowHeight - top) / (CARD_HEIGHT * 0.85) - column * 0.14));
}

/** 卡片相对窗口中心的位置 */
function cardGeometry(index: number, offset: number, cardWidth: number, windowHeight: number, total: number): CardGeometry {
  const col = index % COLS;
  const row = Math.floor(index / COLS);
  const dx = (col - (COLS - 1) / 2) * (cardWidth + CARD_GAP);
  const dy = row * (CARD_HEIGHT + CARD_GAP) + CARD_HEIGHT / 2 - offset - windowHeight / 2;
  // 最远距离至少按两行算
  const farthest = Math.hypot(cardWidth + CARD_GAP, Math.max(windowHeight / 2, ((Math.ceil(total / COLS) - 1) * (CARD_HEIGHT + CARD_GAP)) / 2));
  return { index, col, row, dx, dy, spread: Math.min(1, Math.hypot(dx, dy) / farthest) };
}

/** 写入卡片位姿，回到原位时清除 */
function applyPose(card: HTMLElement, transform: string, opacity: number) {
  const settled = !transform || opacity >= 1;
  setStyle(card, "transform", transform);
  setStyle(card, "opacity", settled ? "" : opacity.toFixed(3));
}

function render(position: number, entry: number) {
  const main = mainRef.value;
  const scene = sceneRef.value;
  if (!main || !scene || !metrics) return;
  const { starts: sceneStarts, overflow, dwell, switchLength, windowHeight, box, cardWidth } = metrics;
  const count = sceneStarts.length;
  if (!count) return;

  // 当前所在分类
  let index = 0;
  while (index < count - 1 && position >= sceneStarts[index + 1]!) index++;
  const local = position - sceneStarts[index]!;
  const distance = overflow[index]!;
  const offset = clamp(local - dwell, 0, distance);
  // 切换进度，最后一个分类没有
  const switching = index < count - 1 ? clamp((local - dwell - distance) / switchLength) : 0;

  if (current.value !== index) current.value = index;

  // 画框入场：从前倾、下沉、缩小立正
  const settled = 1 - (1 - entry) ** 2;
  setStyle(
    main,
    "transform",
    settled < 1
      ? `perspective(1300px) translate3d(0, ${((1 - settled) * 140).toFixed(1)}px, 0) rotateX(${((1 - settled) * 30).toFixed(2)}deg) scale(${(0.9 + settled * 0.1).toFixed(4)})`
      : "",
  );

  // 本次切换的转场，以及当前分类自己的入场方式
  const incoming: CatalogTransition | null = switching > 0 ? transitionFor(index + 1, TRANSITION_OFFSET) : null;
  const own = transitionFor(index, TRANSITION_OFFSET);
  if (main.dataset.transition !== (incoming?.name ?? "")) main.dataset.transition = incoming?.name ?? "";

  // 露出进度；色环比露出形状大一圈
  const reveal = clamp(switching / 0.82) ** 2;
  const ring = ringRef.value;
  if (ring) {
    setStyle(ring, "visibility", incoming ? "visible" : "");
    setStyle(ring, "clip-path", incoming ? incoming.ring(reveal, box) : "");
  }

  const frames = main.querySelectorAll<HTMLElement>(":scope > .ov-ba-frame");
  frames.forEach((frame, frameIndex) => {
    const isCurrent = frameIndex === index;
    const isIncoming = frameIndex === index + 1 && switching > 0;
    setStyle(frame, "visibility", isCurrent || isIncoming ? "visible" : "");
    setStyle(frame, "z-index", isIncoming ? "3" : isCurrent ? "1" : "");
    setStyle(frame, "clip-path", isIncoming && incoming ? incoming.reveal(reveal, box) : "");
    if (!isCurrent && !isIncoming) return;

    const cards = frame.querySelector<HTMLElement>(".ov-cards");
    if (!cards) return;
    setStyle(cards, "transform", isCurrent && offset > 0 ? `translate3d(0, ${(-offset).toFixed(1)}px, 0)` : "");

    const total = cards.children.length;
    for (let cardIndex = 0; cardIndex < total; cardIndex++) {
      const card = cards.children[cardIndex] as HTMLElement;
      const geometry = cardGeometry(cardIndex, isCurrent ? offset : 0, cardWidth, windowHeight, total);
      let progress = cardProgress(cardIndex, isCurrent ? offset : 0, windowHeight);

      if (isIncoming && incoming) {
        // 新分类：露出一段后卡片逐张入场
        progress = Math.min(progress, easeOutCubic(clamp((switching - 0.28 - incoming.enterDelay(geometry)) / 0.45)));
        const pose = incoming.enter(progress, geometry);
        applyPose(card, progress >= 1 ? "" : pose.transform, pose.opacity);
        continue;
      }

      // 旧分类：卡片离场
      if (incoming) {
        const leaving = clamp((switching - incoming.exitDelay(geometry)) / 0.62) ** 2;
        if (leaving > 0) {
          const pose = incoming.exit(leaving, geometry);
          applyPose(card, pose.transform, pose.opacity);
          continue;
        }
      }

      // 第一个分类：卡片随画框入场
      if (index === 0) progress = Math.min(progress, easeOutCubic(clamp((entry - 0.5 - own.enterDelay(geometry) * 0.7) / 0.4)));
      const pose = own.enter(progress, geometry);
      applyPose(card, progress >= 1 ? "" : pose.transform, pose.opacity);
    }
  });

  // 左侧竖轨按进度填充
  const segmentLength = (index < count - 1 ? sceneStarts[index + 1]! : metrics.total) - sceneStarts[index]!;
  scene.querySelectorAll<HTMLElement>(".ov-ba-step").forEach((step, stepIndex) => {
    const fill = stepIndex < index ? 1 : stepIndex === index ? clamp(local / segmentLength) : 0;
    setStyle(step, "--ba-fill", fill.toFixed(3));
  });
}

function tick() {
  frameRequest = 0;
  const scene = sceneRef.value;
  if (!scene || !metrics) return;
  const top = scene.getBoundingClientRect().top;
  const target = clamp(-top, 0, metrics.total);
  // 场景顶边到达距顶 25% 时入场完成
  const entryTarget = clamp((metrics.viewportHeight - top) / (metrics.viewportHeight * 0.75));

  if (snapNext) {
    scrollNow = target;
    entryNow = entryTarget;
    snapNext = false;
  }
  else {
    scrollNow += (target - scrollNow) * SMOOTHING;
    entryNow += (entryTarget - entryNow) * SMOOTHING;
    if (Math.abs(target - scrollNow) < 0.5) scrollNow = target;
    if (Math.abs(entryTarget - entryNow) < 0.002) entryNow = entryTarget;
  }

  render(scrollNow, entryNow);
  // 未追上目标就继续下一帧
  if (scrollNow !== target || entryNow !== entryTarget) schedule();
}

function schedule() {
  if (!frameRequest) frameRequest = requestAnimationFrame(tick);
}

/** 重新换算版面并直接落位 */
function remeasure() {
  if (!live) return;
  measure();
  snapNext = true;
  schedule();
}

/** 键盘聚焦到画框外的卡片时，把页面滚到能看见它的位置 */
function onFocusIn(event: FocusEvent) {
  if (!live || !metrics) return;
  const card = (event.target as HTMLElement | null)?.closest<HTMLElement>(".overview-card");
  const scene = sceneRef.value;
  const cards = card?.parentElement;
  if (!card || !cards || !scene) return;
  const cardIndex = Array.prototype.indexOf.call(cards.children, card) as number;
  const row = Math.floor(cardIndex / COLS);
  const index = current.value;
  const offset = clamp(
    row * (CARD_HEIGHT + CARD_GAP) - (metrics.windowHeight - CARD_HEIGHT) / 2,
    0,
    metrics.overflow[index] ?? 0,
  );
  const sceneTop = scene.getBoundingClientRect().top + window.scrollY;
  window.scrollTo({ top: sceneTop + metrics.starts[index]! + metrics.dwell + offset });
}

let resizeObserver: ResizeObserver | undefined;

/** 切到场景模式后按新的锚点位置重新落位 */
function restoreHash() {
  const id = decodeURIComponent(location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  if (!target || !sceneRef.value?.contains(target)) return;
  window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - ANCHOR_OFFSET });
}

function start() {
  measure();
  snapNext = true;
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", remeasure);
  if (mainRef.value && typeof ResizeObserver !== "undefined") {
    resizeObserver = new ResizeObserver(remeasure);
    resizeObserver.observe(mainRef.value);
  }
  schedule();
}

function stop() {
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", remeasure);
  resizeObserver?.disconnect();
  resizeObserver = undefined;
  cancelAnimationFrame(frameRequest);
  frameRequest = 0;
  metrics = undefined;
  sceneHeight.value = 0;
  starts.value = [];
  // 清除内联样式，交还给列表模式
  const scene = sceneRef.value;
  if (!scene) return;
  scene.querySelectorAll<HTMLElement>(".ov-ba-main, .ov-ba-ring, .ov-ba-frame, .ov-cards, .overview-card, .ov-ba-step").forEach(clearStyles);
}

// 模式切换：等 DOM 更新后再测量
watch(
  () => live,
  async (isLive) => {
    if (!import.meta.client) return;
    await nextTick();
    if (isLive) {
      start();
      await nextTick();
      restoreHash();
    }
    else {
      stop();
    }
  },
);

// 分类数据变化时重新换算
watch(categories, async () => {
  if (!live) return;
  await nextTick();
  remeasure();
});

// 新渲染的卡片补一帧进度
watch(current, async () => {
  if (!live) return;
  await nextTick();
  schedule();
});

onMounted(async () => {
  if (!live) return;
  await nextTick();
  start();
});

onBeforeUnmount(() => {
  stop();
  spyObserver?.disconnect();
});

/* ── 样式类 ─────────────────────────────────────────────────────────── */

/*
 * LIST 为列表模式，LIVE 为场景模式；配色变量 --ov-* 定义在 ComponentsList。
 * 断点写成 max-[N+1]，与原 max-width: N 等价。
 */

/** 系列根节点 */
const GRID_CLASS = "relative mx-auto w-[min(var(--ov-w-catalog),100%_-_var(--ov-gutter)_*_2)] scroll-mt-[92px] [&+&]:mt-28 max-[901px]:[&+&]:mt-20";

/** 骨架底色 */
const SKELETON = "bg-(--ov-sunk)";

/** 卡片占位 */
const CARD_SKELETON = "pointer-events-none rounded-[14px] bg-(--ov-card) p-3 shadow-[var(--ov-ring),0_1px_2px_rgb(8_10_16/0.04)]";

/** 分类列表；窄屏下为横向胶囊 */
const STEPS_CLASS = "scrollbar-hide relative m-0 grid min-h-0 list-none gap-0.5 overflow-y-auto p-0 max-[901px]:flex max-[901px]:gap-2 max-[901px]:overflow-x-auto max-[901px]:overflow-y-hidden max-[901px]:p-0.5";

/** 分类项 */
const STEP_ITEM = "relative min-w-0 max-[901px]:flex-none";
const STEP_BOX = "relative block py-[9px] pr-0 pl-5 max-[901px]:rounded-[999px] max-[901px]:bg-(--ov-surface) max-[901px]:px-3.5 max-[901px]:py-[7px] max-[901px]:shadow-(--ov-ring)";

const LIST = {
  /** 左右两栏，窄屏上下排列 */
  stage: "grid grid-cols-[288px_minmax(0,1fr)] items-start gap-12 max-[901px]:grid-cols-[minmax(0,1fr)] max-[901px]:gap-5",
  /** 左侧吸顶 */
  side: "sticky top-[92px] flex max-h-[calc(100svh_-_116px)] min-w-0 flex-col max-[901px]:static max-[901px]:max-h-none",
  /** 右侧大卡片列表 */
  main: "grid min-w-0 gap-7",
  /** 大卡片 */
  frame: "min-w-0 scroll-mt-[92px] rounded-3xl bg-(--ov-surface) p-[5px] shadow-(--ov-shadow-card)",
  screen: "rounded-[20px] bg-(--ov-screen) p-[18px] max-[701px]:p-3",
  head: "mx-1 mt-0.5 mb-4 flex items-baseline justify-between gap-3",
  window: "",
  /** 一行三张，手机上自动排列 */
  cards: "grid grid-cols-3 gap-3 max-[701px]:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] max-[701px]:gap-2.5",
} as const;

const LIVE = {
  /** 舞台钉住一屏，行高锁定在舞台内高 */
  stage: "sticky top-0 box-border grid h-svh grid-cols-[288px_minmax(0,1fr)] grid-rows-[minmax(0,1fr)] items-center gap-12 pt-[88px] pb-[52px]",
  /** 左侧 */
  side: "static flex max-h-full min-w-0 flex-col",
  /** 画框，transform 由控制器写入 */
  main: "relative block h-full max-h-[800px] min-w-0 origin-bottom gap-7 rounded-3xl bg-(--ov-surface) shadow-(--ov-shadow-card) will-change-transform",
  /** 分类层：默认隐藏，由控制器显示并裁切；用 overflow-clip 避免聚焦时滚动 */
  frame: "invisible absolute inset-[5px] min-w-0 scroll-mt-[92px] overflow-clip rounded-[20px] p-0",
  screen: "box-border flex h-full flex-col rounded-[20px] bg-(--ov-screen) px-[18px] py-0",
  /** 分类标题固定在顶部，下沿渐隐 */
  head: "relative z-2 -mx-[18px] my-0 flex flex-none items-baseline justify-between gap-3 bg-(--ov-screen) px-[22px] pt-5 pb-3.5 after:pointer-events-none after:absolute after:top-full after:right-0 after:left-0 after:h-3.5 after:bg-[linear-gradient(var(--ov-screen),transparent)] after:content-['']",
  window: "relative min-h-0 flex-1",
  /** 与 CARD_HEIGHT / CARD_GAP / CARDS_PADDING 保持一致 */
  cards: "grid auto-rows-[256px] grid-cols-3 gap-3 pb-[18px] will-change-transform",
} as const;

const cls = computed(() => (live ? LIVE : LIST));

/** 分类项随是否选中变化的样式 */
function stepClasses(on: boolean) {
  return {
    /** 竖轨填充 */
    fill: live
      ? "scale-y-[var(--ba-fill,0)]"
      : ["transition-transform duration-400 ease-(--ov-ease-expo) motion-reduce:transition-none", on ? "scale-y-100" : "scale-y-0"],
    /** 分类名 */
    title: on
      ? "text-(--ov-text) max-[901px]:text-primary-foreground"
      : "text-(--ov-text-3) group-hover/step:text-(--ov-text-2)",
    count: on ? "max-[901px]:text-primary-foreground" : "",
    /** 说明行：选中时最多三行 */
    desc: on ? "line-clamp-3 whitespace-normal text-ellipsis text-(--ov-text-2)" : "block truncate text-(--ov-text-3)",
    box: on ? "max-[901px]:bg-primary" : "",
  };
}
</script>

<template>
  <!-- 数据未到：占位 -->
  <div v-if="!series" :class="GRID_CLASS" aria-busy="true" aria-label="组件列表加载中">
    <div :class="LIST.stage">
      <div :class="LIST.side">
        <div class="mb-5 flex-none">
          <div class="h-5 w-24 rounded" :class="SKELETON" />
          <div class="mt-3 h-8 w-40 rounded" :class="SKELETON" />
        </div>
        <div :class="STEPS_CLASS">
          <div v-for="step in PLACEHOLDER_STEPS" :key="step" :class="[STEP_ITEM, STEP_BOX]">
            <div class="h-5 w-28 rounded" :class="SKELETON" />
            <div class="mt-2 h-4 w-48 max-w-full rounded" :class="SKELETON" />
          </div>
        </div>
      </div>
      <div :class="LIST.main">
        <div :class="LIST.frame">
          <div :class="LIST.screen">
            <div :class="LIST.head">
              <div class="h-6 w-24 rounded" :class="SKELETON" />
            </div>
            <div :class="LIST.cards">
              <div v-for="card in PLACEHOLDER_CARDS" :key="card" :class="CARD_SKELETON">
                <div class="min-h-[168px] rounded-lg" :class="SKELETON" />
                <div class="mt-3 h-6 w-3/5 rounded" :class="SKELETON" />
                <div class="mt-2 h-5 w-2/5 rounded" :class="SKELETON" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 系列根节点；场景模式下撑高并钉住舞台 -->
  <div
    v-else :id="`series-${series.id}`" ref="scene" class="ov-ba-grid" :class="[GRID_CLASS, { 'is-live': live }]"
    :style="live && sceneHeight ? { height: `${sceneHeight}px` } : undefined"
  >
    <!-- 场景模式的分类锚点 -->
    <template v-if="live">
      <i
        v-for="(section, index) in categories" :id="frameId(section.name)" :key="section.name"
        class="ov-ba-anchor pointer-events-none absolute left-0 size-px" aria-hidden="true"
        :style="{ top: `${(starts[index] ?? 0) + ANCHOR_OFFSET + 2}px` }"
      />
    </template>

    <div :class="cls.stage">
      <!-- 左侧：系列说明与分类列表 -->
      <div :class="cls.side">
        <div class="mb-5 flex-none">
          <span class="mb-2.5 block text-[14.5px] font-semibold tracking-[-0.01em] text-(--ov-label)">{{ series.count }} 个组件</span>
          <h3 class="text-[clamp(26px,2.6vw,34px)] leading-[1.2] font-semibold tracking-[-0.02em] text-(--ov-text)">
            {{ series.title }}
          </h3>
          <p class="mt-2.5 text-[14.5px] leading-[1.65] text-pretty text-(--ov-text-2)">
            {{ series.description }}
          </p>
        </div>
        <ol :class="STEPS_CLASS" :aria-label="`${series.title}的分类`">
          <li
            v-for="(section, index) in categories" :key="section.name" class="ov-ba-step" :class="STEP_ITEM"
            :data-on="activeIndex === index ? '' : undefined"
          >
            <a
              :href="`#${frameId(section.name)}`" :aria-current="activeIndex === index ? 'true' : undefined"
              class="group/step focus-visible:rounded-md focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary"
              :class="[STEP_BOX, stepClasses(activeIndex === index).box]"
            >
              <!-- 竖轨 -->
              <span
                class="absolute top-[9px] bottom-[9px] left-0 w-0.5 rounded-[2px] bg-[color-mix(in_oklab,var(--color-gray-10)_10%,transparent)] max-[901px]:hidden"
                aria-hidden="true"
              ><i class="absolute inset-0 origin-top rounded-[inherit] bg-primary" :class="stepClasses(activeIndex === index).fill" /></span>
              <span
                class="block text-[16px] leading-[1.4] font-semibold tracking-[-0.01em] transition-[color] duration-300 ease-[ease] max-[901px]:text-[14.5px]"
                :class="stepClasses(activeIndex === index).title"
              >{{ section.name }}<em
                class="ml-[7px] text-[12.5px] font-normal not-italic tabular-nums text-(--ov-text-3)"
                :class="stepClasses(activeIndex === index).count"
              >{{ section.items.length }}</em></span>
              <span
                class="pt-[3px] text-[13.5px] leading-[1.55] max-[901px]:hidden"
                :class="stepClasses(activeIndex === index).desc"
              >{{ componentNames(section.items) }}</span>
            </a>
          </li>
        </ol>
      </div>

      <!-- 右侧：分类卡片 -->
      <div ref="main" class="ov-ba-main" :class="cls.main" @focusin="onFocusIn">
        <!-- 切换时的主色环 -->
        <i
          v-if="live" ref="ring" class="ov-ba-ring pointer-events-none invisible absolute inset-[5px] z-2 rounded-[20px] bg-primary"
          aria-hidden="true"
        />

        <section
          v-for="(section, index) in categories" :id="live ? undefined : frameId(section.name)" :key="section.name"
          v-near="() => reveal(section.name)" v-spy v-fly-in class="ov-ba-frame" :class="[cls.frame, { 'fly-in': !live }]"
          :data-index="index" :aria-labelledby="`title-${series.id}-${section.name}`"
        >
          <div :class="cls.screen">
            <div :class="cls.head">
              <h4 :id="`title-${series.id}-${section.name}`" class="text-[19px] font-semibold tracking-[-0.015em] text-(--ov-text)">
                {{ section.name }}
              </h4>
              <span class="text-[13px] tabular-nums text-(--ov-text-3)">{{ section.items.length }} 个组件</span>
            </div>

            <!-- 卡片可视窗口 -->
            <div class="ov-ba-window" :class="cls.window">
              <div class="ov-cards" :class="cls.cards" @pointermove.passive="onCardMove">
                <!-- 场景模式 -->
                <template v-if="live">
                  <template v-if="isInWindow(index)">
                    <ComponentsOverviewCard v-for="item in section.items" :key="item.id" :item="item" scene />
                  </template>
                </template>
                <!-- 列表模式：接近视口前显示占位 -->
                <template v-else>
                  <template v-for="(item, cardIndex) in section.items" :key="item.id">
                    <div v-if="!isRevealed(section.name)" aria-hidden="true" :class="CARD_SKELETON">
                      <div class="min-h-[168px] rounded-lg" :class="SKELETON" />
                      <div class="mt-3 h-6 w-3/5 rounded" :class="SKELETON" />
                      <div class="mt-2 h-5 w-2/5 rounded" :class="SKELETON" />
                    </div>
                    <ComponentsOverviewCard v-else v-fly-in="{ stagger: cardIndex }" :item="item" class="fly-in" />
                  </template>
                </template>
              </div>
            </div>
          </div>
        </section>

        <!-- 分类序号 -->
        <span
          v-if="live" aria-hidden="true"
          class="absolute top-[calc(100%_+_12px)] right-1.5 grid h-[26px] min-w-16 place-items-center rounded-[999px] px-[11px]
            text-[12.5px] font-medium tracking-[-0.01em] tabular-nums text-gray-1 bg-[color-mix(in_oklab,var(--color-gray-10)_82%,transparent)]"
        >{{ current + 1 }} / {{ categories.length }}</span>
      </div>
    </div>
  </div>
</template>
