<script setup lang="ts">
import { ref, computed } from "vue";
import type { GuideStep } from "~/components/reborn/ui/reborn-guide/RebornGuide.vue";

const current = ref(-1);
const mode = ref<"popup" | "dialog">("popup");
const placement = ref("bottom");

/** 目标元素 ref */
const headerRef = ref<HTMLElement | null>(null);
const card1Ref = ref<HTMLElement | null>(null);
const card2Ref = ref<HTMLElement | null>(null);
const actionBtnRef = ref<HTMLElement | null>(null);

/** 生成 steps */
const steps = computed<GuideStep[]>(() => [
  {
    element: () => headerRef.value,
    title: "欢迎使用引导组件",
    body: '这是 RebornGuide 引导组件，用于逐步骤向用户介绍页面功能。点击「下一步」继续。',
    placement: "bottom" as const,
  },
  {
    element: () => card1Ref.value,
    title: "功能卡片一",
    body: "这里展示了主要的功能信息。引导框可以自动定位在高亮元素的周围。",
    placement: "right" as const,
    highlightPadding: 12,
  },
  {
    element: () => card2Ref.value,
    title: "功能卡片二",
    body: "高亮元素会通过 CSS transition 平滑移动。你可以滚动页面，高亮位置会自动跟随。",
    placement: "left" as const,
  },
  {
    element: () => actionBtnRef.value,
    title: "操作按钮",
    body: "高亮框支持 12 种定位方向：top、bottom、left、right 及其组合。当前步骤可自定义按钮文案。",
    placement: placement.value as any,
    nextButtonProps: { label: "了解对话框模式" },
  },
  {
    element: () => actionBtnRef.value,
    title: "对话框模式",
    body: "除了浮层高亮模式，Guide 组件还支持对话框模式（dialog），适用于需要用户专注阅读的场景。",
    mode: "dialog" as const,
    placement: "center" as const,
  },
]);

function startGuide() {
  current.value = 0;
}

function restartGuide() {
  current.value = -1;
  setTimeout(() => {
    current.value = 0;
  }, 300);
}

function onFinish(ctx: { e: MouseEvent; current: number; total: number }) {
  // 引导完成后隐藏
}

function onChange(step: number) {
  // 步骤变化
}

const placementOptions = [
  "top", "bottom", "left", "right",
  "top-left", "top-right", "bottom-left", "bottom-right",
  "left-top", "left-bottom", "right-top", "right-bottom",
];
</script>

<template>
  <div class="p-8 w-full">
    <!-- 页面头部 -->
    <header ref="headerRef" class="mb-12 text-center">
      <h1 class="text-3xl font-bold text-gray-9 dark:text-gray-1 mb-2">
        RebornGuide 引导组件
      </h1>
      <p class="text-gray-5 dark:text-gray-4">
        逐步骤引导用户了解页面功能
      </p>
    </header>

    <!-- 控制面板 -->
    <div class="mb-8 p-4 rounded-ui-lg border border-gray-2 dark:border-gray-7 bg-gray-1 dark:bg-gray-8">
      <div class="flex flex-wrap items-center gap-4">
        <RebornButton
          v-if="current < 0"
          color="primary"
          @click="startGuide"
        >
          开始引导
        </RebornButton>
        <RebornButton
          v-else
          variant="outline"
          @click="restartGuide"
        >
          重新开始
        </RebornButton>

        <RebornButton
          variant="subtle"
          @click="current = -1"
        >
          停止
        </RebornButton>

        <div class="flex items-center gap-2 ml-4">
          <span class="text-sm text-gray-5">模式：</span>
          <RebornButton
            :variant="mode === 'popup' ? 'solid' : 'outline'"
            size="sm"
            @click="mode = 'popup'"
          >
            Popup
          </RebornButton>
          <RebornButton
            :variant="mode === 'dialog' ? 'solid' : 'outline'"
            size="sm"
            @click="mode = 'dialog'"
          >
            Dialog
          </RebornButton>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-sm text-gray-5">默认 Placement：</span>
          <select
            v-model="placement"
            class="px-2 py-1 text-sm border border-gray-2 rounded-lg bg-white dark:bg-gray-8"
          >
            <option v-for="p in placementOptions" :key="p" :value="p">{{ p }}</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 功能卡片区域 -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div
        ref="card1Ref"
        class="rounded-ui-lg border border-gray-2 dark:border-gray-7 bg-white dark:bg-gray-9 p-6 shadow-sm"
      >
        <div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Icon name="lucide:zap" class="size-6 text-primary" />
        </div>
        <h3 class="text-lg font-semibold text-gray-9 dark:text-gray-1 mb-2">闪电般快速</h3>
        <p class="text-sm text-gray-5 dark:text-gray-4">
          基于 Vue 3 Composition API，使用 defineModel 和 TypeScript 构建，开发体验极致流畅。
        </p>
      </div>

      <div
        ref="card2Ref"
        class="rounded-ui-lg border border-gray-2 dark:border-gray-7 bg-white dark:bg-gray-9 p-6 shadow-sm"
      >
        <div class="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <Icon name="lucide:shield-check" class="size-6 text-success" />
        </div>
        <h3 class="text-lg font-semibold text-gray-9 dark:text-gray-1 mb-2">类型安全</h3>
        <p class="text-sm text-gray-5 dark:text-gray-4">
          完整的 TypeScript 类型定义，所有 Props、Events、Slots 都有智能提示。
        </p>
      </div>

      <div
        class="rounded-ui-lg border border-gray-2 dark:border-gray-7 bg-white dark:bg-gray-9 p-6 shadow-sm"
      >
        <div class="w-12 h-12 rounded-full bg-warning/10 flex items-center justify-center mb-4">
          <Icon name="lucide:palette" class="size-6 text-warning" />
        </div>
        <h3 class="text-lg font-semibold text-gray-9 dark:text-gray-1 mb-2">高度可定制</h3>
        <p class="text-sm text-gray-5 dark:text-gray-4">
          支持 ui 属性覆盖任意样式，支持步骤级按钮配置，满足各种业务场景。
        </p>
      </div>
    </div>

    <!-- 操作按钮区 -->
    <div ref="actionBtnRef" class="text-center">
      <RebornButton
        color="primary"
        size="lg"
        @click="startGuide"
      >
        点击体验引导
      </RebornButton>
    </div>

    <!-- 事件日志 -->
    <div v-if="current >= 0" class="mt-8 p-4 rounded-ui-lg border border-gray-2 dark:border-gray-7 bg-gray-1 dark:bg-gray-8">
      <h4 class="text-sm font-semibold text-gray-7 dark:text-gray-3 mb-2">事件日志</h4>
      <div class="text-xs text-gray-5">
        当前步骤：{{ current + 1 }} / {{ steps.length }}
        &nbsp;|&nbsp; 模式：{{ steps[current]?.mode || mode }}
        &nbsp;|&nbsp; Placement：{{ steps[current]?.placement || '-' }}
      </div>
    </div>

    <!-- Guide 组件 -->
    <RebornGuide
      v-model:current="current"
      :steps="steps"
      :mode="mode"
      :z-index="9999"
      @finish="onFinish"
      @change="onChange"
    >
      <template #counter="{ current: cur, total }">
        <span class="text-xs text-gray-4">
          步骤 {{ cur }} / {{ total }}
        </span>
      </template>
    </RebornGuide>
  </div>
</template>

<script lang="ts">
export default {
  name: "RebornGuideDemo",
};
</script>
