<script setup lang="ts">
/**
 * 总览卡片缩略：「Vue 是 渐进式 / JavaScript 框架」，主色单词逐字模糊上浮后停住
 *
 * 静态模拟：组件用 setTimeout 链无限轮换单词且没有关闭开关，而总览卡片挂载后不卸载，
 * 因此只复现它换上新词那一刻的逐字淡入（CSS 关键帧播一次），随后停在完整单词上。
 */
const letters = '渐进式'.split('')
</script>

<template>
  <div class="text-center text-2xl text-gray-7">
    <div>
      Vue 是
      <span class="text-primary inline-block px-1">
        <span
          v-for="(letter, index) in letters"
          :key="index"
          class="flip-letter inline-block"
          :style="{ animationDelay: `${index * 0.05}s` }"
        >{{ letter }}</span>
      </span>
    </div>
    <div class="mt-1 text-xl">
      JavaScript 框架
    </div>
  </div>
</template>

<style scoped>
.flip-letter {
  animation: flip-letter-in 0.3s ease both;
}

@keyframes flip-letter-in {
  from {
    opacity: 0;
    transform: translateY(10px);
    filter: blur(8px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}
</style>
