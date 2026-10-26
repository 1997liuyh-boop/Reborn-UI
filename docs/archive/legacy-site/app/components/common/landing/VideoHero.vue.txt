<script setup lang="ts">
import { useHead } from "#imports";
import { onClickOutside } from "@vueuse/core";
import { motion, useReducedMotion } from "motion-v";
import { onBeforeUnmount, onMounted, ref, useTemplateRef, watch } from "vue";
import AppHeaderLogo from "~/components/app/AppHeaderLogo.vue";
import { createHeroEntrance, heroVideoUrl, landingNavigation } from "./videoHero.config";

const menu = useTemplateRef<HTMLDetailsElement>("menu");
const video = useTemplateRef<HTMLVideoElement>("video");
const reduceMotion = useReducedMotion();
const isPaused = ref(true);
const videoFailed = ref(false);
const videoReady = ref(false);
const mounted = ref(false);

useHead({
  titleTemplate: "%s",
  link: [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" },
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" },
  ],
});

function closeMenu(restoreFocus = false) {
  if (!menu.value?.open) return;
  menu.value.open = false;
  if (restoreFocus) menu.value.querySelector("summary")?.focus();
}

onClickOutside(menu, () => closeMenu());

async function playVideo() {
  if (!video.value || videoFailed.value) return;
  try {
    await video.value.play();
  } catch {
    // 自动播放受限时保留手动播放入口，不影响页面导航。
    isPaused.value = true;
  }
}

function toggleVideo() {
  if (video.value?.paused) void playVideo();
  else video.value?.pause();
}

watch(reduceMotion, (reduced) => {
  if (reduced) video.value?.pause();
});

onMounted(() => {
  // 缓存视频可能在水合前就绪，需要补齐加载状态。
  videoReady.value = (video.value?.readyState ?? 0) >= 2;
  videoFailed.value = Boolean(video.value?.error);
  mounted.value = true;
  if (!reduceMotion.value) void playVideo();
});

onBeforeUnmount(() => video.value?.pause());
</script>

<template>
  <main class="relative isolate flex min-h-screen min-h-svh flex-col justify-between overflow-hidden bg-white font-[Inter,Arial,sans-serif] text-black selection:bg-black selection:text-white">
    <motion.nav
      aria-label="首页导航"
      v-bind="createHeroEntrance(-16, 0.8, 0, reduceMotion)"
      class="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 p-4 md:px-8 md:py-6"
    >
      <div class="flex min-w-0 items-center gap-3 md:gap-5">
        <NuxtLink to="/" aria-label="Reborn UI 首页" class="pointer-events-auto rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">
          <!-- 移动端裁切出同一字标中的 UI 徽章，桌面显示完整项目 Logo。 -->
          <AppHeaderLogo class="h-8! w-10 overflow-hidden text-black! [&_svg]:h-8 [&_svg]:max-w-none [&_svg]:shrink-0 [&_svg]:-translate-x-19 md:w-auto md:[&_svg]:translate-x-0" />
        </NuxtLink>
        <details ref="menu" class="group pointer-events-auto" @keydown.esc.stop.prevent="closeMenu(true)">
          <summary class="flex cursor-pointer list-none items-center gap-2 rounded-full bg-black p-1 pr-4 text-[11px] font-medium text-white outline-offset-4 focus-visible:outline-2 focus-visible:outline-black [&::-webkit-details-marker]:hidden">
            <span class="flex size-7 items-center justify-center rounded-full bg-white text-black md:size-8">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="size-3 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </span>
            菜单
          </summary>
          <div class="absolute inset-x-4 top-full mt-2 rounded-2xl border border-black/10 bg-white p-2 shadow-[0_12px_40px_#0000000d] md:right-auto md:left-8 md:w-80">
            <NuxtLink v-for="item in landingNavigation" :key="item.to" :to="item.to" class="flex items-center justify-between gap-5 rounded-xl px-4 py-3 transition-colors hover:bg-[#f4f4f6] focus-visible:outline-2 focus-visible:outline-black" @click="closeMenu()">
              <span><span class="block text-sm font-medium">{{ item.label }}</span><span class="mt-1 block text-xs text-black/50">{{ item.description }}</span></span>
              <UIcon name="i-lucide-arrow-up-right" class="size-4 shrink-0" />
            </NuxtLink>
          </div>
        </details>
        <div class="pointer-events-auto hidden items-center gap-4 rounded-full bg-[#f4f4f6] px-5 py-3 text-[11px] font-medium md:flex">
          <span>Web Components</span><span class="h-3 w-px bg-black/15" /><span>UniApp</span>
        </div>
      </div>
      <NuxtLink to="/components" aria-label="浏览组件总览" class="pointer-events-auto flex shrink-0 items-center gap-3 rounded-full bg-[#f4f4f6] p-1 text-[11px] font-medium outline-offset-4 focus-visible:outline-2 focus-visible:outline-black md:pr-5">
        <span class="flex size-7 items-center justify-center rounded-full bg-black text-white md:size-8">
          <svg viewBox="0 0 16 16" class="size-3.5" fill="currentColor" aria-hidden="true"><circle cx="4.5" cy="4.5" r="1.7" /><circle cx="11.5" cy="4.5" r="1.7" /><circle cx="4.5" cy="11.5" r="1.7" /><circle cx="11.5" cy="11.5" r="1.7" /></svg>
        </span>
        <span class="hidden md:inline">组件总览</span>
      </NuxtLink>
    </motion.nav>

    <!-- 视频独立于内容布局；手机保留四周留白，桌面铺满视口。 -->
    <motion.div
      aria-hidden="true"
      :initial="{ opacity: 0, transform: 'scale(1.05)' }"
      :animate="{ opacity: 1, transform: 'scale(1)' }"
      :transition="{ duration: reduceMotion ? 0 : 1.8, ease: [0.16, 1, 0.3, 1] }"
      class="pointer-events-none absolute top-[10%] left-[10%] z-0 h-[80%] w-[80%] md:inset-0 md:size-full"
    >
      <video
        ref="video"
        :src="heroVideoUrl"
        :autoplay="mounted && !reduceMotion"
        muted
        loop
        playsinline
        preload="metadata"
        tabindex="-1"
        class="size-full object-cover"
        @loadeddata="videoReady = true"
        @playing="isPaused = false; videoReady = true"
        @pause="isPaused = true"
        @error="videoFailed = true"
      />
    </motion.div>

    <button
      v-if="!videoFailed"
      type="button"
      :aria-label="isPaused ? '播放背景视频' : '暂停背景视频'"
      :disabled="!videoReady"
      class="absolute top-20 right-4 z-30 flex size-8 cursor-pointer items-center justify-center rounded-full border border-black/10 bg-white/80 text-black/60 transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black disabled:cursor-wait disabled:opacity-40 md:top-24 md:right-8"
      @click="toggleVideo"
    >
      <UIcon :name="isPaused ? 'i-lucide-play' : 'i-lucide-pause'" class="size-3" />
    </button>

    <motion.footer
      v-bind="createHeroEntrance(20, 1, 0.5, reduceMotion)"
      class="relative z-30 mt-auto flex flex-col gap-8 bg-[linear-gradient(to_top,#ffffff_0%,rgba(255,255,255,0.8)_50%,transparent_100%)] px-4 pt-32 pb-6 md:flex-row md:items-end md:justify-between md:gap-5 md:px-8 md:pt-40 md:pb-8"
    >
      <div class="min-w-0 pt-24 md:pt-0">
        <motion.p v-bind="createHeroEntrance(16, 0.8, 0.6, reduceMotion)" class="mb-5 flex items-center gap-2.5 text-[13px] text-black/55">
          <span class="size-2 shrink-0 rounded-full bg-black" />
          Reborn UI · 为 Web 与 UniApp 而构建
        </motion.p>
        <motion.h1 v-bind="createHeroEntrance(20, 0.8, 0.8, reduceMotion)" class="text-[clamp(2rem,8vw,4.5rem)] leading-none font-light tracking-[-0.03em] md:text-[clamp(2.5rem,5.5vw,4.5rem)]">
          自由构建，<br>
          不止一端。
        </motion.h1>
        <motion.div v-bind="createHeroEntrance(16, 0.8, 1, reduceMotion)">
          <p class="mt-5 max-w-md text-[13px] leading-relaxed text-black/55">按需安装的 Vue 组件，源码可控，样式自由定制。</p>
          <div class="mt-6 flex flex-wrap gap-2.5">
            <NuxtLink to="/components" class="inline-flex min-h-11 items-center justify-center rounded-full bg-black px-6 text-[13px] text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">浏览组件</NuxtLink>
            <NuxtLink to="/getting-started" class="inline-flex min-h-11 items-center justify-center rounded-full border border-black/35 px-6 text-[13px] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black">开始使用</NuxtLink>
          </div>
        </motion.div>
        <p v-if="videoFailed" role="status" class="mt-4 text-xs text-black/50">背景视频暂不可用，组件和文档仍可正常浏览。</p>
      </div>
      <div class="flex shrink-0 flex-wrap gap-2" aria-label="组件库技术栈">
        <span v-for="tag in ['Vue 3', 'TypeScript', 'Tailwind CSS']" :key="tag" class="rounded-full border border-black/12 bg-white px-4 py-2 text-[11px]">{{ tag }}</span>
      </div>
    </motion.footer>
  </main>
</template>
