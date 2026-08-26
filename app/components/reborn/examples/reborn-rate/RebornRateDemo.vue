<script setup lang="ts">
import { rateColors, rateSizes } from "~/components/reborn/ui/reborn-rate/reborn-rate.config";

/** 演练场绑定值 */
const state = ref({
  size: "md",
  color: "warning",
  count: 5,
  allowHalf: false,
  showValue: true,
  disabled: false,
  readonly: false,
});

const val1 = ref(3);

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
        props: { options: rateSizes.map((s) => ({ label: s, value: s })) },
      },
      {
        label: "颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "warning",
        props: { options: rateColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "数量",
        key: "count",
        component: "slider" as const,
        defaultValue: 5,
        props: { min: 1, max: 10, step: 1 },
      },
    ],
  },
  {
    title: "行为",
    children: [
      { label: "半星", key: "allowHalf", component: "checkbox" as const, defaultValue: false },
      { label: "显示分数", key: "showValue", component: "checkbox" as const, defaultValue: true },
      { label: "禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
      { label: "只读", key: "readonly", component: "checkbox" as const, defaultValue: false },
    ],
  },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      component-name="RebornRate"
      title="交互演练场"
      description="调节尺寸、颜色与颗数，右侧评分实时响应；半星、禁用、只读可叠加。"
    >
      <RebornRate
        v-model="val1"
        :size="state.size"
        :color="state.color"
        :allow-half="state.allowHalf"
        :show-value="state.showValue"
        :disabled="state.disabled"
        :readonly="state.readonly"
        :count="state.count"
      />
    </Playground>

    <DemoSection
      title="自定义图标"
      description="#icon 插槽拿到 active，可换成任意 Icon 或图片。"
    >
      <DemoBlock layout="stack">
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-12 text-xs">爱心</span>
          <RebornRate
            v-model="val1"
            :size="state.size"
            :color="state.color"
            :allow-half="state.allowHalf"
            :show-value="state.showValue"
            :disabled="state.disabled"
            :readonly="state.readonly"
            :count="state.count"
          >
            <template #icon>
              <Icon
                name="lucide:heart"
                class="size-full"
              />
            </template>
          </RebornRate>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-12 text-xs">火焰</span>
          <RebornRate
            v-model="val1"
            :size="state.size"
            :color="state.color"
            :allow-half="state.allowHalf"
            :show-value="state.showValue"
            :disabled="state.disabled"
            :readonly="state.readonly"
            :count="state.count"
          >
            <template #icon>
              <Icon
                name="lucide:flame"
                class="size-full"
              />
            </template>
          </RebornRate>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-dimmed w-12 text-xs">点赞</span>
          <RebornRate
            v-model="val1"
            :size="state.size"
            :color="state.color"
            :allow-half="state.allowHalf"
            :show-value="state.showValue"
            :disabled="state.disabled"
            :readonly="state.readonly"
            :count="state.count"
          >
            <template #icon>
              <Icon
                name="lucide:thumbs-up"
                class="size-full"
              />
            </template>
          </RebornRate>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="颜色"
      description="与全站语义色板对齐。"
    >
      <DemoBlock layout="stack">
        <RebornRate
          v-for="c in rateColors"
          :key="c"
          :model-value="3"
          :color="c"
          :size="state.size"
        />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
