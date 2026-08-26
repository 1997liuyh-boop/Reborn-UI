<script setup lang="ts">
const placeholders = [
  "为什么我的代码总是坏掉？",
  "undefined 到底是什么意思？",
  "这次真的要把 div 居中了",
  "我比编译器聪明吗？",
  "循环会不会转晕？",
];
const text = ref("");
</script>

<template>
  <DemoSection
    title="基础用法"
    description="占位文案轮换消失；标题是输入框的引导，不是页面级 hero。"
  >
    <DemoBlock
      layout="stack"
      align="center"
    >
      <div class="flex flex-col items-center justify-center px-4 py-16">
        <h2 class="text-highlighted mb-10 text-center text-xl sm:mb-16 sm:text-4xl">
          随便问点什么
        </h2>
        <VanishingInput
          v-model="text"
          :placeholders="placeholders"
        />
      </div>
    </DemoBlock>
  </DemoSection>
</template>
