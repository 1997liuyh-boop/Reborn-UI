<script setup lang="ts">
/**
 * 总览卡片缩略：一排竖长图片卡片横向排开、最右一张被边缘截断，右下角是左右翻页按钮
 *
 * 静态模拟：AppleCard 每张卡都挂一个 Teleport 与 window 键盘监听，
 * 卡片尺寸又按 md 断点写死为 384×640，缩到卡片里只剩几个像素，
 * 这里按组件的结构（顶部黑色渐变 + 分类 + 标题 + 铺满的配图）用 DOM 画出缩小版。
 * 第三张只露出一截，表达「还能继续横向滚动」。
 */
const cards = [
  {
    category: '人工智能',
    title: '用 AI 做更多事',
    src: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?q=80&w=400&auto=format&fit=crop',
  },
  {
    category: '效率',
    title: '把生产力再抬一档',
    src: 'https://images.unsplash.com/photo-1531554694128-c4c6665f59c2?q=80&w=400&auto=format&fit=crop',
  },
]

const peekSrc = 'https://images.unsplash.com/photo-1713869791518-a770879e60dc?q=80&w=400&auto=format&fit=crop'
</script>

<template>
  <div class="flex w-[200px] flex-col gap-1.5">
    <div class="flex gap-2">
      <div
        v-for="card in cards"
        :key="card.title"
        class="relative h-[96px] w-[70px] shrink-0 overflow-hidden rounded-xl bg-gray-2"
      >
        <img
          :src="card.src"
          :alt="card.title"
          class="absolute inset-0 size-full object-cover"
        >
        <div class="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-transparent" />
        <div class="relative p-1.5 text-white">
          <div class="text-[8px] font-medium">
            {{ card.category }}
          </div>
          <div class="mt-0.5 text-[10px] leading-tight font-semibold">
            {{ card.title }}
          </div>
        </div>
      </div>
      <div class="relative h-[96px] min-w-0 flex-1 overflow-hidden rounded-l-xl bg-gray-2">
        <img
          :src="peekSrc"
          alt="下一张卡片"
          class="absolute inset-0 size-full object-cover object-left"
        >
        <div class="absolute inset-0 bg-linear-to-b from-black/60 via-transparent to-transparent" />
      </div>
    </div>
    <div class="flex justify-end gap-1.5">
      <span class="flex size-5 items-center justify-center rounded-full bg-gray-2 opacity-50">
        <Icon
          name="tabler:arrow-narrow-left"
          class="size-3.5 text-gray-6"
        />
      </span>
      <span class="flex size-5 items-center justify-center rounded-full bg-gray-2">
        <Icon
          name="tabler:arrow-narrow-right"
          class="size-3.5 text-gray-6"
        />
      </span>
    </div>
  </div>
</template>
