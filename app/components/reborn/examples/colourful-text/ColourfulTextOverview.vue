<script setup lang="ts">
/**
 * 总览卡片缩略：「你能找到的最好的」下方，「动效组件」四个字逐字着上不同颜色
 *
 * 静态模拟：组件内部有一个不可关闭的 5 秒 setInterval 循环换色，而总览卡片挂载后不卸载，
 * 因此只取它的某一帧——每个字符落在调色板里不同的颜色上；入场用 CSS 关键帧从模糊淡入一次。
 * 颜色取自组件默认 colors 中明暗背景下都看得清的几项。
 */
const chars = [
  { char: '动', color: 'rgb(47, 195, 106)' },
  { char: '效', color: 'rgb(42, 169, 210)' },
  { char: '组', color: 'rgb(218, 0, 171)' },
  { char: '件', color: 'rgb(249, 129, 47)' },
]
</script>

<template>
  <div class="text-center font-bold">
    <p class="text-highlighted text-lg">
      你能找到的最好的
    </p>
    <p class="mt-1 text-4xl">
      <span
        v-for="(item, index) in chars"
        :key="item.char"
        class="colourful-char inline-block"
        :style="{ color: item.color, animationDelay: `${index * 0.05}s` }"
      >{{ item.char }}</span>
    </p>
  </div>
</template>

<style scoped>
.colourful-char {
  animation: colourful-char-in 0.5s ease both;
}

/* 复现组件换色时的单次模糊回弹，播完停在清晰态 */
@keyframes colourful-char-in {
  0% {
    opacity: 0.2;
    filter: blur(5px);
    transform: translateY(0);
  }

  50% {
    opacity: 0.8;
    transform: translateY(-3px);
  }

  100% {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }
}
</style>
