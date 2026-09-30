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

    <DemoSection title="基础用法">
      <template #description>
        文本可以通过 <code>value</code> 传入，也可以写进默认插槽；两者同时存在时插槽优先，格式化结果经作用域参数 <code>content</code> 暴露。<code>size</code> 以 px 为单位写入行内字号。
      </template>
      <DemoBlock layout="stack">
        <RebornText value="通过 value 传入的文本" />
        <RebornText>通过默认插槽传入的文本</RebornText>
        <RebornText
          type="phone"
          value="13812345678"
          mask
        >
          <template #default="{ content }">
            联系电话：{{ content }}
          </template>
        </RebornText>
        <RebornText
          :size="20"
          value="size 为 20 时字号为 20px"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="语义色">
      <template #description>
        <code>color</code> 与全站语义色板对齐；不传时继承父级文字颜色，便于嵌进已有排版。
      </template>
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

    <DemoSection title="格式化与脱敏">
      <template #description>
        <code>type</code> 决定按哪种规则格式化，<code>mask</code> 为 <code>true</code> 时手机号、姓名、银行卡、邮箱才会脱敏；金额只做数字格式化，与 <code>mask</code> 无关。
      </template>
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

    <DemoSection title="金额：货币符号、千分位与精度">
      <template #description>
        Web 端 <code>currency</code> 默认为空、<code>thousandsIcon</code> 默认不加分隔符，需要显式传入；<code>currencyPosition</code> 控制符号在数字前后，<code>precision</code> 控制小数位。
      </template>
      <DemoBlock
        layout="grid"
        class="lg:grid-cols-2"
      >
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">默认：无货币符号、无千分位</span>
          <RebornText
            type="amount"
            :value="12345.6"
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">currency="¥" + thousandsIcon=","</span>
          <RebornText
            type="amount"
            :value="12345.6"
            currency="¥"
            thousands-icon=","
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">符号后置 + precision=0</span>
          <RebornText
            type="amount"
            :value="12345.6"
            currency="元"
            currency-position="after"
            :precision="0"
            thousands-icon=","
          />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">ui.currency 单独缩小符号</span>
          <RebornText
            type="amount"
            :value="12345.6"
            currency="¥"
            thousands-icon=","
            :ui="{ base: 'font-semibold text-error', currency: 'mr-0.5 text-xs' }"
          />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="多行省略与气泡提示">
      <template #description>
        <code>ellipsis</code> 开启省略，<code>lines</code> 指定最大行数；再开 <code>tooltip</code> 后仅在内容确实被截断时才弹出气泡，短文本不受影响。
      </template>
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
