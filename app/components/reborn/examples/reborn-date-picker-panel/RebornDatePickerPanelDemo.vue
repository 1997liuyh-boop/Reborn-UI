<script setup lang="ts">
import type { DatePickerType } from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import {
  datePickerActiveTypes,
  datePickerPanelColors,
  datePickerPanelSizes,
  datePickerTypes,
} from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";

// ─── 交互演练场 ─────────────────────────────────────────────────

const state = ref<Record<string, any>>({
  value: "2024-04-03" as string | string[],
  type: "date" as DatePickerType,
  color: "primary",
  activeType: "fill",
  width: "auto",
  size: "md",
  disabled: false,
  border: true,
  shortcuts: true,
});

/** 多选与范围类型的绑定值是数组，切换类型时需要重置以免类型错位 */
watch(
  () => state.value.type,
  (newType: DatePickerType) => {
    const isMultiple = [
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
    ].includes(newType);

    state.value.value = isMultiple ? [] : "";
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
const controls = [
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
      {
        label: "显示快捷选项",
        key: "shortcuts",
        component: "checkbox" as const,
        defaultValue: true,
      },
      { label: "禁用状态", key: "disabled", component: "checkbox" as const, defaultValue: false },
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

/** 演练场右上角展示的等价代码 */
const panelCode = computed(() => {
  const s = state.value;
  const props: string[] = ['v-model="value"', `type="${s.type}"`];

  if (s.color !== "primary") props.push(`color="${s.color}"`);
  if (s.size !== "md") props.push(`size="${s.size}"`);
  if (s.activeType !== "fill") props.push(`active-type="${s.activeType}"`);
  if (s.width !== "auto") props.push(`width="${s.width}"`);
  if (!s.border) props.push(':border="false"');
  if (s.disabled) props.push("disabled");
  if (s.shortcuts) props.push(':shortcuts="shortcuts"');
  props.push(`value-format="${valueFormat.value}"`);

  return `<RebornDatePickerPanel\n  ${props.join("\n  ")}\n/>`;
});

/** 快捷选项：value 可以是日期，也可以是返回日期的函数 */
const globalShortcuts = [
  { text: "今天", value: new Date() },
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

/** 把绑定值格式化为可读文本 */
function formatDisplay(val: string | string[]) {
  if (Array.isArray(val)) return val.length ? `[${val.join(", ")}]` : "空数组";

  return val || "未选择";
}

// ─── 宽度模式 ───────────────────────────────────────────────────

/** 两块放在同宽的父容器里对比 */
const widthDemoValue = ref("2024-04-03");

// ─── 自定义快捷按钮 ─────────────────────────────────────────────

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

// ─── 禁用与部分日期禁用 ─────────────────────────────────────────

const disabledPanelValue = ref("2024-04-10");
const weekendValue = ref("");
const boundedValue = ref("");

/** 周末不可选：disabledDate 返回 true 即禁用该天 */
function disableWeekend(date: Date) {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/** 只允许选未来 14 天内的工作日：可以把多条规则写在一个函数里 */
function disablePast(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const max = new Date(today);
  max.setDate(max.getDate() + 14);
  return date < today || date > max;
}

// ─── 自定义选中样式 ─────────────────────────────────────────────

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

// ─── 区间样式自定义 ─────────────────────────────────────────────

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
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="state"
      :controls="controls"
      :code="panelCode"
      component-name="RebornDatePickerPanel"
      title="交互演练场"
      description="type 决定面板的选择粒度与绑定值形态：单选返回字符串，多选与范围返回数组；value-format 随类型自动切换。"
    >
      <div class="flex w-full flex-col items-center gap-4">
        <RebornDatePickerPanel
          v-model="state.value"
          :type="state.type"
          :color="state.color"
          :active-type="state.activeType"
          :width="state.width"
          :size="state.size"
          :disabled="state.disabled"
          :border="state.border"
          :shortcuts="state.shortcuts ? globalShortcuts : []"
          :value-format="valueFormat"
        />

        <DemoNote tone="dimmed">
          当前绑定值：<code class="break-all">{{ formatDisplay(state.value) }}</code>
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="宽度模式">
      <template #description>
        默认 <code>width="auto"</code>，面板由内部元素撑开——各视图的网格共用同一套最小宽度， 切换年
        / 月 / 季度视图时宽度不会跳动；<code>width="full"</code> 占满父容器，
        适合嵌在定宽卡片里。下面两块的父容器同宽，差别只在这个属性。
      </template>
      <DemoBlock layout="stack">
        <div
          v-for="w in ['auto', 'full'] as const"
          :key="w"
          class="flex w-full min-w-0 flex-col gap-3"
        >
          <span class="text-dimmed text-xs font-medium">
            <code>width="{{ w }}"</code>
          </span>
          <div class="border-gray-3 w-full rounded-sm border border-dashed p-2">
            <RebornDatePickerPanel
              v-model="widthDemoValue"
              type="date"
              :width="w"
              :color="state.color"
              :size="state.size"
            />
          </div>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义快捷按钮">
      <template #description>
        <code>shortcuts</code> 传 <code>{ text, value }</code> 数组即在左侧长出一列快捷按钮。
        <code>value</code>
        可以是一个日期，也可以是返回日期的函数——需要「相对今天」的快捷项就写成函数，
        否则日期会固定在组件创建的那一刻。范围类型的 <code>value</code> 返回长度为 2 的数组。
      </template>
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">单选：今天 / 昨天 / 一周前 / 本月 1 号</span>
          <RebornDatePickerPanel
            v-model="singleShortcutValue"
            type="date"
            :shortcuts="singleShortcuts"
            :color="state.color"
            :size="state.size"
            value-format="YYYY-MM-DD"
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
            :color="state.color"
            :size="state.size"
            value-format="YYYY-MM-DD"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(rangeShortcutValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="禁用与部分日期禁用">
      <template #description>
        <code>disabled</code> 让整个面板置灰且不可交互；<code>disabled-date</code> 逐日判定，返回
        <code>true</code> 即该天不可选；<code>start</code> /
        <code>end</code> 则直接划定可选边界。三者可以叠加，被排除的日期一律取
        <code>dayDisabled</code> 样式并屏蔽点击。
      </template>
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>disabled</code> 整个面板禁用</span>
          <RebornDatePickerPanel
            v-model="disabledPanelValue"
            type="date"
            disabled
            :color="state.color"
            :size="state.size"
            value-format="YYYY-MM-DD"
            border
          />
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium"><code>disabled-date</code> 周末不可选</span>
          <RebornDatePickerPanel
            v-model="weekendValue"
            type="date"
            :disabled-date="disableWeekend"
            :color="state.color"
            :size="state.size"
            value-format="YYYY-MM-DD"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(weekendValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>disabled-date</code> 只开放今天起 14 天
          </span>
          <RebornDatePickerPanel
            v-model="boundedValue"
            type="daterange"
            :disabled-date="disablePast"
            :color="state.color"
            :size="state.size"
            value-format="YYYY-MM-DD"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(boundedValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="自定义选中样式">
      <template #description>
        先用 <code>active-type</code> 在四种内置表现里挑：<code>fill</code> 背景填色、
        <code>fillRound</code> 背景填色且为正圆、<code>outline</code> 描边加文字、<code>text</code>
        仅文字变色。下面用 <code>week</code> 演示，好看清范围里的表现：中间项的底色逐格相接、
        连成一条不断的带子，只有首尾两端按激活类型收圆角。还不够就用 <code>ui.dayActive</code>
        直接写类名，它会并进日期格节点，冲突的类名交给 tailwind-merge 裁决，写全即可覆盖默认值。
      </template>
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
            :color="state.color"
            :size="state.size"
            value-format="YYYY-MM-DD"
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
            type="date"
            :ui="customActiveUi"
            :size="state.size"
            value-format="YYYY-MM-DD"
            border
          />
        </div>
      </DemoBlock>

      <DemoNote tone="dimmed">
        自定义时记得把 <code>hover:</code> 一并写上：日期格基类带着
        <code>hover:bg-gray-2</code>，不覆盖回来的话鼠标停上去选中格会变灰。
      </DemoNote>
    </DemoSection>

    <DemoSection title="区间样式自定义">
      <template #description>
        范围类型下，首尾两端取 <code>ui.dayActive</code>，中间项取 <code>ui.dayInRange</code>。
        底色画在日期格外面的格位（<code>ui.dayCell</code>）上，宽度撑满所在列，相邻两列因此首尾相接、
        连成一条不断的带子；两端的圆角由 <code>ui.dayRangeStart</code> /
        <code>ui.dayRangeEnd</code> 收口。
      </template>
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">两端正圆实心，中间连成整条</span>
          <RebornDatePickerPanel
            v-model="rangeStyleValue"
            type="daterange"
            :ui="customRangeUi"
            :size="state.size"
            value-format="YYYY-MM-DD"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatDisplay(rangeStyleValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">两端虚线描边，中间浅底</span>
          <RebornDatePickerPanel
            v-model="dashedRangeValue"
            type="daterange"
            :ui="dashedRangeUi"
            :size="state.size"
            value-format="YYYY-MM-DD"
            border
          />
        </div>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
