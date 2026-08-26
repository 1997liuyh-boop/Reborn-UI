<script setup lang="ts">
import type {
  DescriptionsAlign,
  DescriptionsBorderMode,
  DescriptionsLineHeight,
  DescriptionsSize,
} from "~/components/reborn/ui/reborn-descriptions/reborn-descriptions.config";
import { useColorMode } from "@vueuse/core";
import {
  descriptionsAligns,
  descriptionsBorderModes,
  descriptionsLineHeights,
  descriptionsSizes,
} from "~/components/reborn/ui/reborn-descriptions/reborn-descriptions.config";
import RebornDescriptions from "~/components/reborn/ui/reborn-descriptions/RebornDescriptions.vue";
import RebornDescriptionsItem from "~/components/reborn/ui/reborn-descriptions/RebornDescriptionsItem.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认值，重置时直接回填 */
const defaultState = {
  title: "用户信息",
  column: 3,
  size: "md" as DescriptionsSize,
  border: "bordered" as DescriptionsBorderMode,
  direction: "horizontal" as "horizontal" | "vertical",
  colon: true,
  rounded: true,
  responsive: true,
  labelBackground: "",
  contentBackground: "",
  labelAlign: "left" as DescriptionsAlign,
  contentAlign: "left" as DescriptionsAlign,
  labelLineHeight: "relaxed" as DescriptionsLineHeight,
  contentLineHeight: "relaxed" as DescriptionsLineHeight,
  labelLineHeightCustom: "",
  contentLineHeightCustom: "",
};

const state = ref({ ...defaultState });

/** 恢复演练场初始配置 */
function resetDemo() {
  state.value = { ...defaultState };
}

const alignLabels: Record<DescriptionsAlign, string> = {
  left: "左对齐",
  center: "居中",
  right: "右对齐",
};

const lineHeightLabels: Record<DescriptionsLineHeight, string> = {
  none: "紧凑 none",
  tight: "较紧 tight",
  snug: "略紧 snug",
  normal: "标准 normal",
  relaxed: "宽松 relaxed",
  loose: "很松 loose",
};

/** 自定义行高优先于预设档位 */
const effectiveLabelLineHeight = computed(
  () => state.value.labelLineHeightCustom.trim() || state.value.labelLineHeight,
);
const effectiveContentLineHeight = computed(
  () => state.value.contentLineHeightCustom.trim() || state.value.contentLineHeight,
);

const colorMode = useColorMode();

/** 演练场取色器图标：浅色与边框同色（gray-5），深色用 gray-4 保证可见 */
const colorPickerUi = computed(() => ({
  icon:
    colorMode.value === "dark"
      ? "text-gray-4 transition-transform duration-200"
      : "text-gray-5 transition-transform duration-200",
}));

/** 演练场控制面板配置（依赖 colorPickerUi，故用 computed 保持响应） */
const controls = computed(() => [
  {
    title: "基础配置",
    children: [
      { label: "标题", key: "title", component: "input" as const, defaultValue: defaultState.title },
      {
        label: "列数",
        key: "column",
        component: "select" as const,
        defaultValue: defaultState.column,
        props: { options: [1, 2, 3, 4].map((n) => ({ label: String(n), value: n })) },
      },
      {
        label: "尺寸",
        key: "size",
        component: "select" as const,
        defaultValue: defaultState.size,
        props: { options: descriptionsSizes.map((s) => ({ label: s.toUpperCase(), value: s })) },
      },
      {
        label: "排列方向",
        key: "direction",
        component: "select" as const,
        defaultValue: defaultState.direction,
        props: {
          options: [
            { label: "水平 horizontal", value: "horizontal" },
            { label: "垂直 vertical", value: "vertical" },
          ],
        },
      },
    ],
  },
  {
    title: "边框与形状",
    children: [
      {
        label: "边框模式",
        key: "border",
        component: "select" as const,
        defaultValue: defaultState.border,
        props: {
          options: descriptionsBorderModes.map((m) => ({
            label: m === "bordered" ? "有边框 bordered" : m === "divider" ? "分割线 divider" : "无边框 none",
            value: m,
          })),
        },
      },
      { label: "表格外圆角", key: "rounded", component: "checkbox" as const, defaultValue: true },
      { label: "显示冒号", key: "colon", component: "checkbox" as const, defaultValue: true },
      { label: "宽度自适应", key: "responsive", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "对齐与行高",
    children: [
      {
        label: "标签对齐",
        key: "labelAlign",
        component: "select" as const,
        defaultValue: defaultState.labelAlign,
        props: { options: descriptionsAligns.map((a) => ({ label: alignLabels[a], value: a })) },
      },
      {
        label: "内容对齐",
        key: "contentAlign",
        component: "select" as const,
        defaultValue: defaultState.contentAlign,
        props: { options: descriptionsAligns.map((a) => ({ label: alignLabels[a], value: a })) },
      },
      {
        label: "标签行高",
        key: "labelLineHeight",
        component: "select" as const,
        defaultValue: defaultState.labelLineHeight,
        props: { options: descriptionsLineHeights.map((h) => ({ label: lineHeightLabels[h], value: h })) },
      },
      {
        label: "标签行高（自定义 CSS）",
        key: "labelLineHeightCustom",
        component: "input" as const,
        defaultValue: "",
        props: { placeholder: "如 1.8 或 28px" },
      },
      {
        label: "内容行高",
        key: "contentLineHeight",
        component: "select" as const,
        defaultValue: defaultState.contentLineHeight,
        props: { options: descriptionsLineHeights.map((h) => ({ label: lineHeightLabels[h], value: h })) },
      },
      {
        label: "内容行高（自定义 CSS）",
        key: "contentLineHeightCustom",
        component: "input" as const,
        defaultValue: "",
        props: { placeholder: "如 2 或 32px" },
      },
    ],
  },
  {
    title: "配色",
    children: [
      {
        label: "标签背景",
        key: "labelBackground",
        component: "color-picker" as const,
        defaultValue: "",
        props: { ui: colorPickerUi.value },
      },
      {
        label: "内容背景",
        key: "contentBackground",
        component: "color-picker" as const,
        defaultValue: "",
        props: { ui: colorPickerUi.value },
      },
    ],
  },
]);

/** 关闭宽度自适应时，按列数估算表格最小宽度，供外层横轴滚动展示 */
const playgroundMinWidth = computed(() => {
  if (state.value.responsive) return undefined;
  const cols = Math.max(Number(state.value.column) || 1, 1);
  return `${cols * 280}px`;
});

const playgroundItems = computed(() => [
  { label: "用户名", value: "阿尔法" },
  { label: "手机号", value: "186 0000 0000" },
  { label: "城市", value: "上海市浦东新区" },
  { label: "账号状态", slot: "pg-status" },
  { label: "账户余额", value: "¥ 8,888.00" },
  { label: "注册时间", value: "2024-01-15 09:32" },
  {
    label: "个人简介",
    value: "热爱开源，专注于构建优雅易用的前端组件库。",
    span: state.value.column,
  },
]);

// ─── 示例数据 ───────────────────────────────────────────────────

const memberItems = [
  { label: "姓名", value: "苏木木", labelSlot: "member-name" },
  { label: "工号", value: "RB-0042", labelSlot: "member-id" },
  { label: "部门", value: "前端工程团队", labelSlot: "member-dept" },
  { label: "职级", slot: "member-rank", labelSlot: "member-rank-label" },
  { label: "联系方式", value: "sumuyu@reborn.dev", labelSlot: "member-contact" },
  { label: "状态", slot: "member-status", labelSlot: "member-status-label" },
  { label: "加入时间", value: "2023-03-01", labelSlot: "member-joined" },
  { label: "技术栈", slot: "member-skills", labelSlot: "member-skills-label", span: 2 },
];

const skillList = ["Vue 3", "TypeScript", "Tailwind CSS", "Nuxt 3", "Vite"];
const certList = ["官方认证商家", "极速发货", "七天无理由", "品质保证"];
const categoryList = ["电子数码", "智能穿戴", "配件周边"];

/** 逐项背景色 / 字体色 / class / 空值 / 命名插槽示例 */
const coloredItems = [
  {
    label: "订单编号",
    value: "ORD-2025-88190234",
    labelBackground: "#E1F3D8",
    contentBackground: "#FDE2E2",
    labelColor: "#166534",
    contentColor: "#991b1b",
    contentClass: "font-mono tracking-wide",
  },
  { label: "订单状态", value: "配送中", contentColor: "#374151" },
  { label: "商品金额", value: "¥ 1,299.00", contentColor: "#374151" },
  {
    label: "实付金额",
    value: "¥ 1,199.00",
    labelBackground: "#FDE2E2",
    contentColor: "#dc2626",
    contentBold: true,
    labelBold: true,
    labelColor: "#991b1b",
  },
  { label: "发票信息", value: null, contentColor: "#9ca3af", contentClass: "italic" },
  {
    label: "支付方式",
    slot: "colored-payment",
    labelSlot: "colored-payment-label",
    labelBackground: "#EFF6FF",
    labelColor: "#1d4ed8",
  },
  {
    label: "收货地址",
    value: "上海市浦东新区世纪大道 1000 号",
    span: 2,
    contentColor: "#374151",
    labelClass: "font-semibold",
  },
];
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      component-name="RebornDescriptions"
      title="交互演练场"
      description="调节左侧属性，实时预览列数、边框、对齐与配色的组合效果。"
    >
      <template #left>
        <RebornButton
          label="重置配置"
          size="sm"
          color="neutral"
          variant="outline"
          @click="resetDemo"
        >
          <template #leading>
            <Icon
              name="lucide:rotate-ccw"
              class="size-4"
            />
          </template>
        </RebornButton>
      </template>

      <!-- 关闭宽度自适应时改用横向滚动，避免表格被压缩变形 -->
      <div
        class="w-full"
        :class="[!state.responsive && 'overflow-x-auto pb-3', state.direction === 'vertical' && 'pt-2']"
      >
        <RebornDescriptions
          :title="state.title"
          :column="state.column"
          :size="state.size"
          :border="state.border"
          :direction="state.direction"
          :colon="state.colon"
          :rounded="state.rounded"
          :responsive="state.responsive"
          :label-background="state.labelBackground || undefined"
          :content-background="state.contentBackground || undefined"
          :label-align="state.labelAlign"
          :content-align="state.contentAlign"
          :label-line-height="effectiveLabelLineHeight"
          :content-line-height="effectiveContentLineHeight"
          :items="playgroundItems"
          :class="state.responsive ? 'w-full' : 'w-full shrink-0'"
          :style="!state.responsive ? { minWidth: playgroundMinWidth } : undefined"
        >
          <template #actions>
            <button
              type="button"
              class="text-primary hover:text-primary/80 inline-flex cursor-pointer items-center gap-1 text-sm font-medium transition-colors"
              @click="resetDemo"
            >
              <Icon
                name="lucide:rotate-ccw"
                size="14"
              />
              重置
            </button>
          </template>
          <template #content-pg-status>
            <span
              class="bg-success/10 text-success inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
            >
              <span class="bg-success size-1.5 rounded-full" />
              正常
            </span>
          </template>
        </RebornDescriptions>
      </div>
    </Playground>

    <DemoSection
      title="富内容插槽"
      description="items[].labelSlot 与 items[].slot 搭配 #label-* / #content-* 插槽，可在标签区与内容区嵌入图标、徽标等富内容。"
    >
      <DemoBlock layout="stack">
        <RebornDescriptions
          title="团队成员"
          :column="2"
          border="bordered"
          :items="memberItems"
        >
          <template #label-member-name>
            <span class="inline-flex items-center gap-1.5">
              <Icon
                name="lucide:user"
                class="text-primary size-3.5 shrink-0"
              />
              姓名
            </span>
          </template>
          <template #label-member-id>
            <span class="inline-flex items-center gap-1.5">
              <Icon
                name="lucide:badge-check"
                class="text-muted size-3.5 shrink-0"
              />
              工号
            </span>
          </template>
          <template #label-member-dept>
            <span class="inline-flex items-center gap-1.5">
              <Icon
                name="lucide:building-2"
                class="text-muted size-3.5 shrink-0"
              />
              部门
            </span>
          </template>
          <template #label-member-rank-label>
            <span class="inline-flex items-center gap-1.5">
              <Icon
                name="lucide:award"
                class="text-warning size-3.5 shrink-0"
              />
              职级
            </span>
          </template>
          <template #label-member-contact>
            <span class="inline-flex items-center gap-1.5">
              <Icon
                name="lucide:mail"
                class="text-muted size-3.5 shrink-0"
              />
              联系方式
            </span>
          </template>
          <template #label-member-status-label>
            <span class="inline-flex items-center gap-1.5">
              <Icon
                name="lucide:activity"
                class="text-success size-3.5 shrink-0"
              />
              状态
            </span>
          </template>
          <template #label-member-joined>
            <span class="inline-flex items-center gap-1.5">
              <Icon
                name="lucide:calendar"
                class="text-muted size-3.5 shrink-0"
              />
              加入时间
            </span>
          </template>
          <template #label-member-skills-label>
            <span class="inline-flex items-center gap-1.5">
              <Icon
                name="lucide:code-2"
                class="text-primary size-3.5 shrink-0"
              />
              技术栈
            </span>
          </template>
          <template #content-member-rank>
            <span class="bg-primary/10 text-primary rounded-ui-2xs inline-flex items-center gap-1 px-2 py-0.5 text-xs font-bold">
              P6 高级工程师
            </span>
          </template>
          <template #content-member-status>
            <span class="inline-flex items-center gap-1.5 text-sm">
              <span class="bg-success size-2 rounded-full" />
              在线
            </span>
          </template>
          <template #content-member-skills>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="skill in skillList"
                :key="skill"
                class="bg-elevated text-muted rounded-full px-2.5 py-0.5 text-xs font-medium"
              >
                {{ skill }}
              </span>
            </div>
          </template>
        </RebornDescriptions>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="子组件语法"
      description="除 items 数组驱动外，也可直接使用 RebornDescriptionsItem 子组件语法，内容插槽支持嵌入任意 Vue 组件。"
    >
      <DemoBlock layout="stack">
        <RebornDescriptions
          title="电商店铺概览"
          :column="3"
          border="bordered"
        >
          <RebornDescriptionsItem label="店铺名称">Reborn Official Store</RebornDescriptionsItem>
          <RebornDescriptionsItem label="评分">
            <span class="flex items-center gap-1">
              <Icon
                v-for="i in 5"
                :key="i"
                name="lucide:star"
                class="size-3.5"
                :class="i <= 4 ? 'fill-warning text-warning' : 'text-dimmed'"
              />
              <span class="text-muted ml-1 text-sm font-medium">4.9</span>
            </span>
          </RebornDescriptionsItem>
          <RebornDescriptionsItem label="店铺状态">
            <span
              class="bg-success/10 text-success inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium"
            >
              <span class="bg-success size-1.5 rounded-full" />
              营业中
            </span>
          </RebornDescriptionsItem>
          <RebornDescriptionsItem label="累计销量">129,480 件</RebornDescriptionsItem>
          <RebornDescriptionsItem label="好评率">
            <span class="text-success font-semibold">98.6%</span>
          </RebornDescriptionsItem>
          <RebornDescriptionsItem label="粉丝数">
            <span class="font-semibold">42,311</span>
            <span class="text-dimmed ml-1 text-xs">人</span>
          </RebornDescriptionsItem>
          <RebornDescriptionsItem label="主营品类">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="cat in categoryList"
                :key="cat"
                class="bg-info/10 text-info rounded-ui-2xs px-2 py-0.5 text-xs font-medium"
              >
                {{ cat }}
              </span>
            </div>
          </RebornDescriptionsItem>
          <RebornDescriptionsItem
            label="认证信息"
            :span="2"
          >
            <div class="flex flex-wrap items-center gap-2">
              <span
                v-for="cert in certList"
                :key="cert"
                class="bg-primary/10 text-primary inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
              >
                <Icon
                  name="lucide:shield-check"
                  class="size-3"
                />
                {{ cert }}
              </span>
            </div>
          </RebornDescriptionsItem>
        </RebornDescriptions>
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="逐项自定义样式"
      description="每个描述项可单独指定背景色、字体颜色、加粗与 CSS 类名；单项字段优先于组件全局属性，value 传 null 表示空值。"
    >
      <DemoBlock layout="stack">
        <RebornDescriptions
          title="彩色订单详情"
          :column="2"
          border="bordered"
          :items="coloredItems"
        >
          <template #label-colored-payment-label>
            <span class="inline-flex items-center gap-1.5">
              <Icon
                name="lucide:credit-card"
                class="size-3.5"
              />
              支付方式
            </span>
          </template>
          <template #content-colored-payment>
            <span class="inline-flex items-center gap-1.5 font-medium">
              <Icon
                name="lucide:wallet"
                class="text-primary size-3.5"
              />
              微信支付
            </span>
          </template>
        </RebornDescriptions>
        <DemoNote tone="dimmed">完整的 items 字段说明与代码写法见下方 API 文档。</DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
