<script lang="ts" setup>
const appConfig = useAppConfig();
const toast = useToast();

/** 安装命令（与安装文档一致） */
const installCommand = "npx reborn-ui@latest init";

const githubUrl = computed(() => (appConfig.github as { url?: string } | undefined)?.url || "https://github.com");

async function copyInstallCommand() {
  try {
    await navigator.clipboard.writeText(installCommand);
    toast.add({ title: "已复制安装命令", description: installCommand });
  } catch {
    toast.add({ title: "复制失败，请手动复制", description: installCommand, color: "error" });
  }
}
</script>

<template>
  <section
    class="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pt-16 pb-8 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:gap-8 lg:px-10">
    <!-- 左侧：标题 / 副标题 / 描述 / 按钮 / 安装命令 -->
    <div class="relative flex flex-col items-start gap-6">
      <h1
        class="text-balance bg-gradient-to-r from-[#1B6DFA] via-[#6d5cf6] to-[#a855f7] bg-clip-text text-6xl font-black tracking-[-0.04em] text-transparent sm:text-7xl lg:text-[5.5rem] lg:leading-[1.05]">
        REBORN-UI
      </h1>
      <p class="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-white">
        重新定义你的界面体验
      </p>
      <p class="max-w-xl text-base leading-8 text-zinc-600 sm:text-lg dark:text-white/65">
        一个现代化、跨端的 Vue 组件库：Web 与 uniapp 共用同一套 API。
        <br>
        让开发更高效，让设计更自由。
      </p>

      <div class="flex flex-wrap items-center gap-3 pt-2">
        <NuxtLink to="/getting-started">
          <RebornButton size="lg"
            class="min-w-36 bg-gradient-to-r from-[#1B6DFA] to-[#8b5cf6] text-white shadow-[0_16px_40px_rgba(109,92,246,0.45)] hover:from-[#3b82f6] hover:to-[#a78bfa]">
            开始使用
            <template #trailing>
              <Icon name="lucide:arrow-right" class="size-4" />
            </template>
          </RebornButton>
        </NuxtLink>
        <NuxtLink :to="githubUrl" target="_blank" rel="noreferrer">
          <RebornButton size="lg" variant="outlined" color="neutral"
            class="min-w-44 border-zinc-300 bg-white/60 text-zinc-800 backdrop-blur-xl hover:bg-white dark:border-white/15 dark:bg-white/[0.04] dark:text-white dark:hover:bg-white/[0.08]">
            在 GitHub 上查看
            <template #trailing>
              <Icon name="simple-icons:github" class="size-4" />
            </template>
          </RebornButton>
        </NuxtLink>
      </div>

      <!-- 安装命令 -->
      <button type="button"
        class="group mt-2 flex w-full max-w-md items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white/70 px-4 py-3 text-left font-mono text-sm text-zinc-700 backdrop-blur-xl transition-colors hover:border-[#8b5cf6]/50 dark:border-white/10 dark:bg-white/[0.04] dark:text-white/80 dark:hover:border-[#8b5cf6]/60"
        @click="copyInstallCommand">
        <span class="flex items-center gap-3">
          <span class="text-[#8b5cf6]">$</span>
          <span>{{ installCommand }}</span>
        </span>
        <Icon name="lucide:copy"
          class="size-4 shrink-0 text-zinc-400 transition-colors group-hover:text-[#8b5cf6] dark:text-white/40" />
      </button>
    </div>

    <!-- 右侧：悬浮的品牌标志（玻璃球 + 轨道环 + 基座） -->
    <div class="relative mx-auto flex h-[26rem] w-full max-w-[30rem] items-center justify-center lg:h-[34rem]">
      <!-- 轨道环 -->
      <div
        class="hero-ring absolute h-[22rem] w-[22rem] rounded-full border border-[#8b5cf6]/40 lg:h-[27rem] lg:w-[27rem]" />
      <div
        class="hero-ring-2 absolute h-[26rem] w-[26rem] rounded-full border border-[#1B6DFA]/25 lg:h-[32rem] lg:w-[32rem]" />

      <!-- 玻璃球 -->
      <div
        class="hero-float relative flex h-64 w-64 items-center justify-center rounded-full border border-white/20 bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.28)_0%,rgba(139,92,246,0.18)_35%,rgba(27,109,250,0.12)_60%,rgba(10,6,22,0.4)_100%)] shadow-[0_0_80px_rgba(139,92,246,0.45),inset_0_0_60px_rgba(255,255,255,0.08)] backdrop-blur-xl lg:h-80 lg:w-80">
        <svg viewBox="0 0 64 64" class="h-32 w-32 drop-shadow-[0_18px_30px_rgba(109,92,246,0.55)] lg:h-40 lg:w-40"
          role="img" aria-label="Reborn UI">
          <defs>
            <linearGradient id="hero-logo-gradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stop-color="#c4b5fd" />
              <stop offset="50%" stop-color="#8b5cf6" />
              <stop offset="100%" stop-color="#1B6DFA" />
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="52" height="52" rx="12" stroke="url(#hero-logo-gradient)" stroke-width="3.5"
            fill="none" />
          <g fill="url(#hero-logo-gradient)">
            <rect x="18" y="18" width="12" height="12" rx="2.5" />
            <rect x="34" y="18" width="12" height="12" rx="2.5" opacity="0.45" />
            <rect x="18" y="34" width="12" height="12" rx="2.5" opacity="0.45" />
            <rect x="34" y="34" width="12" height="12" rx="2.5" />
          </g>
        </svg>
      </div>

      <!-- 漂浮的小方块 -->
      <div
        class="hero-cube absolute top-10 left-8 h-5 w-5 rotate-12 rounded-md bg-gradient-to-br from-[#a78bfa] to-[#6d5cf6] opacity-80 shadow-[0_0_20px_rgba(139,92,246,0.6)]" />
      <div
        class="hero-cube-2 absolute right-6 bottom-24 h-7 w-7 -rotate-6 rounded-md bg-gradient-to-br from-[#93c5fd] to-[#1B6DFA] opacity-70 shadow-[0_0_24px_rgba(27,109,250,0.6)]" />
      <div class="hero-cube absolute top-32 right-2 h-3 w-3 rotate-45 rounded-sm bg-[#c4b5fd] opacity-70" />

      <!-- 基座 -->
      <div
        class="absolute bottom-6 h-10 w-64 rounded-[100%] border border-[#8b5cf6]/40 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.45)_0%,rgba(27,109,250,0.15)_50%,transparent_75%)] blur-[1px] lg:w-80" />
      <div
        class="absolute bottom-2 h-6 w-48 rounded-[100%] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.6)_0%,transparent_70%)] blur-md lg:w-60" />
    </div>
  </section>
</template>

<style scoped>
.hero-float {
  animation: hero-float 6s ease-in-out infinite;
}

.hero-ring {
  transform: rotateX(70deg);
  animation: hero-ring 18s linear infinite;
}

.hero-ring-2 {
  transform: rotateX(70deg) rotateZ(30deg);
  animation: hero-ring 26s linear infinite reverse;
}

.hero-cube {
  animation: hero-cube 7s ease-in-out infinite;
}

.hero-cube-2 {
  animation: hero-cube 9s ease-in-out infinite 1.5s;
}

@keyframes hero-float {

  0%,
  100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-14px);
  }
}

@keyframes hero-ring {
  from {
    transform: rotateX(70deg) rotateZ(0deg);
  }

  to {
    transform: rotateX(70deg) rotateZ(360deg);
  }
}

@keyframes hero-cube {

  0%,
  100% {
    transform: translateY(0) rotate(12deg);
  }

  50% {
    transform: translateY(-18px) rotate(24deg);
  }
}
</style>
