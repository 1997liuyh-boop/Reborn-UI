<script setup lang="ts">
import { inputOtpColors, inputOtpSizes } from "~/components/reborn/ui/reborn-input-otp/reborn-input-otp.config";

/** 演练场绑定值 */
const state = ref({
  size: "md",
  color: "primary",
  disabled: false,
});

const value1 = ref("");
const value2 = ref("");

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
        props: { options: inputOtpSizes.map((s) => ({ label: s, value: s })) },
      },
      {
        label: "颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: inputOtpColors.map((c) => ({ label: c, value: c })) },
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
      component-name="RebornInputOtp"
      title="交互演练场"
      description="切换尺寸与颜色，输入框格实时响应；勾选禁用查看不可编辑态。"
    >
      <RebornInputOtp
        v-model="value1"
        :size="state.size"
        :color="state.color"
        :disabled="state.disabled"
      />
    </Playground>

    <DemoSection
      title="基础用法"
      description="默认 4 位；当前值会同步到下方说明。"
    >
      <DemoBlock layout="stack">
        <RebornInputOtp
          v-model="value1"
          :size="state.size"
          :color="state.color"
          :disabled="state.disabled"
        />
        <DemoNote tone="dimmed">当前值：{{ value1 || "空" }}</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="6 位验证码"
      description="通过 length 指定位数，常用于短信 / 邮箱校验码。"
    >
      <DemoBlock>
        <RebornInputOtp
          v-model="value2"
          :length="6"
          :size="state.size"
          :color="state.color"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="颜色"
      description="与全站语义色板对齐，覆盖主色、成功、警告、错误等反馈场景。"
    >
      <DemoBlock layout="stack">
        <RebornInputOtp
          v-for="c in inputOtpColors"
          :key="c"
          :color="c"
          :size="state.size"
          :length="4"
        />
      </DemoBlock>
    </DemoSection>
  </div>
</template>
