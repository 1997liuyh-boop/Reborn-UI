<script setup lang="ts">
import RebornInputNumber from "~/components/reborn/ui/reborn-input-number/RebornInputNumber.vue";
import {
  inputNumberColors,
  inputNumberSizes,
  inputNumberShapes,
} from "~/components/reborn/ui/reborn-input-number/reborn-input-number.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

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

/** 演练场控制面板配置 */
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
          options: inputNumberSizes.map((s) => ({ label: s.toUpperCase(), value: s })),
        },
      },
      {
        label: "配色方案",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          options: inputNumberColors.map((c) => ({ label: c, value: c })),
        },
      },
      {
        label: "形状轮廓",
        key: "shape",
        component: "select" as const,
        defaultValue: "square",
        props: {
          options: inputNumberShapes.map((s) => ({ label: s, value: s })),
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

/** 演练场右上角展示的等价代码 */
const inputNumberCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="value"'];

  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.shape !== "square") props.push(`shape="${s.shape}"`);
  props.push(`:min="${s.min}"`, `:max="${s.max}"`, `:step="${s.step}"`);
  if (s.disabled) props.push("disabled");
  if (s.readonly) props.push("readonly");

  return `<RebornInputNumber\n  ${props.join("\n  ")}\n/>`;
});

// ─── 场景演示状态 ───────────────────────────────────────────────

const basicValue = ref(5);
const coloredValue = ref(20);
const customValue = ref(8);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="inputNumberCode"
      component-name="RebornInputNumber"
      title="交互演练场"
      description="调节尺寸、配色与数值边界，实时预览步进器的增减行为。"
    >
      <RebornInputNumber
        v-model="state.value"
        :size="state.size"
        :color="state.color"
        :shape="state.shape"
        :min="state.min"
        :max="state.max"
        :step="state.step"
        :disabled="state.disabled"
        :readonly="state.readonly"
      />
    </Playground>

    <DemoSection
      title="配色方案"
      description="color 作用于聚焦态的描边与增减按钮的高亮色。"
    >
      <DemoBlock
        layout="grid"
        align="center"
      >
        <div
          v-for="c in inputNumberColors"
          :key="c"
          class="flex flex-col items-center gap-3"
        >
          <span class="text-dimmed text-xs font-medium">{{ c }}</span>
          <RebornInputNumber
            v-model="coloredValue"
            :color="c"
            size="sm"
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="尺寸规格"
      description="size 同时决定输入框高度、字号与左右按钮的点击区域。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-10"
      >
        <div
          v-for="s in inputNumberSizes"
          :key="s"
          class="flex flex-col items-center gap-3"
        >
          <span class="text-dimmed text-xs font-medium">{{ s.toUpperCase() }}</span>
          <RebornInputNumber
            v-model="basicValue"
            :size="s"
            color="info"
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="形状轮廓"
      description="shape 控制外框圆角，square 适合表单，round 更适合独立的数量选择。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-10"
      >
        <div
          v-for="s in inputNumberShapes"
          :key="s"
          class="flex flex-col items-center gap-3"
        >
          <span class="text-dimmed text-xs font-medium">{{ s }}</span>
          <RebornInputNumber
            v-model="basicValue"
            :shape="s"
            color="secondary"
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="进阶自定义"
      description="ui 可逐槽覆盖 wrapper / input / button / divider 的样式，increment、decrement 插槽还能替换增减图标。"
    >
      <DemoBlock
        layout="grid"
        align="start"
      >
        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">甜美主题 · 插槽换图标</span>
          <RebornInputNumber
            v-model="customValue"
            class="w-full"
            :ui="{
              wrapper: 'bg-default ring-rose-200 focus-within:ring-rose-400 rounded-ui-md h-14 border-0',
              button: 'text-rose-400 hover:bg-rose-50 active:scale-95 transition-all',
              input: 'text-rose-600 font-black',
            }"
          >
            <template #decrement="{ iconClass }">
              <Icon
                name="lucide:heart-minus"
                :class="iconClass"
              />
            </template>
            <template #increment="{ iconClass }">
              <Icon
                name="lucide:heart-plus"
                :class="iconClass"
              />
            </template>
          </RebornInputNumber>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">科技霓虹 · 直角 + 等宽字体</span>
          <RebornInputNumber
            v-model="customValue"
            class="w-full"
            :ui="{
              wrapper: 'bg-gray-9 ring-indigo-500/50 focus-within:ring-indigo-400 rounded-none h-12 border-0',
              input: 'text-white font-mono leading-none',
              button: 'text-indigo-400 hover:bg-indigo-500/20 transition-all',
              divider: 'bg-indigo-500/20',
            }"
          >
            <template #increment>
              <Icon
                name="lucide:arrow-right"
                class="size-4"
              />
            </template>
            <template #decrement>
              <Icon
                name="lucide:arrow-left"
                class="size-4"
              />
            </template>
          </RebornInputNumber>
        </div>

        <div class="flex flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">极简无界 · 仅保留下划线</span>
          <RebornInputNumber
            v-model="customValue"
            class="w-full font-bold"
            :ui="{
              wrapper:
                'bg-transparent ring-0 focus-within:ring-0 border-b-2 border-default rounded-none h-12 transition-all focus-within:border-inverted',
              button: 'text-dimmed hover:text-highlighted',
              input: 'font-black text-highlighted',
              divider: 'hidden',
            }"
          />
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
