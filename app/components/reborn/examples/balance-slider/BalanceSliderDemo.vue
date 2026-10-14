<script lang="ts" setup>
import { useColorMode } from "@vueuse/core";
import { computed } from "vue";

// 须在 setup 顶层调用：放进 computed 里会在 setup 之外注册生命周期钩子，触发 Vue 警告
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value == "dark");
const rightColor = computed(() => (isDark.value ? "#FFFFFF" : "#000000"));
const indicatorColor = computed(() => (isDark.value ? "#FFFFFF" : "#000000"));
</script>

<template>
  <div class="w-full p-4">
    <BalanceSlider
      :right-color="rightColor"
      left-content="COFFEE"
      right-content="MILK"
      :indicator-color="indicatorColor"
    />
  </div>
</template>
