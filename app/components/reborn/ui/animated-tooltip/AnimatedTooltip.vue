<script setup lang="ts">
import { AnimatePresence, Motion } from "motion-v";
import { computed, shallowRef } from "vue";

interface Item {
  id: number;
  name: string;
  designation: string;
  image: string;
}

interface Props {
  items: Item[];
}

defineProps<Props>();

const hoveredIndex = shallowRef<number | null>(null);
const mouseX = shallowRef(0);

// 根据指针相对头像中心的横向偏移计算提示框的旋转与位移
const rotation = computed<number>(() => {
  const x = mouseX.value;
  return (x / 100) * 50;
});

const translation = computed<number>(() => {
  const x = mouseX.value;
  return (x / 100) * 50;
});

// 以监听器所在的头像容器（currentTarget）为基准测量，指针移到浮出的提示框等子元素上时角度不会跳变
function updateMouseX(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const halfWidth = rect.width / 2;
  mouseX.value = event.clientX - rect.left - halfWidth;
}

// 进入时立即计算一次初始位置
function handleMouseEnter(event: MouseEvent, itemId: number) {
  hoveredIndex.value = itemId;
  updateMouseX(event);
}

function handleMouseMove(event: MouseEvent) {
  updateMouseX(event);
}
</script>

<template>
  <!-- 单一根节点：父组件传入的 class / style / 事件落在这一层，头像仍横向排列 -->
  <div class="flex items-center">
    <div
      v-for="item in items"
      :key="item.id"
      class="group relative -mr-4"
      @mouseenter="(e) => handleMouseEnter(e, item.id)"
      @mouseleave="hoveredIndex = null"
      @mousemove="handleMouseMove"
    >
      <!-- 提示框：AnimatePresence 管理 v-if 移除，exit 离场动画才会生效 -->
      <AnimatePresence>
        <Motion
          v-if="hoveredIndex === item.id"
          :initial="{
            opacity: 0,
            y: 20,
            scale: 0.6,
          }"
          :animate="{
            opacity: 1,
            y: 0,
            scale: 1,
          }"
          :transition="{
            type: 'spring',
            stiffness: 260,
            damping: 10,
          }"
          :exit="{
            opacity: 0,
            y: 20,
            scale: 0.6,
          }"
          :style="{
            translateX: `${translation}px`,
            rotate: `${rotation}deg`,
          }"
          class="absolute -top-16 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center justify-center rounded-md bg-black px-4 py-2 text-sm whitespace-nowrap shadow-xl"
        >
          <div
            class="absolute right-1/2 -bottom-px z-30 me-1 h-px w-2/5 translate-x-1/2 bg-gradient-to-r from-transparent via-emerald-500 to-transparent"
          />
          <div
            class="absolute -bottom-px left-1/2 z-30 ms-1 h-px w-2/5 -translate-x-1/2 bg-gradient-to-r from-transparent via-sky-500 to-transparent"
          />
          <div class="relative z-30 text-base font-bold text-white">
            {{ item.name }}
          </div>
          <div class="text-sm text-white">{{ item.designation }}</div>
        </Motion>
      </AnimatePresence>

      <!-- 头像 -->
      <img
        :src="item.image"
        :alt="item.name"
        class="relative !m-0 size-14 rounded-full border-2 border-white object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105"
      >
    </div>
  </div>
</template>
