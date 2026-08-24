<script setup lang="ts">
// 演示页：验证通用滚动条三档尺寸与“不占宽度”特性（临时页面，验证后移除）
import { onBeforeUnmount, onMounted, ref } from 'vue';

// 用于对比的两个盒子：左侧可滚动（出现滚动条），右侧无滚动（无滚动条）
const scrollBox = ref<HTMLElement | null>(null);
const plainBox = ref<HTMLElement | null>(null);
const scrollWidth = ref(0);
const plainWidth = ref(0);

// 测量内容可视宽度：overlay 滚动条不占宽度时，两者应一致
const measure = () => {
  scrollWidth.value = scrollBox.value?.clientWidth ?? 0;
  plainWidth.value = plainBox.value?.clientWidth ?? 0;
};

let observer: ResizeObserver | undefined;

onMounted(() => {
  // 等待两帧，确保布局与路由过渡完成后再测量，避免拿到 0
  requestAnimationFrame(() => requestAnimationFrame(measure));
  // 窗口尺寸变化时实时重测，直观验证“有/无滚动条宽度始终一致”
  observer = new ResizeObserver(measure);
  if (scrollBox.value) observer.observe(scrollBox.value);
  if (plainBox.value) observer.observe(plainBox.value);
});

onBeforeUnmount(() => observer?.disconnect());

// 生成占位文本，用于撑出滚动
const lines = Array.from({ length: 40 }, (_, i) => `第 ${i + 1} 行：Reborn UI 通用滚动条演示内容`);
const plainLines = Array.from({ length: 6 }, (_, i) => `第 ${i + 1} 行：普通内容`);
</script>

<template>
  <div class="min-h-screen bg-zinc-50 p-8 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
    <div class="mx-auto max-w-5xl space-y-10">
      <header class="space-y-2">
        <h1 class="text-2xl font-bold">通用滚动条样式演示</h1>
        <p class="text-sm text-zinc-500">
          使用 <code class="rounded bg-zinc-200 px-1 dark:bg-zinc-800">.reborn-scrollbar</code> 系列类；尺寸由 CSS 变量
          <code class="rounded bg-zinc-200 px-1 dark:bg-zinc-800">--reborn-scrollbar-size</code> 驱动。
        </p>
      </header>

      <!-- 三档尺寸 -->
      <section class="space-y-4">
        <h2 class="text-lg font-semibold">三档尺寸：4 / 6 / 8（默认 6）</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            v-for="item in [
              { cls: 'reborn-scrollbar--4', label: '4px' },
              { cls: '', label: '默认 6px' },
              { cls: 'reborn-scrollbar--8', label: '8px' },
            ]" :key="item.label" class="space-y-2"
          >
            <div class="text-sm font-medium text-zinc-500">{{ item.label }}</div>
            <div
              class="reborn-scrollbar h-56 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
              :class="item.cls"
            >
              <p v-for="line in lines" :key="line" class="text-sm leading-6">{{ line }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 不占宽度：内容宽度对比 -->
      <section class="space-y-4">
        <h2 class="text-lg font-semibold">不占宽度：有无滚动条时内容宽度一致</h2>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div class="space-y-2">
            <div class="text-sm font-medium text-zinc-500">可滚动（出现滚动条）内容宽度：{{ scrollWidth }}px</div>
            <div
              ref="scrollBox"
              class="reborn-scrollbar h-40 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p v-for="line in lines" :key="line" class="text-sm leading-6">{{ line }}</p>
            </div>
          </div>
          <div class="space-y-2">
            <div class="text-sm font-medium text-zinc-500">无滚动条内容宽度：{{ plainWidth }}px</div>
            <div
              ref="plainBox"
              class="h-40 rounded-lg border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p v-for="line in plainLines" :key="line" class="text-sm leading-6">{{ line }}</p>
            </div>
          </div>
        </div>
        <p class="text-sm text-zinc-500">
          宽度一致（{{ scrollWidth }}px ≈ {{ plainWidth }}px）即说明滚动条为浮层式、未挤压内容。
        </p>
      </section>
    </div>
  </div>
</template>