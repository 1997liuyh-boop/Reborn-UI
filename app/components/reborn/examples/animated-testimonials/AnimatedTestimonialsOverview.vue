<script setup lang="ts">
/**
 * 总览卡片缩略：左侧三张错落叠放、带随机倾角的人像照片，右侧是姓名、职位、评价与切换按钮
 *
 * 静态模拟：组件按 md 断点固定为左右两栏、图片高 20rem、两栏间距 5rem，
 * 缩到卡片大小后姓名与评价只剩几像素；这里按组件的布局画出缩小版：
 * 当前一张端正地压在最上面，其余两张带小角度、略缩小地垫在后面，
 * 评价文字取逐词模糊浮现动画的终态。
 */
const photos = [
  { src: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=200&auto=format&fit=crop', rotate: 'rotate-[-8deg] scale-95 opacity-70' },
  { src: 'https://images.unsplash.com/photo-1623582854588-d60de57fa33f?q=80&w=200&auto=format&fit=crop', rotate: 'rotate-[6deg] scale-95 opacity-70' },
  { src: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop', rotate: '' },
]
</script>

<template>
  <div class="flex w-[188px] items-center gap-3.5">
    <div class="relative h-[96px] w-[70px] shrink-0">
      <img
        v-for="photo in photos"
        :key="photo.src"
        :src="photo.src"
        alt="评价人头像"
        class="absolute inset-0 size-full origin-bottom rounded-xl object-cover"
        :class="photo.rotate"
      >
    </div>
    <div class="flex min-w-0 flex-1 flex-col">
      <div class="text-xs font-bold text-gray-10">
        陈思远
      </div>
      <div class="text-[9px] text-gray-6">
        TechFlow 产品经理
      </div>
      <p class="mt-1.5 text-[10px] leading-snug text-gray-7">
        细节扎实、功能新颖，彻底改变了我们的工作方式。
      </p>
      <div class="mt-2 flex gap-1.5">
        <span class="flex size-5 items-center justify-center rounded-full bg-gray-2">
          <Icon
            name="lucide:arrow-left"
            class="size-3 text-gray-8"
          />
        </span>
        <span class="flex size-5 items-center justify-center rounded-full bg-gray-2">
          <Icon
            name="lucide:arrow-right"
            class="size-3 text-gray-8"
          />
        </span>
      </div>
    </div>
  </div>
</template>
