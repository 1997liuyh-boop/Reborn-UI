<script setup lang="ts">
import { useColorMode } from "#imports";
import { computed } from "vue";
import Sparkles from "~/components/reborn/ui/sparkles/Sparkles.vue";

/** 在 setup 顶层读取站点主题，监听跟随组件作用域。 */
const colorMode = useColorMode();
/** 粒子颜色跟随亮暗模式 */
const particlesColor = computed(() => (colorMode.value === "dark" ? "#FFFFFF" : "#000000"));
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
