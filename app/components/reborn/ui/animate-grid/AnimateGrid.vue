<script lang="ts" setup>
import { useTimeoutFn } from "@vueuse/core";
import { computed, shallowRef } from "vue";

interface Cards {
  logo: string;
}

interface Props {
  class?: string;
  textGlowStartColor?: string;
  perspective?: number;
  textGlowEndColor?: string;
  cards: Cards[];
  rotateX?: number;
  rotateY?: number;
}

const {
  textGlowStartColor = "#38ef7d80",
  textGlowEndColor = "#38ef7d",
  perspective = 600,
  rotateX = -1,
  rotateY = -15,
  ...props
} = defineProps<Props>();

// 实际列数：不足 4 张时按张数排成一行，否则固定 4 列
const columns = computed(() => Math.min(Math.max(props.cards.length, 1), 4));

// 悬停状态由响应式数据驱动类名，不再直接改 DOM 的 classList；
// 指针离开后该卡片保留 200ms 再回落（lingeringIndex），重新进入时立即取消回落
const hoveredIndex = shallowRef<number | null>(null);
const lingeringIndex = shallowRef<number | null>(null);
const { start: startLinger, stop: stopLinger } = useTimeoutFn(
  () => {
    lingeringIndex.value = null;
  },
  200,
  { immediate: false },
);

function handleEnter(index: number) {
  hoveredIndex.value = index;
  if (lingeringIndex.value === index) {
    stopLinger();
    lingeringIndex.value = null;
  }
}

function handleLeave(index: number) {
  if (hoveredIndex.value === index) hoveredIndex.value = null;
  lingeringIndex.value = index;
  startLinger();
}

/** 按实际列数计算上下左右相邻卡片的下标 */
function adjacentOf(index: number): number[] {
  const cols = columns.value;
  const total = props.cards.length;
  const result: number[] = [];
  if (index % cols !== 0) result.push(index - 1);
  if (index % cols !== cols - 1 && index + 1 < total) result.push(index + 1);
  if (index - cols >= 0) result.push(index - cols);
  if (index + cols < total) result.push(index + cols);
  return result;
}

const raisedBig = computed(() => {
  const set = new Set<number>();
  if (hoveredIndex.value !== null) set.add(hoveredIndex.value);
  if (lingeringIndex.value !== null) set.add(lingeringIndex.value);
  return set;
});

const raisedSmall = computed(() => {
  const set = new Set<number>();
  for (const index of raisedBig.value) {
    for (const adjacent of adjacentOf(index)) {
      if (!raisedBig.value.has(adjacent)) set.add(adjacent);
    }
  }
  return set;
});
</script>

<template>
  <div
    class="relative block"
    :class="[props.class]"
  >
    <div
      class="relative grid w-full max-w-full items-center justify-center"
      :class="[props.cards.length < 4 ? `grid-cols-${props.cards.length}` : 'grid-cols-4']"
      :style="{
        transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
      }"
    >
      <div
        v-for="(item, index) in props.cards"
        :key="index"
        class="card block rounded border border-transparent px-3 py-5 transition-all duration-200"
        :class="{
          'card-raised-big': raisedBig.has(index),
          'card-raised-small': raisedSmall.has(index),
        }"
        :style="{ zIndex: index + 1 }"
        @mouseenter="handleEnter(index)"
        @mouseleave="handleLeave(index)"
      >
        <slot
          name="logo"
          :logo="item.logo"
          :index="index"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.logo svg {
  max-height: 100%;
  max-width: 100%;
  display: block;
  margin: 0 auto;
}

.grid-transform:before {
  content: "";
  z-index: -1;
  left: -10%;
  top: -10%;
  position: absolute;
  width: 150%;
  height: 120%;
  background: radial-gradient(circle, #d9fbe8 0%, white 70%, transparent 100%);
  opacity: 0.5;
}

.dark .grid-transform:before {
  background: radial-gradient(circle, #1f2937 0%, #020420 70%, transparent 100%);
}

.card {
  box-shadow:
    2px 2px 5px rgba(217, 251, 232, 0.5),
    3px 3px 10px rgba(217, 251, 232, 0.5),
    6px 6px 20px rgba(217, 251, 232, 0.1);
}

.dark .card {
  box-shadow:
    2px 2px 5px rgba(31, 41, 55, 0.2),
    3px 3px 10px rgba(31, 41, 55, 0.2),
    6px 6px 20px rgba(31, 41, 55, 0.1);
}

.card svg {
  opacity: 0.7;
  transition: 0.2s;
}

.dark .card:hover {
  box-shadow:
    3px 3px 5px rgba(31, 41, 55, 1),
    5px 5px 10px rgba(31, 41, 55, 1),
    10px 10px 20px rgba(31, 41, 55, 1);
}

.card:hover svg {
  opacity: 1;
}

.card svg {
  shape-rendering: geometricPrecision;
}

.card-raised-small {
  border: 1px solid rgba(0, 193, 106, 0.3);
  transform: scale(1.05) translateX(-5px) translateY(-5px) translateZ(0);
  animation: text-glow-small 1.5s alternate infinite ease-in-out;
}

.card-raised-big {
  border: 1px solid rgba(0, 193, 106, 0.5);
  background-color: white;
  transform: scale(1.15) translateX(-20px) translateY(-20px) translateZ(15px);
  animation: text-glow 1.5s alternate infinite ease-in-out;
}

.dark .card-raised-big {
  border: 1px solid rgba(217, 251, 232, 0.3);
  background-color: #020420;
}

.dark .card-raised-small {
  border: 1px solid rgba(217, 251, 232, 0.2);
  transform: scale(1.05) translateX(-5px) translateY(-5px) translateZ(0);
}

@keyframes text-glow {
  0% {
    filter: drop-shadow(0px 0px 2px v-bind(textGlowStartColor));
  }

  100% {
    filter: drop-shadow(0px 1px 8px v-bind(textGlowEndColor));
  }
}

@keyframes text-glow-small {
  0% {
    filter: drop-shadow(0px 0px 2px rgba(56, 239, 125, 0.1));
  }

  100% {
    filter: drop-shadow(0px 1px 4px rgba(56, 239, 125, 0.5));
  }
}
</style>
