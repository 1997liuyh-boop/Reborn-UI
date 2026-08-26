<script setup lang="ts">
import RebornRadio from "~/components/reborn/ui/reborn-radio/RebornRadio.vue";
import RebornRadioGroup from "~/components/reborn/ui/reborn-radio/RebornRadioGroup.vue";
import { radioColors, radioSizes } from "~/components/reborn/ui/reborn-radio/reborn-radio.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  value: "apple",
  size: "md",
  color: "primary",
  variant: "circle",
  disabled: false,
  label: "苹果",
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "基础配置",
    children: [
      {
        label: "选择变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "circle",
        props: {
          options: [
            { label: "Simple 勾选", value: "simple" },
            { label: "Circle 圆点", value: "circle" },
          ],
        },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: {
          options: radioSizes.map((s) => ({ label: s.toUpperCase(), value: s })),
        },
      },
      {
        label: "品牌色彩",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          options: radioColors.map((c) => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
        },
      },
      {
        label: "显示标签",
        key: "label",
        component: "input" as const,
        defaultValue: "苹果",
      },
      {
        label: "禁用状态",
        key: "disabled",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const radioCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="value"', 'value="apple"', `label="${s.label}"`];

  if (s.variant !== "circle") props.push(`variant="${s.variant}"`);
  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.disabled) props.push("disabled");

  return `<RebornRadio\n  ${props.join("\n  ")}\n/>`;
});

// ─── 场景演示数据 ───────────────────────────────────────────────

const selectedFruit = ref("apple");
const selectedColor = ref("primary");
const selectedSize = ref("md");
const selectedTheme = ref("sun");
const selectedEmoji = ref("🤔");

const fruits = [
  { value: "apple", label: "苹果" },
  { value: "banana", label: "香蕉" },
  { value: "orange", label: "橘子" },
  { value: "grape", label: "葡萄" },
];

const emojis = [
  { value: "😀", label: "开心" },
  { value: "😍", label: "喜欢" },
  { value: "🤔", label: "思考" },
  { value: "🎉", label: "庆祝" },
];

const themes = [
  { value: "sun", label: "浅色", icon: "lucide:sun" },
  { value: "moon", label: "深色", icon: "lucide:moon" },
  { value: "monitor", label: "系统", icon: "lucide:monitor" },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="radioCode"
      component-name="RebornRadio"
      title="交互演练场"
      description="切换变体、尺寸与色彩，实时预览单选框的选中态表现。"
    >
      <RebornRadio
        v-model="state.value"
        value="apple"
        :label="state.label"
        :size="state.size"
        :color="state.color"
        :variant="state.variant"
        :disabled="state.disabled"
      />
    </Playground>

    <DemoSection
      title="选项框架"
      description="circle 变体为经典圆点风格，未选中时是空心圆，选中后呈现带实心圆点的彩色圆环。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-6"
      >
        <RebornRadio
          v-for="fruit in fruits"
          :key="fruit.value"
          v-model="selectedFruit"
          :value="fruit.value"
          :label="fruit.label"
          variant="circle"
          color="primary"
        />
      </DemoBlock>
      <DemoNote tone="dimmed">
        当前值：<span class="text-primary font-mono font-medium">{{ selectedFruit }}</span>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="品牌色彩"
      description="color 覆盖全部语义色板，用于区分不同业务语义的选择项。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-6"
      >
        <RebornRadio
          v-for="c in radioColors"
          :key="c"
          v-model="selectedColor"
          :value="c"
          :label="c"
          :color="c"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="尺寸规格"
      description="size 同时作用于圆点直径与标签字号，从辅助项到核心操作均可覆盖。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-8"
      >
        <RebornRadio
          v-for="s in radioSizes"
          :key="s"
          v-model="selectedSize"
          :value="s"
          :label="s.toUpperCase()"
          :size="s"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="自定义图标"
      description="通过 active-icon / inactive-icon 替换默认圆点，常用于主题切换这类带语义的选择场景。"
    >
      <DemoBlock
        layout="row"
        align="center"
        class="gap-6"
      >
        <RebornRadio
          v-for="t in themes"
          :key="t.value"
          v-model="selectedTheme"
          :value="t.value"
          :label="t.label"
          :active-icon="t.icon"
          :inactive-icon="t.icon"
          color="secondary"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="插槽深度定制"
      description="active-icon / inactive-icon 插槽可渲染任意内容，例如用 Emoji 表达情绪评分。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornRadioGroup v-model="selectedEmoji">
          <RebornRadio
            v-for="e in emojis"
            :key="e.value"
            :value="e.value"
            :label="e.label"
            size="lg"
            color="warning"
          >
            <template #active-icon>
              <span class="text-xl">{{ e.value }}</span>
            </template>
            <template #inactive-icon>
              <span class="text-lg opacity-30 grayscale saturate-0">{{ e.value }}</span>
            </template>
          </RebornRadio>
        </RebornRadioGroup>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
