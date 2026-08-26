<script setup lang="ts">
/** 演示用长文，给光束一条可滚动的路径 */
const dummyContent = [
  {
    title: "从山顶看下去",
    description: [
      "光束会跟着滚动进度走完整篇。把页面往下拉，左侧那条线会一路点亮。",
      "适合文档、长文、发布日志这类需要告诉读者「你读到哪了」的场景。",
    ],
    badge: "Vue",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=3540&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "夜间的雪线",
    description: [
      "徽章用 inverted 表面，亮暗两种模式都保持高对比。",
      "缩略图圆角走白名单，不再写 rounded-lg。",
    ],
    badge: "Nuxt",
    image:
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=3540&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
  {
    title: "林间小路",
    description: [
      "内容本身没有填充盒。分隔只靠留白。",
    ],
    badge: "Reborn UI",
    image:
      "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=3506&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  },
];
</script>

<template>
  <DemoSection
    title="基础用法"
    description="左侧光束随滚动点亮；徽章是内容本身的标签，不是脚手架。"
  >
    <TracingBeam class="px-6">
      <div class="relative mx-auto max-w-2xl pt-4">
        <div
          v-for="(item, index) in dummyContent"
          :key="`content-${index}`"
          class="mb-10"
        >
          <div class="bg-inverted text-inverted mb-4 w-fit rounded-full px-2 text-sm">
            {{ item.badge }}
          </div>

          <p class="text-highlighted mb-4 text-xl">
            {{ item.title }}
          </p>

          <div class="text-muted text-sm">
            <img
              v-if="item.image"
              :src="item.image"
              alt="文章配图"
              class="mb-10 rounded-ui-md object-cover"
            >
            <div>
              <p
                v-for="(paragraph, idx) in item.description"
                :key="`desc-${idx}`"
                class="mb-3"
              >
                {{ paragraph }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </TracingBeam>
  </DemoSection>
</template>
