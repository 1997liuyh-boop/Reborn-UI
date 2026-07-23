<script setup lang="ts">
import type {
  DescriptionsAlign,
  DescriptionsBorderMode,
  DescriptionsLineHeight,
  DescriptionsSize,
} from "~/components/reborn/ui/reborn-descriptions/reborn-descriptions.config";
import { useColorMode } from "@vueuse/core";
import RebornCollapse from "~/components/reborn/ui/reborn-collapse/RebornCollapse.vue";
import RebornColorPicker from "~/components/reborn/ui/reborn-color-picker/RebornColorPicker.vue";
import {
  descriptionsAligns,
  descriptionsBorderModes,
  descriptionsLineHeights,
  descriptionsSizes,
} from "~/components/reborn/ui/reborn-descriptions/reborn-descriptions.config";
import RebornDescriptions from "~/components/reborn/ui/reborn-descriptions/RebornDescriptions.vue";
import RebornDescriptionsItem from "~/components/reborn/ui/reborn-descriptions/RebornDescriptionsItem.vue";
import RebornInput from "~/components/reborn/ui/reborn-input/RebornInput.vue";
import RebornRadio from "~/components/reborn/ui/reborn-radio/RebornRadio.vue";
import RebornRadioGroup from "~/components/reborn/ui/reborn-radio/RebornRadioGroup.vue";
import RebornSelect from "~/components/reborn/ui/reborn-select/RebornSelect.vue";
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";

// ─── 交互配置演示 ─────────────────────────────────────────────────

const demoTitle = ref("用户信息");
const demoColumn = ref(3);
const demoSize = ref<DescriptionsSize>("md");
const demoBorder = ref<DescriptionsBorderMode>("bordered");
const demoDirection = ref<"horizontal" | "vertical">("horizontal");
const demoColon = ref(true);
const demoRounded = ref(true);
const demoResponsive = ref(true);
const demoLabelBackground = ref("");
const demoContentBackground = ref("");
const demoLabelAlign = ref<DescriptionsAlign>("left");
const demoContentAlign = ref<DescriptionsAlign>("left");
const demoLabelLineHeight = ref<DescriptionsLineHeight>("relaxed");
const demoContentLineHeight = ref<DescriptionsLineHeight>("relaxed");
const demoLabelLineHeightCustom = ref("");
const demoContentLineHeightCustom = ref("");

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

const effectiveDemoLabelLineHeight = computed(
  () => demoLabelLineHeightCustom.value.trim() || demoLabelLineHeight.value,
);
const effectiveDemoContentLineHeight = computed(
  () => demoContentLineHeightCustom.value.trim() || demoContentLineHeight.value,
);

const borderSelectOptions = descriptionsBorderModes.map((m) => ({
  label: m === "bordered" ? "有边框 bordered" : m === "divider" ? "分割线 divider" : "无边框 none",
  value: m,
}));

const colorMode = useColorMode();

/** 演练场取色器图标：浅色与边框同色（gray-5），深色用 gray-4 保证可见 */
const demoColorPickerUi = computed(() => ({
  icon:
    colorMode.value === "dark"
      ? "text-gray-4 transition-transform duration-200"
      : "text-gray-5 transition-transform duration-200",
}));

function resetDemo() {
  demoTitle.value = "用户信息";
  demoColumn.value = 3;
  demoSize.value = "md";
  demoBorder.value = "bordered";
  demoDirection.value = "horizontal";
  demoColon.value = true;
  demoRounded.value = true;
  demoResponsive.value = true;
  demoLabelBackground.value = "";
  demoContentBackground.value = "";
  demoLabelAlign.value = "left";
  demoContentAlign.value = "left";
  demoLabelLineHeight.value = "relaxed";
  demoContentLineHeight.value = "relaxed";
  demoLabelLineHeightCustom.value = "";
  demoContentLineHeightCustom.value = "";
}

/** 关闭宽度自适应时，按列数估算表格最小宽度，供外层横轴滚动展示 */
const playgroundMinWidth = computed(() => {
  if (demoResponsive.value) return undefined;
  const cols = Math.max(Number(demoColumn.value) || 1, 1);
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
    span: demoColumn.value,
  },
]);

// ─── Showcase 数据 ───────────────────────────────────────────────

const orderItems = [
  { label: "订单编号", value: "ORD-2025-88190234" },
  { label: "下单时间", value: "2025-12-01 14:30:08" },
  { label: "收货人", value: "陈晨 / 186 0000 0000" },
  { label: "收货地址", value: "上海市浦东新区世纪大道 1000 号", span: 2 },
  { label: "商品金额", value: "¥ 1,299.00" },
  { label: "优惠金额", value: "-¥ 100.00" },
  { label: "运费", value: "¥ 0.00" },
  { label: "实付金额", slot: "order-total" },
  { label: "支付方式", slot: "order-payment" },
  { label: "订单状态", slot: "order-status" },
];

const serverItems = [
  { label: "CPU", value: "Intel Xeon Gold 6348 × 2" },
  { label: "内存", value: "256 GB DDR4 ECC" },
  { label: "存储", value: "2 × 1.92TB NVMe SSD (RAID 1)" },
  { label: "网络", value: "10 Gbps 双路 Bonding" },
  { label: "操作系统", value: "Ubuntu Server 24.04 LTS" },
  { label: "所在区域", value: "华东一区 / 上海数据中心" },
  { label: "实例 ID", value: "i-0a1b2c3d4e5f6789" },
  { label: "状态", slot: "server-status" },
  { label: "创建时间", value: "2024-08-10 10:00:00" },
  { label: "到期时间", value: "2026-08-10 00:00:00", span: 2 },
];

const productItems = [
  { label: "品牌", value: "Reborn Pro" },
  { label: "型号", value: "R9 Ultra" },
  { label: "重量", value: "185g" },
  { label: "尺寸", value: "160 × 75 × 8.2mm" },
  { label: "屏幕", value: "6.8″ AMOLED · 2K+" },
  { label: "芯片", value: "Helio X99 Pro" },
];

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
  {
    label: "订单状态",
    value: "配送中",
    contentColor: "#374151",
  },
  {
    label: "商品金额",
    value: "¥ 1,299.00",
    contentColor: "#374151",
  },
  {
    label: "实付金额",
    value: "¥ 1,199.00",
    labelBackground: "#FDE2E2",
    contentColor: "#dc2626",
    contentBold: true,
    labelBold: true,
    labelColor: "#991b1b",
  },
  {
    label: "发票信息",
    value: null,
    contentColor: "#9ca3af",
    contentClass: "italic",
  },
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

/** items 用法代码示例：默认收起 */
const itemsCodeExpanded = ref(false);
</script>

<template>
  <div class="mx-auto flex w-full max-w-6xl flex-col gap-12">
    <!-- ═══ 交互配置演示（上下布局） ═══ -->
    <section>
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 class="border-primary border-l-4 pl-3 text-lg font-bold">交互配置演示</h3>
        <button
          type="button"
          class="bg-primary/10 text-primary hover:bg-primary/20 flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all active:scale-95"
          @click="resetDemo"
        >
          <Icon
            name="lucide:rotate-ccw"
            size="12"
          />
          重置配置
        </button>
      </div>

      <div
        class="grid grid-cols-1 gap-8 rounded-2xl border border-gray-100 bg-gray-50 p-6 md:grid-cols-2 lg:grid-cols-3 dark:border-gray-800 dark:bg-gray-900/50"
      >
        <div>
          <p class="mb-3 text-sm font-medium text-gray-500">排列方向</p>
          <RebornRadioGroup v-model="demoDirection">
            <RebornRadio
              value="horizontal"
              label="水平"
            />
            <RebornRadio
              value="vertical"
              label="垂直"
            />
          </RebornRadioGroup>
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-gray-500">列数</p>
          <RebornRadioGroup v-model="demoColumn">
            <RebornRadio
              v-for="n in [1, 2, 3, 4]"
              :key="n"
              :value="n"
              :label="String(n)"
            />
          </RebornRadioGroup>
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-gray-500">尺寸</p>
          <RebornRadioGroup v-model="demoSize">
            <RebornRadio
              v-for="s in descriptionsSizes"
              :key="s"
              :value="s"
              :label="s.toUpperCase()"
            />
          </RebornRadioGroup>
        </div>

        <div>
          <p class="text-sm font-medium text-gray-500">宽度自适应</p>
          <RebornSwitch
            v-model="demoResponsive"
            active-label="开启"
            inactive-label="关闭"
          />
        </div>

        <div>
          <p class="text-sm font-medium text-gray-500">显示冒号</p>
          <RebornSwitch
            v-model="demoColon"
            active-label="显示"
            inactive-label="隐藏"
          />
        </div>

        <div>
          <p class="text-sm font-medium text-gray-500">表格外圆角</p>
          <RebornSwitch
            v-model="demoRounded"
            active-label="圆角"
            inactive-label="直角"
          />
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-gray-500">边框模式</p>
          <RebornSelect
            v-model="demoBorder"
            :options="borderSelectOptions"
          />
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-gray-500">标签背景</p>
          <RebornColorPicker
            v-model="demoLabelBackground"
            :ui="demoColorPickerUi"
          />
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-gray-500">内容背景</p>
          <RebornColorPicker
            v-model="demoContentBackground"
            :ui="demoColorPickerUi"
          />
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-gray-500">标题</p>
          <RebornInput
            v-model="demoTitle"
            placeholder="描述列表标题"
          />
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-gray-500">标签对齐</p>
          <RebornRadioGroup v-model="demoLabelAlign">
            <RebornRadio
              v-for="align in descriptionsAligns"
              :key="align"
              :value="align"
              :label="alignLabels[align]"
            />
          </RebornRadioGroup>
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-gray-500">内容对齐</p>
          <RebornRadioGroup v-model="demoContentAlign">
            <RebornRadio
              v-for="align in descriptionsAligns"
              :key="align"
              :value="align"
              :label="alignLabels[align]"
            />
          </RebornRadioGroup>
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-gray-500">标签行高</p>
          <RebornSelect
            v-model="demoLabelLineHeight"
            :options="
              descriptionsLineHeights.map((h) => ({ label: lineHeightLabels[h], value: h }))
            "
          />
          <RebornInput
            v-model="demoLabelLineHeightCustom"
            class="mt-2"
            placeholder="自定义 CSS，如 1.8 或 28px"
          />
        </div>

        <div>
          <p class="mb-3 text-sm font-medium text-gray-500">内容行高</p>
          <RebornSelect
            v-model="demoContentLineHeight"
            :options="
              descriptionsLineHeights.map((h) => ({ label: lineHeightLabels[h], value: h }))
            "
          />
          <RebornInput
            v-model="demoContentLineHeightCustom"
            class="mt-2"
            placeholder="自定义 CSS，如 2 或 32px"
          />
        </div>
      </div>

      <div
        class="mt-10 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-800/30"
      >
        <div
          class="w-full"
          :class="[
            !demoResponsive && 'overflow-x-auto pb-3',
            demoDirection === 'vertical' && 'pt-2',
          ]"
        >
          <RebornDescriptions
            :title="demoTitle"
            :column="demoColumn"
            :size="demoSize"
            :border="demoBorder"
            :direction="demoDirection"
            :colon="demoColon"
            :rounded="demoRounded"
            :responsive="demoResponsive"
            :label-background="demoLabelBackground || undefined"
            :content-background="demoContentBackground || undefined"
            :label-align="demoLabelAlign"
            :content-align="demoContentAlign"
            :label-line-height="effectiveDemoLabelLineHeight"
            :content-line-height="effectiveDemoContentLineHeight"
            :items="playgroundItems"
            :class="demoResponsive ? 'w-full' : 'w-full shrink-0'"
            :style="!demoResponsive ? { minWidth: playgroundMinWidth } : undefined"
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
      </div>
    </section>

    <!-- ═══ Showcases（一行一个） ═══ -->
    <div class="flex flex-col gap-10">
      <!-- ── 5. 团队成员 · 富内容插槽 ── -->
      <div class="flex flex-col gap-4">
        <div>
          <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">
            富内容插槽
            <code class="text-primary ml-2 text-sm font-normal">slot</code>
          </h4>
          <p class="mt-1 text-sm text-gray-500">
            通过
            <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">labelSlot</code>
            与
            <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">slot</code>
            配合
            <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">#label-*</code>
            、
            <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">#content-*</code>
            插槽，可在标签区与内容区嵌入图标、徽标等富内容。
          </p>
        </div>
        <div
          class="rounded-2xl bg-white/50 p-6 ring-1 ring-gray-200/80 dark:bg-gray-900/20 dark:ring-gray-700/40"
        >
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
                  class="size-3.5 shrink-0 text-gray-500"
                />
                工号
              </span>
            </template>
            <template #label-member-dept>
              <span class="inline-flex items-center gap-1.5">
                <Icon
                  name="lucide:building-2"
                  class="size-3.5 shrink-0 text-gray-500"
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
                  class="size-3.5 shrink-0 text-gray-500"
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
                  class="size-3.5 shrink-0 text-gray-500"
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
              <span
                class="bg-primary/10 text-primary inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-bold"
              >
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
                  class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                >
                  {{ skill }}
                </span>
              </div>
            </template>
          </RebornDescriptions>
        </div>
      </div>
    </div>

    <!-- ═══ 子组件插槽写法 · 全宽展示 ═══ -->
    <div class="flex flex-col gap-4">
      <div>
        <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">子组件语法</h4>
        <p class="mt-1 text-sm text-gray-500">
          除
          <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">items</code>
          数组驱动外，也可直接使用
          <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
            >RebornDescriptionsItem</code
          >
          子组件语法，内容插槽支持嵌入任意 Vue 组件。
        </p>
      </div>
      <div
        class="rounded-2xl bg-white/50 p-6 ring-1 ring-gray-200/80 dark:bg-gray-900/20 dark:ring-gray-700/40"
      >
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
                :class="i <= 4 ? 'fill-warning text-warning' : 'text-gray-300'"
              />
              <span class="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">4.9</span>
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
            <span class="ml-1 text-xs text-gray-400">人</span>
          </RebornDescriptionsItem>
          <RebornDescriptionsItem label="主营品类">
            <div class="flex flex-wrap gap-1">
              <span
                v-for="cat in categoryList"
                :key="cat"
                class="bg-info/10 text-info rounded px-2 py-0.5 text-xs font-medium"
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
                class="bg-primary/10 text-primary dark:bg-primary/15 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
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
      </div>
    </div>

    <!-- ── 逐项自定义背景色 / 字体色 ── -->
    <div class="flex flex-col gap-4">
      <div>
        <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">逐项自定义样式</h4>
        <p class="mt-1 text-sm text-gray-500">
          每个描述项可单独指定背景色、字体颜色、加粗、CSS 类名，或通过
          <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">slot</code>
          /
          <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">labelSlot</code>
          插入富内容。单项字段优先于组件全局
          <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
            >label-background</code
          >
          等属性；<code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
            >value: null</code
          >
          表示空值。
        </p>
      </div>
      <div
        class="rounded-2xl bg-white/50 p-6 ring-1 ring-gray-200/80 dark:bg-gray-900/20 dark:ring-gray-700/40"
      >
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
      </div>
      <div
        class="rounded-2xl bg-white/50 p-6 ring-1 ring-gray-200/80 dark:bg-gray-900/20 dark:ring-gray-700/40"
      >
        <RebornCollapse
          v-model="itemsCodeExpanded"
          custom-class="w-full"
        >
          <template #default="{ open }">
            <div class="flex cursor-pointer items-center justify-between gap-3">
              <p class="text-xs font-semibold tracking-widest text-gray-400 uppercase">
                通过 items 数组逐项传入
              </p>
              <span class="flex shrink-0 items-center gap-1.5 text-xs text-gray-400">
                {{ open ? "收起" : "展开查看" }}
                <Icon
                  name="lucide:chevron-down"
                  class="size-4 transition-transform duration-200"
                  :class="{ 'rotate-180': open }"
                />
              </span>
            </div>
          </template>
          <template #content>
            <div class="pt-4">
              <pre
                class="overflow-x-auto rounded-xl bg-gray-900 p-4 font-mono text-xs leading-relaxed text-indigo-300"
              ><code>{{ `const items = [
  {
    label: "订单编号",
    value: "ORD-2025-88190234",
    labelBackground: "#E1F3D8",
    contentBackground: "#FDE2E2",
    labelColor: "#166534",
    contentColor: "#991b1b",
    contentClass: "font-mono tracking-wide",
  },
  {
    label: "订单状态",
    value: "配送中",
    contentColor: "#374151",
  },
  {
    label: "实付金额",
    value: "¥ 1,199.00",
    labelBackground: "#FDE2E2",
    contentColor: "#dc2626",
    contentBold: true,
    labelBold: true,
    labelColor: "#991b1b",
  },
  {
    label: "发票信息",
    value: null, // 空值
    contentColor: "#9ca3af",
    contentClass: "italic",
  },
  {
    label: "支付方式",
    slot: "payment",
    labelSlot: "payment-label",
    labelBackground: "#EFF6FF",
    labelColor: "#1d4ed8",
  },
  {
    label: "收货地址",
    value: "上海市浦东新区世纪大道 1000 号",
    span: 2,
    labelClass: "font-semibold",
  },
]` }}</code></pre>
              <pre
                class="mt-3 overflow-x-auto rounded-xl bg-gray-900 p-4 font-mono text-xs leading-relaxed text-indigo-300"
              ><code>{{ `<RebornDescriptions border="bordered" :column="2" :items="items">
  <template #label-payment-label>…</template>
  <template #content-payment>…</template>
</RebornDescriptions>

<!-- 或使用子组件逐项设置 -->
<RebornDescriptions border="bordered" :column="2">
  <RebornDescriptionsItem
    label="订单编号"
    label-background="#E1F3D8"
    label-color="#166534"
    content-background="#FDE2E2"
    content-color="#991b1b"
    content-class="font-mono tracking-wide"
  >
    ORD-2025-88190234
  </RebornDescriptionsItem>
  <RebornDescriptionsItem
    label="发票信息"
    :value="null"
    content-color="#9ca3af"
    content-class="italic"
  />
  <RebornDescriptionsItem
    label="实付金额"
    label-background="#FDE2E2"
    label-color="#991b1b"
    label-bold
    content-color="#dc2626"
    content-bold
  >
    ¥ 1,199.00
  </RebornDescriptionsItem>
</RebornDescriptions>` }}</code></pre>
            </div>
          </template>
        </RebornCollapse>
      </div>
    </div>
  </div>
</template>
