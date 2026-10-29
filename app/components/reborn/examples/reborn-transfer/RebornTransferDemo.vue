<script setup lang="ts">
import type {
  TransferCheckShape,
  TransferColor,
  TransferDataRecord,
  TransferVariant,
} from "~/components/reborn/ui/reborn-transfer/reborn-transfer.config";
import { computed, shallowRef } from "vue";

import RebornBadge from "~/components/reborn/ui/reborn-badge/RebornBadge.vue";
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import {
  transferCheckShapes,
  transferColors,
  transferVariants,
} from "~/components/reborn/ui/reborn-transfer/reborn-transfer.config";
import RebornTransfer from "~/components/reborn/ui/reborn-transfer/RebornTransfer.vue";
import { cn } from "~/lib/utils";

/** 本演示使用默认字段，同时满足支持字段别名的宽记录契约。 */
interface DemoTransferItem extends TransferDataRecord { key: string; label: string; description?: string; disabled?: boolean }

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场固定高度选项 */
const transferHeightPresetOptions = [
  { label: "不设置（由父元素决定）", value: "auto" },
  { label: "280px", value: 280 },
  { label: "360px", value: 360 },
  { label: "420px", value: 420 },
] as const;

const defaultPlaygroundState = {
  variant: "outlined" as TransferVariant,
  color: "primary" as TransferColor,
  disabled: false,
  showSearch: false,
  headerSelect: "both",
  oneWay: false,
  showUndo: false,
  checkShape: "rounded" as TransferCheckShape,
  heightPreset: "auto" as (typeof transferHeightPresetOptions)[number]["value"],
};

const defaultPlaygroundTargetKeys = ["3", "6", "9"];

const state = shallowRef<Record<string, any>>({ ...defaultPlaygroundState });

/** 高度预设为 auto 时不下发 height；演练场容器本身高度为 auto，列表随条目增高 */
const playgroundHeight = computed(() => {
  const preset = state.value.heightPreset;
  return preset === "auto" ? undefined : (preset as number);
});

const playgroundTargetKeys = shallowRef([...defaultPlaygroundTargetKeys]);

/** 最近一次触发的事件描述，替代 console 输出 */
const lastEvent = shallowRef("");

/** 还原演练场的全部配置与已选项 */
function resetPlaygroundConfig() {
  state.value = { ...defaultPlaygroundState };
  playgroundTargetKeys.value = [...defaultPlaygroundTargetKeys];
  lastEvent.value = "";
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      {
        label: "形态变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "outlined",
        props: {
          options: transferVariants.map((v) => ({
            label: v === "outlined" ? "描边 outlined" : "无边框 borderless",
            value: v,
          })),
        },
      },
      {
        label: "语义色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: transferColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "选中框形状",
        key: "checkShape",
        component: "select" as const,
        defaultValue: "rounded",
        props: {
          options: transferCheckShapes.map((shape) => ({
            label: shape === "square" ? "方形" : shape === "rounded" ? "圆角" : "圆形",
            value: shape,
          })),
        },
      },
      {
        label: "列表高度",
        key: "heightPreset",
        component: "select" as const,
        defaultValue: "auto",
        props: {
          options: transferHeightPresetOptions.map((item) => ({
            label: item.label,
            value: item.value,
          })),
        },
      },
    ],
  },
  {
    title: "交互控制",
    children: [
      {
        label: "头部选择控件",
        key: "headerSelect",
        component: "select" as const,
        defaultValue: "both",
        props: {
          options: [
            { label: "全选复选框", value: "checkbox" },
            { label: "扩展下拉菜单", value: "menu" },
            { label: "复选框 + 菜单", value: "both" },
            { label: "隐藏", value: "none" },
          ],
        },
      },
      { label: "禁用整体", key: "disabled", component: "checkbox" as const, defaultValue: false },
      { label: "显示搜索", key: "showSearch", component: "checkbox" as const, defaultValue: false },
      { label: "单向模式", key: "oneWay", component: "checkbox" as const, defaultValue: false },
      { label: "显示撤回", key: "showUndo", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

function handleChange(nextTargetKeys: string[], direction: "right" | "left", moveKeys: string[]) {
  lastEvent.value = `change · 方向 ${direction} · 移动 ${moveKeys.length} 项 · 右侧共 ${nextTargetKeys.length} 项`;
}

function handleSelectChange(sourceSelectedKeys: string[], targetSelectedKeys: string[]) {
  lastEvent.value = `select-change · 左侧勾选 ${sourceSelectedKeys.length} 项 · 右侧勾选 ${targetSelectedKeys.length} 项`;
}

function handleUndo(
  nextTargetKeys: string[],
  payload: { direction: "right" | "left"; moveKeys: string[] },
) {
  lastEvent.value = `undo · 撤回 ${payload.moveKeys.length} 项 · 右侧共 ${nextTargetKeys.length} 项`;
}

/** 演练场右上角展示的等价代码 */
const codeString = computed(() => {
  const heightAttr =
    playgroundHeight.value != null ? `\n  :height="${playgroundHeight.value}"` : "";
  return `<RebornTransfer
  v-model="targetKeys"
  :data-source="dataSource"
  :titles="['可选科目', '已选科目']"
  variant="${state.value.variant}"
  color="${state.value.color}"
  :disabled="${state.value.disabled}"
  :show-search="${state.value.showSearch}"
  header-select="${state.value.headerSelect}"
  :one-way="${state.value.oneWay}"
  :show-undo="${state.value.showUndo}"
  check-shape="${state.value.checkShape}"${heightAttr}
/>`;
});

/** 演练场数据源 */
const playgroundData: DemoTransferItem[] = [
  { key: "1", label: "语文", description: "人教版 · 必修" },
  { key: "2", label: "数学", description: "人教版 · 必修" },
  { key: "3", label: "英语", description: "人教版 · 必修" },
  { key: "4", label: "物理", description: "人教版 · 必修" },
  { key: "5", label: "化学", description: "人教版 · 选修" },
  { key: "6", label: "生物", description: "人教版 · 选修" },
  { key: "7", label: "历史", description: "人教版 · 选修" },
  { key: "8", label: "地理", description: "人教版 · 选修" },
  { key: "9", label: "政治", description: "人教版 · 选修" },
  { key: "10", label: "美术", description: "选课 · 艺体" },
];

// ─── 场景演示数据 ───────────────────────────────────────────────

/** 形态变体：两种形态共用一份数据，各自维护已选项 */
const variantDemoData: DemoTransferItem[] = [
  { key: "bj", label: "北京" },
  { key: "sh", label: "上海" },
  { key: "gz", label: "广州" },
  { key: "sz", label: "深圳" },
  { key: "hz", label: "杭州" },
  { key: "cd", label: "成都" },
];
const variantOutlinedTargetKeys = shallowRef(["sh", "hz"]);
const variantBorderlessTargetKeys = shallowRef(["sh", "hz"]);

/** 列表分页：56 条模拟员工数据 */
const DEPARTMENTS = ["研发部", "产品部", "设计部", "运营部", "市场部", "人力部"] as const;

const paginationDemoData: DemoTransferItem[] = Array.from({ length: 56 }, (_, i) => {
  const no = i + 1;
  const dept = DEPARTMENTS[i % DEPARTMENTS.length]!;
  return {
    key: `emp-${no}`,
    label: `员工 ${String(no).padStart(2, "0")}`,
    description: `工号 E${10000 + no} · ${dept}`,
  };
});

const paginationTargetKeys = shallowRef(["emp-3", "emp-12", "emp-28", "emp-41"]);

/** 虚拟滚动：3000 条只有 label 的商品数据，行高 30 加 4px 行间距正好是默认步长 34 */
const SKU_CATEGORIES = ["数码", "家电", "服饰", "食品", "图书", "美妆"] as const;

const virtualDemoData: DemoTransferItem[] = Array.from({ length: 3000 }, (_, i) => {
  const no = i + 1;
  return {
    key: `sku-${no}`,
    label: `SKU-${String(no).padStart(4, "0")} · ${SKU_CATEGORIES[i % SKU_CATEGORIES.length]}`,
  };
});

const virtualTargetKeys = shallowRef(["sku-2", "sku-15", "sku-1024", "sku-2999"]);

/** 自定义搜索方法：通讯录，description 为「工号 · 部门」 */
const filterDemoData: DemoTransferItem[] = [
  { key: "f1", label: "陈晨", description: "E10021 · 研发部" },
  { key: "f2", label: "苏木木", description: "E10035 · 研发部" },
  { key: "f3", label: "林涛", description: "E10042 · 设计部" },
  { key: "f4", label: "赵小雅", description: "E10058 · 产品部" },
  { key: "f5", label: "王博", description: "E10063 · 测试部" },
  { key: "f6", label: "孙悦", description: "E10077 · 运维部" },
  { key: "f7", label: "Lucas Chen", description: "E10081 · 设计部" },
  { key: "f8", label: "Mia Wang", description: "E10094 · 产品部" },
];
const filterDemoTargetKeys = shallowRef(["f3"]);

/** 姓名、工号、部门任一包含搜索词即命中，英文不区分大小写 */
function filterByLabelOrDescription(input: string, item: TransferDataRecord): boolean {
  const keyword = input.trim().toLowerCase();
  return [item.label, item.description].some((field) =>
    String(field ?? "").toLowerCase().includes(keyword),
  );
}

/** 禁用条目：内置角色不可移除 */
const withDisabledData: DemoTransferItem[] = [
  { key: "admin", label: "超级管理员", description: "系统内置，不可移除", disabled: true },
  { key: "editor", label: "内容编辑", description: "可编辑文章与媒体" },
  { key: "viewer", label: "访客", description: "只读权限" },
  { key: "ops", label: "运维工程师", description: "服务器与部署权限" },
  { key: "finance", label: "财务", description: "查看财务报表", disabled: true },
  { key: "marketing", label: "市场推广", description: "管理营销活动" },
];
const withDisabledTargetKeys = shallowRef(["editor", "ops"]);

/** 单向模式：任务看板 */
const oneWayData: DemoTransferItem[] = [
  { key: "a", label: "待办 · 优化登录流程", description: "预计 2 天" },
  { key: "b", label: "待办 · 修复支付 Bug", description: "预计 0.5 天" },
  { key: "c", label: "待办 · 数据看板重构", description: "预计 5 天" },
  { key: "d", label: "待办 · 增加单元测试", description: "预计 3 天" },
  { key: "e", label: "待办 · 文档更新", description: "预计 1 天" },
];
const oneWayTargetKeys = shallowRef(["b", "c"]);
const oneWayEnabled = shallowRef(true);

/** 自定义中间操作按钮：区域覆盖 */
const customOpData: DemoTransferItem[] = [
  { key: "1", label: "华北区" },
  { key: "2", label: "华东区" },
  { key: "3", label: "华南区" },
  { key: "4", label: "西南区" },
  { key: "5", label: "西北区" },
];
const customOpTargetKeys = shallowRef(["2", "4"]);
const customOpSlotTargetKeys = shallowRef(["2", "4"]);

/** operation 插槽示例：按 action 给出按钮文案 */
const operationSlotLabels = {
  toRight: "加入覆盖",
  toLeft: "移出覆盖",
  undo: "撤销上一步",
} as const;

/** 高度跟随父元素：16 个统计指标，超出父元素高度后在列表内滚动 */
const heightDemoData: DemoTransferItem[] = [
  "访问量",
  "独立访客",
  "跳出率",
  "平均停留时长",
  "新增用户",
  "活跃用户",
  "次日留存率",
  "转化率",
  "客单价",
  "订单数",
  "退款率",
  "复购率",
  "页面加载时长",
  "接口错误率",
  "崩溃率",
  "搜索次数",
].map((label, i) => ({ key: `m${i + 1}`, label }));
const heightDemoTargetKeys = shallowRef(["m1", "m2", "m8"]);

/** 头部与底部插槽：候选人名单 */
const slotDemoData: DemoTransferItem[] = [
  { key: "c1", label: "周宁", description: "一面通过" },
  { key: "c2", label: "吴桐", description: "二面通过" },
  { key: "c3", label: "郑一帆", description: "一面通过" },
  { key: "c4", label: "冯晓", description: "终面通过" },
  { key: "c5", label: "何青", description: "二面通过" },
  { key: "c6", label: "许诺", description: "一面通过" },
];
const slotDemoTargetKeys = shallowRef(["c4"]);

/** 自定义条目插槽：成员列表 */
const memberData: DemoTransferItem[] = [
  { key: "u1", label: "陈晨", description: "前端工程师 · P5" },
  { key: "u2", label: "苏木木", description: "后端工程师 · P6" },
  { key: "u3", label: "林涛", description: "UI 设计师 · D4" },
  { key: "u4", label: "赵小雅", description: "产品经理 · P5" },
  { key: "u5", label: "王博", description: "测试工程师 · P4" },
  { key: "u6", label: "孙悦", description: "运维工程师 · P5" },
];

/** 自定义条目示例：右侧默认已穿梭成员 */
const memberDefaultTargetKeys = ["u2", "u4", "u6"];

/** 根据姓名生成头像色 */
function getAvatarColor(value: unknown): string {
  const name = String(value ?? "");
  const colors = [
    "bg-primary/15 text-primary",
    "bg-success/15 text-success",
    "bg-info/15 text-info",
    "bg-warning/15 text-warning",
    "bg-secondary/15 text-secondary",
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return colors[idx]!;
}

/** 根据描述中的职级生成徽标样式 */
function getRankClass(value: unknown): string {
  const description = String(value ?? "");
  if (description.includes("P6") || description.includes("P7") || description.includes("D5")) {
    return "bg-primary/10 text-primary";
  }
  if (description.includes("D4")) return "bg-success/10 text-success";
  return "bg-elevated text-muted";
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="codeString"
      component-name="RebornTransfer"
      title="交互演练场"
      description="切换形态、语义色、头部控件与穿梭方向，实时预览两侧列表的联动表现。"
    >
      <template #tag>
        <RebornButton
          variant="soft"
          size="sm"
          label="重置配置"
          @click="resetPlaygroundConfig"
        >
          <template #leading>
            <Icon
              name="lucide:rotate-ccw"
              class="size-3.5"
            />
          </template>
        </RebornButton>
      </template>

      <div class="flex w-full flex-col gap-4">
        <RebornTransfer
          v-model="playgroundTargetKeys"
          :data-source="playgroundData"
          :titles="['可选科目', '已选科目']"
          :variant="state.variant"
          :color="state.color"
          :height="playgroundHeight"
          :disabled="state.disabled"
          :show-search="state.showSearch"
          :header-select="state.headerSelect"
          :one-way="state.oneWay"
          :show-undo="state.showUndo"
          :check-shape="state.checkShape"
          class="w-full"
          @change="handleChange"
          @select-change="handleSelectChange"
          @undo="handleUndo"
        />
        <DemoNote
          v-if="lastEvent"
          tone="dimmed"
        >
          最后事件：<code>{{ lastEvent }}</code>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection
      title="形态变体"
      description="outlined 为带描边与头部的完整面板；borderless 去掉面板边框和头部，适合嵌进已有卡片或弹窗、外层已经提供边界的场景。"
    >
      <DemoBlock layout="stack">
        <div class="flex w-full flex-col gap-2">
          <span class="text-muted text-sm">outlined</span>
          <RebornTransfer
            v-model="variantOutlinedTargetKeys"
            :data-source="variantDemoData"
            :titles="['可选城市', '已选城市']"
            class="w-full"
          />
        </div>
        <div class="flex w-full flex-col gap-2">
          <span class="text-muted text-sm">borderless</span>
          <RebornTransfer
            v-model="variantBorderlessTargetKeys"
            :data-source="variantDemoData"
            variant="borderless"
            class="w-full"
          />
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        borderless 不渲染头部，全选复选框、扩展菜单、标题与计数随之隐藏，此时 <code>titles</code> 与
        <code>header-select</code> 不生效，只能逐项勾选。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="高度跟随父元素"
      description="组件不提供尺寸档位，根节点撑满父元素高度。父元素给定高度后，条目超出的部分在列表内滚动，滚动条由 RebornScrollbar 绘制，不占列表宽度。"
    >
      <DemoBlock layout="stack">
        <div class="h-72 w-full">
          <RebornTransfer
            v-model="heightDemoTargetKeys"
            :data-source="heightDemoData"
            :titles="['可选指标', '已选指标']"
            show-search
            search-placeholder="搜索指标"
            class="w-full"
          />
        </div>
      </DemoBlock>
      <DemoNote tone="dimmed">
        父元素高度为 auto 时组件不限制高度，列表随条目增高；条目较多时给父元素设高度，或直接传
        <code>height</code>（如 <code>:height="320"</code>）。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="列表分页"
      description="数据量较大时用 pagination 开启两侧独立分页，每页只渲染固定条数以减轻长列表的滚动与 DOM 压力。"
    >
      <DemoBlock layout="stack">
        <RebornTransfer
          v-model="paginationTargetKeys"
          :data-source="paginationDemoData"
          :titles="['组织全员', '项目组已选']"
          :pagination="{ pageSize: 8 }"
          show-search
          show-undo
          search-placeholder="按姓名搜索"
          class="w-full"
        />
      </DemoBlock>
      <DemoNote tone="dimmed">
        共 {{ paginationDemoData.length }} 条候选数据，每页 8 条，当前已选
        {{ paginationTargetKeys.length }} 人。搜索会重置到第 1 页。头部复选框只勾选当前页；下拉菜单逐行列出搜索结果内的全部条目（不受分页限制），点一行切换该条勾选，适合跨页挑人。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="虚拟滚动"
      description="数据量大又不想分页时，用 virtual-scroll 让列表只渲染可视区附近的条目，滚动时按位置替换。行高固定为 virtual-item-height，面板需要确定的高度，这里传了 height。"
    >
      <DemoBlock layout="stack">
        <RebornTransfer
          v-model="virtualTargetKeys"
          :data-source="virtualDemoData"
          :titles="['全部商品', '已选商品']"
          :height="360"
          virtual-scroll
          show-search
          search-placeholder="按编号或品类搜索"
          class="w-full"
        />
      </DemoBlock>
      <DemoNote tone="dimmed">
        共 {{ virtualDemoData.length }} 条，当前已选 {{ virtualTargetKeys.length }} 条，滚动时左侧列表的 DOM 里始终只有十几行。
        <code>virtual-item-height</code> 默认 34，等于只有 label 的行高 30 加 4px 行间距；条目带 description 时要传 56，用插槽改了行高时也要同步改，否则相邻行会重叠或留出空白。头部下拉同样按虚拟列表渲染。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="自定义搜索方法"
      description="不传 filter-option 时，搜索按 label 做包含匹配，英文不区分大小写。条目的其他字段也要参与搜索时，传入 filter-option 自行判断，返回 true 即保留该条目。"
    >
      <DemoBlock layout="stack">
        <RebornTransfer
          v-model="filterDemoTargetKeys"
          :data-source="filterDemoData"
          :titles="['通讯录', '已邀请']"
          :filter-option="filterByLabelOrDescription"
          show-search
          search-placeholder="姓名、工号或部门"
          class="w-full"
        />
      </DemoBlock>
      <DemoNote tone="dimmed">
        方法签名为 <code>(inputValue, item) =&gt; boolean</code>，<code>item</code> 是 dataSource 里的原始对象，配置了
        <code>field-names</code> 时要按原始字段名取值。在左侧输入「设计」能找到 Lucas Chen，输入「E1006」能找到王博，默认搜索下只有输入姓名才会命中。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="头部与底部插槽"
      description="title 插槽替换头部左侧的勾选区，extra 插槽替换右侧标题，footer 插槽渲染在面板底部。左右面板共用同一个插槽，用作用域里的 direction 区分。"
    >
      <DemoBlock layout="stack">
        <RebornTransfer
          v-model="slotDemoTargetKeys"
          :data-source="slotDemoData"
          :titles="['候选人', '拟录用']"
          class="w-full"
        >
          <template #title="{ direction, checked, indeterminate, disabled, checkedCount, total, toggle }">
            <RebornCheckbox
              :model-value="checked"
              :indeterminate="indeterminate"
              :disabled="disabled"
              size="sm"
              :label="`${direction === 'left' ? '待定' : '录用'} ${checkedCount} / ${total}`"
              :ui="{ label: 'text-sm' }"
              @change="toggle"
            />
          </template>
          <template #extra="{ direction, title }">
            <span class="truncate text-sm font-semibold text-gray-9">{{ title }}</span>
            <RebornBadge
              v-if="direction === 'right'"
              :label="`${slotDemoTargetKeys.length} 人`"
              color="success"
              variant="soft"
              size="sm"
            />
          </template>
          <template #footer="{ direction, total, checkedCount }">
            <span class="text-sm text-gray-7">
              {{ direction === "left" ? "候选" : "拟录用" }}共 {{ total }} 人<template v-if="checkedCount">，已勾选 {{ checkedCount }} 人</template>
            </span>
          </template>
        </RebornTransfer>
      </DemoBlock>
      <DemoNote tone="dimmed">
        title 插槽作用域给出 <code>checked</code> / <code>indeterminate</code> / <code>toggle</code>，自绘的全选控件和默认复选框一样只作用于当前页；头部的下拉菜单不在插槽内，仍按
        <code>header-select</code> 显示。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="禁用条目"
      description="在 dataSource 中为条目设置 disabled: true，即可禁止该条目被勾选与穿梭。"
    >
      <DemoBlock layout="stack">
        <RebornTransfer
          v-model="withDisabledTargetKeys"
          :data-source="withDisabledData"
          :titles="['全部角色', '已授权角色']"
          class="w-full"
        />
      </DemoBlock>
    </DemoSection>

    <DemoSection
      title="单向模式"
      description="one-way 只保留从左至右的穿梭通道：开启后移入右侧的条目可用行尾的「撤回」按钮逐条退回，开启前就在右侧的条目不可撤回，适合「一经确认不可回退」的流程。"
    >
      <DemoBlock layout="stack">
        <div class="flex items-center gap-3">
          <RebornSwitch v-model="oneWayEnabled" />
          <span class="text-muted text-sm">开启单向模式</span>
        </div>
        <RebornTransfer
          v-model="oneWayTargetKeys"
          :data-source="oneWayData"
          :titles="['待办任务', '进行中']"
          :one-way="oneWayEnabled"
          header-select="menu"
          class="w-full"
        />
      </DemoBlock>
      <DemoNote tone="dimmed">
        「修复支付 Bug」「数据看板重构」是初始值，开启单向模式前就在右侧，没有撤回按钮，在右侧下拉中也置灰；从左侧新移入的条目才能撤回，在下拉中取消选中与点它的「撤回」按钮效果相同。关掉开关再打开，当时已在右侧的条目都会变为不可撤回。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="自定义操作按钮"
      description="operation-buttons 配置三个操作按钮的图标、文案与悬停提示；要换掉按钮本身（变体、颜色或改用别的组件）时用 operation 插槽。"
    >
      <DemoBlock layout="stack">
        <RebornTransfer
          v-model="customOpTargetKeys"
          :data-source="customOpData"
          :titles="['未覆盖区域', '已覆盖区域']"
          show-undo
          :operation-buttons="{
            toRight: {
              title: '将选中区域加入覆盖范围',
              label: '加入',
              icon: 'lucide:plus',
              iconClass: 'size-3.5 text-primary',
              trailingIcon: 'lucide:chevron-right',
              trailingIconClass: 'size-3.5 opacity-60',
            },
            toLeft: {
              title: '从覆盖范围移除选中区域',
              label: '移除',
              icon: 'lucide:minus',
              iconClass: 'size-3.5 text-warning',
              trailingIcon: 'lucide:chevron-left',
              trailingIconClass: 'size-3.5 opacity-60',
            },
            undo: {
              title: '撤销最近一次区域调整',
              label: '撤销',
              icon: 'lucide:history',
              iconClass: 'size-3.5',
              trailingIcon: 'lucide:rotate-ccw',
              trailingIconClass: 'size-3 opacity-50',
            },
          }"
          class="w-full"
        />
      </DemoBlock>
      <DemoBlock layout="stack">
        <RebornTransfer
          v-model="customOpSlotTargetKeys"
          :data-source="customOpData"
          :titles="['未覆盖区域', '已覆盖区域']"
          show-undo
          class="w-full"
        >
          <template #operation="{ action, config, disabled, onClick }">
            <RebornButton
              size="sm"
              :variant="action === 'undo' ? 'text' : 'outlined'"
              :color="disabled ? 'neutral' : action === 'toLeft' ? 'warning' : 'primary'"
              :disabled="disabled"
              :title="config.title"
              :label="operationSlotLabels[action]"
              @click="onClick"
            />
          </template>
        </RebornTransfer>
      </DemoBlock>
      <DemoNote tone="dimmed">
        operation 插槽按按钮逐个调用，<code>action</code> 区分是哪个按钮（toRight / toLeft /
        undo），<code>onClick</code> 执行对应操作，禁用时调用不会生效。默认按钮禁用时会改用 neutral 色，自绘按钮建议同样按 <code>disabled</code> 切换颜色，示例即如此处理。只想改按钮内部内容、保留 RebornButton
        外壳时，用 <code>operation-to-right</code> / <code>operation-to-left</code> /
        <code>operation-undo</code> 插槽。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="自定义条目"
      description="default 插槽接管条目文案区域的渲染，作用域提供原始数据 item、所在方向 direction 与勾选状态 checked；条目前的复选框仍由组件渲染。"
    >
      <DemoBlock layout="stack">
        <RebornTransfer
          :data-source="memberData"
          :default-target-keys="memberDefaultTargetKeys"
          :titles="['全部成员', '项目组成员']"
          class="w-full"
        >
          <template #default="{ item }">
            <div class="flex items-center gap-2.5">
              <!-- 头像：取姓名首字，配色由字符编码派生 -->
              <div
                :class="
                  cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold',
                    getAvatarColor(item.label),
                  )
                "
              >
                {{ String(item.label ?? "").charAt(0) }}
              </div>
              <!-- 姓名与职级 -->
              <div class="min-w-0 flex-1">
                <div class="text-highlighted truncate text-sm font-medium">
                  {{ item.label }}
                </div>
                <div
                  v-if="item.description"
                  class="mt-0.5 flex items-center gap-1.5"
                >
                  <span
                    :class="
                      cn(
                        'rounded-sm px-1.5 py-px text-sm font-semibold',
                        getRankClass(item.description),
                      )
                    "
                  >
                    {{ String(item.description ?? "").split(" · ")[1] }}
                  </span>
                  <span class="text-dimmed truncate text-sm">
                    {{ String(item.description ?? "").split(" · ")[0] }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </RebornTransfer>
      </DemoBlock>
      <DemoNote tone="dimmed">
        旧的 <code>#item</code> 插槽仍可用（作用域只有 <code>item</code>），二者同时提供时 default
        优先。示例同时用 <code>default-target-keys</code> 预设了右侧的初始成员。
      </DemoNote>
    </DemoSection>
  </div>
</template>
