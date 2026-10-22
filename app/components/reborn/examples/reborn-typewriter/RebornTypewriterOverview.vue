<script setup lang="ts">
/**
 * 总览卡片缩略：等宽字体逐字打出一行问候语，末尾跟一个闪烁光标
 *
 * 组件打完字后会用 setInterval 让光标常驻闪烁，总览页卡片挂载后不卸载，不能留常驻定时器；
 * 因此关掉组件自带光标（showCursor=false 时不会启动闪烁定时器），改用 CSS 关键帧画一个同款光标。
 * 打字过程只在挂载时播放一次，随后停在完整文本上。
 */
import RebornTypewriter from '~/components/reborn/ui/reborn-typewriter/RebornTypewriter.vue'
</script>

<template>
  <div class="text-default font-mono text-xl whitespace-nowrap">
    <RebornTypewriter
      text="你好，Reborn UI"
      :type-speed="90"
      :show-cursor="false"
    />
    <span class="typewriter-cursor ml-px inline-block font-normal">|</span>
  </div>
</template>

<style scoped>
/* 与组件光标同节奏（约 530ms 一次切换）的阶跃闪烁 */
.typewriter-cursor {
  animation: typewriter-blink 1.06s steps(1, end) infinite;
}

@keyframes typewriter-blink {
  50% {
    opacity: 0;
  }
}
</style>
