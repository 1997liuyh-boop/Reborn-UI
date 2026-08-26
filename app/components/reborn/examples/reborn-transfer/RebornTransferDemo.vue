<script setup lang="ts">
import type {
  TransferCheckShape,
  TransferItem,
} from "~/components/reborn/ui/reborn-transfer/reborn-transfer.config";

import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import {
  transferCheckShapes,
  transferSizes,
} from "~/components/reborn/ui/reborn-transfer/reborn-transfer.config";
import RebornTransfer from "~/components/reborn/ui/reborn-transfer/RebornTransfer.vue";
import { cn } from "~/lib/utils";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场固定高度选项 */
const transferHeightPresetOptions = [
  { label: "自适应（随尺寸）", value: "auto" },
  { label: "280px", value: 280 },
  { label: "360px", value: 360 },
  { label: "420px", value: 420 },
] as const;

const defaultPlaygroundState = {
  size: "md",
  disabled: false,
  showSearch: false,
  headerSelect: "checkbox",
  oneWay: false,
  showUndo: false,
  checkShape: "rounded" as TransferCheckShape,
  heightPreset: "auto" as (typeof transferHeightPresetOptions)[number]["value"],
};

const defaultPlaygroundTargetKeys = ["3", "6", "9"];

const state = ref<Record<string, any>>({ ...defaultPlaygroundState });

/** 高度预设为 auto 时不下发 height，交由尺寸决定 */
const playgroundHeight = computed(() => {
  const preset = state.value.heightPreset;
  return preset === "auto" ? undefined : (preset as number);
});

const playgroundTargetKeys = ref([...defaultPlaygroundTargetKeys]);

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
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: {
          options: transferSizes.map((s) => ({
            label: s === "sm" ? "小号 SM" : s === "md" ? "中号 MD" : "大号 LG",
            value: s,
          })),
        },
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
        defaultValue: "checkbox",
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

/** 最近一次触发的事件描述，替代 console 输出 */
const lastEvent = ref("");

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
  size="${state.value.size}"
  :disabled="${state.value.disabled}"
  :show-search="${state.value.showSearch}"
  header-select="${state.value.headerSelect}"
  :one-way="${state.value.oneWay}"
  :show-undo="${state.value.showUndo}"
  check-shape="${state.value.checkShape}"${heightAttr}
/>`;
});

/** 演练场数据源 */
const playgroundData: TransferItem[] = [
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

/** 列表分页：56 条模拟员工数据 */
const DEPARTMENTS = ["研发部", "产品部", "设计部", "运营部", "市场部", "人力部"] as const;

const paginationDemoData: TransferItem[] = Array.from({ length: 56 }, (_, i) => {
  const no = i + 1;
  const dept = DEPARTMENTS[i % DEPARTMENTS.length]!;
  return {
    key: `emp-${no}`,
    label: `员工 ${String(no).padStart(2, "0")}`,
    description: `工号 E${10000 + no} · ${dept}`,
  };
});

const paginationTargetKeys = ref(["emp-3", "emp-12", "emp-28", "emp-41"]);

/** 禁用条目：内置角色不可移除 */
const withDisabledData: TransferItem[] = [
  { key: "admin", label: "超级管理员", description: "系统内置，不可移除", disabled: true },
  { key: "editor", label: "内容编辑", description: "可编辑文章与媒体" },
  { key: "viewer", label: "访客", description: "只读权限" },
  { key: "ops", label: "运维工程师", description: "服务器与部署权限" },
  { key: "finance", label: "财务", description: "查看财务报表", disabled: true },
  { key: "marketing", label: "市场推广", description: "管理营销活动" },
];
const withDisabledTargetKeys = ref(["editor", "ops"]);

/** 单向模式：任务看板 */
const oneWayData: TransferItem[] = [
  { key: "a", label: "待办 · 优化登录流程", description: "预计 2 天" },
  { key: "b", label: "待办 · 修复支付 Bug", description: "预计 0.5 天" },
  { key: "c", label: "待办 · 数据看板重构", description: "预计 5 天" },
  { key: "d", label: "待办 · 增加单元测试", description: "预计 3 天" },
  { key: "e", label: "待办 · 文档更新", description: "预计 1 天" },
];
const oneWayTargetKeys = ref(["b", "c"]);
const oneWayEnabled = ref(true);

/** 自定义中间操作按钮：区域覆盖 */
const customOpData: TransferItem[] = [
  { key: "1", label: "华北区" },
  { key: "2", label: "华东区" },
  { key: "3", label: "华南区" },
  { key: "4", label: "西南区" },
  { key: "5", label: "西北区" },
];
const customOpTargetKeys = ref(["2", "4"]);

/** 自定义条目插槽：成员列表 */
const memberData: TransferItem[] = [
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
function getAvatarColor(name: string): string {
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
function getRankClass(description: string): string {
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
      description="调节尺寸、头部控件与穿梭方向，实时预览两侧列表的联动表现。"
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
          :size="state.size"
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
      title="列表分页"
      description="数据量较大时用 pagination 开启两侧独立分页，每页只渲染固定条数以减轻长列表的滚动与 DOM 压力。"
    >
      <DemoBlock layout="stack">
        <RebornTransfer
          v-model="paginationTargetKeys"
          :data-source="paginationDemoData"
          :titles="['组织全员', '项目组已选']"
          :pagination="{ pageSize: 8 }"
          header-select="menu"
          show-search
          show-undo
          search-placeholder="按姓名或工号搜索"
          class="w-full"
        />
      </DemoBlock>
      <DemoNote tone="dimmed">
        共 {{ paginationDemoData.length }} 条候选数据，每页 8 条，当前已选
        {{ paginationTargetKeys.length }} 人。搜索会重置到第 1 页；<code>header-select="menu"</code>
        下「全选当页」仅勾选当前分页，「全选所有」则跨页勾选整侧条目。
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
      description="one-way 只保留从左至右的穿梭通道，右侧条目改由自身的移除按钮退回，适合「一经确认不可回退」的流程。"
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
    </DemoSection>

    <DemoSection
      title="自定义操作按钮"
      description="operation-buttons 可统一配置三个操作按钮的图标、文案与悬停提示。"
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
      <DemoNote tone="dimmed">
        如需完全自定义按钮结构，可用 <code>operation-to-right</code> /
        <code>operation-to-left</code> / <code>operation-undo</code> 插槽整体替换。
      </DemoNote>
    </DemoSection>

    <DemoSection
      title="自定义条目"
      description="#item 插槽可完全接管条目的渲染内容，作用域提供当前条目的原始数据对象。"
    >
      <DemoBlock layout="stack">
        <RebornTransfer
          :data-source="memberData"
          :default-target-keys="memberDefaultTargetKeys"
          :titles="['全部成员', '项目组成员']"
          class="w-full"
        >
          <template #item="{ item }">
            <div class="flex items-center gap-2.5">
              <!-- 头像：取姓名首字，配色由字符编码派生 -->
              <div
                :class="
                  cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                    getAvatarColor(item.label),
                  )
                "
              >
                {{ item.label.charAt(0) }}
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
                        'rounded-ui-2xs px-1.5 py-px text-[10px] font-semibold',
                        getRankClass(item.description),
                      )
                    "
                  >
                    {{ item.description.split(" · ")[1] }}
                  </span>
                  <span class="text-dimmed truncate text-[11px]">
                    {{ item.description.split(" · ")[0] }}
                  </span>
                </div>
              </div>
            </div>
          </template>
        </RebornTransfer>
      </DemoBlock>
      <DemoNote tone="dimmed">
        可配合 <code>default-target-keys</code> 预设右侧的初始内容。
      </DemoNote>
    </DemoSection>
  </div>
</template>
