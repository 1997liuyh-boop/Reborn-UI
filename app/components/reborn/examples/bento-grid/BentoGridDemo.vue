<script lang="ts" setup>
const items = [
  {
    title: "创新的黎明",
    description: "探索那些改变世界的想法与发明从何而来。",
  },
  {
    title: "数字革命",
    description: "走进技术如何重塑我们的生活。",
  },
  {
    title: "设计的艺术",
    description: "发现深思熟虑的体验设计之美。",
  },
  {
    title: "沟通的力量",
    description: "理解有效沟通如何影响日常。",
  },
  {
    title: "求知",
    description: "加入这场通往理解与启发的旅途。",
  },
  {
    title: "创造的乐趣",
    description: "体验把想法变成现实的那一下。",
  },
  {
    title: "冒险精神",
    description: "出发，去遇见新的风景。",
  },
];
</script>

<template>
  <DemoSection
    title="基础用法"
    description="格子头部的脉冲块是条目自己的骨架占位，用 elevated 而不是 zinc。"
  >
    <BentoGrid class="mx-auto max-w-4xl">
      <BentoGridItem
        v-for="(item, index) in items"
        :key="index"
        :class="index === 3 || index === 6 ? 'md:col-span-2' : ''"
      >
        <template #header>
          <div class="flex size-full animate-pulse space-x-4">
            <div class="bg-elevated flex size-full flex-1 rounded-ui-sm" />
          </div>
        </template>

        <template #title>
          <strong>{{ item.title }}</strong>
        </template>

        <template #icon />

        <template #description>
          <p>{{ item.description }}</p>
        </template>
      </BentoGridItem>
    </BentoGrid>
  </DemoSection>
</template>
