<script setup lang="ts">
import cloudflare from './cloudflare.svg';

/** 每格的三种状态：被抬起的一格、与它相邻的四格、其余普通格 */
type CardState = 'raised' | 'adjacent' | 'normal';

/** 各状态对应的类名，样式取自组件悬停时的抬起效果 */
const cardStateClass: Record<CardState, string> = {
  raised: 'z-20 border-emerald-500/50 bg-white [transform:scale(1.15)_translate3d(-20px,-20px,15px)] [filter:drop-shadow(0_1px_6px_#38ef7d)] dark:border-emerald-100/30 dark:bg-[#020420]',
  adjacent: 'z-10 border-emerald-500/30 [transform:scale(1.05)_translate(-5px,-5px)] dark:border-emerald-100/20',
  normal: 'border-transparent',
};

const raisedIndex = 5;
/** 4 列网格里第 6 格的左右上下邻格 */
const adjacentIndexes = [4, 6, 1, 9];

/** 静态复刻抬起的一帧，避免总览常驻鼠标监听与动画循环；每格状态在这里一次算好，模板只按状态取类名 */
const cards = Array.from({ length: 12 }, (_, index) => ({
  logo: cloudflare,
  state: (index === raisedIndex ? 'raised' : adjacentIndexes.includes(index) ? 'adjacent' : 'normal') as CardState,
}));
</script>

<template>
  <div class="relative h-[110px] w-[193px]">
    <div class="absolute top-0 left-0 w-[440px] origin-top-left scale-[0.438]">
      <div class="grid grid-cols-4 gap-2 [transform:perspective(600px)_rotateX(-1deg)_rotateY(-15deg)]">
        <div
          v-for="(card, index) in cards"
          :key="index"
          class="relative block rounded-sm border px-3 py-5 shadow-lg shadow-emerald-100/50 dark:shadow-gray-800/20"
          :class="cardStateClass[card.state]"
        >
          <img :src="card.logo" alt="Cloudflare" class="mx-auto h-10 w-auto">
        </div>
      </div>
    </div>
  </div>
</template>
