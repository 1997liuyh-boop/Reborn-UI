<script lang="ts" setup>
import { useColorMode } from "#imports";
import { computed } from "vue";

// 读取站点现有主题，避免创建会改写全站 class 的独立主题状态
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value === "dark");
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
