<script setup lang="ts">
import { sliderColors, sliderSizes } from "~/components/reborn/ui/reborn-slider/reborn-slider.config";

/** 演练场绑定值 */
const state = ref({
  size: "md",
  color: "primary",
  disabled: false,
});

const value1 = ref(40);
const rangeValues = ref([20, 80]);

/** 演练场控制面板配置 */
const controls = [
  {
    title: "外观",
    children: [
      {
        label: "尺寸",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: sliderSizes.map((s) => ({ label: s, value: s })) },
      },
      {
        label: "颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: sliderColors.map((c) => ({ label: c, value: c })) },
      },
      { label: "禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      component-name="RebornSlider"
      title="交互演练场"
      description="切换尺寸与颜色，滑块实时响应；勾选禁用查看不可拖动态。"
    >
      <RebornSlider
        v-model="value1"
        class="w-full max-w-sm"
        :size="state.size"
        :color="state.color"
        :disabled="state.disabled"
        show-value
      />
    </Playground>

    <DemoSection
      title="步长"
      description="step=10 时拖动会按 10 对齐。"
    >
      <DemoBlock layout="stack">
        <RebornSlider
          v-model="value1"
          class="w-full max-w-sm"
          :step="10"
          :size="state.size"
          :color="state.color"
          show-value
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="范围选择"
      description="v-model:values 绑定长度为 2 的数组，开启 range 即为区间滑块。"
    >
      <DemoBlock layout="stack">
        <RebornSlider
          v-model:values="rangeValues"
          class="w-full max-w-sm"
          range
          :size="state.size"
          :color="state.color"
          show-value
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="颜色"
      description="与全站语义色板对齐。"
    >
      <DemoBlock layout="stack">
        <RebornSlider
          v-for="c in sliderColors"
          :key="c"
          class="w-full max-w-sm"
          :model-value="50"
          :color="c"
          :size="state.size"
        />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
