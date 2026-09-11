<script setup lang="ts">
import { useHead } from "#imports";
import { onClickOutside, useMediaQuery } from "@vueuse/core";
import { motion } from "motion-v";
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";
import AppHeaderLogo from "~/components/app/AppHeaderLogo.vue";
import MultipleAnimationScene from "./MultipleAnimationScene.vue";
import { installCommand } from "./retargetingHero.config";
import RetargetingScene from "./RetargetingScene.vue";
import { createHeroEntrance, landingNavigation } from "./videoHero.config";

// 首屏保持一致，水合后再应用系统的减少动态效果偏好。
const hydrated = ref(false);
const desktop = useMediaQuery("(min-width: 768px)");
const preference = useMediaQuery("(prefers-reduced-motion: reduce)");
const reduced = computed(() => hydrated.value && preference.value);
const menu = useTemplateRef<HTMLDetailsElement>("menu");
const paused = ref(false);
const menuOpen = ref(false);
const sceneStatus = ref("loading");
const sceneError = ref("");
const sceneVersion = ref(0);
const compatibility = ref(false);
const copyStatus = ref("");
const animationPaused = computed(() => paused.value || reduced.value || menuOpen.value);
let copyTimer: ReturnType<typeof setTimeout> | undefined;

useHead({ titleTemplate: "%s", link: [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossorigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap" },
] });

function closeMenu(restoreFocus = false) {
  if (menu.value) menu.value.open = false;
  menuOpen.value = false;
  if (restoreFocus) menu.value?.querySelector("summary")?.focus();
}
function updateMenu() { menuOpen.value = Boolean(menu.value?.open); }
function retryScene(useCompatibility = false) {
  compatibility.value = useCompatibility;
  sceneStatus.value = "loading";
  sceneError.value = "";
  sceneVersion.value += 1;
}
async function copyInstall() {
  clearTimeout(copyTimer);
  try {
    await navigator.clipboard.writeText(installCommand);
    copyStatus.value = "安装命令已复制";
  } catch { copyStatus.value = "复制失败，请手动选择安装命令"; }
  copyTimer = setTimeout(() => { copyStatus.value = ""; }, 4000);
}
onClickOutside(menu, () => closeMenu());
onMounted(() => { hydrated.value = true; });
onBeforeUnmount(() => { clearTimeout(copyTimer); });
</script>

<template>
  <main class="relative isolate flex min-h-screen min-h-svh flex-col justify-between overflow-hidden bg-white font-[Inter,Arial,sans-serif] text-black selection:bg-black selection:text-white">
    <motion.nav aria-label="首页导航" v-bind="createHeroEntrance(-16, 0.8, 0, reduced)" class="pointer-events-none fixed inset-x-0 top-0 z-50 flex items-center justify-between gap-3 p-4 md:px-8 md:py-6">
      <div class="flex min-w-0 items-center gap-3 md:gap-5">
        <NuxtLink to="/" aria-label="Reborn UI 首页" class="pointer-events-auto rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4">
          <!-- 手机沿用原 Logo 的 UI 徽章，桌面展示完整字标。 -->
          <AppHeaderLogo class="h-8! w-10 overflow-hidden text-black! [&_svg]:h-8 [&_svg]:max-w-none [&_svg]:shrink-0 [&_svg]:-translate-x-19 md:w-auto md:[&_svg]:translate-x-0" />
        </NuxtLink>
        <details ref="menu" class="group pointer-events-auto" @toggle="updateMenu" @keydown.esc.stop.prevent="closeMenu(true)">
          <summary class="flex cursor-pointer list-none items-center gap-2 rounded-full bg-black p-1 pr-4 text-[11px] font-medium text-white outline-offset-4 focus-visible:outline-2 [&::-webkit-details-marker]:hidden">
            <span class="flex size-7 items-center justify-center rounded-full bg-white text-black md:size-8">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" class="size-3 transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            </span>
            菜单
          </summary>
          <div class="absolute inset-x-4 top-full mt-2 max-h-[75svh] overflow-y-auto rounded-2xl border border-black/10 bg-white p-2 shadow-[0_12px_40px_#0000000d] md:right-auto md:left-8 md:w-80">
            <NuxtLink v-for="item in landingNavigation" :key="item.to" :to="item.to" class="flex items-center justify-between gap-5 rounded-xl px-4 py-3 transition-colors hover:bg-[#f4f4f6] focus-visible:outline-2" @click="closeMenu()">
              <span><span class="block text-sm font-medium">{{ item.label }}</span><span class="mt-1 block text-xs text-black/50">{{ item.description }}</span></span>
              <span aria-hidden="true" class="icon-[lucide--arrow-up-right] size-4 shrink-0" />
            </NuxtLink>
          </div>
        </details>
        <div class="pointer-events-auto hidden items-center gap-4 rounded-full bg-[#f4f4f6] px-5 py-3 text-[11px] font-medium md:flex">
          <span>Web Components</span><span class="h-3 w-px bg-black/15" /><span>UniApp</span>
        </div>
      </div>
      <NuxtLink to="/components" aria-label="浏览组件总览" class="pointer-events-auto flex shrink-0 items-center gap-3 rounded-full bg-[#f4f4f6] p-1 text-[11px] font-medium outline-offset-4 focus-visible:outline-2 md:pr-5">
        <span class="flex size-7 items-center justify-center rounded-full bg-black text-white md:size-8">
          <svg viewBox="0 0 16 16" class="size-3.5" fill="currentColor" aria-hidden="true"><circle cx="4.5" cy="4.5" r="1.7" /><circle cx="11.5" cy="4.5" r="1.7" /><circle cx="4.5" cy="11.5" r="1.7" /><circle cx="11.5" cy="11.5" r="1.7" /></svg>
        </span>
        <span class="hidden md:inline">组件总览</span>
      </NuxtLink>
    </motion.nav>

    <!-- 保留真实双角色动画；小屏只显示主舞台，桌面向右下偏移。 -->
    <motion.div aria-hidden="true" :initial="{ opacity: 0, transform: 'scale(1.05)' }" :animate="{ opacity: 1, transform: 'scale(1)' }" :transition="{ duration: reduced ? 0 : 1.8, ease: [0.16, 1, 0.3, 1] }" class="pointer-events-none absolute top-32 left-[10%] z-0 h-96 w-full md:top-[6%] md:left-[8%] md:size-full md:[mask-image:linear-gradient(to_right,transparent,black_12%)]">
      <RetargetingScene :key="sceneVersion" :paused="animationPaused" :compatibility="compatibility" class="absolute inset-0" @status="sceneStatus = $event" @error="sceneError = $event" />
    </motion.div>

    <div class="absolute top-20 right-4 z-45 flex max-w-[calc(100%-2rem)] flex-col items-end gap-2 md:top-24 md:right-8">
      <div class="flex items-center gap-2 rounded-full bg-white/85 py-1 pr-1 pl-3 text-[10px] text-black/55">
        <span role="status" class="sr-only md:not-sr-only">{{ sceneStatus === 'loading' ? '正在加载 3D 场景…' : sceneStatus === 'error' ? '3D 场景未能显示' : compatibility ? 'Three.js · 兼容模式' : 'Three.js · 实时动画' }}</span>
        <button type="button" :aria-label="paused ? '继续动画' : '暂停动画'" :aria-pressed="paused" :disabled="reduced" class="flex size-8 items-center justify-center rounded-full border border-black/10 text-black transition-colors hover:bg-black/5 focus-visible:outline-2 disabled:opacity-40" @click="paused = !paused">
          <span aria-hidden="true" :class="animationPaused ? 'icon-[lucide--play]' : 'icon-[lucide--pause]'" class="size-3" />
        </button>
      </div>
      <span v-if="reduced" class="sr-only text-[10px] text-black/50 md:not-sr-only">已按系统偏好减少动态效果</span>
      <div v-if="sceneStatus === 'error'" class="max-w-xs rounded-2xl border border-black/10 bg-white/95 p-4 text-xs leading-relaxed shadow-sm">
        <p role="alert">{{ sceneError }} 文档与组件入口仍可使用。</p>
        <div class="mt-3 flex flex-wrap gap-3">
          <button type="button" class="min-h-9 rounded-full bg-black px-4 text-white focus-visible:outline-2 focus-visible:outline-offset-2" @click="retryScene()">重新加载</button>
          <button type="button" class="min-h-9 rounded-full border border-black/20 px-4 focus-visible:outline-2" @click="retryScene(true)">使用兼容模式</button>
        </div>
      </div>
    </div>

    <!-- 移动端不挂载小舞台，隐藏时一并释放模型和动画循环。 -->
    <div v-if="hydrated && desktop" class="absolute top-24 left-8 z-40 hidden h-[min(36vh,20rem)] w-[56vw] max-w-200 md:block">
      <MultipleAnimationScene :paused="animationPaused" />
    </div>

    <motion.footer v-bind="createHeroEntrance(20, 1, 0.5, reduced)" class="relative z-30 mt-auto flex flex-col gap-6 bg-[linear-gradient(to_top,#ffffff_0%,rgba(255,255,255,0.8)_50%,transparent_100%)] px-4 pt-16 pb-6 md:flex-row md:items-end md:justify-between md:gap-5 md:px-8 md:pt-40 md:pb-8">
      <div class="min-w-0 pt-64 md:pt-0">
        <motion.p v-bind="createHeroEntrance(16, 0.8, 0.6, reduced)" class="mb-5 flex items-center gap-2.5 text-[13px] text-black/55">
          <span class="size-2 shrink-0 rounded-full bg-black" />Reborn UI · 为 Web 与 UniApp 而构建
        </motion.p>
        <motion.h1 v-bind="createHeroEntrance(20, 0.8, 0.8, reduced)" class="text-[clamp(2rem,8vw,4.5rem)] leading-none font-light tracking-[-0.03em] md:text-[clamp(2.5rem,5.5vw,4.5rem)]">自由构建，<br>不止一端。</motion.h1>
        <motion.div v-bind="createHeroEntrance(16, 0.8, 1, reduced)">
          <p class="mt-5 max-w-md text-[13px] leading-relaxed text-black/55">按需安装的 Vue 组件，源码可控，样式自由定制。</p>
          <div class="mt-6 flex flex-wrap gap-2.5">
            <NuxtLink to="/components" class="inline-flex min-h-11 items-center justify-center rounded-full bg-black px-6 text-[13px] text-white transition-colors hover:bg-black/80 focus-visible:outline-2 focus-visible:outline-offset-4">浏览组件</NuxtLink>
            <NuxtLink to="/getting-started" class="inline-flex min-h-11 items-center justify-center rounded-full border border-black/35 px-6 text-[13px] transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-4">开始使用</NuxtLink>
          </div>
          <button type="button" class="mt-3 inline-flex min-h-9 items-center gap-2 text-[11px] text-black/55 transition-colors hover:text-black focus-visible:outline-2 focus-visible:outline-offset-2" @click="copyInstall"><span aria-hidden="true" class="icon-[lucide--copy] size-3" />{{ installCommand }}</button>
          <span role="status" class="ml-2 text-[11px] text-black/60">{{ copyStatus }}</span>
        </motion.div>
      </div>
      <div class="flex shrink-0 flex-wrap gap-2" aria-label="组件库技术栈"><span v-for="tag in ['Vue 3', 'TypeScript', 'Tailwind CSS']" :key="tag" class="rounded-full border border-black/12 bg-white px-4 py-2 text-[11px]">{{ tag }}</span></div>
    </motion.footer>
  </main>
</template>




