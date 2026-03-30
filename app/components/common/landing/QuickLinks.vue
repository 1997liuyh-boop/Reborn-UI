<script lang="ts" setup>
const links = [
  {
    icon: "tabler:rocket",
    eyebrow: "Get Started",
    title: "快速开始",
    description: "先了解 Reborn UI 的核心理念、目录组织和最短上手路径。",
    to: "/getting-started",
    glowClass: "from-[#ff3d58]/18 via-[#ff3d58]/6 to-transparent",
    iconClass: "bg-[linear-gradient(135deg,rgba(255,61,88,0.2),rgba(255,61,88,0.08))] text-[var(--color-primary)]",
  },
  {
    icon: "tabler:play",
    eyebrow: "Install",
    title: "安装接入",
    description: "查看依赖、初始化方式和与你当前项目最匹配的接入流程。",
    to: "/getting-started/installation",
    glowClass: "from-[#5b6bff]/18 via-[#7c3aed]/8 to-transparent",
    iconClass: "bg-[linear-gradient(135deg,rgba(91,107,255,0.18),rgba(124,58,237,0.08))] text-[#5b6bff] dark:text-[#93a2ff]",
  },
  {
    icon: "tabler:components",
    eyebrow: "Explore",
    title: "组件总览",
    description: "直接浏览组件、示例和 API，快速判断哪些能力可以立刻复用。",
    to: "/components",
    glowClass: "from-[#22c1c3]/18 via-[#5b6bff]/6 to-transparent",
    iconClass: "bg-[linear-gradient(135deg,rgba(34,193,195,0.18),rgba(91,107,255,0.08))] text-[#188d9a] dark:text-[#7ae9ef]",
  },
];
</script>

<template>
  <UPageSection
    id="quickLinks"
    title="快速链接"
    description="从这里直接进入最常用的入口，延续首页的玻璃质感与品牌红视觉重心。"
  >
    <div class="grid gap-5 md:grid-cols-3">
      <NuxtLink
        v-for="link in links"
        :key="link.to"
        :to="link.to"
        class="group relative overflow-hidden rounded-[28px] border border-white/50 bg-white/42 p-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] ring-1 ring-white/65 backdrop-blur-2xl transition-all duration-300 hover:-translate-y-1 hover:border-white/70 hover:bg-white/56 hover:shadow-[0_28px_80px_rgba(255,61,88,0.14)] dark:border-white/12 dark:bg-white/[0.06] dark:ring-white/8 dark:hover:bg-white/[0.09] dark:hover:shadow-[0_28px_80px_rgba(0,0,0,0.32)]"
      >
        <div class="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/95 to-transparent dark:via-white/60" />
        <div class="absolute -top-10 right-[-1.5rem] h-28 w-28 rounded-full bg-gradient-to-br blur-3xl transition-transform duration-500 group-hover:scale-110" :class="link.glowClass" />

        <div class="relative z-10 flex h-full flex-col">
          <div class="flex items-start justify-between gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/55 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl dark:border-white/12 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" :class="link.iconClass">
              <Icon :name="link.icon" class="h-5 w-5" />
            </div>
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
            <span class="font-mono text-xs tracking-wide">{{ link.to }}</span>
          </div>
        </div>
      </NuxtLink>
    </div>
  </UPageSection>
</template>
