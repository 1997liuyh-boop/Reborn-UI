<script setup lang="ts">
import { Icon } from '#components';

/**
 * 总览卡片缩略：签名板上写好一笔签名，下方是笔色色板与撤销 / 清空 / 完成操作
 *
 * Web 端无实现，按 UniApp 源码静态还原外观：真实组件在 canvas 上手写，
 * 缩略图改用一条 SVG 曲线代替笔迹，进入视口时用 CSS 描边动画写一次后停住，不循环。
 * 笔迹用 currentColor 跟随正文色，避免默认深色笔在暗色主题下看不见；
 * 工具栏按 showRedo=false 的配置只放三个操作，原尺寸放不下全部四个。
 */
const penColors = ['var(--color-gray-9)', '#ef4444', '#f59e0b', '#22c55e', '#3b82f6', '#8b5cf6']

const actions = [
  { text: '撤销', icon: 'lucide:undo-2' },
  { text: '清空', icon: 'lucide:eraser' },
  { text: '完成', icon: 'lucide:check' },
]
</script>

<template>
  <div class="flex w-[200px] flex-col gap-2">
    <!-- 签名板 -->
    <div class="relative h-[66px] overflow-hidden rounded-lg bg-gray-1 text-gray-9 ring-1 ring-gray-3">
      <svg
        class="absolute inset-0 size-full"
        viewBox="0 0 200 66"
        fill="none"
        stroke="currentColor"
        stroke-width="2.2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path
          class="signature-stroke"
          pathLength="1"
          d="M28 40 C34 18 48 14 44 34 S40 52 52 36 S66 18 70 34 S74 48 84 32 C90 22 98 22 98 34 S104 46 116 30 S132 20 134 34 S142 44 156 28"
        />
        <path
          class="signature-stroke signature-stroke--late"
          pathLength="1"
          d="M34 50 C70 46 120 44 172 40"
        />
      </svg>
    </div>

    <!-- 笔色色板：当前色放大，其余略透明 -->
    <div class="flex items-center gap-1.5">
      <span
        v-for="(color, index) in penColors"
        :key="color"
        class="size-3.5 rounded-full ring-1 ring-gray-3"
        :class="[index === 0 ? 'scale-110' : 'opacity-90']"
        :style="{ backgroundColor: color }"
      />
    </div>

    <!-- 操作按钮：主色浅底胶囊 -->
    <div class="flex justify-end gap-1">
      <div
        v-for="action in actions"
        :key="action.text"
        class="flex h-[22px] items-center gap-0.5 rounded-full bg-primary/10 px-2 text-primary"
      >
        <Icon
          :name="action.icon"
          class="size-3"
        />
        <span class="text-[10px] font-medium">{{ action.text }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 笔迹只描写一次后停在终态 */
.signature-stroke {
  stroke-dasharray: 1;
  stroke-dashoffset: 1;
  animation: signature-draw 1.4s ease-out 0.2s forwards;
}

.signature-stroke--late {
  animation-duration: 0.5s;
  animation-delay: 1.5s;
}

@keyframes signature-draw {
  to {
    stroke-dashoffset: 0;
  }
}
</style>
