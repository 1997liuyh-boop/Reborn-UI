<script setup lang="ts">
import { useHead } from "#imports";
import { useEventListener, useMediaQuery } from "@vueuse/core";
import { motion } from "motion-v";
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import AppHeaderLogo from "~/components/app/AppHeaderLogo.vue";
import FlameCanvas from "./FlameCanvas.vue";
import { flameHeroVideoUrl, getScrubTime, heroMessage, installCommand } from "./flameHero.config";
import { createHeroEntrance, landingNavigation } from "./videoHero.config";

// 水合完成后再读取系统偏好，保证服务端与客户端的首帧一致。
const hydrated = ref(false);
const reducePreference = useMediaQuery("(prefers-reduced-motion: reduce)");
const reduced = computed(() => hydrated.value && reducePreference.value);
const desktop = useMediaQuery("(min-width: 768px)");
const menuOpen = ref(false);
const menuButton = useTemplateRef<HTMLButtonElement>("menuButton");
const menuPanel = useTemplateRef<HTMLElement>("menuPanel");
const video = useTemplateRef<HTMLVideoElement>("video");
const paused = ref(false);
const videoFailed = ref(false);
const duration = ref(0);
const progress = ref(0);
const copyStatus = ref("");
const displayed = ref("");
const done = computed(() => displayed.value === heroMessage);
const animationPaused = computed(() => paused.value || reduced.value || menuOpen.value);
let previousX: number | null = null;
let targetTime = 0;
let typingTimer: ReturnType<typeof setTimeout> | undefined;
let copyTimer: ReturnType<typeof setTimeout> | undefined;

useHead({ titleTemplate: "%s", link: [
  { rel: "stylesheet", href: "https://db.onlinewebfonts.com/c/5ac3fe7c6abd2f62067f266d89671492?family=HelveticaNowDisplay-Medium" },
  { rel: "stylesheet", href: "https://db.onlinewebfonts.com/c/1aa3377e489837a26d019bba501e779d?family=HelveticaNowDisplayW01-Rg" },
] });

function closeMenu() { menuOpen.value = false; menuButton.value?.focus(); }
function trapFocus(event: KeyboardEvent) {
  if (!menuOpen.value || event.key !== "Tab") return;
  const links = menuPanel.value?.querySelectorAll<HTMLAnchorElement>("a");
  if (!links?.length) return;
  const first = menuButton.value;
  const last = links[links.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
}

function seek() {
  const media = video.value;
  if (!media || media.seeking || !duration.value || animationPaused.value) return;
  // 等上一帧完成解码再继续，避免鼠标移动产生大量并行 seek。
  if (Math.abs(media.currentTime - targetTime) > 0.035) media.currentTime = targetTime;
}
function mediaReady() {
  duration.value = Number.isFinite(video.value?.duration) ? video.value!.duration : 0;
  videoFailed.value = Boolean(video.value?.error);
}
function moveVideo(event: PointerEvent) {
  if (event.pointerType !== "mouse") return;
  if (previousX !== null && !animationPaused.value) {
    targetTime = getScrubTime(targetTime, event.clientX - previousX, window.innerWidth, duration.value);
    progress.value = duration.value ? targetTime / duration.value * 100 : 0;
    seek();
  }
  previousX = event.clientX;
}
function scrubVideo(event: Event) {
  const input = event.target as HTMLInputElement;
  progress.value = Number(input.value);
  targetTime = progress.value / 100 * duration.value;
  seek();
}
function typeNext() {
  if (reduced.value) { displayed.value = heroMessage; return; }
  displayed.value = heroMessage.slice(0, displayed.value.length + 1);
  if (!done.value) typingTimer = setTimeout(typeNext, 38);
}
async function copyInstall() {
  clearTimeout(copyTimer);
  try {
    await navigator.clipboard.writeText(installCommand);
    copyStatus.value = "安装命令已复制";
  } catch { copyStatus.value = "复制失败，请手动选择安装命令"; }
  copyTimer = setTimeout(() => { copyStatus.value = ""; }, 4000);
}

useEventListener("pointermove", moveVideo);
useEventListener("blur", () => { previousX = null; });
useEventListener("keydown", (event: KeyboardEvent) => {
  if (event.key === "Escape" && menuOpen.value) closeMenu();
  trapFocus(event);
});
watch(desktop, (value) => { if (value) menuOpen.value = false; });
watch(animationPaused, () => { previousX = null; });
watch(reduced, (value) => { if (value) { clearTimeout(typingTimer); displayed.value = heroMessage; } });
onMounted(() => {
  hydrated.value = true;
  mediaReady();
  if (reduced.value) displayed.value = heroMessage;
  else typingTimer = setTimeout(typeNext, 600);
});
onBeforeUnmount(() => { clearTimeout(typingTimer); clearTimeout(copyTimer); video.value?.pause(); });
</script>

<template>
  <main class="relative isolate min-h-screen min-h-svh overflow-hidden bg-[#f5f5f3] font-['HelveticaNowDisplayW01-Rg','Helvetica_Neue',Arial,sans-serif] text-black selection:bg-black selection:text-white">
    <video ref="video" :src="flameHeroVideoUrl" muted playsinline preload="auto" aria-hidden="true" tabindex="-1" class="pointer-events-none absolute inset-0 z-0 size-full object-cover object-[70%_center]" @loadedmetadata="mediaReady" @error="videoFailed = true" @seeked="seek" />
    <div aria-hidden="true" class="pointer-events-none absolute inset-0 bg-[linear-gradient(0deg,#f5f5f3_0%,#f5f5f3cc_22%,transparent_70%)] md:bg-[linear-gradient(90deg,#f5f5f3ed_0%,#f5f5f399_30%,transparent_68%)]" />
    <FlameCanvas :paused="animationPaused" class="absolute inset-x-0 bottom-0 z-1 h-[26vh] min-h-36 opacity-90 md:left-[36%] md:h-[42vh] md:opacity-95" />

    <nav aria-label="首页导航" class="fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-4 bg-white/65 px-5 py-4 backdrop-blur-md sm:px-8 sm:py-5">
      <NuxtLink to="/" aria-label="Reborn UI 首页" class="shrink-0 rounded focus-visible:outline-2 focus-visible:outline-offset-4"><AppHeaderLogo class="h-8! text-black! [&_svg]:h-8" /></NuxtLink>
      <div class="hidden items-center md:flex md:text-base lg:text-[23px]">
        <template v-for="(item, index) in landingNavigation" :key="item.to">
          <span v-if="index" aria-hidden="true" class="mr-2">,</span>
          <NuxtLink :to="item.to" class="transition-opacity hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4">{{ item.label }}</NuxtLink>
        </template>
      </div>
      <NuxtLink to="/getting-started" class="hidden shrink-0 text-base underline underline-offset-4 transition-opacity hover:opacity-60 md:block lg:text-[23px]">开始使用</NuxtLink>
      <button ref="menuButton" type="button" :aria-expanded="menuOpen" aria-controls="home-mobile-menu" :aria-label="menuOpen ? '关闭菜单' : '打开菜单'" class="relative flex size-11 flex-col items-center justify-center gap-[5px] rounded focus-visible:outline-2 md:hidden" @click="menuOpen = !menuOpen">
        <span :class="{ 'translate-y-[7px] rotate-45': menuOpen }" class="h-0.5 w-6 bg-black transition-transform duration-300 motion-reduce:transition-none" />
        <span :class="{ 'opacity-0': menuOpen }" class="h-0.5 w-6 bg-black transition-opacity duration-300 motion-reduce:transition-none" />
        <span :class="{ '-translate-y-[7px] -rotate-45': menuOpen }" class="h-0.5 w-6 bg-black transition-transform duration-300 motion-reduce:transition-none" />
      </button>
    </nav>
    <div id="home-mobile-menu" ref="menuPanel" :inert="!menuOpen" :aria-hidden="!menuOpen" :class="menuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'" class="fixed inset-0 z-40 flex flex-col justify-center gap-7 bg-white/95 px-8 backdrop-blur-sm transition-opacity duration-300 motion-reduce:transition-none md:hidden">
      <NuxtLink v-for="item in landingNavigation" :key="item.to" :to="item.to" class="w-fit text-[32px] font-medium" @click="menuOpen = false">{{ item.label }}</NuxtLink>
      <NuxtLink to="/getting-started" class="w-fit text-2xl underline underline-offset-4" @click="menuOpen = false">开始使用</NuxtLink>
    </div>

    <section :inert="menuOpen" aria-labelledby="flame-hero-title" class="relative z-10 flex min-h-screen min-h-svh flex-col justify-end px-5 pt-32 pb-56 sm:px-8 md:justify-center md:px-10 md:py-36">
      <div class="max-w-xl">
        <p aria-hidden="true" class="pointer-events-none mb-5 text-[clamp(18px,4vw,26px)] leading-[1.3] blur-[4px] select-none sm:mb-6">你好，欢迎来到 Reborn UI。<br>面向 Web 与 UniApp 的 Vue 组件库。</p>
        <h1 id="flame-hero-title" class="sr-only">Reborn UI，面向 Web 与 UniApp 的 Vue 组件库</h1>
        <p class="relative mb-6 min-h-[4.1em] text-[clamp(18px,4vw,26px)] leading-[1.35]">
          <span class="sr-only">{{ heroMessage }}</span>
          <span aria-hidden="true">{{ displayed }}<span v-if="!done" class="ml-0.5 inline-block h-[1.1em] w-0.5 animate-pulse bg-black align-middle motion-reduce:animate-none" /></span>
        </p>
        <motion.div v-bind="createHeroEntrance(8, 0.4, 0.4, reduced)" class="flex flex-wrap gap-2">
          <NuxtLink v-for="item in landingNavigation" :key="item.to" :to="item.to" class="inline-flex min-h-10 items-center rounded-full border border-black/10 bg-white px-4 text-[13px] transition-colors hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 sm:px-5 sm:text-[15px]">{{ item.label }}</NuxtLink>
          <button type="button" class="mt-1 inline-flex min-h-10 max-w-full items-center gap-3 rounded-full border border-black/40 bg-white/65 px-4 text-xs transition-colors hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 sm:text-sm" @click="copyInstall"><span class="break-all">{{ installCommand }}</span><UIcon name="i-lucide-copy" class="size-3 shrink-0" /></button>
        </motion.div>
        <p role="status" class="mt-3 min-h-5 text-xs">{{ copyStatus || (videoFailed ? '视频暂不可用，火焰与文档入口仍可使用。' : '') }}</p>
      </div>
    </section>
    <footer :inert="menuOpen" class="absolute inset-x-0 bottom-0 z-20 flex flex-wrap items-end justify-between gap-5 px-5 py-7 sm:px-8 md:px-10">
      <p class="text-xs leading-5 text-black/65">源码可控，样式自由。<br>Vue 3 / TypeScript / Tailwind CSS</p>
      <div class="flex flex-col items-end gap-3 rounded-xl bg-white/80 p-3 backdrop-blur-sm">
        <button type="button" :aria-pressed="paused" :disabled="reduced" class="flex min-h-7 items-center gap-2 text-xs" @click="paused = !paused"><UIcon :name="animationPaused ? 'i-lucide-play' : 'i-lucide-pause'" class="size-3" />{{ reduced ? '已跟随系统减少动态效果' : paused ? '继续动态效果' : '暂停动态效果' }}</button>
        <label class="flex items-center gap-3 text-[11px]">拖动探索<input type="range" aria-label="背景视频进度" min="0" max="100" step="0.1" :value="progress" :disabled="!duration || animationPaused || videoFailed" class="w-24 accent-black disabled:opacity-40 sm:w-32" @input="scrubVideo"></label>
      </div>
    </footer>
  </main>
</template>
