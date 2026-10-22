<script setup lang="ts">
/**
 * 总览卡片缩略：「让你的网站看起来更」下方是一个带内阴影的渐变容器，里面是单词「现代」
 *
 * 静态模拟：组件用 useIntervalFn 无限轮换单词且没有关闭开关，而总览卡片挂载后不卸载，
 * 因此用 DOM 复刻容器的渐变底与内阴影（类名与组件一致，明暗两套），
 * 只把换词那一刻的逐字模糊淡入用 CSS 关键帧播一次，随后停在完整单词上。
 */
const letters = '现代'.split('')
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <p class="text-highlighted text-lg font-bold tracking-tight">
      让你的网站看起来更
    </p>
    <span
      class="relative inline-block rounded-lg px-4 pt-1 pb-2 text-center text-3xl font-bold text-black shadow-[inset_0_-1px_#d1d5db,inset_0_0_0_1px_#d1d5db,_0_4px_8px_#d1d5db] [background:linear-gradient(to_bottom,#f3f4f6,#e5e7eb)] dark:text-white dark:shadow-[inset_0_-1px_#10171e,inset_0_0_0_1px_hsla(205,89%,46%,.24),_0_4px_8px_#00000052] dark:[background:linear-gradient(to_bottom,#374151,#1f2937)]"
    >
      <span
        v-for="(letter, index) in letters"
        :key="index"
        class="flip-letter inline-block"
        :style="{ animationDelay: `${index * 0.02}s` }"
      >{{ letter }}</span>
    </span>
  </div>
</template>

<style scoped>
.flip-letter {
  animation: flip-letter-in 0.4s ease both;
}

@keyframes flip-letter-in {
  from {
    opacity: 0;
    filter: blur(10px);
  }

  to {
    opacity: 1;
    filter: blur(0);
  }
}
</style>
