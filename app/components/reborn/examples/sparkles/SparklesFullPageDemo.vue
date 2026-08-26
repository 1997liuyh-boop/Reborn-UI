<script setup lang="ts">
import { useColorMode } from "@vueuse/core";

/** 粒子颜色跟随亮暗模式 */
const particlesColor = computed(() => (useColorMode().value === "dark" ? "#FFFFFF" : "#000000"));
</script>

<template>
  <div class="relative flex h-[28rem] w-full flex-col items-center justify-center overflow-hidden">
    <div class="absolute inset-0 w-full">
      <Sparkles
        background="transparent"
        :min-size="0.8"
        :max-size="2"
        :particle-density="800"
        class="size-full"
        :particle-color="particlesColor"
      />
    </div>
    <h1 class="text-highlighted relative z-20 text-center text-3xl font-bold md:text-6xl">
      做出好产品
    </h1>
  </div>
</template>
