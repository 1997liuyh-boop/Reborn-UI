<script setup lang="ts">
import RebornInputNumber from "~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue";
import {
  inputNumberColors,
  inputNumberSizes,
  inputNumberShapes,
} from "~/components/reborn/ui/reborn-input-number/reborn-input-number.config";

// --- Playground 状态 ---
const state = ref<Record<string, any>>({
  value: 10,
  size: "md",
  color: "primary",
  min: 0,
  max: 100,
  step: 1,
  shape: "square",
  disabled: false,
  readonly: false,
});

// --- 控制面板配置 ---
const controls: any = [
  {
    title: "基础属性",
    children: [
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: {
          options: inputNumberSizes.map((s) => ({ label: s, value: s })),
        },
      },
      {
        label: "配色方案",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          options: inputNumberColors.map((c) => ({
            label: c,
            value: c,
          })),
        },
      },
      {
        label: "形状轮廓",
        key: "shape",
        component: "select" as const,
        defaultValue: "square",
        props: {
          options: inputNumberShapes.map((s) => ({
            label: s,
            value: s,
          })),
        },
      },
    ],
  },
  {
    title: "数值控制",
    children: [
      { label: "最小值", key: "min", component: "input" as const, defaultValue: 0, props: { type: "number" } },
      { label: "最大值", key: "max", component: "input" as const, defaultValue: 100, props: { type: "number" } },
      { label: "步长", key: "step", component: "input" as const, defaultValue: 1, props: { type: "number" } },
    ],
  },
  {
    title: "状态控制",
    children: [
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
      { label: "仅允许增减（Readonly）", key: "readonly", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

// --- 其他示例状态 ---
const basicValue = ref(5);
const coloredValue = ref(20);
const customValue = ref(8);

const sizeSections = [
  { label: "小尺寸 (sm)", size: "sm" as const },
  { label: "标准尺寸 (md)", size: "md" as const },
  { label: "大尺寸 (lg)", size: "lg" as const },
];
</script>

<template>
  <div class="flex flex-col gap-16 pb-24">
    <!-- 第一部分：交互式游乐场 -->
    <Playground v-model="state" :controls="controls" component-name="RebornInputNumber" title="交互体验"
      description="通过左侧面板实时调节组件属性，在右侧查看视觉反馈">
      <RebornInputNumber v-model="state.value" :size="state.size" :color="state.color" :shape="state.shape"
        :min="state.min" :max="state.max" :step="state.step" :disabled="state.disabled" :readonly="state.readonly" />
    </Playground>

    <!-- 第二部分：组件变体 -->
    <section>
      <!-- 色彩预设 -->
      <div class="space-y-6">
        <div class="flex items-center gap-3">
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">核心色彩</h3>
          <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
        </div>
        <div class="grid gap-4 sm:grid-cols-2">
          <div v-for="c in inputNumberColors" :key="c"
            class="flex items-center justify-between rounded-2xl border border-gray-50 bg-white p-4 transition-all hover:border-gray-200 hover:shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <span class="text-xs font-bold text-gray-400 uppercase tracking-tighter">{{ c }}</span>
            <RebornInputNumber v-model="coloredValue" :color="c" size="sm" />
          </div>
        </div>
      </div>

      <!-- 尺寸对比 -->
      <div class="space-y-6 mt-12">
        <div class="flex items-center gap-3">
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">尺寸规范</h3>
          <div class="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
        </div>
        <div
          class="flex h-[180px] items-center justify-center gap-8 rounded-2xl border border-gray-100 bg-gray-50/30 p-8 dark:border-gray-800 dark:bg-gray-900/30">
          <div v-for="s in sizeSections" :key="s.size" class="flex flex-col items-center gap-4">
            <RebornInputNumber v-model="basicValue" :size="s.size" color="info" />
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 第三部分：深度定制 -->
    <section class="space-y-8">
      <div class="flex items-center gap-3">
        <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">进阶自定义</h3>
        <p class="text-sm text-gray-500">通过插槽和配置项实现无限可能</p>
      </div>

      <div class="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        <!-- 甜美主题 -->
        <div
          class="group relative overflow-hidden rounded-[40px] bg-rose-50/30 p-8 transition-all hover:bg-rose-50 dark:bg-rose-950/10">
          <div class="mb-6 flex items-center gap-2 text-rose-500 font-black">
            <Icon name="lucide:heart" class="size-5 fill-rose-500" />
            <span>Sweet Love</span>
          </div>
          <RebornInputNumber v-model="customValue" class="w-full" :ui="{
            wrapper: 'bg-white ring-rose-200 focus-within:ring-rose-400 rounded-2xl shadow-sm h-14 border-0',
            button: 'text-rose-400 hover:bg-rose-50 active:scale-95 transition-all',
            input: 'text-rose-600 font-black',
          }">
            <template #decrement="{ iconClass }">
              <Icon name="lucide:heart-minus" :class="iconClass" />
            </template>
            <template #increment="{ iconClass }">
              <Icon name="lucide:heart-plus" :class="iconClass" />
            </template>
          </RebornInputNumber>
        </div>

        <!-- 科技霓虹 -->
        <div
          class="group relative overflow-hidden rounded-[40px] bg-gray-900 p-8 transition-all hover:shadow-2xl hover:shadow-indigo-500/20">
          <div class="mb-6 flex items-center gap-2 text-indigo-400 font-mono text-sm uppercase tracking-tighter">
            <Icon name="lucide:zap" class="size-4 fill-indigo-400" />
            <span>Cyber Neon</span>
          </div>
          <RebornInputNumber v-model="customValue" class="w-full" :ui="{
            wrapper:
              'bg-gray-800 ring-indigo-500/50 focus-within:ring-indigo-400 shadow-[0_0_20px_rgba(99,102,241,0.1)] rounded-none h-12 border-0',
            input: 'text-white font-mono leading-none',
            button: 'text-indigo-400 hover:bg-indigo-500/20 transition-all',
            divider: 'bg-indigo-500/20',
          }">
            <template #increment>
              <Icon name="lucide:arrow-right" class="size-4" />
            </template>
            <template #decrement>
              <Icon name="lucide:arrow-left" class="size-4" />
            </template>
          </RebornInputNumber>
        </div>

        <!-- 极简无界 -->
        <div
          class="group flex flex-col justify-center rounded-[40px] border-2 border-dashed border-gray-100 p-8 transition-all hover:border-gray-200 dark:border-gray-800">
          <div class="mb-6 text-sm text-gray-400 font-medium px-2">Minimalist</div>
          <RebornInputNumber v-model="customValue" class="w-full font-bold" :ui="{
            wrapper:
              'bg-transparent ring-0 focus-within:ring-0 border-b-2 border-gray-200 dark:border-gray-700 rounded-none h-12 transition-all focus-within:border-gray-900 dark:focus-within:border-white',
            button: 'text-gray-300 hover:text-gray-900 dark:hover:text-white',
            input: 'font-black text-gray-900 dark:text-white',
            divider: 'hidden',
          }" />
        </div>
      </div>
    </section>
  </div>
</template>
