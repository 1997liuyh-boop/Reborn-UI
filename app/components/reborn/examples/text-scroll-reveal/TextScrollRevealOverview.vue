<script setup lang="ts">
/**
 * 总览卡片缩略：一句话里前几个词已被点亮、中间一个词半亮、后面的词仍是浅色底字
 *
 * 真实组件监听 window 滚动并占两屏高度，不能放进卡片；这里只取它逐词渲染用的 ScrollWord，
 * 按组件的分段规则（第 i 个词在 [i/n, (i+1)/n] 区间内点亮）传入固定进度 0.5，
 * 得到「滚动到一半」时的画面。
 */

/** 与组件一致按空格拆词 */
const words = '用 Reborn UI 把界面 做漂亮。'.split(' ')

/** 固定的滚动进度：一半 */
const progress = 0.5
</script>

<template>
  <p class="flex max-w-[200px] flex-wrap justify-center text-xl font-bold text-black/20 dark:text-white/20">
    <ScrollWord
      v-for="(word, i) in words"
      :key="i"
      :word="word"
      :progress="progress"
      :range="[i / words.length, (i + 1) / words.length]"
    />
  </p>
</template>
