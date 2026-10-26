<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, shallowRef, watch } from "vue";

interface Props {
  words: string[];
  duration?: number;
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  duration: 3000,
  class: "",
});

defineEmits<{
  /** 新单词进场动画结束时触发 */
  animationStart: [];
  /** 旧单词离场动画结束时触发 */
  animationComplete: [];
}>();

const currentWord = shallowRef(props.words[0] ?? "");
const isVisible = shallowRef(true);
// 两个定时器句柄都保存下来，卸载时一并取消，避免卸载后仍切换单词
let timeoutId: ReturnType<typeof setTimeout> | null = null;
let swapTimer: ReturnType<typeof setTimeout> | null = null;

function startAnimation() {
  isVisible.value = false;

  swapTimer = setTimeout(() => {
    swapTimer = null;
    const currentIndex = props.words.indexOf(currentWord.value);
    const nextWord = props.words[currentIndex + 1] || props.words[0] || "";
    currentWord.value = nextWord;
    isVisible.value = true;
  }, 600);
}

const splitWords = computed(() => {
  return currentWord.value.split(" ")?.map(word => ({
    word,
    letters: word.split(""),
  }));
});

function startTimeout() {
  timeoutId = setTimeout(() => {
    timeoutId = null;
    startAnimation();
  }, props.duration);
}

onMounted(() => {
  startTimeout();
});

onBeforeUnmount(() => {
  if (timeoutId) clearTimeout(timeoutId);
  if (swapTimer) clearTimeout(swapTimer);
});

watch(isVisible, (newValue) => {
  if (newValue) {
    startTimeout();
  }
});
</script>

<template>
  <div class="relative inline-block px-2">
    <!-- 显式命名过渡，类名与 keyframes 都带 flip-words- 前缀并放在 scoped 样式里，不影响应用里其他未命名的 Transition -->
    <Transition
      name="flip-words"
      @after-enter="$emit('animationStart')"
      @after-leave="$emit('animationComplete')"
    >
      <div
        v-show="isVisible"
        class="relative z-10 inline-block text-left text-neutral-900 dark:text-neutral-100"
        :class="[props.class]"
      >
        <template
          v-for="(wordObj, wordIndex) in splitWords"
          :key="wordObj.word + wordIndex"
        >
          <span
            class="flip-words-word inline-block whitespace-nowrap opacity-0"
            :style="{ animationDelay: `${wordIndex * 0.3}s` }"
          >
            <span
              v-for="(letter, letterIndex) in wordObj.letters"
              :key="wordObj.word + letterIndex"
              class="flip-words-letter inline-block opacity-0"
              :style="{ animationDelay: `${wordIndex * 0.3 + letterIndex * 0.05}s` }"
            >
              {{ letter }}
            </span>
            <span class="inline-block">&nbsp;</span>
          </span>
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.flip-words-word {
  animation: flip-words-fade-in 0.3s ease forwards;
}

.flip-words-letter {
  animation: flip-words-fade-in 0.2s ease forwards;
}

@keyframes flip-words-fade-in {
  0% {
    opacity: 0;
    transform: translateY(10px);
    filter: blur(8px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.flip-words-enter-active {
  animation: flip-words-enter 0.6s ease-in-out forwards;
}

.flip-words-leave-active {
  animation: flip-words-leave 0.6s ease-in-out forwards;
}

@keyframes flip-words-enter {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }

  100% {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes flip-words-leave {
  0% {
    opacity: 1;
    transform: scale(1);
    filter: blur(0);
  }

  100% {
    opacity: 0;
    transform: scale(2);
    filter: blur(8px);
  }
}
</style>
