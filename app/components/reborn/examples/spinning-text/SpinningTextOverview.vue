<script setup lang="ts">
/**
 * 总览卡片缩略：一圈文字沿圆周均匀排开并缓慢旋转
 *
 * 组件的旋转由 motion-v 的无限循环驱动（rotate 不走合成器，需要逐帧 JS 计算），不适合常驻在总览页；
 * 这里把组件自身的过渡改成零时长、不重复，只借用它的环形排字，旋转交给外层纯 CSS 关键帧。
 * 外层容器设为 0 尺寸，旋转中心正好落在圆心，旋转时也不会撑大占位。
 */
</script>

<template>
  <div class="spinning-ring text-highlighted flex size-0 items-center justify-center text-sm">
    <SpinningText
      text="了解更多·立即体验·开始使用·"
      :radius="5.5"
      :transition="{ duration: 0, repeat: 0 }"
    />
  </div>
</template>

<style scoped>
.spinning-ring {
  animation: spinning-ring-rotate 12s linear infinite;
}

@keyframes spinning-ring-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
