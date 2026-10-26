<script lang="ts" setup>
import { useIntervalFn, useMounted } from "@vueuse/core";
import { Motion } from "motion-v";
import { computed, nextTick, ref, shallowRef, useTemplateRef, watch } from "vue";

interface FocusProps {
  sentence?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
}

interface FocusRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

const props = withDefaults(defineProps<FocusProps>(), {
  sentence: "reborn Focus",
  manualMode: false,
  blurAmount: 5,
  borderColor: "green",
  animationDuration: 0.5,
  pauseBetweenAnimations: 1,
});

const words = computed(() => props.sentence.split(" "));
const containerRef = useTemplateRef<HTMLElement>("containerRef");
// 单词元素按下标就地登记，保留 ref
const wordRefs = ref<{ [key: number]: HTMLElement | null }>({});
const currentIndex = shallowRef(0);
const lastActiveIndex = shallowRef<number | null>(null);
const focusRect = shallowRef<FocusRect>({ x: 0, y: 0, width: 0, height: 0 });

function setRef(el: unknown, index: number) {
  wordRefs.value[index] = el instanceof HTMLElement ? el : null;
}

function handleMouseEnter(index: number) {
  if (props.manualMode) {
    lastActiveIndex.value = index;
    currentIndex.value = index;
  }
}
function handleMouseLeave() {
  if (props.manualMode) {
    currentIndex.value = 0;
  }
}

watch(
  currentIndex,
  async (newIndex) => {
    await nextTick();
    if (newIndex === null || newIndex === -1) return;
    if (!wordRefs.value[newIndex] || !containerRef.value) return;

    const parentRect = containerRef.value.getBoundingClientRect();
    const wordRect = wordRefs.value[newIndex].getBoundingClientRect();

    focusRect.value = {
      x: wordRect.left - parentRect.left,
      y: wordRect.top - parentRect.top,
      width: wordRect.width,
      height: wordRect.height,
    };
  },
  { immediate: true },
);

// 自动模式的轮换定时器：在 setup 顶层创建，卸载时自动清除；间隔读 getter，时长参数变化后按新间隔重启
const { pause, resume } = useIntervalFn(
  () => {
    const total = words.value.length;
    if (!total) return;
    currentIndex.value = (currentIndex.value + 1) % total;
  },
  () => props.animationDuration * 1000 + props.pauseBetweenAnimations * 1000,
  { immediate: false },
);
const mounted = useMounted();

// 只在客户端挂载后启动；manualMode 切换时随之启停
watch(
  () => !props.manualMode && mounted.value,
  (on) => (on ? resume() : pause()),
  { immediate: true },
);
</script>

<template>
  <div
    ref="containerRef"
    class="focus-container"
  >
    <span
      v-for="(word, index) in words"
      :key="`${word}_${index}`"
      :ref="(el) => setRef(el, index)"
      class="focus-word"
      :class="{
        manual: props.manualMode,
        active: index === currentIndex && !props.manualMode,
      }"
      :style="{
        filter: manualMode
          ? index === currentIndex
            ? `blur(0px)`
            : `blur(${blurAmount}px)`
          : index === currentIndex
            ? `blur(0px)`
            : `blur(${blurAmount}px)`,
        transition: `filter ${animationDuration}s ease`,
        '--border-color': borderColor,
      }"
      @mouseenter="handleMouseEnter(index)"
      @mouseleave="handleMouseLeave"
    >
      {{ word }}
    </span>
    <Motion
      as="div"
      class="focus-frame"
      :animate="{
        x: focusRect.x,
        y: focusRect.y,
        width: focusRect.width,
        height: focusRect.height,
        opacity: currentIndex >= 0 ? 1 : 0,
      }"
      :transition="{
        duration: animationDuration,
      }"
      :style="{
        '--border-color': borderColor,
      }"
    >
      <span class="corner top-left" />
      <span class="corner top-right" />
      <span class="corner bottom-left" />
      <span class="corner bottom-right" />
    </Motion>
  </div>
</template>

<style scoped>
.focus-container {
  position: relative;
  display: flex;
  gap: 1em;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}

/* 单词 */
.focus-word {
  position: relative;
  font-size: 3rem;
  font-weight: 900;
  cursor: pointer;
  transition:
    filter 0.3s ease,
    color 0.3s ease;
}

.focus-word.active {
  filter: blur(0);
}

.focus-frame {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  box-sizing: content-box;
  border: none;
}

.corner {
  position: absolute;
  width: 1rem;
  height: 1rem;
  border: 3px solid var(--border-color, #fff);
  filter: drop-shadow(0px 0px 4px var(--border-color, #fff));
  border-radius: 3px;
  transition: none;
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
  border-left: none;
  border-bottom: none;
}

.bottom-left {
  bottom: -10px;
  left: -10px;
  border-right: none;
  border-top: none;
}

.bottom-right {
  bottom: -10px;
  right: -10px;
  border-left: none;
  border-top: none;
}
</style>
