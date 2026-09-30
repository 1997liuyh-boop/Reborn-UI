<script setup lang="ts">
import type {
  DatePickerType,
  ViewType,
} from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, ref, useTemplateRef, watch } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import {
  datePickerActiveTypes,
  datePickerPanelColors,
  datePickerPanelSizes,
  datePickerTypes,
} from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import RebornDatePickerPanel from "~/components/reborn/ui/reborn-date-picker-panel/RebornDatePickerPanel.vue";

// ─── 通用工具 ───────────────────────────────────────────────────

/** 本地时区的 YYYY-MM-DD，用于回显 Date 与比对节假日 */
function toDateKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** 把绑定值格式化为可读文本：Date 标出类型，字符串原样，数组逐项展开 */
function formatDisplay(val: unknown): string {
  if (Array.isArray(val)) return val.length ? `[${val.map(formatDisplay).join(", ")}]` : "空数组";
  if (val instanceof Date) return `Date(${toDateKey(val)})`;

  return val ? `"${val}"` : "未选择";
}

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 多选与范围类型的绑定值是数组 */
const arrayValueTypes: DatePickerType[] = [
  "dates",
  "months",
  "quarters",
  "years",
  "week",
  "daterange",
  "monthrange",
  "quarterrange",
  "yearrange",
  "datetimerange",
];

/** 演练场默认状态 */
const defaultState: Record<string, any> = {
  value: "2024-04-03",
  type: "date",
  color: "primary",
  activeType: "fill",
  width: "auto",
  size: "md",
  disabled: false,
  border: true,
  shortcuts: true,
  showWeekNumber: false,
  unlinkPanels: false,
  singlePanel: false,
  showToday: false,
};

const state = ref<Record<string, any>>({ ...defaultState });

/** 最近一次事件，让预览区的操作「有回应」 */
const lastEvent = ref("");

/** 重置演练场配置，事件回显一并清空 */
function resetState() {
  state.value = { ...defaultState };
  lastEvent.value = "";
}

/**
 * 切换类型时重置绑定值：单值与数组形态不同，取值精度也不同，沿用旧值会被按新格式误读。
 * 重置配置回到默认类型时保留默认值，否则刚恢复的示例值会被立刻清掉。
 */
watch(
  () => state.value.type,
  (newType: DatePickerType) => {
    if (newType === defaultState.type && state.value.value === defaultState.value) return;
    state.value.value = arrayValueTypes.includes(newType) ? [] : "";
    lastEvent.value = "";
  },
);

/** 不同类型对应的取值精度不同，格式需要随之切换 */
const valueFormat = computed(() => {
  const type = state.value.type as DatePickerType;

  if (["year", "years", "yearrange"].includes(type)) return "YYYY";
  if (["month", "months", "monthrange"].includes(type)) return "YYYY-MM";
  // 季度用 Q 令牌输出（2024-Q2）；面板同时支持按该格式回读
  if (["quarter", "quarters", "quarterrange"].includes(type)) return "YYYY-[Q]Q";
  if (["datetime", "datetimerange"].includes(type)) return "YYYY-MM-DD HH:mm";

  return "YYYY-MM-DD";
});

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "面板类型",
    children: [
      {
        label: "选择模式",
        key: "type",
        component: "select" as const,
        defaultValue: "date",
        props: { options: datePickerTypes.map((t) => ({ label: t, value: t })) },
      },
      { label: "显示快捷选项", key: "shortcuts", component: "checkbox" as const, defaultValue: true },
      { label: "底部显示「今天」栏", key: "showToday", component: "checkbox" as const, defaultValue: false },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
  {
    title: "范围与周数",
    children: [
      {
        label: "显示周数（week 类型无效）",
        key: "showWeekNumber",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "取消面板联动（仅范围类型）",
        key: "unlinkPanels",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "只显示一个面板（仅范围类型）",
        key: "singlePanel",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
  {
    title: "视觉样式",
    children: [
      {
        label: "主题颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: datePickerPanelColors.map((c) => ({ label: c, value: c })) },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: datePickerPanelSizes.map((s) => ({ label: s.toUpperCase(), value: s })) },
      },
      {
        label: "激活类型",
        key: "activeType",
        component: "select" as const,
        defaultValue: "fill",
        props: {
          options: [
            { label: "背景 fill", value: "fill" },
            { label: "背景正圆 fillRound", value: "fillRound" },
            { label: "描边加文字 outline", value: "outline" },
            { label: "仅文字 text", value: "text" },
          ],
        },
      },
      {
        label: "宽度模式",
        key: "width",
        component: "select" as const,
        defaultValue: "auto",
        props: {
          options: [
            { label: "内容撑开 auto", value: "auto" },
            { label: "占满父容器 full", value: "full" },
          ],
        },
      },
      { label: "面板边框", key: "border", component: "checkbox" as const, defaultValue: true },
    ],
  },
];

/** 演练场右上角展示的等价代码：完整列出当前所有参数（含默认值） */
const panelCode = computed(() => {
  const s = state.value;
  const props: string[] = [
    'v-model="value"',
    `type="${s.type}"`,
    `value-format="${valueFormat.value}"`,
    `color="${s.color}"`,
    `size="${s.size}"`,
    `active-type="${s.activeType}"`,
    `width="${s.width}"`,
    `:border="${s.border}"`,
    `:disabled="${s.disabled}"`,
    s.shortcuts ? ':shortcuts="shortcuts"' : ':shortcuts="[]"',
    `:show-week-number="${s.showWeekNumber}"`,
    `:unlink-panels="${s.unlinkPanels}"`,
    `:single-panel="${s.singlePanel}"`,
    `:show-today="${s.showToday}"`,
  ];

  return `<RebornDatePickerPanel\n  ${props.join("\n  ")}\n/>`;
});

/** 快捷选项：value 可以是日期，也可以是返回日期的函数 */
const globalShortcuts = [
  { text: "今天", value: () => new Date() },
  {
    text: "一周前",
    value: () => {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      return d;
    },
  },
  {
    text: "下个月",
    value: () => {
      const d = new Date();
      d.setMonth(d.getMonth() + 1);
      return d;
    },
  },
];

function onPlaygroundCalendarChange(value: [Date, Date | null]) {
  lastEvent.value = `calendar-change ${formatDisplay(value[0])} → ${value[1] ? formatDisplay(value[1]) : "null"}`;
}

function onPlaygroundPanelChange(date: Date | [Date, Date], mode: "month" | "year", view: ViewType) {
  lastEvent.value = `panel-change ${formatDisplay(date)} · mode="${mode}" · view="${view}"`;
}

function onPlaygroundChange(value: unknown) {
  lastEvent.value = `change ${formatDisplay(value)}`;
}

// ─── 基础用法 ───────────────────────────────────────────────────

const basicDateValue = ref<Date | "">("");
const basicStringValue = ref("2024-04-03");

// ─── 选择类型 ───────────────────────────────────────────────────

const quarterValue = ref("2024-Q2");
const typeRangeValue = ref(["2024-04-01", "2024-04-05"]);

// ─── 范围与双面板 ───────────────────────────────────────────────

const linkedRangeValue = ref(["2024-04-22", "2024-05-06"]);
const unlinkedRangeValue = ref(["2024-01-15", "2024-06-10"]);
const singleRangeValue = ref(["2024-04-08", "2024-04-12"]);

// ─── 周数 ───────────────────────────────────────────────────────

const weekNumberValue = ref("2024-04-03");

// ─── 禁用规则 ───────────────────────────────────────────────────

const disabledPanelValue = ref("2024-04-10");
const weekendValue = ref("");
const boundedValue = ref(["2024-04-10", "2024-04-12"]);
const unitValue = ref("");

/** 周末不可选：只在日期粒度判定，否则切到月视图时「1 号恰逢周末」的月份也会被误禁 */
function disableWeekend(date: Date, unit: "year" | "month" | "quarter" | "week" | "date") {
  const day = date.getDay();
  return unit === "date" && (day === 0 || day === 6);
}

/**
 * 按粒度禁用：同一个方法通过 unit 参数分流——月粒度只开放 3-8 月，
 * 年粒度禁用 2024 年以前；点标题切到年视图时能看到两套规则同时生效
 */
function disableByUnit(date: Date, unit: "year" | "month" | "quarter" | "week" | "date") {
  if (unit === "year") return date.getFullYear() < 2024;
  if (unit === "month") return date.getMonth() < 2 || date.getMonth() > 7;
  return false;
}

// ─── 快捷选项 ───────────────────────────────────────────────────

/** 从今天出发偏移若干天，快捷项的 value 写成函数才能每次点击都按当天重新计算 */
function daysFromToday(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

const singleShortcutValue = ref("");
const singleShortcuts = [
  { text: "今天", value: () => daysFromToday(0) },
  { text: "昨天", value: () => daysFromToday(-1) },
  { text: "一周前", value: () => daysFromToday(-7) },
  {
    text: "本月 1 号",
    value: () => {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1);
    },
  },
];

/** 范围类型的快捷项返回长度为 2 的数组，依次是起点与终点 */
const rangeShortcutValue = ref<string[]>([]);
const rangeShortcuts = [
  { text: "最近 7 天", value: () => [daysFromToday(-6), daysFromToday(0)] },
  { text: "最近 30 天", value: () => [daysFromToday(-29), daysFromToday(0)] },
  {
    text: "本月",
    value: () => {
      const d = new Date();
      return [
        new Date(d.getFullYear(), d.getMonth(), 1),
        new Date(d.getFullYear(), d.getMonth() + 1, 0),
      ];
    },
  },
];

// ─── 今天栏 ─────────────────────────────────────────────────────

const todayDateValue = ref("");
const todayMonthValue = ref("");

// ─── 选中样式 ───────────────────────────────────────────────────

const activeTypeShowcases = ref(
  datePickerActiveTypes.map((value) => ({
    value,
    label: { fill: "背景", fillRound: "背景正圆", outline: "描边加文字", text: "仅文字" }[value],
    model: ["2024-04-07", "2024-04-13"] as string[],
  })),
);

const customActiveValue = ref("2024-04-11");
/** ui.dayActive 会并进日期格节点，冲突的类名由 tailwind-merge 裁决，所以写全即可覆盖 */
const customActiveUi = {
  dayActive: "bg-gray-10 text-gray-1 rounded-full font-medium hover:bg-gray-10",
  dayToday: "text-gray-10 underline underline-offset-4",
};

const rangeStyleValue = ref(["2024-04-09", "2024-04-18"]);
/** 首尾用 dayActive，中间项用 dayInRange；两者都要把 hover 写上，否则悬停会被灰底盖掉 */
const customRangeUi = {
  dayActive: "bg-success text-gray-1 rounded-full hover:bg-success",
  dayInRange: "bg-green-1 text-success rounded-none hover:bg-green-1",
};

const dashedRangeValue = ref(["2024-04-09", "2024-04-18"]);
const dashedRangeUi = {
  dayActive: "border border-dashed border-warning bg-transparent text-warning rounded-[4px]",
  dayInRange: "bg-orange-1 text-gray-9 rounded-[4px] hover:bg-orange-1",
};

// ─── 自定义单元格 ───────────────────────────────────────────────

const cellValue = ref("2024-04-03");

/** 2024 年清明与劳动节的放假、调休安排 */
const holidayMarks: Record<string, "休" | "班"> = {
  "2024-04-04": "休",
  "2024-04-05": "休",
  "2024-04-06": "休",
  "2024-04-07": "班",
  "2024-04-28": "班",
  "2024-05-01": "休",
  "2024-05-02": "休",
  "2024-05-03": "休",
  "2024-05-04": "休",
  "2024-05-05": "休",
  "2024-05-11": "班",
};

function holidayMark(date: Date) {
  return holidayMarks[toDateKey(date)];
}

// ─── 导航图标 ───────────────────────────────────────────────────

const navIconValue = ref("2024-04-03");

// ─── 事件 ───────────────────────────────────────────────────────

const eventPanel = useTemplateRef<InstanceType<typeof RebornDatePickerPanel>>("eventPanel");
const eventValue = ref(["2024-04-08", "2024-04-12"]);
const eventLogs = ref<{ id: number; name: string; detail: string }[]>([]);
let eventSeq = 0;

/** 新事件插到最前，只保留最近 8 条 */
function pushLog(name: string, detail: string) {
  eventLogs.value = [{ id: ++eventSeq, name, detail }, ...eventLogs.value].slice(0, 8);
}

function onCalendarChange(value: [Date, Date | null]) {
  pushLog("calendar-change", `[${formatDisplay(value[0])}, ${value[1] ? formatDisplay(value[1]) : "null"}]`);
}

function onPanelChange(date: Date | [Date, Date], mode: "month" | "year", view: ViewType) {
  pushLog("panel-change", `${formatDisplay(date)}, "${mode}", "${view}"`);
}

function onChange(value: unknown) {
  pushLog("change", formatDisplay(value));
}

function onClear() {
  pushLog("clear", "()");
}
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="panelCode"
      component-name="RebornDatePickerPanel"
      title="交互演练场"
      description="调节左侧参数，实时查看面板在各类型下的表现与绑定值。"
    >
      <template #tag>
        <RebornButton
          size="sm"
          variant="soft"
          color="neutral"
          @click="resetState"
        >
          <template #leading>
            <Icon
              name="lucide:rotate-ccw"
              size="12"
            />
          </template>
          重置配置
        </RebornButton>
      </template>

      <div class="flex w-full flex-col items-center gap-4">
        <RebornDatePickerPanel
          v-model="state.value"
          :type="state.type"
          :value-format="valueFormat"
          :color="state.color"
          :size="state.size"
          :active-type="state.activeType"
          :width="state.width"
          :border="state.border"
          :disabled="state.disabled"
          :shortcuts="state.shortcuts ? globalShortcuts : []"
          :show-week-number="state.showWeekNumber"
          :unlink-panels="state.unlinkPanels"
          :single-panel="state.singlePanel"
          :show-today="state.showToday"
          @calendar-change="onPlaygroundCalendarChange"
          @panel-change="onPlaygroundPanelChange"
          @change="onPlaygroundChange"
        />

        <DemoNote tone="dimmed">
          当前绑定值：<code class="break-all">{{ formatDisplay(state.value) }}</code>
        </DemoNote>
        <DemoNote tone="dimmed">
          最近事件：<code class="break-all">{{ lastEvent || "暂无" }}</code>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">不传 <code>value-format</code>：绑定值是 <code>Date</code></span>
          <RebornDatePickerPanel
            v-model="basicDateValue"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(basicDateValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>value-format="YYYY-MM-DD"</code>：绑定值是字符串</span>
          <RebornDatePickerPanel
            v-model="basicStringValue"
            value-format="YYYY-MM-DD"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(basicStringValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="选择类型">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>type="quarter"</code> · <code>value-format="YYYY-[Q]Q"</code></span>
          <RebornDatePickerPanel
            v-model="quarterValue"
            type="quarter"
            value-format="YYYY-[Q]Q"
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(quarterValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>type="daterange"</code> · <code>value-format="YYYY-MM-DD"</code></span>
          <RebornDatePickerPanel
            v-model="typeRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(typeRangeValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="范围与双面板">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">默认：双面板联动</span>
          <RebornDatePickerPanel
            v-model="linkedRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(linkedRangeValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>unlink-panels</code>：左右各自翻页</span>
          <RebornDatePickerPanel
            v-model="unlinkedRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            unlink-panels
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(unlinkedRangeValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>single-panel</code>：只渲染一个面板</span>
          <RebornDatePickerPanel
            v-model="singleRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            single-panel
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(singleRangeValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>

      <DemoNote>
        取消联动后左侧必须早于右侧：两侧已相邻时，左侧的「下一页」与右侧的「上一页」置灰不响应，
        以免两个面板显示同一个月、区间无从落点。
      </DemoNote>
    </DemoSection>

    <DemoSection title="周数">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <RebornDatePickerPanel
            v-model="weekNumberValue"
            value-format="YYYY-MM-DD"
            show-week-number
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(weekNumberValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>

      <DemoNote>
        周数按每一行的周一计算，所以跨年那一行会显示第 1 周或第 52 / 53 周，与行首的周日所在年份不一定相同。
      </DemoNote>
    </DemoSection>

    <DemoSection title="禁用规则">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>disabled</code> 整个面板禁用</span>
          <RebornDatePickerPanel
            v-model="disabledPanelValue"
            disabled
            value-format="YYYY-MM-DD"
            :color="state.color"
            :size="state.size"
            border
          />
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>disabled-method</code> 周末不可选</span>
          <RebornDatePickerPanel
            v-model="weekendValue"
            :disabled-method="disableWeekend"
            value-format="YYYY-MM-DD"
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(weekendValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>start="2024-04-08"</code> · <code>end="2024-04-24"</code> 划定可选边界
          </span>
          <RebornDatePickerPanel
            v-model="boundedValue"
            type="daterange"
            start="2024-04-08"
            end="2024-04-24"
            value-format="YYYY-MM-DD"
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(boundedValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>disabled-method</code> 按粒度限制：月份只开放 3-8 月，年份禁用 2024 以前
          </span>
          <RebornDatePickerPanel
            v-model="unitValue"
            type="month"
            :disabled-method="disableByUnit"
            value-format="YYYY-MM"
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            点标题切到年视图可看到年粒度规则同时生效。绑定值：<code>{{ formatDisplay(unitValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>

      <DemoNote>
        <code>disabled-method</code> 在年 / 月 / 季度视图也会被调用，传入的是该项首日。
        只想约束日期时要判断 <code>unit === "date"</code>，否则 1 号恰逢周末的月份会在月视图里一起被禁。
      </DemoNote>
    </DemoSection>

    <DemoSection title="快捷选项">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">单选：今天 / 昨天 / 一周前 / 本月 1 号</span>
          <RebornDatePickerPanel
            v-model="singleShortcutValue"
            :shortcuts="singleShortcuts"
            value-format="YYYY-MM-DD"
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(singleShortcutValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">范围：最近 7 天 / 最近 30 天 / 本月</span>
          <RebornDatePickerPanel
            v-model="rangeShortcutValue"
            type="daterange"
            :shortcuts="rangeShortcuts"
            value-format="YYYY-MM-DD"
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(rangeShortcutValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>

      <DemoNote>
        「相对今天」的快捷项必须把 <code>value</code> 写成函数：直接写日期会固定在组件创建的那一刻，
        页面跨过零点后「今天」仍指向前一天。
      </DemoNote>
    </DemoSection>

    <DemoSection title="今天栏">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">date：点击「今天」选中当天，视图同时翻回本月</span>
          <RebornDatePickerPanel
            v-model="todayDateValue"
            value-format="YYYY-MM-DD"
            show-today
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(todayDateValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">month：文案变为「本月」，选中当前月份</span>
          <RebornDatePickerPanel
            v-model="todayMonthValue"
            type="month"
            value-format="YYYY-MM"
            show-today
            :color="state.color"
            :size="state.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(todayMonthValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>

      <DemoNote>
        文字颜色跟随 <code>color</code>。当前时间所在的单位被 <code>start</code> / <code>end</code> / <code>disabled-method</code>
        排除，或面板整体 <code>disabled</code> 时，这一栏置灰且点击无效。
      </DemoNote>
    </DemoSection>

    <DemoSection title="选中样式">
      <DemoBlock
        layout="grid"
        :columns="2"
      >
        <div
          v-for="at in activeTypeShowcases"
          :key="at.value"
          class="flex min-w-0 flex-col gap-3"
        >
          <span class="text-dimmed text-xs font-medium">
            {{ at.label }} · <code>{{ at.value }}</code>
          </span>
          <RebornDatePickerPanel
            v-model="at.model"
            type="week"
            :active-type="at.value"
            value-format="YYYY-MM-DD"
            :color="state.color"
            :size="state.size"
            border
          />
        </div>
      </DemoBlock>

      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>ui.dayActive</code> 自定义：黑底正圆，今日改为下划线
          </span>
          <RebornDatePickerPanel
            v-model="customActiveValue"
            :ui="customActiveUi"
            value-format="YYYY-MM-DD"
            :size="state.size"
            border
          />
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">范围两端正圆实心，中间连成整条</span>
          <RebornDatePickerPanel
            v-model="rangeStyleValue"
            type="daterange"
            :ui="customRangeUi"
            value-format="YYYY-MM-DD"
            :size="state.size"
            border
          />
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">范围两端虚线描边，中间浅底</span>
          <RebornDatePickerPanel
            v-model="dashedRangeValue"
            type="daterange"
            :ui="dashedRangeUi"
            value-format="YYYY-MM-DD"
            :size="state.size"
            border
          />
        </div>
      </DemoBlock>

      <DemoNote>
        自定义时记得把 <code>hover:</code> 一并写上：日期格基类带着 <code>hover:bg-gray-2</code>，
        不覆盖回来的话鼠标停上去选中格会变灰。范围首尾取 <code>ui.dayActive</code>、中间项取
        <code>ui.dayInRange</code>，两者要分别覆盖。
      </DemoNote>
    </DemoSection>

    <DemoSection title="自定义单元格">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">2024 年清明、劳动节的放假与调休</span>
          <RebornDatePickerPanel
            v-model="cellValue"
            value-format="YYYY-MM-DD"
            :color="state.color"
            :size="state.size"
            border
          >
            <template #default="{ type, text, date, selected }">
              <div
                v-if="type === 'date'"
                class="flex flex-col items-center leading-none"
              >
                <span>{{ text }}</span>
                <span
                  v-if="holidayMark(date)"
                  class="text-[10px]"
                  :class="selected ? '' : holidayMark(date) === '休' ? 'text-success' : 'text-error'"
                >{{ holidayMark(date) }}</span>
              </div>
              <template v-else-if="type === 'month'">
                {{ text }}月
              </template>
              <template v-else-if="type === 'quarter'">
                第{{ text }}季度
              </template>
              <template v-else>
                {{ text }}
              </template>
            </template>
          </RebornDatePickerPanel>
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(cellValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>

      <DemoNote>
        四种视图共用这一个插槽，必须按 <code>type</code> 分支并补回默认文案：只写日期分支的话，点标题切到月视图后
        格子里只剩数字，「月」字会丢掉。选中格的角标不写颜色，直接继承选中态的文字色，避免与实心底色撞色。
      </DemoNote>
    </DemoSection>

    <DemoSection title="导航图标">
      <DemoBlock layout="stack">
        <RebornDatePickerPanel
          v-model="navIconValue"
          value-format="YYYY-MM-DD"
          :color="state.color"
          :size="state.size"
          border
        >
          <template #prev-year>
            <Icon
              name="lucide:arrow-left-to-line"
              class="size-4"
            />
          </template>
          <template #prev-month>
            <Icon
              name="lucide:arrow-left"
              class="size-4"
            />
          </template>
          <template #next-month>
            <Icon
              name="lucide:arrow-right"
              class="size-4"
            />
          </template>
          <template #next-year>
            <Icon
              name="lucide:arrow-right-to-line"
              class="size-4"
            />
          </template>
        </RebornDatePickerPanel>
      </DemoBlock>

      <DemoNote>
        插槽内容替换的是默认图标，不会套用 <code>ui.icon</code> 的尺寸，需要自己给出大小；
        年 / 月 / 季度视图只用 <code>prev-year</code> / <code>next-year</code>，这两个插槽在所有视图里都会生效。
      </DemoNote>
    </DemoSection>

    <DemoSection title="事件">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <RebornDatePickerPanel
            ref="eventPanel"
            v-model="eventValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            :color="state.color"
            :size="state.size"
            border
            @calendar-change="onCalendarChange"
            @panel-change="onPanelChange"
            @change="onChange"
            @clear="onClear"
          />
          <div class="flex flex-wrap items-center gap-2">
            <RebornButton
              size="sm"
              variant="outlined"
              @click="eventPanel?.clear()"
            >
              调用 clear()
            </RebornButton>
            <RebornButton
              size="sm"
              variant="soft"
              color="neutral"
              @click="eventLogs = []"
            >
              清空日志
            </RebornButton>
          </div>
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(eventValue) }}</code>
          </DemoNote>
          <ul class="flex flex-col gap-1 font-mono text-xs">
            <li
              v-for="log in eventLogs"
              :key="log.id"
              class="text-gray-7 break-all"
            >
              <span class="text-primary">{{ log.name }}</span> {{ log.detail }}
            </li>
            <li
              v-if="!eventLogs.length"
              class="text-gray-5"
            >
              点选日期、翻页或切换视图后，事件与参数会记录在这里。
            </li>
          </ul>
        </div>
      </DemoBlock>

      <DemoNote>
        点下起点就会抛 <code>calendar-change</code>，此时终点为 <code>null</code>；<code>change</code>
        要等起止都选定才抛。依赖完整区间的逻辑监听 <code>change</code>，想在选完起点时给提示才用
        <code>calendar-change</code>。
      </DemoNote>
    </DemoSection>
  </div>
</template>
