<script setup lang="ts">
import { useHead } from "#imports";
import { onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import AppHeaderLogo from "~/components/app/AppHeaderLogo.vue";
import { getSpotlightPosition } from "~/utils/lithosSpotlight";

const scene = useTemplateRef<HTMLElement>("scene");
const livingImage = useTemplateRef<HTMLImageElement>("livingImage");
const isRevealing = ref(false);
const isPinned = ref(false);
const menuOpen = ref(false);
const imageReady = ref(false);
const imageFailed = ref(false);
// 与文档站顶栏保持相同的分类名称和路由。
const navigationItems = [
  { label: "入门指南", to: "/getting-started" },
  { label: "Components", to: "/components" },
  { label: "Changelogs", to: "/changelogs" },
  { label: "Composables", to: "/composables" },
];
let frame = 0;
let target = { x: 0, y: 0 };
let position = { x: 0, y: 0 };
let reducedMotion = false;
let motionQuery: MediaQueryList | undefined;

useHead({ titleTemplate: "%s", link: [{ rel: "preload", as: "image", href: "/images/lithos/strata.webp" }] });

// 只更新局部 CSS 变量，不让每一帧指针移动触发整个组件重新渲染。
function paintSpotlight() {
  const element = scene.value;
  if (!element) return;
  const factor = reducedMotion ? 1 : 0.2;
  position.x += (target.x - position.x) * factor;
  position.y += (target.y - position.y) * factor;
  element.style.setProperty("--spot-x", `${position.x.toFixed(2)}px`);
  element.style.setProperty("--spot-y", `${position.y.toFixed(2)}px`);
  frame = 0;
  if (Math.abs(target.x - position.x) + Math.abs(target.y - position.y) > 0.2) {
    frame = requestAnimationFrame(paintSpotlight);
  }
}

function schedulePaint() {
  if (!frame) frame = requestAnimationFrame(paintSpotlight);
}

function moveSpotlight(event: PointerEvent) {
  if (!scene.value || isPinned.value || !imageReady.value || imageFailed.value) return;
  target = getSpotlightPosition(event.clientX, event.clientY, scene.value.getBoundingClientRect());
  if (!isRevealing.value || event.pointerType === "touch") position = { ...target };
  isRevealing.value = true;
  schedulePaint();
}

function hideSpotlight() {
  if (!isPinned.value) isRevealing.value = false;
}

function centerSpotlight() {
  if (!scene.value) return;
  const { width, height } = scene.value.getBoundingClientRect();
  target = { x: width * (width < 768 ? 0.68 : 0.74), y: height * 0.52 };
  position = { ...target };
  schedulePaint();
}

function toggleReveal() {
  isPinned.value = !isPinned.value;
  isRevealing.value = isPinned.value;
  if (isPinned.value) centerSpotlight();
}

function moveWithKeyboard(event: KeyboardEvent) {
  if (event.key === "Escape") {
    isPinned.value = false;
    isRevealing.value = false;
    return;
  }
  const directions: Record<string, [number, number]> = {
    ArrowLeft: [-45, 0],
    ArrowRight: [45, 0],
    ArrowUp: [0, -45],
    ArrowDown: [0, 45],
  };
  const delta = directions[event.key];
  if (!delta || !isPinned.value || !scene.value) return;
  event.preventDefault();
  const { width, height } = scene.value.getBoundingClientRect();
  target = getSpotlightPosition(target.x + delta[0], target.y + delta[1], {
    left: 0,
    top: 0,
    width,
    height,
  });
  schedulePaint();
}

function handleResize() {
  if (isPinned.value) centerSpotlight();
  else hideSpotlight();
}

function updateMotionPreference() {
  reducedMotion = motionQuery?.matches ?? false;
}

onMounted(() => {
  // 缓存图片可能在 hydration 前完成加载，需要同步检查真实图片状态。
  if (livingImage.value?.complete) {
    imageReady.value = livingImage.value.naturalWidth > 0;
    imageFailed.value = !imageReady.value;
  }
  motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  updateMotionPreference();
  motionQuery.addEventListener("change", updateMotionPreference);
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(frame);
  motionQuery?.removeEventListener("change", updateMotionPreference);
  window.removeEventListener("resize", handleResize);
});
</script>

<template>
  <main
    ref="scene"
    class="relative isolate flex min-h-svh flex-col overflow-hidden bg-[#101113] font-[Arial,Helvetica,sans-serif] text-[#f1f0eb] [--spot-x:74%] [--spot-y:52%] selection:bg-[#ea683f] selection:text-black"
    @pointermove="moveSpotlight"
    @pointerleave="hideSpotlight"
    @pointercancel="hideSpotlight"
    @pointerup="hideSpotlight"
  >
    <!-- 双图共享尺寸与裁切位置，柔边遮罩仅作用于植物图层。 -->
    <div
      class="pointer-events-none absolute inset-0 -z-20"
      aria-hidden="true"
    >
      <img
        src="/images/lithos/strata.webp"
        alt=""
        width="2400"
        height="1600"
        fetchpriority="high"
        class="size-full object-cover object-[62%_center] md:object-center"
      >
      <img
        ref="livingImage"
        src="/images/lithos/living-strata.webp"
        alt=""
        width="2400"
        height="1600"
        class="absolute inset-0 size-full [mask-image:radial-gradient(circle_230px_at_var(--spot-x)_var(--spot-y),black_0%,black_30%,transparent_100%)] object-cover object-[62%_center] transition-opacity duration-500 [-webkit-mask-image:radial-gradient(circle_230px_at_var(--spot-x)_var(--spot-y),black_0%,black_30%,transparent_100%)] motion-reduce:transition-none md:[mask-image:radial-gradient(circle_320px_at_var(--spot-x)_var(--spot-y),black_0%,black_30%,transparent_100%)] md:object-center md:[-webkit-mask-image:radial-gradient(circle_320px_at_var(--spot-x)_var(--spot-y),black_0%,black_30%,transparent_100%)]"
        :class="isRevealing && imageReady ? 'opacity-100' : 'opacity-0'"
        @load="imageReady = true"
        @error="imageFailed = true"
      >
      <div
        class="absolute inset-0 bg-[linear-gradient(90deg,rgba(9,10,10,0.86)_0%,rgba(9,10,10,0.46)_42%,rgba(9,10,10,0.04)_78%)]"
      />
      <div
        class="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,10,0.75)_0%,transparent_24%,transparent_66%,rgba(9,10,10,0.92)_100%)]"
      />
    </div>

    <header
      class="relative z-20 mx-6 flex h-24 shrink-0 items-center justify-between border-b border-white/15 md:mx-12 md:h-28 lg:mx-16"
    >
      <NuxtLink
        to="/"
        aria-label="Reborn UI 首页"
        class="inline-flex items-center rounded-sm outline-offset-8 focus-visible:outline-2 focus-visible:outline-[#ec764f]"
      >
        <AppHeaderLogo class="text-[#f1f0eb]!" />
      </NuxtLink>
      <nav
        aria-label="文档分类"
        class="absolute left-1/2 hidden -translate-x-1/2 items-center gap-7 lg:flex"
      >
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="cursor-pointer py-3 text-[13px] text-[#c6c4be] transition-colors hover:text-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ec764f]"
          @click="menuOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
      <NuxtLink
        to="/getting-started"
        class="group hidden cursor-pointer items-center gap-7 rounded-full border border-white/25 px-5 py-3 text-[12px] transition-colors hover:border-[#ec764f] hover:bg-[#ec764f]/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ec764f] lg:inline-flex"
      >
        开始使用
        <UIcon
          name="i-lucide-arrow-up-right"
          class="size-4 text-[#ed754d] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transform-none"
        />
      </NuxtLink>
      <button
        type="button"
        class="flex size-11 cursor-pointer items-center justify-center rounded-full border border-white/25 focus-visible:outline-2 focus-visible:outline-[#ec764f] lg:hidden"
        :aria-expanded="menuOpen"
        aria-controls="reborn-mobile-menu"
        :aria-label="menuOpen ? '关闭导航' : '打开导航'"
        @click="menuOpen = !menuOpen"
      >
        <UIcon
          :name="menuOpen ? 'i-lucide-x' : 'i-lucide-menu'"
          class="size-5"
        />
      </button>
      <nav
        v-if="menuOpen"
        id="reborn-mobile-menu"
        aria-label="移动端文档分类"
        class="absolute inset-x-0 top-22 flex flex-col rounded-xl border border-white/15 bg-[#151615] p-3 shadow-xl lg:hidden"
        @keydown.esc="menuOpen = false"
      >
        <NuxtLink
          v-for="item in navigationItems"
          :key="item.to"
          :to="item.to"
          class="cursor-pointer rounded-lg px-4 py-3 text-left text-sm hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-[#ec764f]"
          @click="menuOpen = false"
        >
          {{ item.label }}
        </NuxtLink>
      </nav>
    </header>

    <section
      aria-labelledby="reborn-heading"
      class="relative mx-6 flex min-h-[520px] flex-1 items-center py-16 md:mx-12 md:min-h-[550px] md:py-20 lg:mx-16"
    >
      <div class="relative z-10 max-w-[820px]">
        <p
          class="mb-8 flex items-center gap-3 font-mono text-[9px] tracking-[0.23em] text-[#d7d0c5] sm:text-[10px]"
        >
          <span class="h-px w-7 bg-[#ec764f]" /> VUE COMPONENTS · WEB & UNIAPP
        </p>
        <h1
          id="reborn-heading"
          class="text-[clamp(64px,8.2vw,132px)] leading-[0.96] font-normal tracking-[-0.065em]"
        >
          Reborn UI<span class="text-[#ed754d]">.</span><br>
          <span class="text-[clamp(38px,6vw,88px)] tracking-[-0.04em]">为创意重生。</span>
        </h1>
        <p
          class="mt-8 max-w-[420px] text-[14px] leading-[1.8] text-[#b8b7b1] sm:max-w-[460px] sm:text-[15px]"
        >
          面向 Web 与 UniApp 的 Vue 组件库。<br>
          使用 TypeScript 与 Tailwind CSS，按需安装组件源码，<br class="hidden sm:block">
          自由定制属于你的界面。
        </p>
        <NuxtLink
          to="/getting-started"
          class="group mt-9 inline-flex cursor-pointer items-center gap-6 rounded-full bg-[#ed754d] py-2 pr-2 pl-6 text-[13px] font-medium text-[#191511] transition-colors hover:bg-[#ff9069] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#f1f0eb]"
        >
          开始使用
          <span
            class="flex size-9 items-center justify-center rounded-full bg-[#1b1b18] text-[#f1f0eb]"
          ><UIcon
            name="i-lucide-arrow-up-right"
            class="size-4 transition-transform group-hover:rotate-45 motion-reduce:transform-none"
          /></span>
        </NuxtLink>
        <NuxtLink
          to="/components"
          class="ml-5 inline-flex min-h-11 items-center gap-2 rounded-sm text-[13px] text-[#d0cec5] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ec764f]"
        >
          浏览组件
          <UIcon name="i-lucide-arrow-right" class="size-4" />
        </NuxtLink>
      </div>
    </section>

    <!-- 引导保留在岩层上；使用按钮提供与鼠标同等的键盘显影入口。 -->
    <div
      class="pointer-events-none absolute top-[47%] left-[74%] hidden -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-5 transition-opacity duration-500 motion-reduce:transition-none lg:flex"
      :class="isRevealing ? 'opacity-0' : 'opacity-100'"
      aria-hidden="true"
    >
      <div
        class="flex size-24 items-center justify-center rounded-full border border-white/30 bg-white/[0.02]"
      >
        <div class="flex size-16 items-center justify-center rounded-full border border-white/15">
          <UIcon
            name="i-lucide-move-up-right"
            class="size-5 text-[#dddcd4]"
          />
        </div>
      </div>
      <span class="font-mono text-[9px] tracking-[0.2em] text-[#cac5bc]">移动鼠标，探索另一层可能</span>
    </div>
    <div
      class="pointer-events-none absolute top-[var(--spot-y)] left-[var(--spot-x)] hidden size-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/40 transition-opacity duration-300 motion-reduce:transition-none lg:flex"
      :class="isRevealing ? 'opacity-100' : 'opacity-0'"
      aria-hidden="true"
    >
      <UIcon
        name="i-lucide-plus"
        class="size-3 text-white/80"
      />
    </div>

    <footer class="relative z-10 mx-6 shrink-0 md:mx-12 lg:mx-16">
      <div class="flex flex-wrap items-end justify-between gap-4 pb-7">
        <div class="flex items-center gap-3">
          <span class="flex size-8 items-center justify-center rounded-full border border-white/20"><UIcon
            name="i-lucide-orbit"
            class="size-4 text-[#a8a69e]"
          /></span>
          <div>
            <p class="font-mono text-[9px] tracking-[0.17em] text-[#888b84]">
              WEB · UNIAPP
            </p>
            <p class="mt-1 text-[12px] text-[#d0cec5]">按需安装 · 源码可控</p>
          </div>
        </div>
        <button
          type="button"
          class="group inline-flex min-h-11 cursor-pointer items-center gap-3 rounded-sm text-[11px] text-[#c3c1b8] transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ec764f] disabled:cursor-wait disabled:opacity-50"
          :disabled="!imageReady || imageFailed"
          :aria-pressed="isPinned"
          aria-describedby="reborn-keyboard-help"
          @click="toggleReveal"
          @keydown="moveWithKeyboard"
        >
          <span class="relative flex size-2"><span
            class="absolute inline-flex size-full rounded-full bg-[#ed754d] opacity-60"
          /><span
            class="relative inline-flex size-2 rounded-full"
            :class="isPinned ? 'bg-[#abc78c]' : 'bg-[#ed754d]'"
          /></span>
          {{
            imageFailed
              ? "暂时无法加载效果"
              : isPinned
                ? "关闭显影效果"
                : "开启显影效果"
          }}
          <UIcon
            :name="isPinned ? 'i-lucide-eye-off' : 'i-lucide-scan'"
            class="size-4"
          />
        </button>
        <span
          id="reborn-keyboard-help"
          class="sr-only"
        >开启后可用方向键移动光斑，按 Escape 关闭显影效果。</span>
      </div>
      <div
        class="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 py-5 font-mono text-[9px] tracking-[0.09em] text-[#95968e]"
      >
        <p>© {{ new Date().getFullYear() }} REBORN UI</p>
        <p class="hidden items-center gap-3 sm:flex">
          <span class="text-[#ed754d]">01</span><span class="h-px w-10 bg-white/25" /> VUE + TYPESCRIPT
          <span class="ml-2 text-[#686b65]">/</span><span class="ml-2">TAILWIND CSS</span>
        </p>
        <NuxtLink
          to="/changelogs"
          class="flex cursor-pointer items-center gap-2 py-1 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#ec764f]"
        >
          查看更新日志
          <UIcon
            name="i-lucide-arrow-up-right"
            class="size-3"
          />
        </NuxtLink>
      </div>
    </footer>
  </main>
</template>
