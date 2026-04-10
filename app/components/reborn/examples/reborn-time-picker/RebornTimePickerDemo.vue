<script setup lang="ts">
import RebornTimePicker from "~/components/reborn/ui/reborn-time-picker/RebornTimePicker.vue";
import {
  timePickerColors,
  timePickerSizes,
} from "~/components/reborn/ui/reborn-time-picker/reborn-time-picker.config";

// --- 1. Playground 状态与配置 ---

const state = ref<Record<string, any>>({
  value: "09:30:00",
  size: "md",
  color: "primary",
  isRange: false,
  arrowControl: false,
  disabled: false,
});

const controls = [
  {
    title: "核心配置",
    children: [
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: {
          options: timePickerSizes.map((s) => ({ label: s.toUpperCase(), value: s })),
        },
      },
      {
        label: "品牌色彩",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          options: timePickerColors.map((c) => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
        },
      },
    ],
  },
  {
    title: "功能开关",
    children: [
      {
        label: "范围选择",
        key: "isRange",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "箭头控制",
        key: "arrowControl",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "禁用组件",
        key: "disabled",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
];

// --- 2. Showcases 状态与函数 ---

const basicValue = ref("10:00:00");
const arrowValue = ref("14:20:00");
const rangeValue = ref(["09:00:00", "18:00:00"]);
const limitedValue = ref("12:00:00");

function disabledHours() {
  return [0, 1, 2, 3, 4, 23];
}
function disabledMinutes(hour: number) {
  if (hour === 12) return Array.from({ length: 30 }, (_, i) => i);
  return [];
}
</script>

<template>
  <div class="space-y-12 pb-20">
    <!-- Header -->
    <header class="space-y-4">
      <div class="flex items-center gap-3">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Time Picker</h1>
        <span
          class="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary dark:bg-primary-900/30">时间选择器</span>
      </div>
      <p class="max-w-3xl text-lg text-gray-500 dark:text-gray-400">
        一款响应式的时间选择组件，支持滚轮选择与箭头控制模式，完美适配各种业务场景的时间输入需求。
      </p>
    </header>

    <!-- Playground -->
    <section>
      <Playground v-model="state" :controls="controls" component-name="RebornTimePicker" title="交互演练场"
        description="通过左侧面板自定义组件属性，实时查看效果与生成的代码。">
        <template #default>
          <div class="flex items-center justify-center p-8">
            <RebornTimePicker v-model="state.value" :size="state.size" :color="state.color" :is-range="state.isRange"
              :arrow-control="state.arrowControl" :disabled="state.disabled" class="w-full max-w-xs" />
          </div>
        </template>
      </Playground>
    </section>

    <!-- Showcases -->
    <section class="space-y-8">
      <h2 class="text-2xl font-bold text-gray-900 dark:text-white">场景演示</h2>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <!-- 基础示例 -->
        <div
          class="group relative rounded-3xl border border-gray-200 bg-white/50 p-6 transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/30">
          <div class="mb-6">
            <h3 class="text-lg font-semibold">基础用法</h3>
            <p class="text-sm text-gray-500">最基本的时间选择方式，支持直观的滚轮操作。</p>
          </div>
          <div class="flex flex-col gap-4">
            <RebornTimePicker v-model="basicValue" />
            <div class="rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              选择值: <span class="font-mono font-medium text-primary">{{ basicValue }}</span>
            </div>
          </div>
        </div>

        <!-- 箭头控制 -->
        <div
          class="group relative rounded-3xl border border-gray-200 bg-white/50 p-6 transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/30">
          <div class="mb-6">
            <h3 class="text-lg font-semibold">箭头控制模式</h3>
            <p class="text-sm text-gray-500">适合桌面端操作的点击式选择，提供精确的步骤调整。</p>
          </div>
          <div class="flex flex-col gap-4">
            <RebornTimePicker v-model="arrowValue" arrow-control color="secondary" />
            <div class="rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              选择值: <span class="font-mono font-medium text-secondary-500">{{ arrowValue }}</span>
            </div>
          </div>
        </div>

        <!-- 范围选择 -->
        <div
          class="group relative rounded-3xl border border-gray-200 bg-white/50 p-6 transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/30 lg:col-span-2">
          <div class="mb-6">
            <h3 class="text-lg font-semibold">时间范围选择</h3>
            <p class="text-sm text-gray-500">一键开启时间段选择模式，适用于排班、会议等时段预约场景。</p>
          </div>
          <div class="flex flex-col gap-4">
            <RebornTimePicker v-model="rangeValue" is-range color="success" />
            <div class="rounded-xl bg-gray-50 p-3 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              选定时段: <span class="font-mono font-medium text-success-600 dark:text-success-400">{{ rangeValue[0] }} 至 {{
                rangeValue[1] }}</span>
            </div>
          </div>
        </div>

        <!-- 限制可选时间 -->
        <div
          class="group relative rounded-3xl border border-gray-200 bg-white/50 p-6 transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/30">
          <div class="mb-6">
            <h3 class="text-lg font-semibold">选择约束</h3>
            <p class="text-sm text-gray-500">通过禁用函数精确控制可选时间段，确保业务数据合规。</p>
          </div>
          <div class="flex flex-col gap-4">
            <RebornTimePicker v-model="limitedValue" color="warning" :disabled-hours="disabledHours"
              :disabled-minutes="disabledMinutes" />
            <div class="text-xs text-gray-400 italic">
              * 凌晨 0-4 点、深夜 23 点禁用；12 点禁止选择前 30 分钟。
            </div>
          </div>
        </div>

        <!-- 极简禁用 -->
        <div
          class="group relative rounded-3xl border border-gray-200 bg-white/50 p-6 transition-all hover:shadow-xl dark:border-gray-800 dark:bg-gray-900/30">
          <div class="mb-6">
            <h3 class="text-lg font-semibold">只读与禁用</h3>
            <p class="text-sm text-gray-500">组件支持全局禁用，保持视觉一致性的同时防止非预期交互。</p>
          </div>
          <div class="flex flex-col gap-4 opacity-70">
            <RebornTimePicker disabled value="08:00:00" />
            <div class="text-xs font-medium text-red-500/80">组件当前处于不可交互状态</div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
