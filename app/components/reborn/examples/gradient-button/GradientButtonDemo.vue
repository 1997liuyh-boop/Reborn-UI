<script lang="ts" setup>
import { useColorMode } from "@vueuse/core";
import { computed } from "vue";

// 须在 setup 顶层调用：放进 computed 里会在 setup 之外注册生命周期钩子，触发 Vue 警告
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value == "dark");
const bgColor = computed(() => (isDark.value ? "#000" : "#fff"));
</script>

<template>
  <div class="z-10 flex h-56 w-full flex-col items-center justify-center">
    <GradientButton :bg-color="bgColor">Zooooooooooom 🚀</GradientButton>
  </div>
</template>
