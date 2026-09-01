<script lang="ts" setup>
import LiquidGlass from "~/components/reborn/ui/liquid-glass/LiquidGlass.vue";

const componentPath = "/components";

const toast = useToast();

const links = [
  {
    icon: "tabler:rocket",
    eyebrow: "Get Started",
    title: "快速开始",
    description: "先了解 Reborn UI 的核心理念、目录组织和最短上手路径。",
    to: "/getting-started",
    glowClass: "from-[#ff3d58]/18 via-[#ff3d58]/6 to-transparent",
    iconClass: "text-[var(--color-primary)]",
    iconGlassClass: "bg-[linear-gradient(135deg,rgba(255,61,88,0.16),rgba(255,61,88,0.07))]",
  },
  {
    icon: "tabler:play",
    eyebrow: "Install",
    title: "安装接入",
    description: "查看依赖、初始化方式和与你当前项目最匹配的接入流程。",
    to: "/getting-started/installation",
    glowClass: "from-[#5b6bff]/18 via-[#7c3aed]/8 to-transparent",
    iconClass: "text-[#5b6bff] dark:text-[#93a2ff]",
    iconGlassClass: "bg-[linear-gradient(135deg,rgba(91,107,255,0.16),rgba(124,58,237,0.07))]",
  },
  {
    icon: "tabler:components",
    eyebrow: "Explore",
    title: "组件总览",
    description: "直接浏览组件、示例和 API，快速判断哪些能力可以立刻复用。",
    to: "/components",
    glowClass: "from-[#22c1c3]/18 via-[#5b6bff]/6 to-transparent",
    iconClass: "text-[#188d9a] dark:text-[#7ae9ef]",
    iconGlassClass: "bg-[linear-gradient(135deg,rgba(34,193,195,0.16),rgba(91,107,255,0.07))]",
  },
] as const;

const handlePremiumClick = () => {
  toast.add({ title: "这里已经很专业了，先把组件用起来吧。" });
};
</script>

<template>
  <section class="relative mx-auto flex min-h-[82vh] w-full max-w-7xl items-center justify-center px-6 py-16 sm:px-8 lg:px-10">
    <div class="relative flex w-full flex-col items-center gap-10 text-center lg:gap-14">
      <div class="absolute top-14 left-1/2 -z-10 h-52 w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,_rgba(255,61,88,0.18)_0%,_transparent_70%)] blur-3xl" />

      <LiquidGlass
        position="relative"
        container-class="inline-block rounded-full"
        class="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold tracking-[0.22em] text-[var(--color-primary)] uppercase dark:text-white/90"
        :radius="999"
        :border="0.08"
        :lightness="68"
        :alpha="0.66"
        :blur="12"
        :frost="0.08"
        :displace="8"
        :scale="-130"
      >
        <span class="h-2 w-2 rounded-full bg-[var(--color-primary)] shadow-[0_0_18px_rgba(255,61,88,0.9)]" />
        Reborn UI
      </LiquidGlass>

      <div class="flex max-w-4xl flex-col items-center gap-5">
        <h1 class="text-balance text-5xl font-black tracking-[-0.05em] text-zinc-950 sm:text-6xl lg:text-7xl dark:text-white">
          用 Vue 与 Nuxt 构建更有质感的动效界面
        </h1>
        <p class="max-w-3xl text-lg leading-8 text-zinc-600 sm:text-xl dark:text-white/70">
          Reborn UI 把
          <NuxtLink to="https://tailwindcss.com/" target="_blank" rel="noreferrer" class="font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-75">
            Tailwind CSS
          </NuxtLink>
          、
          <NuxtLink to="https://motion.dev/docs/vue" target="_blank" rel="noreferrer" class="font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-75">
            motion-v
          </NuxtLink>
          、
          <NuxtLink to="https://gsap.com/" target="_blank" rel="noreferrer" class="font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-75">
            GSAP
          </NuxtLink>
          和
          <NuxtLink to="https://threejs.org/" target="_blank" rel="noreferrer" class="font-semibold text-[var(--color-primary)] transition-opacity hover:opacity-75">
            Three.js
          </NuxtLink>
          组织成可复用的组件系统，帮助你更快交付带高级感的页面。
        </p>
        <p class="max-w-2xl text-base leading-7 text-zinc-500 dark:text-white/55">
          无论你是在启动新项目，还是给已有产品补上更细致的视觉表达，这里都能直接接上你的开发节奏。
        </p>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-3">
        <NuxtLink :to="componentPath">
          <RebornButton size="lg" class="min-w-40 shadow-[0_18px_44px_rgba(255,61,88,0.24)]">
            浏览组件
          </RebornButton>
        </NuxtLink>
        <RebornButton
          size="lg"
          variant="outlined"
          class="min-w-40 border-white/70 bg-white/35 text-zinc-900 backdrop-blur-xl hover:bg-white/55 dark:border-white/14 dark:bg-white/6 dark:text-white dark:hover:bg-white/10"
          @click="handlePremiumClick"
        >
          获取专业版
        </RebornButton>
      </div>

      <div class="grid w-full gap-5 pt-2 md:grid-cols-3">
        <NuxtLink
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="group relative overflow-hidden rounded-[28px] border border-white/50 bg-white/42 p-5 text-left shadow-[0_22px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/65 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/70 hover:bg-white/56 hover:shadow-[0_28px_80px_rgba(255,61,88,0.14)] dark:border-white/12 dark:bg-white/[0.06] dark:ring-white/8 dark:hover:bg-white/[0.09] dark:hover:shadow-[0_28px_80px_rgba(0,0,0,0.32)]"
        >
          <div class="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent dark:via-white/60" />
          <div class="absolute -top-10 right-[-1.5rem] h-28 w-28 rounded-full bg-gradient-to-br blur-3xl transition-transform duration-500 group-hover:scale-110" :class="link.glowClass" />

          <div class="relative z-10 flex h-full flex-col">
            <div class="flex items-start justify-between gap-3">
              <LiquidGlass
                position="relative"
                container-class="h-12 w-12 rounded-2xl shrink-0"
                class="flex h-full w-full items-center justify-center rounded-2xl border border-white/35 dark:border-white/10"
                :radius="18"
                :border="0.09"
                :lightness="64"
                :alpha="0.62"
                :blur="10"
                :frost="0.08"
                :displace="7"
                :scale="-120"
              >
                <div class="flex h-full w-full items-center justify-center rounded-2xl" :class="[link.iconClass, link.iconGlassClass]">
                  <Icon :name="link.icon" class="h-5 w-5" />
                </div>
              </LiquidGlass>

              <div class="flex h-9 w-9 items-center justify-center rounded-full border border-white/55 bg-white/55 text-zinc-500 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)] dark:border-white/12 dark:bg-white/[0.06] dark:text-white/55">
                <Icon name="tabler:arrow-up-right" class="h-4 w-4" />
              </div>
            </div>

            <div class="mt-6 flex flex-1 flex-col">
              <div class="text-[11px] font-semibold tracking-[0.22em] text-zinc-400 uppercase dark:text-white/35">
                {{ link.eyebrow }}
              </div>
              <h3 class="mt-3 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">
                {{ link.title }}
              </h3>
              <p class="mt-3 text-sm leading-7 text-zinc-600 dark:text-white/65">
                {{ link.description }}
              </p>
            </div>

            <div class="mt-6 flex items-center justify-between border-t border-white/45 pt-4 text-sm text-zinc-500 dark:border-white/10 dark:text-white/45">
              <span>立即进入</span>
              <LiquidGlass
                position="relative"
                container-class="inline-block rounded-full"
                class="px-3 py-1 text-[11px] font-mono tracking-wide text-zinc-600 dark:text-white/70"
                :radius="999"
                :border="0.08"
                :lightness="66"
                :alpha="0.6"
                :blur="10"
                :frost="0.07"
                :displace="6"
                :scale="-110"
              >
                {{ link.to }}
              </LiquidGlass>
            </div>
          </div>
        </NuxtLink>
      </div>
    </div>
  </section>
</template>
