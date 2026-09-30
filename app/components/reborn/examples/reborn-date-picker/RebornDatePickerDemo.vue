<script setup lang="ts">
import type { DatePickerType, ViewType } from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import { DemoBlock, DemoItem, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, reactive, ref, useTemplateRef, watch } from "vue";
import { z } from "zod";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { datePickerTypes } from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import { datePickerColors, datePickerSizes, datePickerVariants } from "~/components/reborn/ui/reborn-date-picker/reborn-date-picker.config";
import RebornDatePicker from "~/components/reborn/ui/reborn-date-picker/RebornDatePicker.vue";
import RebornForm from "~/components/reborn/ui/reborn-form/RebornForm.vue";
import RebornFormItem from "~/components/reborn/ui/reborn-form/RebornFormItem.vue";

// ─── 通用工具 ───────────────────────────────────────────────────

/** 本地时区的 YYYY-MM-DD，用于回显 Date 与比对节假日 */
function toDateKey(date: Date) {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

/** 把绑定值格式化为可读文本：Date 标出类型，字符串原样，数组逐项展开，null 单独标出 */
function formatDisplay(val: unknown): string {
  if (Array.isArray(val)) return val.length ? `[${val.map(formatDisplay).join(", ")}]` : "[]";
  if (val instanceof Date) return `Date(${toDateKey(val)})`;
  if (val === null || val === undefined) return "null";
  return `"${val}"`;
}

/** 多选、范围与按周类型的绑定值是数组，清空后回到 []；其余类型清空后是 null */
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

/** 事件日志的单条记录 */
interface EventLog {
  id: number;
  name: string;
  detail: string;
}

/** 事件日志自增序号，演练场与「事件」分组共用，保证 key 唯一 */
let eventSeq = 0;

/** 新事件插到最前，只保留最近 limit 条 */
function pushTo(list: { value: EventLog[] }, name: string, detail: string, limit: number) {
  list.value = [{ id: ++eventSeq, name, detail }, ...list.value].slice(0, limit);
}

// ─── 演练场 ─────────────────────────────────────────────────────

/** 演练场默认配置，与组件自身默认值保持一致 */
const defaultState: Record<string, any> = {
  value: "2024-04-03",
  type: "date",
  size: "md",
  color: "primary",
  variant: "outlined",
  activeType: "fill",
  placeholder: "",
  showArrow: true,
  arrowAnimation: true,
  clearable: true,
  loading: false,
  disabled: false,
  collapseTags: false,
  collapseTagsTooltip: false,
  maxCollapseTags: 1,
  closeOn: "click",
  portal: true,
  shortcuts: false,
  showWeekNumber: false,
  unlinkPanels: false,
  singlePanel: false,
  showToday: false,
};

/** 演练场当前配置 */
const state = ref<Record<string, any>>({ ...defaultState });

/** 演练场事件日志：展开、收起与提交会连着抛好几个事件，只记一条会被后一个覆盖 */
const playgroundLogs = ref<EventLog[]>([]);

/** 重置演练场配置，事件日志一并清空 */
function resetState() {
  state.value = { ...defaultState };
  playgroundLogs.value = [];
}

/**
 * 切换类型时重置绑定值：单值与数组形态不同，取值精度也不同，沿用旧值会被按新格式误读。
 * 重置配置回到默认类型时保留默认值，否则刚恢复的示例值会被立刻清掉。
 */
watch(
  () => state.value.type,
  (newType: DatePickerType) => {
    if (newType === defaultState.type && state.value.value === defaultState.value) return;
    state.value.value = arrayValueTypes.includes(newType) ? [] : null;
    playgroundLogs.value = [];
  },
);

/** 不同类型对应的取值精度不同，格式需要随之切换 */
const valueFormat = computed(() => {
  const type = state.value.type as DatePickerType;

  if (["year", "years", "yearrange"].includes(type)) return "YYYY";
  if (["month", "months", "monthrange"].includes(type)) return "YYYY-MM";
  // 季度用 Q 令牌输出（2024-Q2）；组件同时支持按该格式回读
  if (["quarter", "quarters", "quarterrange"].includes(type)) return "YYYY-[Q]Q";
  if (["datetime", "datetimerange"].includes(type)) return "YYYY-MM-DD HH:mm";

  return "YYYY-MM-DD";
});

/** 从今天出发偏移若干天，快捷项的 value 写成函数才能每次点击都按当天重新计算 */
function daysFromToday(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

/** 单值类型的快捷项：返回单个日期 */
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
const rangeShortcuts = [
  { text: "最近 7 天", value: () => [daysFromToday(-6), daysFromToday(0)] },
  { text: "最近 30 天", value: () => [daysFromToday(-29), daysFromToday(0)] },
  {
    text: "本月",
    value: () => {
      const d = new Date();
      return [new Date(d.getFullYear(), d.getMonth(), 1), new Date(d.getFullYear(), d.getMonth() + 1, 0)];
    },
  },
];

/** 演练场的快捷项只接给日期粒度的单值与范围类型，其余类型的面板不渲染日期网格，给了也对不上 */
const playgroundShortcuts = computed(() => {
  if (!state.value.shortcuts) return [];
  const type = state.value.type as DatePickerType;
  if (type === "date" || type === "datetime") return singleShortcuts;
  if (type === "daterange" || type === "datetimerange") return rangeShortcuts;
  return [];
});

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      {
        label: "选择类型（type）",
        key: "type",
        component: "select" as const,
        defaultValue: "date",
        props: { options: datePickerTypes.map(t => ({ label: t, value: t })) },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: datePickerSizes.map(s => ({ label: s.toUpperCase(), value: s })) },
      },
      {
        label: "主题颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: datePickerColors.map(c => ({ label: c, value: c })) },
      },
      {
        label: "形态变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "outlined",
        props: { options: datePickerVariants.map(v => ({ label: v, value: v })) },
      },
      {
        label: "面板选中样式（active-type）",
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
        label: "占位文本（留空按类型给默认值）",
        key: "placeholder",
        component: "input" as const,
        defaultValue: "",
      },
      { label: "显示箭头", key: "showArrow", component: "checkbox" as const, defaultValue: true },
      { label: "箭头旋转动画", key: "arrowAnimation", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "状态",
    children: [
      { label: "可清空", key: "clearable", component: "checkbox" as const, defaultValue: true },
      { label: "加载中", key: "loading", component: "checkbox" as const, defaultValue: false },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
    ],
  },
  {
    title: "行为",
    children: [
      { label: "折叠标签（仅多选类型）", key: "collapseTags", component: "checkbox" as const, defaultValue: false },
      {
        label: "折叠标签悬停提示",
        key: "collapseTagsTooltip",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "折叠前最多展示的标签数",
        key: "maxCollapseTags",
        component: "input-number" as const,
        defaultValue: 1,
        props: { min: 0, max: 6 },
      },
      {
        label: "关闭时机（close-on）",
        key: "closeOn",
        component: "select" as const,
        defaultValue: "click",
        props: {
          options: [
            { label: "外部点击后 click", value: "click" },
            { label: "外部按下时 mousedown", value: "mousedown" },
          ],
        },
      },
      { label: "浮层传送到 body（portal）", key: "portal", component: "checkbox" as const, defaultValue: true },
      {
        label: "显示快捷选项（date / daterange 及带时间的变体）",
        key: "shortcuts",
        component: "checkbox" as const,
        defaultValue: false,
      },
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
      {
        label: "底部显示「今天」栏",
        key: "showToday",
        component: "checkbox" as const,
        defaultValue: false,
      },
    ],
  },
];

/** 演练场右上角展示的等价代码：完整列出当前所有参数（含默认值） */
const pickerCode = computed(() => {
  const s = state.value;
  const props: string[] = [
    'v-model="value"',
    `type="${s.type}"`,
    `value-format="${valueFormat.value}"`,
    `size="${s.size}"`,
    `color="${s.color}"`,
    `variant="${s.variant}"`,
    `active-type="${s.activeType}"`,
  ];
  if (s.placeholder) props.push(`placeholder="${s.placeholder}"`);
  props.push(
    `:show-arrow="${s.showArrow}"`,
    `:arrow-animation="${s.arrowAnimation}"`,
    `:clearable="${s.clearable}"`,
    `:loading="${s.loading}"`,
    `:disabled="${s.disabled}"`,
    `:collapse-tags="${s.collapseTags}"`,
    `:collapse-tags-tooltip="${s.collapseTagsTooltip}"`,
    `:max-collapse-tags="${s.maxCollapseTags}"`,
    `close-on="${s.closeOn}"`,
    `:portal="${s.portal}"`,
    playgroundShortcuts.value.length ? ':shortcuts="shortcuts"' : ':shortcuts="[]"',
    `:show-week-number="${s.showWeekNumber}"`,
    `:unlink-panels="${s.unlinkPanels}"`,
    `:single-panel="${s.singlePanel}"`,
    `:show-today="${s.showToday}"`,
    '@change="onChange"',
    '@visible-change="onVisibleChange"',
    '@calendar-change="onCalendarChange"',
    '@panel-change="onPanelChange"',
    '@clear="onClear"',
    '@remove-tag="onRemoveTag"',
  );

  return `<RebornDatePicker\n  ${props.join("\n  ")}\n/>`;
});

/** 演练场事件：只保留最近 5 条，足够看清一次展开到收起的完整顺序 */
function logPlayground(name: string, detail: string) {
  pushTo(playgroundLogs, name, detail, 5);
}

// ─── 基础用法 ───────────────────────────────────────────────────

/** 不传 value-format：绑定值是 Date 对象 */
const basicDateValue = ref<Date | null>(null);
/** 传 value-format：绑定值是字符串 */
const basicStringValue = ref<string | null>("2024-04-03");
/** 只改展示格式，绑定值仍按 value-format 输出 */
const basicFormatValue = ref<string | null>("2024-04-03");

// ─── 选择类型 ───────────────────────────────────────────────────

/** 按周：绑定值是这一周的 [周日, 周六] */
const weekValue = ref<string[]>([]);
/** 按月 */
const monthValue = ref<string | null>("2024-04");
/** 按季度：值用 Q 令牌输出 */
const quarterValue = ref<string | null>("2024-Q2");
/** 按年 */
const yearValue = ref<string | null>("2024");
/** 日期时间 */
const datetimeValue = ref<string | null>(null);
/** 带周数的日期 */
const weekNumberValue = ref<string | null>("2024-04-03");

// ─── 范围选择 ───────────────────────────────────────────────────

/** 日期范围 */
const dateRangeValue = ref<string[]>(["2024-04-08", "2024-04-12"]);
/** 日期时间范围 */
const datetimeRangeValue = ref<string[]>([]);
/** 月份范围 */
const monthRangeValue = ref<string[]>([]);
/** 取消联动：起止相隔数月，两侧面板各自停在所属月份 */
const unlinkedRangeValue = ref<string[]>(["2024-01-15", "2024-06-10"]);
/** 单面板范围 */
const singleRangeValue = ref<string[]>(["2024-04-08", "2024-04-12"]);
/** 年份范围 */
const yearRangeValue = ref<string[]>(["2021", "2024"]);

// ─── 多选与标签折叠 ─────────────────────────────────────────────

/** 多选日期，标签逐行铺开 */
const multiDatesValue = ref<string[]>(["2024-04-01", "2024-04-03", "2024-04-08", "2024-04-15"]);
/** 多选月份，超出部分折叠为 +N */
const multiMonthsValue = ref<string[]>(["2024-01", "2024-03", "2024-05", "2024-07"]);
/** 多选日期，折叠后悬停查看 */
const multiTooltipValue = ref<string[]>(["2024-04-01", "2024-04-03", "2024-04-08", "2024-04-15", "2024-04-22"]);

// ─── 形态、尺寸与配色 ───────────────────────────────────────────

/** 四种形态共用一个值，便于对比同一内容在不同形态下的表现 */
const variantValue = ref<string | null>("2024-04-03");
/** 三档尺寸共用一个多选值，顺带对比标签在各档的字号 */
const sizeValue = ref<string[]>(["2024-04-01", "2024-04-03"]);
/** 七种配色各自的值，展开后面板选中色随之变化 */
const colorValues = ref<Record<string, string[]>>(
  Object.fromEntries(datePickerColors.map(c => [c, ["2024-04-08", "2024-04-12"]])),
);

// ─── 可选范围与禁用日期 ─────────────────────────────────────────

/** 限定在 2024 年 4 月之内 */
const boundedValue = ref<string | null>("2024-04-10");
/** 周末不可选 */
const weekendValue = ref<string | null>(null);
/** 按粒度禁用 */
const unitValue = ref<string | null>(null);
/** 禁用夜间时段 */
const hoursValue = ref<string | null>(null);

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

/** 只开放 9:00-18:00，其余小时在时间列里置灰 */
function disableNightHours() {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 19, 20, 21, 22, 23];
}

// ─── 快捷选项 ───────────────────────────────────────────────────

/** 单值快捷项 */
const singleShortcutValue = ref<string | null>(null);
/** 范围快捷项 */
const rangeShortcutValue = ref<string[]>([]);

// ─── 今天栏 ─────────────────────────────────────────────────────

/** 日期：点「今天」选中当天并收起 */
const todayDateValue = ref<string | null>(null);
/** 月份：文案变为「本月」 */
const todayMonthValue = ref<string | null>(null);
/** 日期时间：文案变为「此刻」，时分秒取点击时的时间 */
const todayDatetimeValue = ref<string | null>(null);
/** 日期范围：起止都落在今天 */
const todayRangeValue = ref<string[]>([]);
/** 只能选过去的日期 */
const todayPastValue = ref<string | null>(null);

/** 今天及以后不可选：今天被禁用时「今天」栏同步置灰、点击无效 */
function disableFromToday(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime();
}

// ─── 加载与禁用 ─────────────────────────────────────────────────

/** 加载中的值 */
const loadingValue = ref<string | null>("2024-04-03");
/** 禁用的单值 */
const disabledValue = ref<string | null>("2024-04-03");
/** 禁用的范围 */
const disabledRangeValue = ref<string[]>(["2024-04-08", "2024-04-12"]);

// ─── 页头与页脚 ─────────────────────────────────────────────────

/** 页头页脚示例的值 */
const headerFooterValue = ref<string | null>(null);

// ─── 自定义单元格与导航图标 ─────────────────────────────────────

/** 节假日示例：停在 2024 年 4 月，清明假期就在眼前 */
const cellValue = ref<string | null>("2024-04-03");
/** 导航图标示例 */
const navIconValue = ref<string[]>(["2024-04-08", "2024-04-12"]);

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

/** 查询某天是放假还是调休上班，无安排返回 undefined */
function holidayMark(date: Date) {
  return holidayMarks[toDateKey(date)];
}

// ─── 自定义触发器 ───────────────────────────────────────────────

/** default 插槽示例的值 */
const slotTriggerValue = ref<string[]>(["2024-04-08", "2024-04-12"]);
/** cover 插槽示例的值 */
const coverValue = ref<string | null>(null);

// ─── 事件 ───────────────────────────────────────────────────────

/** 范围选择的值 */
const eventRangeValue = ref<string[]>([]);
/** 多选的值 */
const eventMultiValue = ref<string[]>(["2024-04-01", "2024-04-03"]);
/** 「事件」分组的日志 */
const eventLogs = ref<EventLog[]>([]);
/** 用于演示通过实例调用 clear() */
const eventPicker = useTemplateRef<InstanceType<typeof RebornDatePicker>>("eventPicker");

/** 「事件」分组的日志保留最近 8 条 */
function pushLog(name: string, detail: string) {
  pushTo(eventLogs, name, detail, 8);
}

/** 按事件名生成监听函数，演练场与「事件」分组各写各的日志 */
function createHandlers(log: (name: string, detail: string) => void) {
  return {
    /** 绑定值提交 */
    onChange: (value: unknown) => log("change", formatDisplay(value)),
    /** 下拉框展开 / 收起 */
    onVisibleChange: (visible: boolean) => log("visible-change", String(visible)),
    /** 范围类型点选日期，第一次点选时终点为 null */
    onCalendarChange: (value: [Date, Date | null]) =>
      log("calendar-change", `[${formatDisplay(value[0])}, ${value[1] ? formatDisplay(value[1]) : "null"}]`),
    /** 面板翻页或切换视图 */
    onPanelChange: (date: Date | [Date, Date], mode: "month" | "year", view: ViewType) =>
      log("panel-change", `${formatDisplay(date)}, "${mode}", "${view}"`),
    /** 点击清空按钮或调用 clear() */
    onClear: () => log("clear", "()"),
    /** 多选类型移除单个标签 */
    onRemoveTag: (value: unknown) => log("remove-tag", formatDisplay(value)),
  };
}

/** 演练场的事件监听 */
const playgroundHandlers = createHandlers(logPlayground);
/** 「事件」分组的事件监听 */
const eventHandlers = createHandlers(pushLog);

// ─── 与表单联动 ─────────────────────────────────────────────────

/** 表单数据：单值未选时是 null，范围未选时是 [] */
const formModel = reactive<{ departDate: string | null; tripRange: string[] }>({
  departDate: null,
  tripRange: [],
});
/** 表单实例 */
const formRef = ref<any>(null);
/** 校验结果回显 */
const formResult = ref("");

/** 校验规则：null 过不了 z.string()，[] 过不了 length(2)，两种「未选」都能拦下 */
const formRules = z.object({
  departDate: z.string({ message: "请选择出发日期" }).min(1, "请选择出发日期"),
  tripRange: z.array(z.string()).length(2, "请选择行程区间"),
});

/** 提交前整体校验 */
async function submitForm() {
  const valid = await formRef.value?.validate();
  formResult.value = valid ? `校验通过：${formatDisplay(formModel.departDate)}，${formatDisplay(formModel.tripRange)}` : "校验未通过";
}

/** 重置表单与回显 */
function resetForm() {
  formRef.value?.resetFields();
  formResult.value = "";
}

// ─── 自定义样式 ─────────────────────────────────────────────────

/** 虚线触发器的值 */
const customTriggerValue = ref<string[]>(["2024-04-08", "2024-04-12"]);
/** 自定义面板选中色的值 */
const customPanelValue = ref<string[]>(["2024-04-08", "2024-04-12"]);
/** 自定义标签与页头的值 */
const customTagValue = ref<string[]>(["2024-04-01", "2024-04-03", "2024-04-08"]);

/** 首尾用 dayActive，中间项用 dayInRange；两者都要把 hover 写上，否则悬停会被灰底盖掉 */
const customRangeUi = {
  dayActive: "bg-success text-gray-1 rounded-full hover:bg-success",
  dayInRange: "bg-green-1 text-success rounded-none hover:bg-green-1",
};
</script>

<template>
  <div class="flex flex-col gap-8">
    <!-- 交互演练场 -->
    <Playground
      v-model="state"
      :controls="controls"
      :code="pickerCode"
      component-name="RebornDatePicker"
      title="交互演练场"
      description="调节左侧参数，实时查看触发器与下拉面板在各类型下的表现、绑定值和事件顺序。"
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

      <div class="flex w-full max-w-md flex-col gap-4 pb-40">
        <RebornDatePicker
          v-model="state.value"
          :type="state.type"
          :value-format="valueFormat"
          :size="state.size"
          :color="state.color"
          :variant="state.variant"
          :active-type="state.activeType"
          :placeholder="state.placeholder || undefined"
          :show-arrow="state.showArrow"
          :arrow-animation="state.arrowAnimation"
          :clearable="state.clearable"
          :loading="state.loading"
          :disabled="state.disabled"
          :collapse-tags="state.collapseTags"
          :collapse-tags-tooltip="state.collapseTagsTooltip"
          :max-collapse-tags="state.maxCollapseTags"
          :close-on="state.closeOn"
          :portal="state.portal"
          :shortcuts="playgroundShortcuts"
          :show-week-number="state.showWeekNumber"
          :unlink-panels="state.unlinkPanels"
          :single-panel="state.singlePanel"
          :show-today="state.showToday"
          @change="playgroundHandlers.onChange"
          @visible-change="playgroundHandlers.onVisibleChange"
          @calendar-change="playgroundHandlers.onCalendarChange"
          @panel-change="playgroundHandlers.onPanelChange"
          @clear="playgroundHandlers.onClear"
          @remove-tag="playgroundHandlers.onRemoveTag"
        />
        <DemoNote tone="dimmed">
          当前绑定值：<code class="break-all">{{ formatDisplay(state.value) }}</code>
        </DemoNote>
        <ul class="flex flex-col gap-1 font-mono text-xs">
          <li
            v-for="log in playgroundLogs"
            :key="log.id"
            class="text-gray-7 break-all"
          >
            <span class="text-primary">{{ log.name }}</span> {{ log.detail }}
          </li>
          <li
            v-if="!playgroundLogs.length"
            class="text-gray-5"
          >
            展开下拉、选择日期或清空，这里会按时间倒序列出触发的事件
          </li>
        </ul>
      </div>
    </Playground>

    <!-- 基础用法 -->
    <DemoSection
      title="基础用法"
      class="relative z-30"
    >
      <template #description>
        点击触发器展开日期面板，选中后自动收起。不传 <code>value-format</code> 时绑定值是 Date 对象，传了则按格式输出字符串；<code>format</code> 只改触发器里的展示文本，不影响绑定值。
      </template>
      <DemoBlock
        layout="grid"
        :columns="3"
        align="start"
      >
        <DemoItem
          label="绑定 Date 对象"
          note="没有 value-format，选中后拿到的是 Date"
        >
          <RebornDatePicker
            v-model="basicDateValue"
            class="w-full"
          />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(basicDateValue) }}</span>
          </DemoNote>
        </DemoItem>
        <DemoItem
          label="绑定字符串"
          note="value-format 决定绑定值的格式"
        >
          <RebornDatePicker
            v-model="basicStringValue"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(basicStringValue) }}</span>
          </DemoNote>
        </DemoItem>
        <DemoItem
          label="自定义展示格式"
          note="触发器显示中文日期，绑定值仍是 YYYY-MM-DD"
        >
          <RebornDatePicker
            v-model="basicFormatValue"
            value-format="YYYY-MM-DD"
            format="YYYY 年 M 月 D 日"
            class="w-full"
          />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(basicFormatValue) }}</span>
          </DemoNote>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <!-- 选择类型 -->
    <DemoSection
      title="选择类型"
      class="relative z-20"
    >
      <template #description>
        <code>type</code> 决定面板粒度与绑定值形态；占位文本缺省时随类型切换，如「请选择月份」「请选择季度」。<code>datetime</code> 需要在面板里调时分秒，选完日期不会立即收起。
      </template>
      <DemoBlock
        layout="grid"
        :columns="3"
        align="start"
      >
        <DemoItem
          label="week"
          mono
          note="绑定值是这一周的 [周日, 周六]"
        >
          <RebornDatePicker
            v-model="weekValue"
            type="week"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="month"
          mono
        >
          <RebornDatePicker
            v-model="monthValue"
            type="month"
            value-format="YYYY-MM"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="quarter"
          mono
          note="value-format 用 Q 令牌输出 2024-Q2"
        >
          <RebornDatePicker
            v-model="quarterValue"
            type="quarter"
            value-format="YYYY-[Q]Q"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="year"
          mono
        >
          <RebornDatePicker
            v-model="yearValue"
            type="year"
            value-format="YYYY"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="datetime"
          mono
          note="日期与时间都选定即写回，点面板外收起"
        >
          <RebornDatePicker
            v-model="datetimeValue"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="show-week-number"
          mono
          note="日期视图左侧多一列 ISO 周数"
        >
          <RebornDatePicker
            v-model="weekNumberValue"
            value-format="YYYY-MM-DD"
            show-week-number
            class="w-full"
          />
        </DemoItem>
      </DemoBlock>
      <DemoNote tone="dimmed">
        当前值：week <code class="font-mono text-xs">{{ formatDisplay(weekValue) }}</code>，quarter <code class="font-mono text-xs">{{ formatDisplay(quarterValue) }}</code>，datetime <code class="font-mono text-xs">{{ formatDisplay(datetimeValue) }}</code>
      </DemoNote>
    </DemoSection>

    <!-- 范围选择 -->
    <DemoSection
      title="范围选择"
      class="relative z-10"
    >
      <template #description>
        范围类型的触发器分成开始、结束两栏，起止都选定才写回绑定值；只点了开始日期就收起，这个半成品会被丢弃。<code>unlink-panels</code> 让左右面板各自翻页，<code>single-panel</code> 只保留一个面板。
      </template>
      <DemoBlock
        layout="grid"
        :columns="3"
        align="start"
      >
        <DemoItem
          label="daterange"
          mono
        >
          <RebornDatePicker
            v-model="dateRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="datetimerange"
          mono
          note="format 省掉秒，两栏才放得下"
        >
          <RebornDatePicker
            v-model="datetimeRangeValue"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm"
            format="YYYY-MM-DD HH:mm"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="monthrange"
          mono
          note="自定义分隔符与两栏占位"
        >
          <RebornDatePicker
            v-model="monthRangeValue"
            type="monthrange"
            value-format="YYYY-MM"
            range-separator="→"
            start-placeholder="入职月份"
            end-placeholder="离职月份"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="unlink-panels"
          mono
          note="1 月与 6 月分列两侧，不必逐月翻到终点"
        >
          <RebornDatePicker
            v-model="unlinkedRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            unlink-panels
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="single-panel"
          mono
          note="浮层宽度减半，适合侧栏等窄区域"
        >
          <RebornDatePicker
            v-model="singleRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            single-panel
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="yearrange"
          mono
        >
          <RebornDatePicker
            v-model="yearRangeValue"
            type="yearrange"
            value-format="YYYY"
            class="w-full"
          />
        </DemoItem>
      </DemoBlock>
      <DemoNote tone="dimmed">
        daterange 当前值：<code class="font-mono text-xs">{{ formatDisplay(dateRangeValue) }}</code>
      </DemoNote>
    </DemoSection>

    <!-- 多选与标签折叠 -->
    <DemoSection
      title="多选与标签折叠"
      class="relative z-1"
    >
      <template #description>
        <code>dates</code> / <code>months</code> / <code>years</code> / <code>quarters</code> 每点一项立即写回，面板保持展开以便继续勾选。已选项以标签展示，默认逐行铺开；开启 <code>collapse-tags</code> 后超出 <code>max-collapse-tags</code> 的部分合并为 +N，触发器高度保持不变。
      </template>
      <DemoBlock
        layout="grid"
        :columns="3"
        align="start"
      >
        <DemoItem
          label="标签换行"
          note="未开启折叠，触发器随标签增高"
        >
          <RebornDatePicker
            v-model="multiDatesValue"
            type="dates"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="collapse-tags"
          mono
          note="只露出第一个标签，其余合并为 +N"
        >
          <RebornDatePicker
            v-model="multiMonthsValue"
            type="months"
            value-format="YYYY-MM"
            collapse-tags
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="collapse-tags-tooltip"
          mono
          note="max-collapse-tags=2，悬停 +N 查看被折叠的日期"
        >
          <RebornDatePicker
            v-model="multiTooltipValue"
            type="dates"
            value-format="YYYY-MM-DD"
            collapse-tags
            collapse-tags-tooltip
            :max-collapse-tags="2"
            class="w-full"
          />
        </DemoItem>
      </DemoBlock>
      <DemoNote tone="dimmed">
        点标签上的 × 可单独移除一项。dates 当前值：<code class="font-mono text-xs break-all">{{ formatDisplay(multiDatesValue) }}</code>
      </DemoNote>
    </DemoSection>

    <!-- 形态、尺寸与配色 -->
    <DemoSection title="形态、尺寸与配色">
      <template #description>
        <code>variant</code>、<code>size</code>、<code>color</code> 与 RebornSelect 共用同一套类名，同一表单里两者并排时高度、描边与聚焦色一致。<code>color</code> 还会下发给面板，决定选中日期的底色。
      </template>
      <DemoBlock
        layout="grid"
        :columns="4"
        align="start"
      >
        <DemoItem
          v-for="variant in datePickerVariants"
          :key="variant"
          :label="variant"
          mono
        >
          <RebornDatePicker
            v-model="variantValue"
            :variant="variant"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </DemoItem>
      </DemoBlock>
      <DemoBlock
        layout="grid"
        :columns="3"
        align="start"
      >
        <DemoItem
          v-for="size in datePickerSizes"
          :key="size"
          :label="size"
          mono
        >
          <RebornDatePicker
            v-model="sizeValue"
            type="dates"
            :size="size"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </DemoItem>
      </DemoBlock>
      <DemoBlock
        layout="grid"
        :columns="4"
        align="start"
      >
        <DemoItem
          v-for="color in datePickerColors"
          :key="color"
          :label="color"
          mono
        >
          <RebornDatePicker
            v-model="colorValues[color]"
            type="daterange"
            :color="color"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <!-- 可选范围与禁用日期 -->
    <DemoSection title="可选范围与禁用日期">
      <template #description>
        <code>start</code> / <code>end</code> 圈定整体可选区间；<code>disabled-method</code> 逐项判定，第二个参数 <code>unit</code> 标明当前是日、周、月、季度还是年粒度；<code>disabled-hours</code> 等方法只作用于带时间的类型。
      </template>
      <DemoBlock
        layout="grid"
        :columns="4"
        align="start"
      >
        <DemoItem
          label="start + end"
          mono
          note="只能选 2024 年 4 月"
        >
          <RebornDatePicker
            v-model="boundedValue"
            value-format="YYYY-MM-DD"
            start="2024-04-01"
            end="2024-04-30"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="禁用周末"
          note="只在日期粒度判定"
        >
          <RebornDatePicker
            v-model="weekendValue"
            value-format="YYYY-MM-DD"
            :disabled-method="disableWeekend"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="按粒度禁用"
          note="月份只开放 3-8 月，年份禁用 2024 年以前"
        >
          <RebornDatePicker
            v-model="unitValue"
            type="month"
            value-format="YYYY-MM"
            :disabled-method="disableByUnit"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="disabled-hours"
          mono
          note="只开放 9:00-18:00"
        >
          <RebornDatePicker
            v-model="hoursValue"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            :disabled-hours="disableNightHours"
            class="w-full"
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <!-- 快捷选项 -->
    <DemoSection title="快捷选项">
      <template #description>
        <code>shortcuts</code> 在面板左侧列出常用日期，点击后直接写回并收起。<code>value</code> 写成函数才能每次点击都按当天重新计算，范围类型的函数返回 [起点, 终点]。
      </template>
      <DemoBlock
        layout="grid"
        :columns="2"
        align="start"
      >
        <DemoItem label="单值">
          <RebornDatePicker
            v-model="singleShortcutValue"
            value-format="YYYY-MM-DD"
            :shortcuts="singleShortcuts"
            class="w-full"
          />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(singleShortcutValue) }}</span>
          </DemoNote>
        </DemoItem>
        <DemoItem label="范围">
          <RebornDatePicker
            v-model="rangeShortcutValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            :shortcuts="rangeShortcuts"
            class="w-full"
          />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(rangeShortcutValue) }}</span>
          </DemoNote>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <!-- 今天栏 -->
    <DemoSection title="今天栏">
      <template #description>
        <code>show-today</code> 在面板底部加一栏，点击选中当前时间所在的单位，文案随类型变为今天、本周、本月、本季度、今年；<code>datetime</code> 显示「此刻」，时分秒取点击时的时间。今天被 <code>start</code> / <code>end</code> / <code>disabled-method</code> 排除时，这一栏置灰且点击无效。
      </template>
      <DemoBlock
        layout="grid"
        :columns="2"
        align="start"
      >
        <DemoItem label="date">
          <RebornDatePicker
            v-model="todayDateValue"
            value-format="YYYY-MM-DD"
            show-today
            class="w-full"
          />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(todayDateValue) }}</span>
          </DemoNote>
        </DemoItem>
        <DemoItem label="month">
          <RebornDatePicker
            v-model="todayMonthValue"
            type="month"
            value-format="YYYY-MM"
            show-today
            class="w-full"
          />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(todayMonthValue) }}</span>
          </DemoNote>
        </DemoItem>
        <DemoItem label="datetime">
          <RebornDatePicker
            v-model="todayDatetimeValue"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            show-today
            class="w-full"
          />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(todayDatetimeValue) }}</span>
          </DemoNote>
        </DemoItem>
        <DemoItem label="daterange">
          <RebornDatePicker
            v-model="todayRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            show-today
            class="w-full"
          />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(todayRangeValue) }}</span>
          </DemoNote>
        </DemoItem>
        <DemoItem label="今天不可选">
          <RebornDatePicker
            v-model="todayPastValue"
            value-format="YYYY-MM-DD"
            placeholder="只能选过去的日期"
            :disabled-method="disableFromToday"
            show-today
            class="w-full"
          />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(todayPastValue) }}</span>
          </DemoNote>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <!-- 加载与禁用 -->
    <DemoSection title="加载与禁用">
      <template #description>
        <code>loading</code> 把尾部图标换成转圈并隐藏清空按钮，只作用于触发器，面板照常可选；<code>disabled</code> 后触发器置灰、点击无响应。
      </template>
      <DemoBlock
        layout="grid"
        :columns="3"
        align="start"
      >
        <DemoItem
          label="loading"
          mono
        >
          <RebornDatePicker
            v-model="loadingValue"
            value-format="YYYY-MM-DD"
            loading
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="disabled"
          mono
        >
          <RebornDatePicker
            v-model="disabledValue"
            value-format="YYYY-MM-DD"
            disabled
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="范围类型禁用"
        >
          <RebornDatePicker
            v-model="disabledRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            disabled
            class="w-full"
          />
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <!-- 页头与页脚 -->
    <DemoSection
      title="页头与页脚"
      class="relative z-30"
    >
      <template #description>
        <code>header</code> / <code>footer</code> 插槽分别渲染在面板上方和下方，自带分隔线，适合放说明文字或提示。
      </template>
      <DemoBlock layout="stack">
        <DemoItem label="预约日期">
          <RebornDatePicker
            v-model="headerFooterValue"
            value-format="YYYY-MM-DD"
            :disabled-method="disableWeekend"
            class="w-full max-w-xs"
          >
            <template #header>
              请选择到店日期
            </template>
            <template #footer>
              <span class="flex items-center gap-1">
                <Icon
                  name="lucide:info"
                  class="size-3.5"
                />
                周末门店休息，不可预约
              </span>
            </template>
          </RebornDatePicker>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <!-- 自定义单元格与导航图标 -->
    <DemoSection
      title="自定义单元格与导航图标"
      class="relative z-20"
    >
      <template #description>
        <code>cell</code> 插槽接管每个格子的内容，作用域参数与面板的 <code>default</code> 插槽相同；<code>prev-month</code> / <code>next-month</code> / <code>prev-year</code> / <code>next-year</code> 替换翻页按钮里的图标。
      </template>
      <DemoBlock
        layout="grid"
        :columns="2"
        align="start"
      >
        <DemoItem
          label="节假日标注"
          note="2024 年 4 月，清明假期标「休」，调休标「班」"
        >
          <RebornDatePicker
            v-model="cellValue"
            value-format="YYYY-MM-DD"
            class="w-full"
          >
            <template #cell="{ type, text, date, selected }">
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
          </RebornDatePicker>
        </DemoItem>
        <DemoItem
          label="自定义翻页图标"
          note="年用带竖线的箭头，月用普通箭头"
        >
          <RebornDatePicker
            v-model="navIconValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            class="w-full"
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
          </RebornDatePicker>
        </DemoItem>
      </DemoBlock>
      <DemoNote tone="dimmed">
        日、月、季度、年四种视图共用 cell 插槽，必须按 type 分支并补回默认文案，否则切到月视图会只剩数字；选中格的角标不写颜色，跟随选中文字色，避免与选中底色撞色。翻页插槽替换的是默认图标，尺寸需要自己给。
      </DemoNote>
    </DemoSection>

    <!-- 自定义触发器 -->
    <DemoSection
      title="自定义触发器"
      class="relative z-10"
    >
      <template #description>
        <code>default</code> 插槽只替换触发器的文本区，尾部箭头与清空按钮保留；<code>cover</code> 插槽连同尾部图标区一起接管。两者的作用域参数都有 <code>displayText</code>、<code>placeholder</code>、<code>isOpen</code> 和 <code>ui</code>，其中 <code>ui</code> 可复用组件内置的类名。
      </template>
      <DemoBlock
        layout="grid"
        :columns="2"
        align="start"
      >
        <DemoItem
          label="default 插槽"
          mono
          note="前置图标 + 复用 ui.triggerText()"
        >
          <RebornDatePicker
            v-model="slotTriggerValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            class="w-full"
          >
            <template #default="{ displayText, placeholder, ui }">
              <span class="flex min-w-0 flex-1 items-center gap-2">
                <Icon
                  name="lucide:plane"
                  class="text-primary size-4 shrink-0"
                />
                <span :class="displayText ? ui.triggerText() : ui.placeholder()">{{ displayText || placeholder }}</span>
              </span>
            </template>
          </RebornDatePicker>
        </DemoItem>
        <DemoItem
          label="cover 插槽"
          mono
          note="整块替换为渐变卡片"
        >
          <RebornDatePicker
            v-model="coverValue"
            value-format="YYYY-MM-DD"
            :trigger-ui="{ trigger: 'h-auto p-0 border-none bg-transparent' }"
            class="w-full"
          >
            <template #cover="{ displayText, placeholder, isOpen }">
              <div class="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-linear-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-white transition-all active:scale-[0.98]">
                <Icon
                  name="lucide:calendar-heart"
                  class="size-5 shrink-0"
                />
                <div class="flex min-w-0 flex-1 flex-col">
                  <span class="text-xs opacity-80">纪念日</span>
                  <span class="truncate font-medium">{{ displayText || placeholder }}</span>
                </div>
                <Icon
                  name="lucide:chevron-down"
                  class="size-4 shrink-0 transition-transform"
                  :class="isOpen ? 'rotate-180' : ''"
                />
              </div>
            </template>
          </RebornDatePicker>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <!-- 事件 -->
    <DemoSection
      title="事件"
      class="relative z-1"
    >
      <template #description>
        除 RebornSelect 已有的 <code>change</code>、<code>clear</code>、<code>remove-tag</code>、<code>visible-change</code> 外，还转发面板的 <code>calendar-change</code>（仅范围类型）与 <code>panel-change</code>。通过实例调用 <code>clear()</code> 与点清空按钮效果相同。
      </template>
      <DemoBlock
        layout="grid"
        :columns="2"
        align="start"
      >
        <DemoItem label="范围选择">
          <RebornDatePicker
            ref="eventPicker"
            v-model="eventRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            class="w-full"
            @change="eventHandlers.onChange"
            @visible-change="eventHandlers.onVisibleChange"
            @calendar-change="eventHandlers.onCalendarChange"
            @panel-change="eventHandlers.onPanelChange"
            @clear="eventHandlers.onClear"
          />
        </DemoItem>
        <DemoItem label="多选">
          <RebornDatePicker
            v-model="eventMultiValue"
            type="dates"
            value-format="YYYY-MM-DD"
            class="w-full"
            @change="eventHandlers.onChange"
            @visible-change="eventHandlers.onVisibleChange"
            @panel-change="eventHandlers.onPanelChange"
            @clear="eventHandlers.onClear"
            @remove-tag="eventHandlers.onRemoveTag"
          />
        </DemoItem>
      </DemoBlock>
      <div class="flex gap-2">
        <RebornButton
          size="sm"
          variant="outlined"
          @click="eventPicker?.clear()"
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
          操作上面两个选择器，事件会按时间倒序出现在这里
        </li>
      </ul>
      <DemoNote tone="dimmed">
        范围类型点下起点就会抛 calendar-change，此时终点为 null；change 要等起止都选定才抛，紧接着是 visible-change false。多选类型每勾一项都抛 change，面板不收起。
      </DemoNote>
    </DemoSection>

    <!-- 与表单联动 -->
    <DemoSection title="与表单联动">
      <template #description>
        放进 RebornFormItem 后，选中值会触发 change 校验，收起面板会触发 blur 校验，出错时触发器描边变红；表单的 <code>size</code> 与 <code>disabled</code> 同样会下发。
      </template>
      <RebornForm
        ref="formRef"
        :model-value="formModel"
        :rules="formRules"
        label-width="100px"
        label-position="left"
        size="md"
        :trigger="['change', 'blur']"
        class="w-full max-w-lg"
      >
        <RebornFormItem
          label="出发日期"
          prop="departDate"
        >
          <RebornDatePicker
            v-model="formModel.departDate"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </RebornFormItem>
        <RebornFormItem
          label="行程区间"
          prop="tripRange"
        >
          <RebornDatePicker
            v-model="formModel.tripRange"
            type="daterange"
            value-format="YYYY-MM-DD"
            class="w-full"
          />
        </RebornFormItem>
        <RebornFormItem>
          <div class="flex gap-2">
            <RebornButton @click="submitForm">
              校验并提交
            </RebornButton>
            <RebornButton
              color="neutral"
              variant="outlined"
              @click="resetForm"
            >
              重置
            </RebornButton>
          </div>
        </RebornFormItem>
      </RebornForm>
      <DemoNote
        v-if="formResult"
        tone="dimmed"
      >
        <span class="font-mono text-xs">{{ formResult }}</span>
      </DemoNote>
    </DemoSection>

    <!-- 自定义样式 -->
    <DemoSection title="自定义样式">
      <template #description>
        样式分三条通道：<code>trigger-ui</code> 覆盖触发器盒子（含范围两栏与分隔符），<code>panel-ui</code> 原样透传给日期面板，<code>ui</code> 覆盖浮层页头页脚与多选标签。
      </template>
      <DemoBlock
        layout="grid"
        :columns="3"
        align="start"
      >
        <DemoItem
          label="trigger-ui"
          mono
          note="虚线大圆角，分隔符改为主题色"
        >
          <RebornDatePicker
            v-model="customTriggerValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            :trigger-ui="{
              trigger: 'border-dashed border-2 rounded-2xl border-indigo-200 dark:border-indigo-800 px-4 h-14',
              rangeSeparator: 'text-primary',
            }"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="panel-ui"
          mono
          note="首尾正圆、区间浅绿"
        >
          <RebornDatePicker
            v-model="customPanelValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            :panel-ui="customRangeUi"
            class="w-full"
          />
        </DemoItem>
        <DemoItem
          label="ui"
          mono
          note="标签改为主题色浅底，页头加粗"
        >
          <RebornDatePicker
            v-model="customTagValue"
            type="dates"
            value-format="YYYY-MM-DD"
            :ui="{ tag: 'border-primary/30 bg-primary/10 text-primary', dropdownHeader: 'font-medium text-gray-9' }"
            class="w-full"
          >
            <template #header>
              可多选，已选 {{ customTagValue.length }} 天
            </template>
          </RebornDatePicker>
        </DemoItem>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
