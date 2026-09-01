<script setup lang="ts">
import type { GuideStep } from "~/components/reborn/ui/reborn-guide/RebornGuide.vue";

const current = ref(-1);

/** 目标元素 ref */
const headerRef = ref<HTMLElement | null>(null);
const card1Ref = ref<HTMLElement | null>(null);
const card2Ref = ref<HTMLElement | null>(null);
const actionBtnRef = ref<HTMLElement | null>(null);

const placementOptions = [
  "top", "bottom", "left", "right",
  "top-left", "top-right", "bottom-left", "bottom-right",
  "left-top", "left-bottom", "right-top", "right-bottom",
];

/** 演练场绑定值 */
const state = ref({
  mode: "popup" as "popup" | "dialog",
  placement: "bottom",
});

/** 生成 steps */
const steps = computed<GuideStep[]>(() => [
  {
    element: () => headerRef.value,
    title: "欢迎使用引导组件",
    body: "这是 RebornGuide 引导组件，用于逐步骤向用户介绍页面功能。点击「下一步」继续。",
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
    placement: state.value.placement as any,
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

/** 功能卡片本身是引导的落点，用描边盒标识，不填充 */
const targetClass = "border-default rounded-ui-md border border-dashed p-6";

/** 演练场控制面板配置 */
const controls = [
  {
    title: "行为",
    children: [
      {
        label: "模式",
        key: "mode",
        component: "select" as const,
        defaultValue: "popup",
        props: {
          options: [
            { label: "浮层 popup", value: "popup" },
            { label: "对话框 dialog", value: "dialog" },
          ],
        },
      },
      {
        label: "默认定位",
        key: "placement",
        component: "select" as const,
        defaultValue: "bottom",
        props: { options: placementOptions.map((p) => ({ label: p, value: p })) },
      },
    ],
  },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      component-name="RebornGuide"
      title="交互演练场"
      description="切换浮层 / 对话框模式与默认定位，再点「开始引导」逐步走完高亮流程。"
    >
      <DemoBlock>
        <RebornButton
          v-if="current < 0"
          color="primary"
          @click="startGuide"
        >
          开始引导
        </RebornButton>
        <RebornButton
          v-else
          variant="outlined"
          @click="restartGuide"
        >
          重新开始
        </RebornButton>
        <RebornButton
          variant="text"
          @click="current = -1"
        >
          停止
        </RebornButton>
      </DemoBlock>
    </Playground>

    <DemoSection
      title="引导落点"
      description="高亮目标用虚线描边标识，本身无填充；引导浮层由组件自己画。"
    >
      <DemoBlock layout="stack">
        <header
          ref="headerRef"
          class="text-center"
        >
          <p class="text-highlighted text-sm font-semibold">页面头部</p>
          <p class="text-muted mt-1 text-sm">逐步引导用户了解页面功能</p>
        </header>

        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div
            ref="card1Ref"
            :class="targetClass"
          >
            <Icon
              name="lucide:zap"
              class="text-primary mb-3 size-6"
            />
            <p class="text-highlighted text-sm font-semibold">闪电般快速</p>
            <p class="text-muted mt-1 text-sm">基于 Vue 3 Composition API 构建。</p>
          </div>
          <div
            ref="card2Ref"
            :class="targetClass"
          >
            <Icon
              name="lucide:shield-check"
              class="text-success mb-3 size-6"
            />
            <p class="text-highlighted text-sm font-semibold">类型安全</p>
            <p class="text-muted mt-1 text-sm">完整的 TypeScript 类型定义。</p>
          </div>
          <div :class="targetClass">
            <Icon
              name="lucide:palette"
              class="text-warning mb-3 size-6"
            />
            <p class="text-highlighted text-sm font-semibold">高度可定制</p>
            <p class="text-muted mt-1 text-sm">支持 ui 属性覆盖任意样式。</p>
          </div>
        </div>

        <div
          ref="actionBtnRef"
          class="text-center"
        >
          <RebornButton
            color="primary"
            @click="startGuide"
          >
            点击体验引导
          </RebornButton>
        </div>

        <DemoNote
          v-if="current >= 0"
          tone="dimmed"
        >
          当前步骤：{{ current + 1 }} / {{ steps.length }} · 模式：{{ steps[current]?.mode || state.mode }} · Placement：{{ steps[current]?.placement || "-" }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <RebornGuide
      v-model:current="current"
      :steps="steps"
      :mode="state.mode"
      :z-index="9999"
    >
      <template #counter="{ current: cur, total }">
        <span class="text-dimmed text-xs">步骤 {{ cur }} / {{ total }}</span>
      </template>
    </RebornGuide>
  </div>
</template>
