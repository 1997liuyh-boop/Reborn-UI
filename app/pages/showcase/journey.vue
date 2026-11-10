<script setup lang="ts">
import type { DocsCollectionItem } from "@nuxt/content";
import type { CSSProperties } from "vue";
import type { ComponentSeries } from "~/utils/componentsCatalog";
import { computed, onBeforeUnmount, onMounted, shallowRef, useTemplateRef } from "vue";
import ComponentOverviewDemo from "~/components/common/component-list/ComponentOverviewDemo.vue";
import JourneyScene from "~/components/common/showcase/JourneyScene.vue";
import { matchesPlatform } from "~/composables/useDocsPlatform";
import { COMPONENTS_PATH, normalizeCategory, resolveSeries } from "~/utils/componentsCatalog";

/**
 * 云海之旅 —— /showcase/journey
 *
 * 一段滚动叙事：页面高 9 屏，画布吸顶，滚动进度驱动摄像机从云上一路下降到海底。
 * - 云上：组件总览卡片与两个系列的数量卡片从左右两侧飞入；
 * - 穿过云层 / 俯瞰大地 / 潜入海底：每段各有 4 张组件卡片从远处飞到眼前，离开时掠过镜头；
 * - 海底：鱼群在背后游动，停在 REBORN UI 与入门指南入口上。
 * 卡片里的缩略预览就是组件总览页用的 Overview 组件，数量按 Web 端可见的组件实时统计。
 */

definePageMeta({
  layout: false,
  header: false,
  footer: false,
  colorMode: "light",
});

useSeoMeta({
  // 站点的标题模板会追加「 - Reborn UI」
  title: "云海之旅",
  description: "从云上一路下降到海底的滚动场景，沿途展示 Reborn UI 的组件。",
});

/* ── 组件数据 ─────────────────────────────────────────────────────────── */

interface JourneyComponent {
  path: string;
  title: string;
  category: string;
  series: ComponentSeries;
  platform?: string;
  demoName?: string;
}

/** 从文档正文里找到 ComponentViewer 的 demo-file，推导缩略组件名；规则与组件总览页一致 */
function overviewName(item: DocsCollectionItem) {
  const explicit = (item as { overviewDemo?: string }).overviewDemo?.trim();
  if (explicit) return explicit.replace(/\.vue$/i, "");
  const value = (item as { body?: { value?: unknown } }).body?.value;
  if (!Array.isArray(value)) return undefined;
  for (const node of value) {
    if (!Array.isArray(node) || node[0] !== "component-viewer") continue;
    const attrs = node[1] as Record<string, unknown> | undefined;
    const demoFile = attrs?.["demo-file"] ?? attrs?.demoFile;
    if (typeof demoFile !== "string" || !demoFile) continue;
    const name = demoFile.replace(/\.vue$/i, "");
    return name.endsWith("Demo") ? `${name.slice(0, -4)}Overview` : `${name}Overview`;
  }
  return undefined;
}

const { data: catalog } = await useAsyncData("showcase-journey", async () => {
  const docs = await queryCollection("docs").all() as DocsCollectionItem[];
  // 只回传卡片要用的字段，正文 AST 留在服务端
  return docs
    .filter(item => item.path.startsWith(`${COMPONENTS_PATH}/`))
    .map<JourneyComponent>(item => ({
      path: item.path,
      title: item.title,
      category: normalizeCategory(item.category),
      series: resolveSeries(item.path, (item as { series?: unknown }).series),
      platform: (item as { platform?: string }).platform,
      demoName: overviewName(item),
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
});

/** 与组件总览页 Web 档位的口径一致：只统计 Web 端可用（含双端）的组件 */
const webComponents = computed(() => (catalog.value ?? []).filter(item => matchesPlatform(item.platform, "web")));
const rebornCount = computed(() => webComponents.value.filter(item => item.series === "reborn").length);
const communityCount = computed(() => webComponents.value.filter(item => item.series === "community").length);

/** 按分类轮流各取一个，凑满 count 张卡片 */
function pick(series: ComponentSeries, categories: string[], count = 4) {
  const pools = categories.map(category => webComponents.value.filter(item => item.series === series && item.category === category));
  const result: JourneyComponent[] = [];
  for (let round = 0; result.length < count && round < 10; round++) {
    for (const pool of pools) {
      const item = pool[round];
      if (item && result.length < count) result.push(item);
    }
  }
  return result;
}

interface Stage {
  id: string;
  index: string;
  title: string;
  /** 卡片可见的进度区间 */
  from: number;
  to: number;
  cards: JourneyComponent[];
}

const stages = computed<Stage[]>(() => [
  { id: "clouds", index: "02", title: "穿过云层", from: 0.22, to: 0.43, cards: pick("reborn", ["按钮", "通用", "布局"]) },
  { id: "land", index: "03", title: "俯瞰大地", from: 0.47, to: 0.68, cards: pick("reborn", ["表单与输入", "导航", "数据展示"]) },
  { id: "sea", index: "04", title: "潜入海底", from: 0.72, to: 0.88, cards: [...pick("reborn", ["反馈"], 2), ...pick("community", ["特效", "文字动画"], 2)] },
]);

/* ── 滚动进度 ─────────────────────────────────────────────────────────── */

const track = useTemplateRef<HTMLElement>("track");
const progress = shallowRef(0);
const sceneStatus = shallowRef<"loading" | "ready" | "error">("loading");
const narrow = shallowRef(false);
const reduced = shallowRef(false);
/** 首屏飞入动画的进度：页面打开后 1.6 秒内从 0 走到 1，与滚动无关 */
const intro = shallowRef(0);
let frame = 0;
let introFrame = 0;

function measure() {
  frame = 0;
  const element = track.value;
  if (!element) return;
  const range = element.offsetHeight - window.innerHeight;
  progress.value = range > 0 ? Math.min(Math.max(-element.getBoundingClientRect().top / range, 0), 1) : 0;
  narrow.value = window.innerWidth < 768;
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(measure);
}

function playIntro() {
  if (reduced.value) {
    intro.value = 1;
    return;
  }
  const start = performance.now();
  const step = (now: number) => {
    intro.value = Math.min((now - start) / 1600, 1);
    if (intro.value < 1) introFrame = requestAnimationFrame(step);
  };
  introFrame = requestAnimationFrame(step);
}

onMounted(() => {
  reduced.value = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  measure();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  playIntro();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  cancelAnimationFrame(introFrame);
  window.removeEventListener("scroll", onScroll);
  window.removeEventListener("resize", onScroll);
});

/* ── 卡片运动 ─────────────────────────────────────────────────────────── */

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);
const easeOut = (value: number) => 1 - (1 - value) ** 3;
const easeIn = (value: number) => value ** 3;

/**
 * 一张卡片的 3D 运动：从远处（-z）带着侧向偏移飞到原位并略微内倾，
 * 离开时继续向镜头方向冲过去并淡出。enter / exit 都是 0 ~ 1。
 */
function flight(enter: number, exit: number, side: number): CSSProperties {
  const inValue = easeOut(clamp01(enter));
  const outValue = easeIn(clamp01(exit));
  const opacity = inValue * (1 - outValue);
  if (reduced.value) return { opacity, visibility: opacity > 0.01 ? "visible" : "hidden" };
  const z = -1400 * (1 - inValue) + 900 * outValue;
  const x = side * 38 * (1 - inValue);
  const rotate = side * (-34 * (1 - inValue) - 5);
  return {
    opacity,
    transform: `translate3d(${x}vw, 0, ${z}px) rotateY(${rotate}deg)`,
    visibility: opacity > 0.01 ? "visible" : "hidden",
    pointerEvents: opacity > 0.7 ? "auto" : "none",
  };
}

/** 云上：首屏飞入由 intro 驱动，向下滚动后按进度飞离 */
function introCard(delay: number, side: number) {
  const exit = (progress.value - 0.11) / 0.07;
  return flight((intro.value - delay) / (1 - delay), exit, side);
}

/** 四个卡位：左上、右上、左下、右下 */
function slot(index: number): CSSProperties {
  const side = index % 2 === 0 ? -1 : 1;
  const row = Math.floor(index / 2);
  const left = narrow.value ? (side < 0 ? 26 : 74) : (side < 0 ? 19 : 81);
  const top = narrow.value ? (row === 0 ? 44 : 72) : (row === 0 ? 33 : 69);
  return { left: `${left}%`, top: `${top}%` };
}

function stageCard(stage: Stage, index: number) {
  const side = index % 2 === 0 ? -1 : 1;
  const start = stage.from + index * 0.022;
  const enter = (progress.value - start) / 0.07;
  const exit = (progress.value - (stage.to - 0.05)) / 0.05;
  return flight(enter, exit, side);
}

/** 只在卡片即将出现到刚离开之间挂载，缩略预览不会在首屏一次性全部渲染 */
function stageMounted(stage: Stage) {
  return progress.value > stage.from - 0.08 && progress.value < stage.to + 0.04;
}

/** 进度落在 [from, to] 之间时可见，两端各用 edge 长度淡入淡出 */
function band(from: number, to: number, edge = 0.04) {
  const value = progress.value;
  const rise = from <= 0 ? 1 : clamp01((value - from + edge) / edge);
  const fall = to >= 1 ? 1 : clamp01((to + edge - value) / edge);
  return Math.min(rise, fall);
}

function fade(from: number, to: number): CSSProperties {
  const opacity = band(from, to);
  return {
    opacity,
    transform: reduced.value ? undefined : `translateY(${(1 - opacity) * 16}px)`,
    visibility: opacity > 0.01 ? "visible" : "hidden",
    pointerEvents: opacity > 0.7 ? "auto" : "none",
  };
}

/* ── 章节导轨 ─────────────────────────────────────────────────────────── */

const chapters = [
  { label: "云上", at: 0 },
  { label: "云层", at: 0.3 },
  { label: "大地", at: 0.56 },
  { label: "海底", at: 0.8 },
  { label: "终", at: 1 },
];

const activeChapter = computed(() => {
  let active = 0;
  chapters.forEach((chapter, index) => {
    if (progress.value >= chapter.at - 0.06) active = index;
  });
  return active;
});

function jumpTo(at: number) {
  const element = track.value;
  if (!element) return;
  const range = element.offsetHeight - window.innerHeight;
  window.scrollTo({ top: element.offsetTop + range * at, behavior: reduced.value ? "auto" : "smooth" });
}
</script>

<template>
  <main class="bg-[#c9dbee] text-gray-10">
    <section ref="track" class="relative h-[900svh]" aria-label="云海之旅">
      <div class="sticky top-0 h-svh w-full overflow-hidden">
        <JourneyScene class="absolute inset-0" :progress="progress" @status="sceneStatus = $event" />

        <header class="journey-overlay-text absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-4 md:px-10 md:py-6">
          <NuxtLink to="/" class="rounded-sm text-sm font-medium tracking-[0.3em] text-white focus-visible:outline-1 focus-visible:outline-offset-4">
            ◈ REBORN UI
          </NuxtLink>
          <NuxtLink to="/components" class="rounded-sm text-sm text-white/90 transition-colors hover:text-white focus-visible:outline-1 focus-visible:outline-offset-4">
            组件总览 ↗
          </NuxtLink>
        </header>

        <!-- 章节导轨：点击跳到对应进度 -->
        <nav class="journey-overlay-text absolute top-1/2 right-3 z-20 flex -translate-y-1/2 flex-col gap-4 md:right-8" aria-label="章节">
          <button
            v-for="(chapter, index) in chapters"
            :key="chapter.label"
            type="button"
            class="flex items-center justify-end gap-3 rounded-sm text-sm text-white/60 transition-colors hover:text-white focus-visible:outline-1 focus-visible:outline-offset-4"
            :class="activeChapter === index && 'text-white'"
            :aria-current="activeChapter === index ? 'step' : undefined"
            @click="jumpTo(chapter.at)"
          >
            <span class="hidden md:inline">{{ chapter.label }}</span>
            <span class="block h-px transition-all duration-500 motion-reduce:transition-none" :class="activeChapter === index ? 'w-8 bg-white' : 'w-4 bg-white/50'" />
          </button>
        </nav>

        <!-- 卡片舞台：统一透视，卡片在 z 方向飞行 -->
        <div class="journey-stage pointer-events-none absolute inset-0 z-10">
          <!-- 01 云上：左侧总览说明，右侧两个系列的数量 -->
          <article
            class="journey-card absolute top-[18svh] left-[5vw] w-[90vw] p-6 md:top-1/2 md:left-[6vw] md:w-[420px] md:-translate-y-1/2 md:p-8"
            :style="introCard(0, -1)"
          >
            <p class="text-sm text-primary">
              组件总览
            </p>
            <h1 class="mt-3 text-3xl leading-tight text-gray-10 md:text-4xl">
              Reborn UI 全部组件
            </h1>
            <p class="mt-4 text-base leading-relaxed text-gray-8">
              Web / UniApp 双端基础与扩展组件，覆盖按钮、表单、导航、反馈与特效
            </p>
            <p class="mt-4 border-t border-gray-3 pt-4 text-sm leading-relaxed text-gray-6">
              设计与实现持续迭代，欢迎在文档页反馈问题
            </p>
          </article>

          <div class="absolute right-[5vw] bottom-[10svh] left-[5vw] flex gap-3 [transform-style:preserve-3d] md:top-1/2 md:right-[6vw] md:bottom-auto md:left-auto md:w-[300px] md:-translate-y-1/2 md:flex-col md:gap-4">
            <NuxtLink
              v-for="(stat, index) in [
                { label: 'Reborn 组件', count: rebornCount, note: '自研基础组件，双端同名同构' },
                { label: '社区移植', count: communityCount, note: '移植自开源项目的动效与展示组件' },
              ]"
              :key="stat.label"
              to="/components"
              class="journey-card block flex-1 p-5 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4 md:p-6"
              :style="introCard(0.18 + index * 0.14, 1)"
            >
              <p class="text-sm text-gray-6">
                {{ stat.label }}
              </p>
              <p class="mt-2 flex items-baseline gap-2 text-gray-10">
                <span class="text-4xl font-semibold tabular-nums">{{ stat.count }}</span>
                <span class="text-base">个组件</span>
              </p>
              <p class="mt-2 hidden text-sm text-gray-6 md:block">
                {{ stat.note }}
              </p>
            </NuxtLink>
          </div>

          <!-- 02 ~ 04：每段 4 张组件卡片 -->
          <template v-for="stage in stages" :key="stage.id">
            <template v-if="stageMounted(stage)">
              <p class="journey-overlay-text absolute inset-x-0 top-[10svh] text-center text-sm tracking-[0.4em] text-white md:top-[9svh]" :style="fade(stage.from + 0.02, stage.to - 0.03)">
                {{ stage.index }} · {{ stage.title }}
              </p>
              <div
                v-for="(item, index) in stage.cards"
                :key="item.path"
                class="journey-slot absolute w-[46vw] md:w-[280px]"
                :style="slot(index)"
              >
                <NuxtLink
                  :to="item.path"
                  class="journey-card block overflow-hidden p-2 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-4"
                  :style="stageCard(stage, index)"
                >
                  <div class="journey-preview relative h-[104px] overflow-hidden rounded-lg bg-gray-2 md:h-[168px]">
                    <ComponentOverviewDemo :demo-name="item.demoName" :category="item.category" />
                  </div>
                  <div class="flex items-baseline justify-between gap-2 px-2 pt-3 pb-1">
                    <span class="truncate text-base text-gray-10">{{ item.title }}</span>
                    <span class="shrink-0 text-sm text-gray-6">{{ item.category }}</span>
                  </div>
                </NuxtLink>
              </div>
            </template>
          </template>
        </div>

        <!-- 05 海底：鱼群在背后游动 -->
        <div class="journey-overlay-text absolute inset-x-0 top-[22svh] z-20 px-6 text-center text-white" :style="fade(0.92, 1)">
          <p class="text-sm tracking-[0.5em] text-white/80">
            05 · 海底
          </p>
          <h2 class="journey-title mt-5 text-[clamp(3rem,10vw,7.5rem)] leading-none tracking-[0.06em]">
            REBORN UI
          </h2>
        </div>
        <div class="absolute inset-x-0 bottom-[16svh] z-20 flex justify-center px-6" :style="fade(0.92, 1)">
          <NuxtLink
            to="/getting-started"
            class="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-8 text-base text-[#0e4c5e] shadow-[0_12px_32px_rgb(0_30_40/0.35)] transition-colors hover:bg-[#e6fbfb] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            先读入门指南
            <span aria-hidden="true">→</span>
          </NuxtLink>
        </div>

        <p class="journey-overlay-text absolute inset-x-0 bottom-8 z-20 text-center text-sm tracking-[0.4em] text-white" :style="fade(0, 0.05)" aria-hidden="true">
          向下滚动
        </p>

        <p v-if="sceneStatus === 'error'" role="alert" class="absolute inset-x-0 bottom-6 z-20 text-center text-sm text-gray-8">
          当前浏览器无法创建 WebGL 场景，卡片与文字仍可滚动浏览。
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.journey-stage {
  perspective: 1200px;
  perspective-origin: 50% 45%;
}

/* 卡位只负责定位（以卡片中心对齐），飞行变换作用在卡片本身 */
.journey-slot {
  transform: translate(-50%, -50%);
  transform-style: preserve-3d;
}

.journey-card {
  border: 1px solid var(--color-gray-3);
  border-radius: 12px;
  background: var(--color-gray-1);
  box-shadow: 0 24px 60px rgb(15 30 60 / 0.22);
  will-change: transform, opacity;
}

/* 缩略预览默认的最小高度按总览页卡片设计，这里由卡片决定高度 */
.journey-preview :deep(.overview-demo) {
  min-height: 0;
}

.journey-overlay-text {
  text-shadow: 0 1px 12px rgb(10 30 50 / 0.45);
}

.journey-title {
  font-family: "Noto Serif SC", "Source Han Serif SC", "Songti SC", "STSong", serif;
  font-weight: 600;
  text-shadow: 0 4px 32px rgb(0 30 40 / 0.6);
}
</style>
