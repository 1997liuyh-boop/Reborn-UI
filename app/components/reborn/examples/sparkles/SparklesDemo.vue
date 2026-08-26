<script setup lang="ts">
import { useColorMode } from "@vueuse/core";

/** 粒子颜色跟随亮暗模式 */
const particlesColor = computed(() => (useColorMode().value === "dark" ? "#FFFFFF" : "#000000"));
</script>

<template>
  <DemoSection
    title="基础用法"
    description="粒子舞台是效果本身的一部分；径向遮罩用画布同色淡出边缘。"
  >
    <!-- 粒子遮罩需要跟画布同色，外层不再另铺填充 -->
    <div class="flex h-[28rem] w-full flex-col items-center justify-center overflow-hidden">
      <h1 class="text-highlighted relative z-20 text-center text-3xl font-bold md:text-7xl">
        Reborn UI
      </h1>
      <div class="relative h-40 w-[40rem] max-w-full">
        <div class="absolute inset-x-20 top-0 h-[2px] w-3/4 bg-linear-to-r from-transparent via-indigo-500 to-transparent blur-sm" />
        <div class="absolute inset-x-20 top-0 h-px w-3/4 bg-linear-to-r from-transparent via-indigo-500 to-transparent" />
        <div class="absolute inset-x-60 top-0 h-[5px] w-1/4 bg-linear-to-r from-transparent via-sky-500 to-transparent blur-sm" />
        <div class="absolute inset-x-60 top-0 h-px w-1/4 bg-linear-to-r from-transparent via-sky-500 to-transparent" />

        <Sparkles
          background="transparent"
          :min-size="0.4"
          :max-size="1.4"
          :particle-density="1200"
          class="size-full"
          :particle-color="particlesColor"
        />

        <div class="bg-default absolute inset-0 size-full [mask-image:radial-gradient(350px_200px_at_top,transparent_20%,white)]" />
      </div>
    </div>
  </DemoSection>
</template>
