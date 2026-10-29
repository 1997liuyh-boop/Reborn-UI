<script setup lang="ts">
/**
 * 日期选择器演示。文档站与知识库按本文件的文本抽取章节：Playground 的 title 与每个 DemoSection 的
 * title、描述都写在这里（字面量）；状态较多的章节只把卡片内容拆进同目录的子组件。
 */
import type { DatePickerPlaygroundConfig } from "./RebornDatePickerPlaygroundDemo.vue";
import type { DatePickerType } from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import { DemoBlock, DemoItem, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, ref, shallowRef, watch } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { datePickerTypes } from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import { datePickerColors, datePickerSizes, datePickerVariants } from "~/components/reborn/ui/reborn-date-picker/reborn-date-picker.config";
import RebornDatePicker from "~/components/reborn/ui/reborn-date-picker/RebornDatePicker.vue";
import {
  arrayValueTypes,
  disableByUnit,
  disableWeekend,
  formatDisplay,
  rangeShortcuts,
  singleShortcuts,
  valueFormatOf,
} from "../_shared/date-demo-utils";
import DateDemoCell from "../_shared/DateDemoCell.vue";
import RebornDatePickerEventsDemo from "./RebornDatePickerEventsDemo.vue";
import RebornDatePickerFormDemo from "./RebornDatePickerFormDemo.vue";
import RebornDatePickerPlaygroundDemo from "./RebornDatePickerPlaygroundDemo.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场状态：业务值 pickerValue 与外观、行为参数各自具有明确类型 */
interface PlaygroundState extends DatePickerPlaygroundConfig {
  pickerValue: string | string[] | null;
}

/** 演练场默认配置，与组件自身默认值保持一致 */
const defaultState: PlaygroundState = {
  pickerValue: "2024-04-03",
  type: "date",
  size: "md",
  color: "primary",
  variant: "outlined",
  activeType: "fill",
  placeholder: "",
  showArrow: true,
  arrowAnimation: false,
  clearable: true,
  loading: false,
  disabled: false,
  collapseTags: false,
  collapseTagsTooltip: false,
  maxCollapseTags: 1,
  closeOn: "mousedown",
  portal: true,
  shortcuts: false,
  shortcutPosition: "left",
  showWeekNumber: false,
  unlinkPanels: false,
  singlePanel: false,
  showToday: false,
  highlightToday: false,
};

/** 演练场当前配置：控制面板整体替换对象，绑定值由预览区经 v-model:value 写回 */
const state = ref<PlaygroundState>({ ...defaultState });

/** 预览区的重建标记：重置配置或切换类型后预览区重新挂载，它持有的事件日志随之清空 */
const previewKey = shallowRef(0);

/** 重置演练场配置，事件日志一并清空 */
function resetState() {
  state.value = { ...defaultState };
  previewKey.value++;
}

/** 不同类型对应的取值精度不同，格式需要随之切换 */
const valueFormat = computed(() => valueFormatOf(state.value.type));

/** 演练场的快捷项只接给日期粒度的单值与范围类型，其余类型的面板不渲染日期网格，给了也对不上 */
const playgroundShortcuts = computed(() => {
  if (!state.value.shortcuts) return [];
  const type = state.value.type;
  if (type === "date" || type === "datetime") return singleShortcuts;
  if (type === "daterange" || type === "datetimerange") return rangeShortcuts;
  return [];
});

/**
 * 演练场控制面板配置：按参数的作用对象分组。
 * DatePicker 由选择框（触发器与浮层）和内部 RebornDatePickerPanel 组成，分开摆放才能看出某个参数改的是哪一部分。
 */
const controls = [
  {
    title: "共用参数（两者同时生效）",
    children: [
      {
        label: "选择类型（type）",
        key: "type",
        component: "select" as const,
        defaultValue: "date",
        props: { options: datePickerTypes.map((t) => ({ label: t, value: t })) },
      },
      {
        label: "尺寸规格",
        key: "size",
        component: "select" as const,
        defaultValue: "md",
        props: { options: datePickerSizes.map((s) => ({ label: s.toUpperCase(), value: s })) },
      },
      {
        label: "主题颜色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: datePickerColors.map((c) => ({ label: c, value: c })) },
      },
    ],
  },
  {
    title: "选择框参数",
    children: [
      {
        label: "形态变体",
        key: "variant",
        component: "select" as const,
        defaultValue: "outlined",
        props: { options: datePickerVariants.map((v) => ({ label: v, value: v })) },
      },
      {
        label: "占位文本（留空按类型给默认值）",
        key: "placeholder",
        component: "input" as const,
        defaultValue: "",
      },
      { label: "显示箭头", key: "showArrow", component: "checkbox" as const, defaultValue: true },
      { label: "箭头旋转动画", key: "arrowAnimation", component: "checkbox" as const, defaultValue: false },
      { label: "可清空", key: "clearable", component: "checkbox" as const, defaultValue: true },
      { label: "加载中", key: "loading", component: "checkbox" as const, defaultValue: false },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
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
        defaultValue: "mousedown",
        props: {
          options: [
            { label: "外部点击后 click", value: "click" },
            { label: "外部按下时 mousedown", value: "mousedown" },
          ],
        },
      },
      { label: "浮层传送到 body（portal）", key: "portal", component: "checkbox" as const, defaultValue: true },
    ],
  },
  {
    title: "面板参数（透传给 reborn-date-picker-panel）",
    children: [
      {
        label: "选中样式（active-type）",
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
        label: "显示快捷选项（date / daterange 及带时间的变体）",
        key: "shortcuts",
        component: "checkbox" as const,
        defaultValue: false,
      },
      {
        label: "快捷选项位置",
        key: "shortcutPosition",
        component: "select" as const,
        defaultValue: "left",
        props: {
          options: [
            { label: "左侧", value: "left" },
            { label: "右侧", value: "right" },
          ],
        },
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
      { label: "高亮今天（默认关闭）", key: "highlightToday", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码：完整列出当前所有参数（含默认值），顺序与控制面板分组一致 */
const pickerCode = computed(() => {
  const s = state.value;
  const props: string[] = [
    'v-model="value"',
    `type="${s.type}"`,
    `value-format="${valueFormat.value}"`,
    `size="${s.size}"`,
    `color="${s.color}"`,
    `variant="${s.variant}"`,
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
    `active-type="${s.activeType}"`,
    playgroundShortcuts.value.length ? ':shortcuts="shortcuts"' : ':shortcuts="[]"',
    `shortcut-position="${s.shortcutPosition}"`,
    `:show-week-number="${s.showWeekNumber}"`,
    `:unlink-panels="${s.unlinkPanels}"`,
    `:single-panel="${s.singlePanel}"`,
    `:show-today="${s.showToday}"`,
    `:highlight-today="${s.highlightToday}"`,
    '@change="onChange"',
    '@visible-change="onVisibleChange"',
    '@calendar-change="onCalendarChange"',
    '@panel-change="onPanelChange"',
    '@clear="onClear"',
    '@remove-tag="onRemoveTag"',
  );

  return `<RebornDatePicker\n  ${props.join("\n  ")}\n/>`;
});

/**
 * 切换类型时重置绑定值：单值与数组形态不同，取值精度也不同，沿用旧值会被按新格式误读；
 * 旧类型的事件日志也不再有参考价值，预览区随之重建。
 * 重置配置回到默认类型时保留默认值，否则刚恢复的示例值会被立刻清掉。
 */
watch(
  () => state.value.type,
  (newType: DatePickerType) => {
    if (newType === defaultState.type && state.value.pickerValue === defaultState.pickerValue) return;
    state.value.pickerValue = arrayValueTypes.includes(newType) ? [] : null;
    previewKey.value++;
  },
);

// ─── 场景演示状态 ───────────────────────────────────────────────

/** 不传 value-format：绑定值是 Date 对象 */
const basicDateValue = shallowRef<Date | null>(null);

/** 传 value-format：绑定值是字符串 */
const basicStringValue = shallowRef<string | null>("2024-04-03");

/** 只改展示格式，绑定值仍按 value-format 输出 */
const basicFormatValue = shallowRef<string | null>("2024-04-03");

/** 按周：绑定值是这一周的 [周日, 周六] */
const weekValue = shallowRef<string[]>([]);

/** 按月 */
const monthValue = shallowRef<string | null>("2024-04");

/** 按季度：值用 Q 令牌输出 */
const quarterValue = shallowRef<string | null>("2024-Q2");

/** 按年 */
const yearValue = shallowRef<string | null>("2024");

/** 日期时间 */
const datetimeValue = shallowRef<string | null>(null);

/** 带周数的日期 */
const weekNumberValue = shallowRef<string | null>("2024-04-03");

/** 日期范围 */
const dateRangeValue = shallowRef<string[]>(["2024-04-08", "2024-04-12"]);

/** 日期时间范围 */
const datetimeRangeValue = shallowRef<string[]>([]);

/** 月份范围 */
const monthRangeValue = shallowRef<string[]>([]);

/** 取消联动：起止相隔数月，两侧面板各自停在所属月份 */
const unlinkedRangeValue = shallowRef<string[]>(["2024-01-15", "2024-06-10"]);

/** 单面板范围 */
const singleRangeValue = shallowRef<string[]>(["2024-04-08", "2024-04-12"]);

/** 年份范围 */
const yearRangeValue = shallowRef<string[]>(["2021", "2024"]);

/** 多选日期，标签逐行铺开 */
const multiDatesValue = shallowRef<string[]>(["2024-04-01", "2024-04-03", "2024-04-08", "2024-04-15"]);

/** 多选月份，超出部分折叠为 +N */
const multiMonthsValue = shallowRef<string[]>(["2024-01", "2024-03", "2024-05", "2024-07"]);

/** 多选日期，折叠后悬停查看 */
const multiTooltipValue = shallowRef<string[]>(["2024-04-01", "2024-04-03", "2024-04-08", "2024-04-15", "2024-04-22"]);

/** 四种形态共用一个值，便于对比同一内容在不同形态下的表现 */
const variantValue = shallowRef<string | null>("2024-04-03");

/** 三档尺寸共用一个多选值，顺带对比标签在各档的字号 */
const sizeValue = shallowRef<string[]>(["2024-04-01", "2024-04-03"]);

/** 七种配色各自的值，展开后面板选中色随之变化 */
const colorValues = ref<Record<string, string[]>>(
  Object.fromEntries(datePickerColors.map((c) => [c, ["2024-04-08", "2024-04-12"]])),
);

/** 限定在 2024 年 4 月之内 */
const boundedValue = shallowRef<string | null>("2024-04-10");

/** 周末不可选 */
const weekendValue = shallowRef<string | null>(null);

/** 按粒度禁用 */
const unitValue = shallowRef<string | null>(null);

/** 禁用夜间时段 */
const hoursValue = shallowRef<string | null>(null);

/** 只开放 9:00-18:00，其余小时在时间列里置灰 */
function disableNightHours() {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 19, 20, 21, 22, 23];
}

/** 单值快捷项 */
const singleShortcutValue = shallowRef<string | null>(null);

/** 范围快捷项 */
const rangeShortcutValue = shallowRef<string[]>([]);

/** 日期：点「今天」选中当天并收起 */
const todayDateValue = shallowRef<string | null>(null);

/** 月份：文案变为「本月」 */
const todayMonthValue = shallowRef<string | null>(null);

/** 日期时间：文案变为「此刻」，时分秒取点击时的时间 */
const todayDatetimeValue = shallowRef<string | null>(null);

/** 日期范围：起止都落在今天 */
const todayRangeValue = shallowRef<string[]>([]);

/** 只能选过去的日期 */
const todayPastValue = shallowRef<string | null>(null);

/** 今天及以后不可选：今天被禁用时「今天」栏同步置灰、点击无效 */
function disableFromToday(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date.getTime() >= today.getTime();
}

/** 加载中的值 */
const loadingValue = shallowRef<string | null>("2024-04-03");

/** 禁用的单值 */
const disabledValue = shallowRef<string | null>("2024-04-03");

/** 禁用的范围 */
const disabledRangeValue = shallowRef<string[]>(["2024-04-08", "2024-04-12"]);

/** 页头页脚示例的值 */
const headerFooterValue = shallowRef<string | null>(null);

/** default 插槽示例的值 */
const slotTriggerValue = shallowRef<string[]>(["2024-04-08", "2024-04-12"]);

/** cover 插槽示例的值 */
const coverValue = shallowRef<string | null>(null);

/** 虚线触发器的值 */
const customTriggerValue = shallowRef<string[]>(["2024-04-08", "2024-04-12"]);

/** 节假日示例：停在 2024 年 4 月，清明假期就在眼前 */
const cellValue = shallowRef<string | null>("2024-04-03");

/** 导航图标示例 */
const navIconValue = shallowRef<string[]>(["2024-04-08", "2024-04-12"]);

/** 自定义面板选中色的值 */
const customPanelValue = shallowRef<string[]>(["2024-04-08", "2024-04-12"]);

/** 自定义标签与页头的值 */
const customTagValue = shallowRef<string[]>(["2024-04-01", "2024-04-03", "2024-04-08"]);

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
      description="上方参数按作用对象分组：共用参数同时作用于选择框与面板，选择框参数只改触发器与浮层，面板参数透传给内部 RebornDatePickerPanel。下方可查看绑定值与事件顺序。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <!-- 预览区：选择器、绑定值回显与事件日志 -->
      <RebornDatePickerPlaygroundDemo
        :key="previewKey"
        v-model:value="state.pickerValue"
        :config="state"
        :value-format="valueFormat"
        :shortcuts="playgroundShortcuts"
      />
    </Playground>

    <!-- 基础用法 -->
    <DemoSection title="基础用法" class="relative z-30">
      <template #description>
        点击触发器展开日期面板，选中后自动收起。不传
        <code>value-format</code>
        时绑定值是 Date 对象，传了则按格式输出字符串；<code>format</code>
        只改触发器里的展示文本，不影响绑定值。全部类型支持手动输入：年用 <code>YYYY</code>，月用 <code>YYYY-MM</code>，季度用 <code>YYYY-Q1</code>，日期和周用 <code>YYYY-MM-DD</code>，日期时间用 <code>YYYY-MM-DD HH:mm:ss</code>；回车或离开输入框后确认，多选用逗号追加，悬停只预览。
      </template>
      <DemoBlock layout="grid" :columns="3" align="start">
        <DemoItem label="绑定 Date 对象" note="没有 value-format，选中后拿到的是 Date">
          <RebornDatePicker v-model="basicDateValue" class="w-full" />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(basicDateValue) }}</span>
          </DemoNote>
        </DemoItem>
        <DemoItem label="绑定字符串" note="可输入 YYYY-MM-DD，回车确认；无效日期恢复原值">
          <RebornDatePicker v-model="basicStringValue" value-format="YYYY-MM-DD" class="w-full" />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(basicStringValue) }}</span>
          </DemoNote>
        </DemoItem>
        <DemoItem label="自定义展示格式" note="触发器显示中文日期，绑定值仍是 YYYY-MM-DD">
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
    <DemoSection title="选择类型" class="relative z-20">
      <template #description>
        <code>type</code>
        决定面板粒度与绑定值形态；占位文本缺省时随类型切换，如「请选择月份」「请选择季度」。<code>datetime</code>
        需要在面板里调时分秒，选完日期不会立即收起。
      </template>
      <DemoBlock layout="grid" :columns="3" align="start">
        <DemoItem label="week" mono note="绑定值是这一周的 [周日, 周六]">
          <RebornDatePicker v-model="weekValue" type="week" value-format="YYYY-MM-DD" class="w-full" />
        </DemoItem>
        <DemoItem label="month" mono>
          <RebornDatePicker v-model="monthValue" type="month" value-format="YYYY-MM" class="w-full" />
        </DemoItem>
        <DemoItem label="quarter" mono note="value-format 用 Q 令牌输出 2024-Q2">
          <RebornDatePicker v-model="quarterValue" type="quarter" value-format="YYYY-[Q]Q" class="w-full" />
        </DemoItem>
        <DemoItem label="year" mono>
          <RebornDatePicker v-model="yearValue" type="year" value-format="YYYY" class="w-full" />
        </DemoItem>
        <DemoItem label="datetime" mono note="日期与时间都选定即写回，点面板外收起">
          <RebornDatePicker v-model="datetimeValue" type="datetime" value-format="YYYY-MM-DD HH:mm:ss" class="w-full" />
        </DemoItem>
        <DemoItem label="show-week-number" mono note="日期视图左侧多一列 ISO 周数">
          <RebornDatePicker v-model="weekNumberValue" value-format="YYYY-MM-DD" show-week-number class="w-full" />
        </DemoItem>
      </DemoBlock>
      <DemoNote tone="dimmed">
        当前值：week
        <code class="font-mono text-xs">{{ formatDisplay(weekValue) }}</code>，quarter
        <code class="font-mono text-xs">{{ formatDisplay(quarterValue) }}</code>，datetime
        <code class="font-mono text-xs">{{ formatDisplay(datetimeValue) }}</code>
      </DemoNote>
    </DemoSection>

    <!-- 范围选择 -->
    <DemoSection title="范围选择" class="relative z-10">
      <template #description>
        范围类型的触发器分成开始、结束两栏，起止都选定才写回绑定值；只点了开始日期就收起，这个半成品会被丢弃。<code>unlink-panels</code>
        让左右面板各自翻页，<code>single-panel</code>
        只保留一个面板。
      </template>
      <DemoBlock layout="grid" :columns="3" align="start">
        <DemoItem label="daterange" mono>
          <RebornDatePicker v-model="dateRangeValue" type="daterange" value-format="YYYY-MM-DD" class="w-full" />
        </DemoItem>
        <DemoItem label="datetimerange" mono note="format 省掉秒，两栏才放得下">
          <RebornDatePicker
            v-model="datetimeRangeValue"
            type="datetimerange"
            value-format="YYYY-MM-DD HH:mm"
            format="YYYY-MM-DD HH:mm"
            class="w-full"
          />
        </DemoItem>
        <DemoItem label="monthrange" mono note="自定义分隔符与两栏占位">
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
        <DemoItem label="unlink-panels" mono note="1 月与 6 月分列两侧，不必逐月翻到终点">
          <RebornDatePicker
            v-model="unlinkedRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            unlink-panels
            class="w-full"
          />
        </DemoItem>
        <DemoItem label="single-panel" mono note="浮层宽度减半，适合侧栏等窄区域">
          <RebornDatePicker
            v-model="singleRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            single-panel
            class="w-full"
          />
        </DemoItem>
        <DemoItem label="yearrange" mono>
          <RebornDatePicker v-model="yearRangeValue" type="yearrange" value-format="YYYY" class="w-full" />
        </DemoItem>
      </DemoBlock>
      <DemoNote tone="dimmed">
        daterange 当前值：<code class="font-mono text-xs">{{ formatDisplay(dateRangeValue) }}</code>
      </DemoNote>
    </DemoSection>

    <!-- 多选与标签折叠 -->
    <DemoSection title="多选与标签折叠" class="relative z-1">
      <template #description>
        <code>dates</code>
        /
        <code>months</code>
        /
        <code>years</code>
        /
        <code>quarters</code>
        每点一项立即写回，面板保持展开以便继续勾选。已选项以标签展示，默认逐行铺开；开启
        <code>collapse-tags</code>
        后超出
        <code>max-collapse-tags</code>
        的部分合并为 +N，触发器高度保持不变。
      </template>
      <DemoBlock layout="grid" :columns="3" align="start">
        <DemoItem label="标签换行" note="未开启折叠，触发器随标签增高">
          <RebornDatePicker v-model="multiDatesValue" type="dates" value-format="YYYY-MM-DD" class="w-full" />
        </DemoItem>
        <DemoItem label="collapse-tags" mono note="只露出第一个标签，其余合并为 +N">
          <RebornDatePicker
            v-model="multiMonthsValue"
            type="months"
            value-format="YYYY-MM"
            collapse-tags
            class="w-full"
          />
        </DemoItem>
        <DemoItem label="collapse-tags-tooltip" mono note="max-collapse-tags=2，悬停 +N 查看被折叠的日期">
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
        <code>variant</code>、<code>size</code>、<code>color</code>
        与 RebornSelect 共用同一套类名，同一表单里两者并排时高度、描边与聚焦色一致。<code>color</code>
        还会下发给面板，决定选中日期的底色。
      </template>
      <DemoBlock layout="grid" :columns="4" align="start">
        <DemoItem v-for="variant in datePickerVariants" :key="variant" :label="variant" mono>
          <RebornDatePicker v-model="variantValue" :variant="variant" value-format="YYYY-MM-DD" class="w-full" />
        </DemoItem>
      </DemoBlock>
      <DemoBlock layout="grid" :columns="3" align="start">
        <DemoItem v-for="size in datePickerSizes" :key="size" :label="size" mono>
          <RebornDatePicker v-model="sizeValue" type="dates" :size="size" value-format="YYYY-MM-DD" class="w-full" />
        </DemoItem>
      </DemoBlock>
      <DemoBlock layout="grid" :columns="4" align="start">
        <DemoItem v-for="color in datePickerColors" :key="color" :label="color" mono>
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
        <code>start</code>
        /
        <code>end</code>
        圈定整体可选区间；<code>disabled-method</code>
        逐项判定，第二个参数
        <code>unit</code>
        标明当前是日、周、月、季度还是年粒度；<code>disabled-hours</code>
        等方法只作用于带时间的类型。
      </template>
      <DemoBlock layout="grid" :columns="4" align="start">
        <DemoItem label="start + end" mono note="只能选 2024 年 4 月">
          <RebornDatePicker
            v-model="boundedValue"
            value-format="YYYY-MM-DD"
            start="2024-04-01"
            end="2024-04-30"
            class="w-full"
          />
        </DemoItem>
        <DemoItem label="禁用周末" note="只在日期粒度判定">
          <RebornDatePicker
            v-model="weekendValue"
            value-format="YYYY-MM-DD"
            :disabled-method="disableWeekend"
            class="w-full"
          />
        </DemoItem>
        <DemoItem label="按粒度禁用" note="月份只开放 3-8 月，年份禁用 2024 年以前">
          <RebornDatePicker
            v-model="unitValue"
            type="month"
            value-format="YYYY-MM"
            :disabled-method="disableByUnit"
            class="w-full"
          />
        </DemoItem>
        <DemoItem label="disabled-hours" mono note="只开放 9:00-18:00">
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
        <code>shortcuts</code>
        列出常用日期，<code>shortcut-position</code> 可设置在面板左侧或右侧，点击后直接写回并收起。<code>value</code>
        写成函数才能每次点击都按当天重新计算，范围类型的函数返回 [起点, 终点]。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="单值 · 左侧快捷选项">
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
        <DemoItem label="范围 · 右侧快捷选项">
          <RebornDatePicker
            v-model="rangeShortcutValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            :shortcuts="rangeShortcuts"
            shortcut-position="right"
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
        <code>show-today</code>
        在面板底部加一栏，点击选中当前时间所在的单位，文案随类型变为今天、本周、本月、本季度、今年；<code>datetime</code>
        显示「此刻」，时分秒取点击时的时间。今天被
        <code>start</code>
        /
        <code>end</code>
        /
        <code>disabled-method</code>
        排除时，这一栏置灰且点击无效。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="date">
          <RebornDatePicker v-model="todayDateValue" value-format="YYYY-MM-DD" show-today class="w-full" />
          <DemoNote tone="dimmed">
            <span class="font-mono text-xs">{{ formatDisplay(todayDateValue) }}</span>
          </DemoNote>
        </DemoItem>
        <DemoItem label="month">
          <RebornDatePicker v-model="todayMonthValue" type="month" value-format="YYYY-MM" show-today class="w-full" />
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
        <code>loading</code>
        把尾部图标换成转圈并隐藏清空按钮，只作用于触发器，面板照常可选；<code>disabled</code>
        后触发器置灰、点击无响应。
      </template>
      <DemoBlock layout="grid" :columns="3" align="start">
        <DemoItem label="loading" mono>
          <RebornDatePicker v-model="loadingValue" value-format="YYYY-MM-DD" loading class="w-full" />
        </DemoItem>
        <DemoItem label="disabled" mono>
          <RebornDatePicker v-model="disabledValue" value-format="YYYY-MM-DD" disabled class="w-full" />
        </DemoItem>
        <DemoItem label="范围类型禁用">
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
    <DemoSection title="页头与页脚" class="relative z-30">
      <template #description>
        <code>header</code>
        /
        <code>footer</code>
        插槽分别渲染在面板上方和下方，自带分隔线，适合放说明文字或提示。
      </template>
      <DemoBlock layout="stack">
        <DemoItem label="预约日期">
          <RebornDatePicker
            v-model="headerFooterValue"
            value-format="YYYY-MM-DD"
            :disabled-method="disableWeekend"
            class="w-full max-w-xs"
          >
            <template #header>请选择到店日期</template>
            <template #footer>
              <span class="flex items-center gap-1">
                <Icon name="lucide:info" class="size-3.5" />
                周末门店休息，不可预约
              </span>
            </template>
          </RebornDatePicker>
        </DemoItem>
      </DemoBlock>
    </DemoSection>

    <!-- 自定义单元格与导航图标 -->
    <DemoSection title="自定义单元格与导航图标" class="relative z-20">
      <template #description>
        <code>cell</code> 插槽接管每个格子的内容，作用域参数与面板的 <code>default</code> 插槽相同；<code>prev-month</code> /
        <code>next-month</code> / <code>prev-year</code> / <code>next-year</code> 替换翻页按钮里的图标。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="节假日标注" note="2024 年 4 月，清明假期标「休」，调休标「班」">
          <RebornDatePicker v-model="cellValue" value-format="YYYY-MM-DD" class="w-full">
            <template #cell="{ type, text, date, selected }">
              <DateDemoCell :type="type" :text="text" :date="date" :selected="selected" />
            </template>
          </RebornDatePicker>
        </DemoItem>
        <DemoItem label="自定义翻页图标" note="年用带竖线的箭头，月用普通箭头">
          <RebornDatePicker v-model="navIconValue" type="daterange" value-format="YYYY-MM-DD" class="w-full">
            <template #prev-year>
              <Icon name="lucide:arrow-left-to-line" class="size-4" />
            </template>
            <template #prev-month>
              <Icon name="lucide:arrow-left" class="size-4" />
            </template>
            <template #next-month>
              <Icon name="lucide:arrow-right" class="size-4" />
            </template>
            <template #next-year>
              <Icon name="lucide:arrow-right-to-line" class="size-4" />
            </template>
          </RebornDatePicker>
        </DemoItem>
      </DemoBlock>
      <DemoNote tone="dimmed">
        日、月、季度、年四种视图共用 cell 插槽，必须按 type
        分支并补回默认文案，否则切到月视图会只剩数字；选中格的角标不写颜色，跟随选中文字色，避免与选中底色撞色。翻页插槽替换的是默认图标，尺寸需要自己给。
      </DemoNote>
    </DemoSection>

    <!-- 自定义触发器 -->
    <DemoSection title="自定义触发器" class="relative z-10">
      <template #description>
        <code>default</code>
        插槽只替换触发器的文本区，尾部箭头与清空按钮保留；<code>cover</code>
        插槽连同尾部图标区一起接管。两者的作用域参数都有
        <code>displayText</code>、<code>placeholder</code>、<code>isOpen</code>
        和
        <code>ui</code>，其中
        <code>ui</code>
        可复用组件内置的类名。
      </template>
      <DemoBlock layout="grid" :columns="2" align="start">
        <DemoItem label="default 插槽" mono note="前置图标 + 复用 ui.triggerText()">
          <RebornDatePicker v-model="slotTriggerValue" type="daterange" value-format="YYYY-MM-DD" class="w-full">
            <template #default="{ displayText, placeholder, ui }">
              <span class="flex min-w-0 flex-1 items-center gap-2">
                <Icon name="lucide:plane" class="text-primary size-4 shrink-0" />
                <span :class="displayText ? ui.triggerText() : ui.placeholder()">{{ displayText || placeholder }}</span>
              </span>
            </template>
          </RebornDatePicker>
        </DemoItem>
        <DemoItem label="cover 插槽" mono note="整块替换为渐变卡片">
          <RebornDatePicker
            v-model="coverValue"
            value-format="YYYY-MM-DD"
            :trigger-ui="{ trigger: 'h-auto p-0 border-none bg-transparent' }"
            class="w-full"
          >
            <template #cover="{ displayText, placeholder, isOpen }">
              <div
                class="flex w-full cursor-pointer items-center gap-3 rounded-2xl bg-linear-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5 text-white transition-all active:scale-[0.98]"
              >
                <Icon name="lucide:calendar-heart" class="size-5 shrink-0" />
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
    <DemoSection title="事件" class="relative z-1">
      <template #description>
        除 RebornSelect 已有的 <code>change</code>、<code>clear</code>、<code>remove-tag</code>、<code>visible-change</code>
        外，还转发面板的 <code>calendar-change</code>（仅范围类型）与 <code>panel-change</code>。通过实例调用
        <code>clear()</code> 与点清空按钮效果相同。
      </template>
      <!-- 两个选择器、调用按钮与事件日志由子组件维护 -->
      <RebornDatePickerEventsDemo />
      <DemoNote tone="dimmed">
        范围类型点下起点就会抛 calendar-change，此时终点为 null；change 要等起止都选定才抛，紧接着是 visible-change
        false。多选类型每勾一项都抛 change，面板不收起。
      </DemoNote>
    </DemoSection>

    <!-- 与表单联动 -->
    <DemoSection title="与表单联动">
      <template #description>
        放进 RebornFormItem 后，选中值会触发 change 校验，收起面板会触发 blur 校验，出错时触发器描边变红；表单的
        <code>size</code> 与 <code>disabled</code> 同样会下发。
      </template>
      <!-- 表单、校验规则与提交结果由子组件维护 -->
      <RebornDatePickerFormDemo />
    </DemoSection>

    <!-- 自定义样式 -->
    <DemoSection title="自定义样式">
      <template #description>
        样式分三条通道：<code>trigger-ui</code>
        覆盖触发器盒子（含范围两栏与分隔符），<code>panel-ui</code>
        原样透传给日期面板，<code>ui</code>
        覆盖浮层页头页脚与多选标签。
      </template>
      <DemoBlock layout="grid" :columns="3" align="start">
        <DemoItem label="trigger-ui" mono note="虚线大圆角，分隔符改为主题色">
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
        <DemoItem label="panel-ui" mono note="首尾正圆、区间浅绿">
          <RebornDatePicker
            v-model="customPanelValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            :panel-ui="customRangeUi"
            class="w-full"
          />
        </DemoItem>
        <DemoItem label="ui" mono note="标签改为主题色浅底，页头加粗">
          <RebornDatePicker
            v-model="customTagValue"
            type="dates"
            value-format="YYYY-MM-DD"
            :ui="{ tag: 'border-primary/30 bg-primary/10 text-primary', dropdownHeader: 'font-medium text-gray-9' }"
            class="w-full"
          >
            <template #header>可多选，已选 {{ customTagValue.length }} 天</template>
          </RebornDatePicker>
        </DemoItem>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
