<script setup lang="ts">
import { radioColors, radioSizes } from "~/components/reborn/ui/reborn-radio/reborn-radio.config";
import RebornRadio from "~/components/reborn/ui/reborn-radio/RebornRadio.vue";
import RebornRadioGroup from "~/components/reborn/ui/reborn-radio/RebornRadioGroup.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  value: "apple",
  type: "radio",
  variant: "outlined",
  size: "md",
  color: "primary",
  direction: "horizontal",
  disabled: false,
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "基础配置",
    children: [
      {
        label: "类型",
        key: "type",
        component: "select" as const,
        defaultValue: "radio",
        props: {
          options: [
            { label: "Radio 圆点", value: "radio" },
            { label: "Button 分段按钮", value: "button" },
            { label: "PureButton 实体按钮", value: "pure-button" },
          ],
        },
      },
      {
        label: "样式变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "outlined",
        props: {
          options: [
            { label: "Outlined 描边", value: "outlined" },
            { label: "Filled 实底", value: "filled" },
          ],
        },
      },
      {
        label: "语义色彩",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: {
          options: radioColors.map((c) => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c })),
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
        label: "排列方向",
        key: "direction",
        component: "select" as const,
        defaultValue: "horizontal",
        props: {
          options: [
            { label: "水平", value: "horizontal" },
            { label: "垂直", value: "vertical" },
          ],
        },
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
  const props: string[] = ['v-model="value"', ':options="fruits"'];

  if (s.type !== "radio") props.push(`type="${s.type}"`);
  if (s.variant !== "outlined") props.push(`variant="${s.variant}"`);
  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.direction !== "horizontal") props.push(`direction="${s.direction}"`);
  if (s.disabled) props.push("disabled");

  return `<RebornRadioGroup\n  ${props.join("\n  ")}\n/>`;
});

// ─── 场景演示数据 ───────────────────────────────────────────────

const fruits = [
  { value: "apple", label: "苹果" },
  { value: "banana", label: "香蕉" },
  { value: "orange", label: "橘子" },
  { value: "grape", label: "葡萄" },
];

const selectedFruit = ref("apple");
const selectedColor = ref("primary");
const selectedCity = ref("beijing");
const selectedPay = ref("wechat");
const selectedPlan = ref("basic");

const cityOptions = ["beijing", "shanghai", "guangzhou", { label: "深圳（禁用）", value: "shenzhen", disabled: true }];

const payOptions = [
  { value: "wechat", label: "微信支付" },
  { value: "alipay", label: "支付宝" },
  { value: "card", label: "银行卡" },
];

const plans = [
  { value: "basic", label: "基础版", desc: "适合个人开发者" },
  { value: "pro", label: "专业版", desc: "适合小型团队" },
  { value: "enterprise", label: "企业版", desc: "定制化支持" },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="radioCode"
      component-name="RebornRadioGroup"
      title="交互演练场"
      description="切换类型、语义色、尺寸与方向，实时预览单选框组的选中态表现。"
    >
      <RebornRadioGroup
        v-model="state.value"
        :options="fruits"
        :type="state.type"
        :variant="state.variant"
        :size="state.size"
        :color="state.color"
        :direction="state.direction"
        :disabled="state.disabled"
      />
    </Playground>

    <DemoSection
      title="基础用法"
      description="多个 RebornRadio 放入 RebornRadioGroup，由 Group 的 v-model 统一管理选中值；选项文案写在默认插槽中。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornRadioGroup v-model="selectedFruit">
          <RebornRadio
            v-for="fruit in fruits"
            :key="fruit.value"
            :value="fruit.value"
          >
            {{ fruit.label }}
          </RebornRadio>
        </RebornRadioGroup>
      </DemoBlock>
      <DemoNote tone="dimmed">
        当前值：<span class="text-primary font-mono font-medium">{{ selectedFruit }}</span>
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="语义色彩"
      description="color 覆盖全部语义色板，选中态的圆点/高亮随之变化；组内单个 Radio 也可用自身 color 覆盖。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornRadioGroup v-model="selectedColor">
          <RebornRadio
            v-for="c in radioColors"
            :key="c"
            :value="c"
            :color="c"
          >
            {{ c }}
          </RebornRadio>
        </RebornRadioGroup>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="options 快捷传参"
      description="options 接受 string | number | RadioOption 混合数组，对象形式可携带 disabled；label 插槽可统一定制选项文案。"
    >
      <DemoBlock
        layout="col"
        class="gap-4"
      >
        <RebornRadioGroup
          v-model="selectedCity"
          :options="cityOptions"
        />
        <RebornRadioGroup
          v-model="selectedPay"
          :options="payOptions"
        >
          <template #label="{ data }">
            <span class="font-medium">{{ data.label }}</span>
          </template>
        </RebornRadioGroup>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="radio 插槽深度定制"
      description="radio 插槽（作用域含 checked / disabled）可完全接管单选框的渲染，例如做成卡片式选择。"
    >
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornRadioGroup v-model="selectedPlan">
          <RebornRadio
            v-for="plan in plans"
            :key="plan.value"
            :value="plan.value"
          >
            <template #radio="{ checked }">
              <div
                class="w-[140px] rounded-ui-xs border border-solid px-4 py-3 transition-colors"
                :class="checked ? 'border-primary bg-primary/5' : 'border-gray-3'"
              >
                <div
                  class="text-[14px] font-medium"
                  :class="checked ? 'text-primary' : 'text-gray-8'"
                >
                  {{ plan.label }}
                </div>
                <div class="text-gray-5 mt-1 text-[12px]">{{ plan.desc }}</div>
              </div>
            </template>
          </RebornRadio>
        </RebornRadioGroup>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
