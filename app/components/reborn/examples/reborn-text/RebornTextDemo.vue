<script setup lang="ts">
import { textColors } from "~/components/reborn/ui/reborn-text/reborn-text.config";

/** 演练场绑定值 */
const state = ref({
  color: "primary",
});

/** 演练场控制面板配置 */
const controls = [
  {
    title: "外观",
    children: [
      {
        label: "颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: textColors.map((c) => ({ label: c, value: c })) },
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
      component-name="RebornText"
      title="交互演练场"
      description="切换语义色，下方格式化与省略示例同步变色。"
    >
      <RebornText :color="state.color">Reborn UI</RebornText>
    </Playground>

    <DemoSection
      title="颜色"
      description="与全站语义色板对齐。"
    >
      <DemoBlock>
        <RebornText
          v-for="c in textColors"
          :key="c"
          :color="c"
        >
          {{ c }}
        </RebornText>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="文本格式化"
      description="type 决定格式，mask 开启脱敏。"
    >
      <DemoBlock layout="grid" class="lg:grid-cols-2">
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">手机号脱敏</span>
          <RebornText
            :color="state.color"
            type="phone"
            value="13812345678"
            mask
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">姓名脱敏</span>
          <RebornText
            :color="state.color"
            type="name"
            value="张三丰"
            mask
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">金额</span>
          <RebornText
            :color="state.color"
            type="amount"
            :value="12345.6"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">银行卡脱敏</span>
          <RebornText
            :color="state.color"
            type="card"
            value="6222021234567890"
            mask
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">邮箱脱敏</span>
          <RebornText
            :color="state.color"
            type="email"
            value="hello@example.com"
            mask
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="自动气泡提示"
      description="ellipsis 开启省略，内容被截断时才弹出 Tooltip。"
    >
      <DemoBlock layout="stack">
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">单行省略 + Tooltip</span>
          <RebornText
            :color="state.color"
            ellipsis
            tooltip
            class="max-w-[100px]"
          >
            这是一段很长的单行文本内容，超出会显示省略号和气泡
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">单行未省略（无 Tooltip）</span>
          <RebornText
            :color="state.color"
            ellipsis
            tooltip
            class="max-w-[200px]"
          >
            短文本
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">多行省略 + Tooltip</span>
          <RebornText
            :color="state.color"
            ellipsis
            :lines="2"
            tooltip
            class="max-w-xs"
          >
            这是一段很长的文本内容，用于测试多行文本省略且显示 Tooltip 功能。当内容超出指定行数时，会显示省略号并显示 Tooltip。这是一段延伸内容，确保一定会超出两行显示。
          </RebornText>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
