<script setup lang="ts">
import { inputColors, inputSizes } from "~/components/reborn/ui/reborn-input/reborn-input.config";

/** 演练场绑定值 */
const state = ref<Record<string, any>>({
  size: "sm",
  color: "neutral",
  password: false,
  disabled: false,
  rounded: false,
  clearable: true,
  border: true,
});

/** 两个演示输入框各自的内容 */
const basicValue = ref("");
const slotValue = ref("五条悟");

/** 演练场控制面板配置 */
const controls = [
  {
    title: "外观",
    children: [
      {
        label: "尺寸",
        key: "size",
        component: "select" as const,
        defaultValue: "sm",
        props: { options: inputSizes.map((s) => ({ label: s, value: s })) },
      },
      {
        label: "激活边框颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "neutral",
        props: { options: inputColors.map((c) => ({ label: c, value: c })) },
      },
      { label: "圆角", key: "rounded", component: "checkbox" as const, defaultValue: false },
      { label: "边框", key: "border", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "行为",
    children: [
      { label: "密码模式", key: "password", component: "checkbox" as const, defaultValue: false },
      { label: "可清空", key: "clearable", component: "checkbox" as const, defaultValue: true },
      { label: "禁用", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码 */
const inputCode = computed(
  () =>
    `<RebornInput\n  v-model="value"\n  size="${state.value.size}"\n  color="${state.value.color}"\n  :rounded="${state.value.rounded}"\n  :border="${state.value.border}"\n  :password="${state.value.password}"\n  :clearable="${state.value.clearable}"\n  :disabled="${state.value.disabled}"\n  placeholder="请输入内容"\n/>`,
);
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="inputCode"
      component-name="RebornInput"
      title="交互演练场"
      description="color 只在开启 border 后于聚焦态可见；separator 默认开启，会在清除按钮与 trailing 插槽之间画一条竖线。"
    >
      <div class="flex w-full flex-col gap-4">
        <RebornInput
          v-model="basicValue"
          :size="state.size"
          :color="state.color"
          :password="state.password"
          :disabled="state.disabled"
          :rounded="state.rounded"
          :clearable="state.clearable"
          :border="state.border"
          placeholder="基础用法..."
        />

        <RebornInput
          v-model="slotValue"
          :size="state.size"
          :color="state.color"
          :password="state.password"
          :disabled="state.disabled"
          :rounded="state.rounded"
          :clearable="state.clearable"
          :border="state.border"
          placeholder="带前后插槽"
        >
          <template #leading>
            <Icon
              name="lucide:search"
              class="text-dimmed size-4"
            />
          </template>
          <template #trailing>
            <Icon
              name="lucide:calendar"
              class="text-dimmed size-4"
            />
          </template>
        </RebornInput>
      </div>
    </Playground>

    <DemoSection
      title="多行文本"
      description="as 设为 textarea 后渲染为多行输入，rows 控制初始行数；此时高度由内容撑开，尺寸变体只影响字号与内边距。"
    >
      <DemoBlock layout="stack">
        <RebornInput
          as="textarea"
          :rows="4"
          placeholder="请输入多行内容..."
        />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
