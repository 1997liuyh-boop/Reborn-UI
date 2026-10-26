<script lang="ts" setup>
const appConfig = useAppConfig();
const githubUrl = computed(() => (appConfig.github as { url?: string } | undefined)?.url || "https://github.com");

/** 页脚链接：全部指向站内真实路由 */
const columns = [
  {
    title: "文档",
    links: [
      { label: "快速开始", to: "/getting-started" },
      { label: "安装指南", to: "/getting-started/installation" },
      { label: "主题配置", to: "/getting-started/configuration" },
      { label: "更新日志", to: "/changelogs" },
    ],
  },
  {
    title: "组件",
    links: [
      { label: "组件总览", to: "/components" },
      { label: "在线 Playground", to: "/playground" },
      { label: "Composables", to: "/composables" },
    ],
  },
  {
    title: "资源",
    links: [
      { label: "示例规范", to: "/getting-started/demo-guidelines" },
      { label: "Tailwind 4 接入", to: "/getting-started/tailwind4" },
      { label: "Tailwind 3 接入", to: "/getting-started/tailwind3" },
    ],
  },
] as const;

const year = new Date().getFullYear();
</script>

<template>
  <!-- 页脚铺满屏幕宽度（描边与底色到边），内容用 max-w 约束居中 -->
  <footer class="w-full border-t border-zinc-200/80 bg-white/40 backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.02]">
    <div class="mx-auto grid max-w-7xl gap-10 px-6 pt-12 pb-10 sm:px-8 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-10">
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-white">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1B6DFA] to-[#8b5cf6] text-white">
            <Icon name="lucide:layout-grid" class="size-4" />
          </span>
          Reborn UI
        </div>
        <p class="max-w-xs text-sm leading-7 text-zinc-600 dark:text-white/55">
          一个现代化、跨端的 Vue 组件库，Web 与 uniapp 同一套 API。让开发更高效，让设计更自由。
        </p>
        <div class="flex items-center gap-3">
          <NuxtLink :to="githubUrl" target="_blank" rel="noreferrer" aria-label="GitHub" class="text-zinc-500 transition-colors hover:text-[#6d5cf6] dark:text-white/50 dark:hover:text-[#c4b5fd]">
            <Icon name="simple-icons:github" class="size-5" />
          </NuxtLink>
          <NuxtLink to="/changelogs" aria-label="更新日志" class="text-zinc-500 transition-colors hover:text-[#6d5cf6] dark:text-white/50 dark:hover:text-[#c4b5fd]">
            <Icon name="lucide:file-text" class="size-5" />
          </NuxtLink>
        </div>
      </div>

      <div v-for="column in columns" :key="column.title" class="flex flex-col gap-3">
        <h4 class="text-sm font-semibold text-zinc-900 dark:text-white">
          {{ column.title }}
        </h4>
        <NuxtLink
          v-for="link in column.links"
          :key="link.to"
          :to="link.to"
          class="text-sm text-zinc-600 transition-colors hover:text-[#6d5cf6] dark:text-white/55 dark:hover:text-[#c4b5fd]"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </div>

    <div class="border-t border-zinc-200/80 dark:border-white/10">
      <p class="mx-auto max-w-7xl px-6 py-5 text-center text-sm text-zinc-500 sm:px-8 lg:px-10 dark:text-white/40">
        © {{ year }} Reborn UI. Be yourself.
      </p>
    </div>
  </footer>
</template>
