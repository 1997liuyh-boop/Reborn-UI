<script setup lang="ts">
import { useColorMode } from "@vueuse/core";

const isDark = computed(() => useColorMode().value == "dark");
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
