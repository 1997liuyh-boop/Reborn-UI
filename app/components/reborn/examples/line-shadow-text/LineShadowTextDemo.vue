<script setup lang="ts">
import { useColorMode } from "@vueuse/core";

// 须在 setup 顶层调用：放进 computed 里会在 setup 之外注册生命周期钩子，触发 Vue 警告
const colorMode = useColorMode();
const isDark = computed(() => colorMode.value == "dark");
const shadowColor = computed(() => (isDark.value ? "white" : "black"));
</script>

<template>
  <DemoSection title="基础用法">
    <DemoBlock
      layout="stack"
      align="center"
    >
      <h1 class="text-highlighted text-8xl leading-none font-extrabold tracking-tighter text-balance">
        快速
        <LineShadowText
          class="italic"
          :shadow-color="shadowColor"
        >
          上线
        </LineShadowText>
      </h1>
    </DemoBlock>
  </DemoSection>
</template>
