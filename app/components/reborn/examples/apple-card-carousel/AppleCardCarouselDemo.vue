<script lang="ts" setup>
const data = [
  {
    category: "人工智能",
    title: "用 AI 做更多事。",
    src: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=3556&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    category: "效率",
    title: "把生产力再抬一档。",
    src: "https://images.unsplash.com/photo-1531554694128-c4c6665f59c2?q=80&w=3387&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    category: "产品",
    title: "全新 Apple Vision Pro。",
    src: "https://images.unsplash.com/photo-1713869791518-a770879e60dc?q=80&w=2333&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    category: "产品",
    title: "iPhone 15 Pro Max 地图。",
    src: "https://images.unsplash.com/photo-1599202860130-f600f4948364?q=80&w=2515&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    category: "iOS",
    title: "拍照，又进步了一点。",
    src: "https://images.unsplash.com/photo-1602081957921-9137a5d6eaee?q=80&w=2793&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    category: "招聘",
    title: "招一位 Staff 软件工程师。",
    src: "https://images.unsplash.com/photo-1511984804822-e16ba72f5848?q=80&w=2048&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];
</script>

<template>
  <DemoSection
    title="基础用法"
    description="卡片展开后的内容区是卡片自己的表面，用 elevated 填充，不再套中性色硬编码。"
  >
    <div class="w-full overflow-hidden">
      <AppleCardCarousel>
        <AppleCarouselItem
          v-for="(card, index) in data"
          :key="index"
          :index="index"
        >
          <AppleCard
            :card="card"
            :index="index"
            :layout="true"
          >
            <div
              :key="`dummy-content${index}`"
              class="bg-elevated rounded-ui-lg mb-4 p-8 md:p-14"
            >
              <p class="text-muted mx-auto max-w-3xl text-base md:text-2xl">
                <span class="text-highlighted font-bold">第一法则：大胆展示你的作品。</span>
                随手记下待办、课堂笔记；需要转成文字也没问题。
              </p>
              <img
                src="https://assets.aceternity.com/macbook.png"
                alt="MacBook 示意图"
                height="500"
                width="500"
                class="mx-auto size-full object-contain md:size-1/2"
              >
            </div>
          </AppleCard>
        </AppleCarouselItem>
      </AppleCardCarousel>
    </div>
  </DemoSection>
</template>
