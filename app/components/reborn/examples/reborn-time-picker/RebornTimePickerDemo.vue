<script setup lang="ts">
import RebornTimePicker from "~/components/reborn/ui/reborn-time-picker/RebornTimePicker.vue";
import {
  timePickerColors,
  timePickerSizes,
} from "~/components/reborn/ui/reborn-time-picker/reborn-time-picker.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  value: "09:30:00",
  size: "md",
  color: "primary",
  isRange: false,
  arrowControl: false,
  disabled: false,
});

/** 演练场控制面板配置 */
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
      { label: "范围选择", key: "isRange", component: "checkbox" as const, defaultValue: false },
      { label: "箭头控制", key: "arrowControl", component: "checkbox" as const, defaultValue: false },
      { label: "禁用组件", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

// ─── 场景演示状态 ───────────────────────────────────────────────

const basicValue = ref("10:00:00");
const arrowValue = ref("14:20:00");
const rangeValue = ref(["09:00:00", "18:00:00"]);
const limitedValue = ref("12:00:00");

/** 禁用凌晨 0-4 点与深夜 23 点 */
function disabledHours() {
  return [0, 1, 2, 3, 4, 23];
}

/** 12 点整只允许选择后半小时 */
function disabledMinutes(hour: number) {
  if (hour === 12) return Array.from({ length: 30 }, (_, i) => i);
  return [];
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      component-name="RebornTimePicker"
      title="交互演练场"
      description="调节左侧属性，实时预览尺寸、配色与范围选择模式。"
    >
      <RebornTimePicker
        v-model="state.value"
        :size="state.size"
        :color="state.color"
        :is-range="state.isRange"
        :arrow-control="state.arrowControl"
        :disabled="state.disabled"
        class="w-full max-w-xs"
      />
    </Playground>

    <DemoSection
      title="选择模式"
      description="默认为滚轮选择；开启 arrow-control 切换为点击式步进，更适合桌面端精确调整。"
    >
      <DemoBlock layout="grid" align="start">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">滚轮选择 · 默认</span>
          <RebornTimePicker v-model="basicValue" />
          <DemoNote tone="dimmed">
            当前值：<span class="text-primary font-mono font-medium">{{ basicValue }}</span>
          </DemoNote>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">步进选择 · <code>arrow-control</code></span>
          <RebornTimePicker
            v-model="arrowValue"
            arrow-control
            color="secondary"
          />
          <DemoNote tone="dimmed">
            当前值：<span class="text-secondary font-mono font-medium">{{ arrowValue }}</span>
          </DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="时间范围"
      description="传入 is-range 后 v-model 变为 [开始时间, 结束时间] 数组，适用于排班、会议预约等时段场景。"
    >
      <DemoBlock layout="stack">
        <RebornTimePicker
          v-model="rangeValue"
          is-range
          color="success"
          class="w-full max-w-md"
        />
        <DemoNote tone="dimmed">
          选定时段：<span class="text-success font-mono font-medium">{{ rangeValue[0] }} 至 {{ rangeValue[1] }}</span>
        </DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="选择约束与禁用"
      description="disabled-hours / disabled-minutes 传入函数即可精确屏蔽不可选时段；disabled 则整体禁止交互。"
    >
      <DemoBlock layout="grid" align="start">
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">时段约束 · <code>disabled-hours</code></span>
          <RebornTimePicker
            v-model="limitedValue"
            color="warning"
            :disabled-hours="disabledHours"
            :disabled-minutes="disabledMinutes"
          />
          <DemoNote tone="dimmed">凌晨 0–4 点与 23 点不可选；12 点禁止选择前 30 分钟。</DemoNote>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">整体禁用 · <code>disabled</code></span>
          <RebornTimePicker
            disabled
            value="08:00:00"
          />
          <DemoNote tone="dimmed">禁用态保留视觉一致性，但不响应任何交互。</DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
