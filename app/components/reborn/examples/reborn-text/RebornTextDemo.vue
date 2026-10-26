<script setup lang="ts">
import { shallowRef } from "vue";
import { textColors } from "~/components/reborn/ui/reborn-text/reborn-text.config";

/** 演练场绑定值 */
const state = shallowRef<{ color: (typeof textColors)[number] }>({
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
    <Playground v-model="state" :controls="controls" component-name="RebornText" title="交互演练场"
      description="切换语义色，下方格式化与省略示例同步变色。">
      <RebornText :color="state.color">Reborn UI</RebornText>
    </Playground>

    <DemoSection title="语义色">
      <template #description>
        <code>color</code> 与全站语义色板对齐；不传时继承父级文字颜色，便于嵌进已有排版。
      </template>
      <DemoBlock>
        <RebornText v-for="c in textColors" :key="c" :color="c">
          {{ c }}
        </RebornText>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="格式化与脱敏">
      <template #description>
        <code>type</code> 决定按哪种规则格式化，<code>mask</code> 为 <code>true</code> 时手机号、姓名、银行卡、邮箱才会脱敏；金额只做数字格式化，与
        <code>mask</code> 无关。
      </template>
      <DemoBlock layout="grid" class="lg:grid-cols-2">
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">手机号脱敏</span>
          <RebornText :color="state.color" type="phone" value="13812345678" mask />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">姓名脱敏</span>
          <RebornText :color="state.color" type="name" value="张三丰" mask />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">金额</span>
          <RebornText :color="state.color" type="amount" :value="12345.6" />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">银行卡脱敏</span>
          <RebornText :color="state.color" type="card" value="6222021234567890" mask />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">邮箱脱敏</span>
          <RebornText :color="state.color" type="email" value="hello@example.com" mask />
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="金额：货币符号、千分位与精度">
      <template #description>
        Web 端 <code>currency</code> 默认为空、<code>thousandsIcon</code> 默认不加分隔符，需要显式传入；<code>currencyPosition</code>
        控制符号在数字前后，<code>precision</code> 控制小数位。
      </template>
      <DemoBlock layout="grid" class="lg:grid-cols-2">
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">默认：无货币符号、无千分位</span>
          <RebornText type="amount" :value="12345.6" />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">currency="¥" + thousandsIcon=","</span>
          <RebornText type="amount" :value="12345.6" currency="¥" thousands-icon="," />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">符号后置 + precision=0</span>
          <RebornText type="amount" :value="12345.6" currency="元" currency-position="after" :precision="0"
            thousands-icon="," />
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">ui.currency 单独缩小符号</span>
          <RebornText type="amount" :value="12345.6" currency="¥" thousands-icon=","
            :ui="{ base: 'font-semibold text-error', currency: 'mr-0.5 text-xs' }" />
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
          <RebornText :color="state.color" ellipsis tooltip class="max-w-[100px]">
            这是一段很长的单行文本内容，超出会显示省略号和气泡
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">单行未省略（无 Tooltip）</span>
          <RebornText :color="state.color" ellipsis tooltip class="max-w-[200px]">
            短文本
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">多行省略 + Tooltip</span>
          <RebornText :color="state.color" ellipsis :lines="2" tooltip class="max-w-xs">
            这是一段很长的文本内容，用于测试多行文本省略且显示 Tooltip 功能。当内容超出指定行数时，会显示省略号并显示 Tooltip。这是一段延伸内容，确保一定会超出两行显示。
          </RebornText>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="省略位置">
      <template #description>
        <code>ellipsis-position</code> 决定省略号出现在哪一端：<code>end</code> 保留开头，<code>start</code>
        保留结尾，适合只关心末级目录的路径；<code>middle</code>
        保留首尾，长文件名截断后扩展名仍可见。<code>start</code> 与 <code>middle</code> 按容器宽度逐字测量截断，容器变化时自动重算。
      </template>
      <DemoBlock layout="stack" class="max-w-[360px]">
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">end（默认）：保留开头</span>
          <RebornText ellipsis tooltip>
            /workspace/reborn-ui/packages/components/date-picker/RebornDatePickerPanel.vue
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">start：保留结尾</span>
          <RebornText ellipsis ellipsis-position="start" tooltip>
            /workspace/reborn-ui/packages/components/date-picker/RebornDatePickerPanel.vue
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">middle：保留首尾</span>
          <RebornText ellipsis ellipsis-position="middle" tooltip>
            2026年第三季度经营数据汇总与各区域销售明细（终版）.xlsx
          </RebornText>
        </div>
        <div class="flex flex-col gap-1">
          <span class="text-dimmed text-xs">middle + lines=2：多行同样适用</span>
          <RebornText ellipsis ellipsis-position="middle" :lines="2" tooltip>
            这是一段很长的文本内容，用于演示多行中间省略。超出两行时从中间截断，开头与结尾都保留，悬停可在气泡里查看全文。这是一段延伸内容，确保一定会超出两行显示。
          </RebornText>
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
