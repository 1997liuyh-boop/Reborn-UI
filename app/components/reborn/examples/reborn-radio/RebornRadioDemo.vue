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
const selectedMode = ref("day");
const selectedAlign = ref("居中");
const selectedVariant = ref("apple");

/** 非受控用法的最新值，仅由 change 事件回填展示 */
const uncontrolledValue = ref("banana");

/** 非受控模式下通过 change 事件拿到最新值 */
function onUncontrolledChange(value: string | number | boolean) {
  uncontrolledValue.value = String(value);
}

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

    <DemoSection title="类型与尺寸">
      <template #description><code>type="button"</code> 呈现分段按钮；<code>size</code> 由 Group 统一下发，分段按钮高度取 RebornButton 同款高度令牌。</template>
      <DemoBlock
        layout="col"
        class="gap-4"
      >
        <RebornRadioGroup
          v-for="s in radioSizes"
          :key="s"
          v-model="selectedMode"
          type="button"
          :size="s"
        >
          <RebornRadio value="day">日视图</RebornRadio>
          <RebornRadio value="week">周视图</RebornRadio>
          <RebornRadio value="month">月视图</RebornRadio>
        </RebornRadioGroup>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="实体按钮拼接：pure-button">
      <template #description><code>type="pure-button"</code> 每项复用 RebornButton，首尾圆角、相邻边框折叠；<code>button-props</code> 统一透传按钮参数。</template>
      <DemoBlock
        layout="col"
        class="gap-4"
      >
        <RebornRadioGroup
          v-model="selectedAlign"
          type="pure-button"
          color="success"
          :options="['左对齐', '居中', '右对齐']"
        />
        <RebornRadioGroup
          v-model="selectedAlign"
          type="pure-button"
          color="success"
          :button-props="{ borderStyle: 'dashed' }"
          :options="['左对齐', '居中', '右对齐']"
        />
      </DemoBlock>
      <DemoNote tone="dimmed">
        当前值：<span class="text-primary font-mono font-medium">{{ selectedAlign }}</span>
      </DemoNote>
    </DemoSection>

    <DemoSection title="变体：outlined 与 filled">
      <template #description><code>variant</code> 只改变选中态外观：outlined 为语义色描边与前景，filled 为语义色实底加白色前景。</template>
      <DemoBlock
        layout="col"
        class="gap-4"
      >
        <RebornRadioGroup
          v-model="selectedVariant"
          variant="outlined"
          :options="fruits"
        />
        <RebornRadioGroup
          v-model="selectedVariant"
          variant="filled"
          :options="fruits"
        />
        <RebornRadioGroup
          v-model="selectedVariant"
          type="button"
          variant="filled"
          :options="fruits"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="语义色与单项覆盖">
      <template #description><code>color</code> 覆盖全部语义色板，选中态的圆点与高亮随之变化；组内单个 Radio 也可用自身 <code>color</code> 覆盖。</template>
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

    <DemoSection title="数据驱动：options 与 label 插槽">
      <template #description><code>options</code> 接受 string | number | RadioOption 混合数组，对象形式可携带 <code>disabled</code>；<code>label</code> 插槽可统一定制选项文案。</template>
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

    <DemoSection title="方向与非受控">
      <template #description><code>direction="vertical"</code> 纵向排列；不绑 v-model 时用 <code>default-value</code> 给初始值，通过 <code>change</code> 事件读取最新值。</template>
      <DemoBlock
        layout="row"
        align="center"
      >
        <RebornRadioGroup
          default-value="banana"
          direction="vertical"
          :options="fruits"
          @change="onUncontrolledChange"
        />
      </DemoBlock>
      <DemoNote tone="dimmed">
        change 事件最新值：<span class="text-primary font-mono font-medium">{{ uncontrolledValue }}</span>
      </DemoNote>
    </DemoSection>

    <DemoSection title="自定义渲染：radio 插槽">
      <template #description><code>radio</code> 插槽（作用域含 checked / disabled）完全接管单选框的渲染，例如做成卡片式选择；此时 ui 的 icon / dot / label 键不再生效。</template>
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
                class="w-[140px] rounded-md border border-solid px-4 py-3 transition-colors"
                :class="checked ? 'border-primary bg-primary/5' : 'border-gray-3'"
              >
                <div
                  class="text-base font-medium"
                  :class="checked ? 'text-primary' : 'text-gray-8'"
                >
                  {{ plan.label }}
                </div>
                <div class="text-gray-5 mt-1 text-sm">{{ plan.desc }}</div>
              </div>
            </template>
          </RebornRadio>
        </RebornRadioGroup>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
