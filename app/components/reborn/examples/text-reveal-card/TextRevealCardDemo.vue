<template>
  <DemoSection
    title="基础用法"
    description="卡片自己带深色表面；文案是效果的一部分。"
  >
    <DemoBlock layout="stack">
      <TextRevealCard class="mx-auto">
        <template #header>
          <h2 class="mb-2 text-lg font-semibold text-white">文字揭示</h2>
          <p class="text-gray-6 text-sm">把鼠标移到文字上，看看藏着什么。</p>
        </template>
        <template #text>
          <p class="bg-[#323238] bg-clip-text py-4 text-sm font-bold text-transparent sm:py-6 sm:text-3xl md:py-10 md:text-[3rem]">
            准备好看见被藏起来的东西
          </p>
        </template>
        <template #revealText>
          <p
            :style="{
              textShadow: '4px 4px 15px rgba(0,0,0,0.5)',
            }"
            class="bg-linear-to-b from-white to-neutral-300 bg-clip-text py-4 text-sm font-bold text-white sm:py-6 sm:text-3xl md:py-10 md:text-[3rem]"
          >
            光会揭开影子藏住的东西
          </p>
        </template>
      </TextRevealCard>
      <TextRevealCard
        :stars-count="500"
        stars-class="bg-red-500"
        class="mx-auto"
      >
        <template #header>
          <h2 class="mb-2 text-3xl font-semibold">文字揭示</h2>
          <p class="text-gray-6 text-sm">把鼠标移到文字上，看看藏着什么。</p>
        </template>
        <template #text>
          <p class="text-white">
            揭示动画会把藏起来的内容慢慢展开，增强交互感。可以由滚动、点击或进入视口触发。
          </p>
        </template>
        <template #revealText>
          <p class="text-red-500">
            揭示动画会把藏起来的内容慢慢展开，增强交互感。可以由滚动、点击或进入视口触发。
          </p>
        </template>
      </TextRevealCard>
    </DemoBlock>
  </DemoSection>
</template>
