<script lang="ts" setup>
import { useColorMode } from "#imports";
import { computed } from "vue";

// 读取站点现有主题，避免创建会改写全站 class 的独立主题状态
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");
const bgColor = computed(() => (isDark.value ? "#000" : "#fff"));
</script>

<template>
  <div class="z-10 flex h-56 w-full flex-col items-center justify-center">
    <GradientButton :bg-color="bgColor">Zooooooooooom 🚀</GradientButton>
  </div>
</template>
