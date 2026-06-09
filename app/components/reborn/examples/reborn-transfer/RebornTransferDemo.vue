<script setup lang="ts">
import type {
  TransferCheckShape,
  TransferItem,
} from "~/components/reborn/ui/reborn-transfer/reborn-transfer.config";

import { computed, ref } from "vue";
import RebornSwitch from "~/components/reborn/ui/reborn-switch/RebornSwitch.vue";
import {
  transferCheckShapes,
  transferSizes,
} from "~/components/reborn/ui/reborn-transfer/reborn-transfer.config";
import RebornTransfer from "~/components/reborn/ui/reborn-transfer/RebornTransfer.vue";
import { cn } from "~/lib/utils";

/** Playground 固定高度选项 */
const transferHeightPresetOptions = [
  { label: "自适应（随尺寸）", value: "auto" },
  { label: "280px", value: 280 },
  { label: "360px", value: 360 },
  { label: "420px", value: 420 },
] as const;

// --- Playground 状态 ---
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

const playgroundHeight = computed(() => {
  const preset = state.value.heightPreset;
  return preset === "auto" ? undefined : (preset as number);
});

const playgroundTargetKeys = ref([...defaultPlaygroundTargetKeys]);

function resetPlaygroundConfig() {
  state.value = { ...defaultPlaygroundState };
  playgroundTargetKeys.value = [...defaultPlaygroundTargetKeys];
}

// --- 控制面板配置 ---
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

function handleChange(nextTargetKeys: string[], direction: "right" | "left", moveKeys: string[]) {
  console.log("change", { nextTargetKeys, direction, moveKeys });
}

function handleSelectChange(sourceSelectedKeys: string[], targetSelectedKeys: string[]) {
  console.log("selectChange", { sourceSelectedKeys, targetSelectedKeys });
}

function handleUndo(
  nextTargetKeys: string[],
  payload: { direction: "right" | "left"; moveKeys: string[] },
) {
  console.log("undo", { nextTargetKeys, payload });
}

const codeString = computed(() => {
  const heightAttr =
    playgroundHeight.value != null ? `\n  :height='${playgroundHeight.value}'` : "";
  return `<RebornTransfer
  v-model='${JSON.stringify(playgroundTargetKeys.value)}'
  :data-source='dataSource'
  :titles='["可选科目", "已选科目"]'
  :size='${state.value.size}'
  :disabled='${state.value.disabled}'
  :show-search='${state.value.showSearch}'
  header-select='${state.value.headerSelect}'
  :one-way='${state.value.oneWay}'
  :show-undo='${state.value.showUndo}'
  check-shape='${state.value.checkShape}'${heightAttr}
/>`;
});

// ─── 演练场数据源 ─────────────────────────────────────────────────

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

// ─── Showcase 1：尺寸对比 ─────────────────────────────────────────

const sizeDemoData: TransferItem[] = [
  { key: "1", label: "前端开发" },
  { key: "2", label: "后端开发" },
  { key: "3", label: "UI 设计" },
  { key: "4", label: "产品管理" },
  { key: "5", label: "测试工程" },
];
const sizeTargetKeys = ref(["2", "3"]);

// ─── Showcase：列表分页（大数据量）────────────────────────────────

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

// ─── Showcase：包含禁用条目 ─────────────────────────────────────

const withDisabledData: TransferItem[] = [
  { key: "admin", label: "超级管理员", description: "系统内置，不可移除", disabled: true },
  { key: "editor", label: "内容编辑", description: "可编辑文章与媒体" },
  { key: "viewer", label: "访客", description: "只读权限" },
  { key: "ops", label: "运维工程师", description: "服务器与部署权限" },
  { key: "finance", label: "财务", description: "查看财务报表", disabled: true },
  { key: "marketing", label: "市场推广", description: "管理营销活动" },
];
const withDisabledTargetKeys = ref(["editor", "ops"]);

// ─── Showcase 4：单向模式 ─────────────────────────────────────────

const oneWayData: TransferItem[] = [
  { key: "a", label: "待办 · 优化登录流程", description: "预计 2 天" },
  { key: "b", label: "待办 · 修复支付 Bug", description: "预计 0.5 天" },
  { key: "c", label: "待办 · 数据看板重构", description: "预计 5 天" },
  { key: "d", label: "待办 · 增加单元测试", description: "预计 3 天" },
  { key: "e", label: "待办 · 文档更新", description: "预计 1 天" },
];
const oneWayTargetKeys = ref(["b", "c"]);
const oneWayEnabled = ref(true);

// ─── Showcase：自定义中间操作按钮 ────────────────────────────────

const customOpData: TransferItem[] = [
  { key: "1", label: "华北区" },
  { key: "2", label: "华东区" },
  { key: "3", label: "华南区" },
  { key: "4", label: "西南区" },
  { key: "5", label: "西北区" },
];
const customOpTargetKeys = ref(["2", "4"]);

// ─── Showcase 5：自定义条目插槽 ──────────────────────────────────

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
  return "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400";
}
</script>

<template>
  <div class="flex flex-col gap-16">
    <!-- 第一部分：交互式游乐场 -->
    <Playground
      v-model="state"
      :controls="controls"
      :code="codeString"
      component-name="RebornTransfer"
      title="交互体验"
    >
      <template #tag>
        <button
          type="button"
          class="bg-primary/10 text-primary hover:bg-primary/20 flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase transition-all active:scale-95"
          @click="resetPlaygroundConfig"
        >
          <Icon
            name="lucide:rotate-ccw"
            size="12"
          />
          重置配置
        </button>
      </template>

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
        class="mt-6 w-full"
        @change="handleChange"
        @select-change="handleSelectChange"
        @undo="handleUndo"
      />
    </Playground>

    <!-- 第二部分：组件变体 -->
    <section class="space-y-8">
      <div class="flex flex-col gap-10">
        <!-- ── 列表分页（大数据量）── -->
        <div class="flex flex-col gap-4">
          <div>
            <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">
              列表分页
              <code class="text-primary ml-2 text-sm font-normal">pagination</code>
            </h4>
            <p class="mt-1 text-sm text-gray-500">
              当数据源条目较多时，通过
              <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
                >pagination</code
              >
              开启两侧独立分页，每页仅渲染固定条数，减轻长列表滚动与 DOM 压力。可与
              <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
                >show-search</code
              >
              组合：搜索会重置到第 1 页；配合
              <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
                >header-select="menu"</code
              >
              使用时，「全选当页」仅勾选当前分页；「全选所有」则跨页勾选当前侧全部条目，点击穿梭按钮会将所有已勾选项一并移入另一侧。
            </p>
          </div>

          <div
            class="rounded-2xl bg-white/50 p-6 ring-1 ring-gray-200/80 dark:bg-gray-900/20 dark:ring-gray-700/40"
          >
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

            <p class="mt-4 text-xs text-gray-500 dark:text-gray-400">
              共 {{ paginationDemoData.length }} 条候选数据，每页 8 条；当前已选
              {{ paginationTargetKeys.length }} 人进入右侧。
            </p>
          </div>
        </div>

        <!-- ── 3. 禁用条目 ── -->
        <div class="flex flex-col gap-4">
          <div>
            <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">
              禁用条目
              <code class="text-primary ml-2 text-sm font-normal">disabled</code>
            </h4>
            <p class="mt-1 text-sm text-gray-500">
              在 dataSource 中为条目设置
              <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
                >disabled: true</code
              >
              可禁止该条目被勾选和穿梭。
            </p>
          </div>

          <div
            class="rounded-2xl bg-white/50 p-6 ring-1 ring-gray-200/80 dark:bg-gray-900/20 dark:ring-gray-700/40"
          >
            <RebornTransfer
              v-model="withDisabledTargetKeys"
              :data-source="withDisabledData"
              :titles="['全部角色', '已授权角色']"
              class="w-full"
            />
          </div>
        </div>

        <!-- ── 4. 单向穿梭 ── -->
        <div class="flex flex-col gap-4">
          <div>
            <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">
              单向模式
              <code class="text-primary ml-2 text-sm font-normal">one-way</code>
            </h4>
          </div>

          <div
            class="rounded-2xl bg-white/50 p-6 ring-1 ring-gray-200/80 dark:bg-gray-900/20 dark:ring-gray-700/40"
          >
            <div class="mb-4 flex items-center gap-3">
              <RebornSwitch v-model="oneWayEnabled" />
              <span class="text-sm text-gray-500 dark:text-gray-400">开启单向模式</span>
            </div>

            <RebornTransfer
              v-model="oneWayTargetKeys"
              :data-source="oneWayData"
              :titles="['待办任务', '进行中']"
              :one-way="oneWayEnabled"
              header-select="menu"
              class="w-full"
            />
          </div>
        </div>

        <!-- ── 自定义中间操作按钮 ── -->
        <div class="flex flex-col gap-4">
          <div>
            <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">
              自定义操作按钮
              <code class="text-primary ml-2 text-sm font-normal">operation-buttons</code>
            </h4>
            <p class="mt-1 text-sm text-gray-500">
              通过
              <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
                >operation-buttons</code
              >
              可统一配置三个操作按钮的图标（leadingIcon /
              trailingIcon）、文案（label）与悬停提示（title）；如需完全自定义按钮结构，可使用
              <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
                >operation-to-right</code
              >
              /
              <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
                >operation-to-left</code
              >
              /
              <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
                >operation-undo</code
              >
              插槽整体替换。
            </p>
          </div>

          <div
            class="rounded-2xl bg-white/50 p-6 ring-1 ring-gray-200/80 dark:bg-gray-900/20 dark:ring-gray-700/40"
          >
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
          </div>
        </div>

        <!-- ── 5. 自定义条目插槽 ── -->
        <div class="flex flex-col gap-4">
          <div>
            <h4 class="text-xl font-bold text-gray-800 dark:text-gray-200">
              自定义条目
              <code class="text-primary ml-2 text-sm font-normal">#item</code>
            </h4>
            <p class="mt-1 text-sm text-gray-500">
              通过
              <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800">#item</code>
              插槽可完全自定义每个条目的渲染内容，插槽作用域提供当前条目的原始数据对象。可配合
              <code class="rounded bg-gray-100 px-1 py-0.5 text-xs dark:bg-gray-800"
                >default-target-keys</code
              >
              预设右侧初始内容。
            </p>
          </div>

          <div
            class="rounded-2xl bg-white/50 p-6 ring-1 ring-gray-200/80 dark:bg-gray-900/20 dark:ring-gray-700/40"
          >
            <RebornTransfer
              :data-source="memberData"
              :default-target-keys="memberDefaultTargetKeys"
              :titles="['全部成员', '项目组成员']"
              class="w-full"
            >
              <template #item="{ item }">
                <div class="flex items-center gap-2.5">
                  <!-- 头像 -->
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
                    <div class="truncate text-sm font-medium text-gray-800 dark:text-gray-100">
                      {{ item.label }}
                    </div>
                    <div
                      v-if="item.description"
                      class="mt-0.5 flex items-center gap-1.5"
                    >
                      <span
                        :class="
                          cn(
                            'rounded px-1.5 py-px text-[10px] font-semibold',
                            getRankClass(item.description),
                          )
                        "
                      >
                        {{ item.description.split(" · ")[1] }}
                      </span>
                      <span class="truncate text-[11px] text-gray-400 dark:text-gray-500">
                        {{ item.description.split(" · ")[0] }}
                      </span>
                    </div>
                  </div>
                </div>
              </template>
            </RebornTransfer>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
