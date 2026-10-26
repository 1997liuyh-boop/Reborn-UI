<script lang="ts" setup>
import type { ComponentPublicInstance } from "vue";
import { useIntervalFn } from "@vueuse/core";
import { Motion } from "motion-v";
import { onMounted, shallowRef, useId, useTemplateRef, watch } from "vue";

interface Props {
  words?: string[];
  interval?: number;
  animationDuration?: number;
  class?: string;
  textClass?: string;
}

const props = withDefaults(
  defineProps<Props>(),
  {
    words: () => ["better", "modern", "beautiful", "awesome"],
    interval: 3000,
    animationDuration: 700,
  },
);

const id = useId();

const currentWordIndex = shallowRef(0);
// 引用挂在 Motion 组件上，拿到的是组件实例，宽度要从它的根元素 $el 上量
const textRef = useTemplateRef<ComponentPublicInstance>("textRef");

// scrollWidth 不是响应式依赖，放在 computed 里只会在引用变化时重算；改为单词渲染完成后测量并写入状态
const width = shallowRef(100);

function measure() {
  const el = textRef.value?.$el as HTMLElement | undefined;
  if (el?.scrollWidth) width.value = el.scrollWidth + 30;
}

onMounted(measure);
// 父组件替换 words 时下标不变：新数组更短就把下标夹回范围内，避免整个间隔里显示空内容
watch(() => props.words, (words) => {
  currentWordIndex.value %= words.length || 1;
});
// 单词轮换或 words 被替换后都重新测宽，外框宽度跟随当前显示的单词
watch([currentWordIndex, () => props.words], measure, { flush: "post" });

// 间隔读 getter，interval 变化后按新间隔重启
useIntervalFn(() => {
  const total = props.words.length;
  if (!total) return;
  currentWordIndex.value = (currentWordIndex.value + 1) % total;
}, () => props.interval);
</script>

<template>
  <Motion
    :key="words[currentWordIndex]"
    as="p"
    :layout-id="`words-here-${id}`"
    :animate="{ width }"
    :transition="{ duration: props.animationDuration / 2000 }"
    class="relative inline-block rounded-lg px-4 pt-2 pb-3 text-center text-4xl font-bold text-black shadow-[inset_0_-1px_#d1d5db,inset_0_0_0_1px_#d1d5db,_0_4px_8px_#d1d5db] [background:linear-gradient(to_bottom,#f3f4f6,#e5e7eb)] md:text-7xl dark:text-white dark:shadow-[inset_0_-1px_#10171e,inset_0_0_0_1px_hsla(205,89%,46%,.24),_0_4px_8px_#00000052] dark:[background:linear-gradient(to_bottom,#374151,#1f2937)]"
    :class="[props.class]"
  >
    <Motion
      ref="textRef"
      as="div"
      :transition="{
        duration: animationDuration / 1000,
        ease: 'easeInOut',
      }"
      class="inline-block"
      :class="[props.textClass]"
      :layout-id="`word-div-${words[currentWordIndex]}-${id}`"
    >
      <Motion
        as="div"
        class="inline-block"
      >
        <Motion
          v-for="(letter, index) in words[currentWordIndex]"
          :key="index"
          as="span"
          :initial="{
            opacity: 0,
            filter: 'blur(10px)',
          }"
          :animate="{
            opacity: 1,
            filter: 'blur(0px)',
          }"
          :transition="{
            delay: index * 0.02,
          }"
        >
          {{ letter }}
        </Motion>
      </Motion>
    </Motion>
  </Motion>
</template>
