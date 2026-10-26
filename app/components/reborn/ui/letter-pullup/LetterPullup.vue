<script setup lang="ts">
import { Motion } from "motion-v";
import { computed } from "vue";

interface LetterPullupProps {
  class?: string;
  words: string;
  delay?: number;
}

const props = defineProps<LetterPullupProps>();

// words 变化后跟随更新
const letters = computed(() => props.words.split(""));

const pullupVariant = {
  initial: { y: 100, opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
  },
};
</script>

<template>
  <!-- 以 words 作 key：文字变化时整体重放进场动画 -->
  <div
    :key="props.words"
    class="flex justify-center"
  >
    <!-- 文本里常有重复字母与空格，用下标作 key -->
    <div
      v-for="(letter, index) in letters"
      :key="index"
    >
      <Motion
        as="h1"
        :initial="pullupVariant.initial"
        :animate="pullupVariant.animate"
        :transition="{
          delay: index * (props.delay ? props.delay : 0.05),
        }"
        class="font-display text-center text-4xl font-bold tracking-[-0.02em] text-black drop-shadow-sm md:text-4xl md:leading-[5rem]"
        :class="[props.class]"
      >
        <span v-if="letter === ' '">&nbsp;</span>
        <span v-else>{{ letter }}</span>
      </Motion>
    </div>
  </div>
</template>
