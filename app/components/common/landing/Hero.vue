<script lang="ts" setup>
const componentPath = computed(() => `/components`);

const toast = useToast();

const handlePremiumClick = () => {
  toast.add({ title: '我哪里不专业了你还要去找更专业的' });
};
</script>

<template>
  <div class="relative flex h-full min-h-[75vh] w-full flex-col items-center justify-center gap-4 p-8 max-lg:p-6">
    <div class="flex max-w-4xl flex-col items-center justify-center gap-6 py-24">
      <h1
        class="pointer-events-none my-8 bg-gradient-to-b from-black to-gray-500 bg-clip-text text-center text-6xl leading-none font-bold tracking-tight text-pretty whitespace-pre-wrap text-transparent max-md:text-5xl dark:from-white dark:to-gray-50/40">
        使用 Vue 和 Nuxt 构建精美网站
      </h1>
      <span class="text-muted text-center text-2xl font-normal max-lg:text-xl">
        Reborn UI 是一个由可复用的动画组件构成的集合，由
        <NuxtLink href="https://tailwindcss.com/" target="_blank" class="text-primary">
          TailwindCSS
        </NuxtLink>
        、
        <NuxtLink href="https://motion.dev/docs/vue" target="_blank" class="text-primary">
          motion-v
        </NuxtLink>
        、
        <NuxtLink href="https://gsap.com/" target="_blank" class="text-primary">
          GSAP
        </NuxtLink>
        和
        <NuxtLink href="https://threejs.org/" target="_blank" class="text-primary">
          threejs
        </NuxtLink>
        驱动，旨在帮助您更好更快地交付。
      </span>
      <span class="text-muted text-center text-2xl font-normal max-lg:text-xl">
        无论您是在启动新项目还是完善现有项目，这里都是完美的起点。
      </span>
      <div class="flex items-center justify-center gap-4">
        <NuxtLink :href="componentPath">
          <reborn-button size="xl" variant="outline">组件库</reborn-button>
        </NuxtLink>
        <reborn-button size="xl" @click="handlePremiumClick">获取专业版</reborn-button>
      </div>
    </div>
  </div>
</template>
