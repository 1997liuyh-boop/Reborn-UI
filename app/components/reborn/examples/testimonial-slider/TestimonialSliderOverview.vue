<script setup lang="ts">
/**
 * 总览卡片缩略：居中的圆形头像与一句加引号的评价，底部是姓名、职位与左右切换按钮
 *
 * 静态模拟：组件头像背后有一块 480px 的渐变圆作装饰，引文字号写死 text-2xl，
 * 整体缩到卡片大小后文字已不可读、装饰圆又远超缩略图边界；
 * 这里按组件的布局（头像在上、引文居中、底部「按钮 · 姓名职位 · 按钮」一行）画出缩小版，
 * 自动轮播对应的是静止的第一条。
 */
</script>

<template>
  <div class="flex w-[200px] flex-col items-center text-center">
    <div class="relative flex size-14 items-start justify-center rounded-full bg-linear-to-b from-gray-6/25 via-gray-6/5 to-transparent pt-2">
      <img
        src="https://randomuser.me/api/portraits/women/44.jpg"
        alt="Jessie"
        class="size-9 rounded-full object-cover"
      >
    </div>
    <p class="mt-1 text-xs leading-snug font-bold text-gray-9">
      “点来点去像骑着加了涡轮的马，这套组件有劲儿！”
    </p>
    <div class="mt-2 flex w-full items-center justify-between">
      <span class="flex size-5 items-center justify-center rounded-full bg-gray-2">
        <Icon
          name="lucide:arrow-left"
          class="size-3 text-gray-8"
        />
      </span>
      <div class="flex flex-col items-center leading-tight">
        <span class="text-[11px] text-gray-8 italic">Jessie</span>
        <span class="text-[10px] text-gray-6 italic">牧场体验与互动</span>
      </div>
      <span class="flex size-5 items-center justify-center rounded-full bg-gray-2">
        <Icon
          name="lucide:arrow-right"
          class="size-3 text-gray-8"
        />
      </span>
    </div>
  </div>
</template>
