<script setup lang="ts">
import { Motion } from "motion-v";
import { onMounted, onUnmounted, shallowRef } from "vue";

interface Sparkle {
  id: string;
  x: string;
  y: string;
  color: string;
  delay: number;
  scale: number;
}

interface Props {
  text: string;
  sparklesCount?: number;
  colors?: {
    first: string;
    second: string;
  };
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  sparklesCount: 10,
  colors: () => ({ first: "#9E7AFF", second: "#FE8BBB" }),
});

/** 参与渲染的星星列表，只在有星星到期需要替换时整体替换 */
const sparkles = shallowRef<Sparkle[]>([]);

/**
 * 各星剩余寿命（秒），放在非响应式的 Map 里倒计时：寿命只用来决定何时换星、不参与渲染。
 * 若每 100ms 都重建整个数组，组件和全部 Motion 子组件每秒要更新 10 次
 */
const lifespans = new Map<string, number>();
let starSeed = 0;

// 生成一颗属性随机的星星，并登记它的寿命
function generateStar(): Sparkle {
  const starX = `${Math.random() * 100}%`;
  const starY = `${Math.random() * 100}%`;
  const color = Math.random() > 0.5 ? props.colors.first : props.colors.second;
  const delay = Math.random() * 2;
  const scale = Math.random() * 1 + 0.3;
  const id = `${starX}-${starY}-${++starSeed}`;
  lifespans.set(id, Math.random() * 10 + 5);
  return { id, x: starX, y: starY, color, delay, scale };
}

// 按数量初始化星星
function initializeStars() {
  lifespans.clear();
  sparkles.value = Array.from({ length: props.sparklesCount }, generateStar);
}

// 寿命倒计时：只替换到期的那几颗，没有到期时不触发更新
function updateStars() {
  const current = sparkles.value;
  let next: Sparkle[] | null = null;
  for (let index = 0; index < current.length; index++) {
    const star = current[index]!;
    const left = (lifespans.get(star.id) ?? 0) - 0.1;
    if (left > 0) {
      lifespans.set(star.id, left);
      continue;
    }
    lifespans.delete(star.id);
    next ??= [...current];
    next[index] = generateStar();
  }
  if (next) sparkles.value = next;
}

let interval: number;

// 启动倒计时循环
onMounted(() => {
  initializeStars();
  interval = window.setInterval(updateStars, 100);
});

// 卸载时清理
onUnmounted(() => {
  if (interval) {
    clearInterval(interval);
  }
  lifespans.clear();
});
</script>

<template>
  <div class="text-6xl font-bold" :class="props.class">
    <span class="relative inline-block">
      <template v-for="sparkle in sparkles" :key="sparkle.id">
        <!-- 星星：淡入淡出、缩放并旋转 -->
        <Motion
          :initial="{ opacity: 0, scale: 0, rotate: 75 }"
          :animate="{
            opacity: [0, 1, 0],
            scale: [0, sparkle.scale, 0],
            rotate: [75, 120, 150],
          }"
          :transition="{
            duration: 0.8,
            repeat: Infinity,
            delay: sparkle.delay,
          }"
          as="svg"
          class="pointer-events-none absolute z-20"
          :style="{
            left: sparkle.x,
            top: sparkle.y,
            opacity: 0,
          }"
          width="21"
          height="21"
          viewBox="0 0 21 21"
        >
          <path
            d="M9.82531 0.843845C10.0553 0.215178 10.9446 0.215178 11.1746 0.843845L11.8618 2.72026C12.4006 4.19229 12.3916 6.39157 13.5 7.5C14.6084 8.60843 16.8077 8.59935 18.2797 9.13822L20.1561 9.82534C20.7858 10.0553 20.7858 10.9447 20.1561 11.1747L18.2797 11.8618C16.8077 12.4007 14.6084 12.3916 13.5 13.5C12.3916 14.6084 12.4006 16.8077 11.8618 18.2798L11.1746 20.1562C10.9446 20.7858 10.0553 20.7858 9.82531 20.1562L9.13819 18.2798C8.59932 16.8077 8.60843 14.6084 7.5 13.5C6.39157 12.3916 4.19225 12.4007 2.72023 11.8618L0.843814 11.1747C0.215148 10.9447 0.215148 10.0553 0.843814 9.82534L2.72023 9.13822C4.19225 8.59935 6.39157 8.60843 7.5 7.5C8.60843 6.39157 8.59932 4.19229 9.13819 2.72026L9.82531 0.843845Z"
            :fill="sparkle.color"
          />
        </Motion>
      </template>
      {{ text }}
    </span>
  </div>
</template>
