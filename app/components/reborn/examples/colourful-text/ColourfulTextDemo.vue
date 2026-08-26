<script setup lang="ts">
import { Motion } from "motion-v";
</script>

<template>
  <DemoSection
    title="基础用法"
    description="深色舞台是彩色文字效果的一部分，两种模式都保持深色。"
  >
    <div class="relative flex h-[28rem] w-full items-center justify-center overflow-hidden rounded-ui-md bg-gray-10 dark:bg-gray-1">
      <Motion
        as="img"
        src="https://assets.aceternity.com/linear-demo.webp"
        class="pointer-events-none absolute inset-0 size-full [mask-image:radial-gradient(circle,transparent,black_80%)] object-cover"
        :initial="{ opacity: 0 }"
        :while-in-view="{
          opacity: 0.5,
        }"
        :transition="{
          duration: 1,
        }"
      />
      <div>
        <h1 class="relative z-2 text-center font-sans text-2xl font-bold text-white md:text-5xl">
          你能找到的最好的 <ColourfulText text="组件" />
        </h1>
      </div>
    </div>
  </DemoSection>
</template>
