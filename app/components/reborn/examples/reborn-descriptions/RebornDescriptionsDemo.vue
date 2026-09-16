<script setup lang="ts">
import type { DescriptionsItem } from "~/components/reborn/ui/reborn-descriptions/RebornDescriptions.vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import {
  descriptionsAligns,
  descriptionsLayouts,
  descriptionsSizes,
} from "~/components/reborn/ui/reborn-descriptions/reborn-descriptions.config";
import RebornDescriptions from "~/components/reborn/ui/reborn-descriptions/RebornDescriptions.vue";
import RebornDescriptionsItem from "~/components/reborn/ui/reborn-descriptions/RebornDescriptionsItem.vue";

/** 各尺寸档对应的单元格行高，用于在面板与说明里标注具体像素 */
const sizeHeights: Record<string, number> = { sm: 36, md: 48, lg: 56 };

const layoutLabels: Record<string, string> = {
  horizontal: "水平 Horizontal",
  vertical: "垂直 Vertical",
};

const alignLabels: Record<string, string> = {
  left: "左对齐 Left",
  center: "居中 Center",
  right: "右对齐 Right",
};

const layoutOptions = descriptionsLayouts.map(v => ({ label: layoutLabels[v]!, value: v }));
const sizeOptions = descriptionsSizes.map(s => ({ label: `${s.toUpperCase()}（${sizeHeights[s]}px）`, value: s }));
const alignOptions = descriptionsAligns.map(a => ({ label: alignLabels[a]!, value: a }));
const columnOptions = [1, 2, 3, 4].map(n => ({ label: `${n} 列`, value: n }));

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场展示的字段，最后一项跨 2 列以便观察分行 */
const profileItems: DescriptionsItem[] = [
  { label: "用户名", value: "周茂茂" },
  { label: "手机号", value: "181 0000 0000" },
  { label: "所在地", value: "浙江 杭州" },
  { label: "账号状态", value: "正常" },
  { label: "联系地址", value: "浙江省杭州市西湖区工专路 77 号 3 单元 501", span: 2 },
];

/** 演练场默认状态，与组件默认值保持一致 */
const defaultState: Record<string, any> = {
  bordered: false,
  layout: "horizontal",
  size: "md",
  column: 3,
  colon: true,
  labelAlign: "left",
  contentAlign: "left",
  labelWidth: "",
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      { label: "展示边框", key: "bordered", component: "checkbox" as const, defaultValue: false },
      { label: "描述布局", key: "layout", component: "select" as const, defaultValue: "horizontal", props: { options: layoutOptions } },
      { label: "尺寸规格", key: "size", component: "select" as const, defaultValue: "md", props: { options: sizeOptions } },
      { label: "一行列数", key: "column", component: "select" as const, defaultValue: 3, props: { options: columnOptions } },
    ],
  },
  {
    title: "标签与对齐",
    children: [
      { label: "显示冒号（仅无边框 + 水平生效）", key: "colon", component: "checkbox" as const, defaultValue: true },
      { label: "标签对齐", key: "labelAlign", component: "select" as const, defaultValue: "left", props: { options: alignOptions } },
      { label: "内容对齐", key: "contentAlign", component: "select" as const, defaultValue: "left", props: { options: alignOptions } },
      { label: "标签最小宽度", key: "labelWidth", component: "input" as const, defaultValue: "", props: { placeholder: "如 120px" } },
    ],
  },
];

/** 演练场右上角展示的传参明细：完整列出当前所有参数（含默认值） */
const descriptionsCode = computed(() => {
  const s = state.value;
  const attrs: string[] = [
    `title="用户信息"`,
    `:bordered="${s.bordered}"`,
    `layout="${s.layout}"`,
    `size="${s.size}"`,
    `:column="${s.column}"`,
    `:colon="${s.colon}"`,
    `label-align="${s.labelAlign}"`,
    `content-align="${s.contentAlign}"`,
  ];
  if (s.labelWidth) attrs.push(`label-width="${s.labelWidth}"`);
  attrs.push(`:items="items"`);
  return `<RebornDescriptions\n  ${attrs.join("\n  ")}\n/>`;
});

// ─── 场景演示数据 ───────────────────────────────────────────────

/** 数据驱动写法的字段 */
const orderItems: DescriptionsItem[] = [
  { label: "订单编号", value: "RB-2024-0917-0031" },
  { label: "下单时间", value: "2024-09-17 14:32" },
  { label: "支付方式", value: "余额支付" },
  { label: "实付金额", value: "¥ 1,280.00" },
];

/** 内容交给具名插槽渲染的字段，slot 值对应 content-{name} */
const serviceItems: DescriptionsItem[] = [
  { label: "服务名称", value: "reborn-gateway" },
  { label: "运行状态", slot: "status" },
  { label: "实例数", value: 6 },
  { label: "最近部署", value: "12 分钟前" },
];

/** 响应式列数演示：窄容器降到 1 列，宽容器回到 3 列 */
const responsiveItems: DescriptionsItem[] = [
  { label: "环境", value: "生产" },
  { label: "区域", value: "华东 1" },
  { label: "版本", value: "v2.14.3" },
  { label: "负责人", value: "周茂茂" },
  { label: "告警", value: "0 条" },
  { label: "SLA", value: "99.95%" },
];

/** 跨列演示：前两项各占 1 列，第三项吃掉整行 */
const spanItems: DescriptionsItem[] = [
  { label: "商品", value: "机械键盘 87 键" },
  { label: "数量", value: 2 },
  { label: "规格", value: "白光 / 茶轴 / 有线", span: 2 },
  { label: "备注", value: "买家留言：请在工作日送达，收货前电话联系。", span: "filled" },
];
</script>

<template>
  <div class="flex w-full flex-col">
    <Playground
      v-model="state" :controls="controls" :code="descriptionsCode" component-name="RebornDescriptions"
      title="交互演练场" description="调节左侧参数，观察列数、边框与行高的变化。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-8">
        <RebornDescriptions
          class="w-full" title="用户信息" :bordered="state.bordered" :layout="state.layout"
          :size="state.size" :column="state.column" :colon="state.colon" :label-align="state.labelAlign"
          :content-align="state.contentAlign" :label-width="state.labelWidth || undefined" :items="profileItems"
        >
          <template #extra>
            <RebornButton size="sm" variant="outlined" color="neutral">
              编辑
            </RebornButton>
          </template>
        </RebornDescriptions>

        <DemoNote tone="dimmed" class="font-mono text-xs">
          Props: { bordered: {{ state.bordered }}, layout: '{{ state.layout }}', column: {{ state.column }}, size:
          '{{ state.size }}' } → 行高 {{ sizeHeights[state.size] }}px
        </DemoNote>
      </div>
    </Playground>

    <DemoSection
      title="数据驱动与子组件写法"
      description="items 适合字段来自接口的场景；子组件写法适合内容里要塞图标、链接、状态色的场景。两者取其一，同时传入时 items 优先。"
    >
      <DemoBlock layout="stack" class="gap-8">
        <RebornDescriptions bordered title="items 数组" :column="2" :items="orderItems" />

        <RebornDescriptions bordered title="RebornDescriptionsItem 子组件" :column="2">
          <RebornDescriptionsItem label="订单编号">
            RB-2024-0917-0031
          </RebornDescriptionsItem>
          <RebornDescriptionsItem label="支付状态">
            <span class="text-success inline-flex items-center gap-[4px]">
              <Icon name="lucide:circle-check" size="14" />
              已支付
            </span>
          </RebornDescriptionsItem>
          <RebornDescriptionsItem label="收货地址" span="filled">
            浙江省杭州市西湖区工专路 77 号 3 单元 501
          </RebornDescriptionsItem>
        </RebornDescriptions>

        <RebornDescriptions bordered title="items 配合具名插槽" :column="2" :items="serviceItems">
          <template #content-status>
            <span class="text-success inline-flex items-center gap-[4px]">
              <Icon name="lucide:circle-check" size="14" />
              运行中
            </span>
          </template>
        </RebornDescriptions>
      </DemoBlock>

      <DemoNote text="item 上写 slot: 'status'，内容就交给名为 content-status 的插槽渲染；标签同理，用 labelSlot 指向 label-{name}。" />
    </DemoSection>

    <DemoSection
      title="边框与底色"
      description="bordered 默认关闭：标签与内容同格相邻，靠冒号分隔，适合嵌在卡片里的轻量信息区。开启后标签独占带底色的单元格，适合需要逐格对齐的详情页。"
    >
      <DemoBlock layout="stack" class="gap-8">
        <RebornDescriptions title="无边框（默认）" :column="2" :items="orderItems" />
        <RebornDescriptions bordered title="有边框" :column="2" :items="orderItems" />
      </DemoBlock>

      <DemoNote text="冒号只在「无边框 + 水平」下渲染：带边框时标签已有底色单元格作边界，垂直布局时标签独占一行，再加冒号是重复表达。" />
    </DemoSection>

    <DemoSection
      title="布局与列数"
      description="layout 决定标签与内容是同行还是上下两行；column 决定一行放几项，写成对象时按断点取值。"
    >
      <DemoBlock layout="stack" class="gap-8">
        <RebornDescriptions bordered layout="vertical" title="垂直布局" :column="3" :items="orderItems" />

        <div class="flex w-full flex-col gap-4">
          <div class="w-[360px] max-w-full">
            <RebornDescriptions
              bordered title="容器 360px" :column="{ xs: 1, sm: 2, lg: 3 }" :items="responsiveItems"
            />
          </div>
          <RebornDescriptions
            bordered title="容器撑满" :column="{ xs: 1, sm: 2, lg: 3 }" :items="responsiveItems"
          />
        </div>
      </DemoBlock>

      <DemoNote text="断点比对的是组件容器宽度而非视口宽度：上面两个列表参数完全相同，只因外层容器一个 360px、一个撑满，列数才不一样。" />
    </DemoSection>

    <DemoSection
      title="跨列与铺满"
      description="span 是数字时占固定列数，超出当前行剩余列会换行；写 'filled' 表示吃掉当前行剩下的所有列。"
    >
      <DemoBlock layout="stack">
        <RebornDescriptions bordered :column="3" :items="spanItems" />
      </DemoBlock>

      <DemoNote text="每行末项会自动延伸补齐剩余列，否则带边框时会缺格、边线断在半路。所以 'filled' 的真正用途是把它写在非末项上，强行让后续项换到下一行。" />
    </DemoSection>

    <DemoSection
      title="标题与操作区"
      description="title 显示在最顶部，extra 显示在右上方，两者都有同名插槽可放富内容。"
    >
      <DemoBlock layout="stack">
        <RebornDescriptions bordered :column="2" :items="orderItems">
          <template #title>
            <span class="inline-flex items-center gap-[8px]">
              <Icon name="lucide:receipt-text" class="text-primary" size="20" />
              订单详情
            </span>
          </template>
          <template #extra>
            <RebornButton size="sm" variant="outlined" color="neutral">
              导出
            </RebornButton>
            <RebornButton size="sm" color="primary">
              再次购买
            </RebornButton>
          </template>
        </RebornDescriptions>
      </DemoBlock>

      <DemoNote text="标题固定 24px / 字重 500，不随 size 变化；size 只影响单元格行高（36 / 48 / 56px）。" />
    </DemoSection>
  </div>
</template>
