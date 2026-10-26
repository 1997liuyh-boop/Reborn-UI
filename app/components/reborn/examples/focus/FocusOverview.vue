<script setup lang="ts">
/**
 * 总览卡片缩略：「聚焦 当下」两个词，前一个清晰并被主色四角框住，后一个模糊
 *
 * 静态模拟：自动模式靠 useIntervalFn 无限轮换焦点，不适合常驻在挂载后不卸载的总览卡片里；
 * 手动模式会随鼠标悬停切换焦点，而缩略图只需要静止的一帧。因此按组件样式用 DOM 复刻
 * 「焦点停在第一个词」的那一帧：词距 1em、未聚焦词模糊、四个角标向外扩 10px，框体入场用 CSS 播一次。
 */
const corners = ['top-left', 'top-right', 'bottom-left', 'bottom-right']
</script>

<template>
  <div class="text-highlighted flex items-center justify-center gap-[1em] text-4xl font-black">
    <span class="relative">
      聚焦
      <span class="focus-frame absolute inset-0">
        <span
          v-for="corner in corners"
          :key="corner"
          class="corner"
          :class="corner"
        />
      </span>
    </span>
    <span class="blur-[4px]">当下</span>
  </div>
</template>

<style scoped>
.focus-frame {
  animation: focus-frame-in 0.5s ease both;
}

.corner {
  position: absolute;
  width: 1rem;
  height: 1rem;
  border: 3px solid var(--color-primary);
  border-radius: 3px;
  filter: drop-shadow(0 0 4px var(--color-primary));
}

.top-left {
  top: -10px;
  left: -10px;
  border-right: none;
  border-bottom: none;
}

.top-right {
  top: -10px;
  right: -10px;
  border-bottom: none;
  border-left: none;
}

.bottom-left {
  bottom: -10px;
  left: -10px;
  border-top: none;
  border-right: none;
}

.bottom-right {
  right: -10px;
  bottom: -10px;
  border-top: none;
  border-left: none;
}

/* 对应组件焦点框从原点移到目标词的过渡，这里简化为由外向内收拢一次 */
@keyframes focus-frame-in {
  from {
    opacity: 0;
    transform: scale(1.4);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
