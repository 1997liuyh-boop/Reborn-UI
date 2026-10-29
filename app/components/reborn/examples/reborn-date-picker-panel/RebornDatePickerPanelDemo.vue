<script setup lang="ts">
/**
 * 日期面板演示。文档站与知识库按本文件的文本抽取章节：Playground 的 title 与每个 DemoSection 的
 * title、描述都写在这里（字面量）；状态较多的章节只把卡片内容拆进同目录的子组件。
 */
import type { DatePickerPanelPlaygroundConfig } from "./RebornDatePickerPanelPlaygroundDemo.vue";
import type { DatePickerType } from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, ref, shallowRef, watch } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import {
  datePickerActiveTypes,
  datePickerPanelColors,
  datePickerPanelSizes,
  datePickerTypes,
} from "~/components/reborn/ui/reborn-date-picker-panel/reborn-date-picker-panel.config";
import RebornDatePickerPanel from "~/components/reborn/ui/reborn-date-picker-panel/RebornDatePickerPanel.vue";
import {
  arrayValueTypes,
  disableByUnit,
  disableWeekend,
  formatPanelDisplay,
  rangeShortcuts,
  singleShortcuts,
  valueFormatOf,
} from "../_shared/date-demo-utils";
import DateDemoCell from "../_shared/DateDemoCell.vue";
import RebornDatePickerPanelEventsDemo from "./RebornDatePickerPanelEventsDemo.vue";
import RebornDatePickerPanelPlaygroundDemo from "./RebornDatePickerPanelPlaygroundDemo.vue";

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场里同时作用于其余章节的配色与尺寸 */
type PanelAppearance = Pick<DatePickerPanelPlaygroundConfig, "color" | "size">;

/** 演练场的其余参数：面板业务值 pickerValue 与行为、样式配置使用明确的独立字段 */
interface PlaygroundState extends Omit<DatePickerPanelPlaygroundConfig, "color" | "size"> {
  pickerValue: string | string[];
}

/** 配色与尺寸的默认值；appearance 只会被整体替换，可以直接复用这个对象 */
const defaultAppearance: PanelAppearance = { color: "primary", size: "md" };

/**
 * 演练场的配色与尺寸：其余章节共用，所以单独成一份，不放进 state。
 * 文档卡片按依赖抽取源码时，引用它的章节只会带上这两个值，不会拖进整套演练场配置。
 */
const appearance = shallowRef<PanelAppearance>(defaultAppearance);

/** 演练场其余参数的默认值 */
const defaultState: PlaygroundState = {
  pickerValue: "2024-04-03",
  type: "date",
  activeType: "fill",
  width: "auto",
  disabled: false,
  border: true,
  shortcuts: true,
  showWeekNumber: false,
  unlinkPanels: false,
  singlePanel: false,
  showToday: false,
  highlightToday: false,
};

/** 演练场其余参数：控制面板整体替换对象，绑定值由预览区经 v-model:value 写回 */
const state = ref<PlaygroundState>({ ...defaultState });

/** Playground 控制面板读写的完整模型：读取时合并两份状态，写入时配色与尺寸进 appearance，其余进 state */
const playgroundModel = computed<PlaygroundState & PanelAppearance>({
  get: () => ({ ...state.value, ...appearance.value }),
  set: ({ color, size, ...rest }) => {
    // 只在配色或尺寸真的变化时替换，避免调其他参数时其余章节跟着重渲染
    if (color !== appearance.value.color || size !== appearance.value.size) appearance.value = { color, size };
    state.value = rest;
  },
});

/** 预览区的重建标记：重置配置或切换类型后预览区重新挂载，它持有的事件回显随之清空 */
const previewKey = shallowRef(0);

/** 重置演练场配置，事件回显一并清空 */
function resetState() {
  state.value = { ...defaultState };
  appearance.value = defaultAppearance;
  previewKey.value++;
}

/** 不同类型对应的取值精度不同，格式需要随之切换 */
const valueFormat = computed(() => valueFormatOf(state.value.type));

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
      { label: "显示快捷选项", key: "shortcuts", component: "checkbox" as const, defaultValue: true },
      { label: "底部显示「今天」栏", key: "showToday", component: "checkbox" as const, defaultValue: false },
      { label: "高亮今天（默认关闭）", key: "highlightToday", component: "checkbox" as const, defaultValue: false },
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
  const s = playgroundModel.value;
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
    `:highlight-today="${s.highlightToday}"`,
  ];

  return `<RebornDatePickerPanel\n  ${props.join("\n  ")}\n/>`;
});

/**
 * 切换类型时重置绑定值：单值与数组形态不同，取值精度也不同，沿用旧值会被按新格式误读；
 * 旧类型的事件回显也不再有参考价值，预览区随之重建。
 * 重置配置回到默认类型时保留默认值，否则刚恢复的示例值会被立刻清掉。
 */
watch(
  () => state.value.type,
  (newType: DatePickerType) => {
    if (newType === defaultState.type && state.value.pickerValue === defaultState.pickerValue) return;
    state.value.pickerValue = arrayValueTypes.includes(newType) ? [] : "";
    previewKey.value++;
  },
);

// ─── 场景演示状态 ───────────────────────────────────────────────

const basicDateValue = shallowRef<Date | "">("");

const basicStringValue = shallowRef("2024-04-03");

const quarterValue = shallowRef("2024-Q2");

const typeRangeValue = shallowRef(["2024-04-01", "2024-04-05"]);

const linkedRangeValue = shallowRef(["2024-04-22", "2024-05-06"]);

const unlinkedRangeValue = shallowRef(["2024-01-15", "2024-06-10"]);

const singleRangeValue = shallowRef(["2024-04-08", "2024-04-12"]);

const weekNumberValue = shallowRef("2024-04-03");

const disabledPanelValue = shallowRef("2024-04-10");

const weekendValue = shallowRef("");

const boundedValue = shallowRef(["2024-04-10", "2024-04-12"]);

const unitValue = shallowRef("");

const singleShortcutValue = shallowRef("");

/** 范围类型的快捷项返回长度为 2 的数组，依次是起点与终点 */
const rangeShortcutValue = shallowRef<string[]>([]);

const todayDateValue = shallowRef("");

const todayMonthValue = shallowRef("");

const activeTypeShowcases = ref(
  datePickerActiveTypes.map((value) => ({
    value,
    label: { fill: "背景", fillRound: "背景正圆", outline: "描边加文字", text: "仅文字" }[value],
    model: ["2024-04-07", "2024-04-13"] as string[],
  })),
);

const customActiveValue = shallowRef("2024-04-11");

/** ui.dayActive 会并进日期格节点，冲突的类名由 tailwind-merge 裁决，所以写全即可覆盖 */
const customActiveUi = {
  dayActive: "bg-gray-10 text-gray-1 rounded-full font-medium hover:bg-gray-10",
  dayToday: "text-gray-10 underline underline-offset-4",
};

const rangeStyleValue = shallowRef(["2024-04-09", "2024-04-18"]);

/** 首尾用 dayActive，中间项用 dayInRange；两者都要把 hover 写上，否则悬停会被灰底盖掉 */
const customRangeUi = {
  dayActive: "bg-success text-gray-1 rounded-full hover:bg-success",
  dayInRange: "bg-green-1 text-success rounded-none hover:bg-green-1",
};

const dashedRangeValue = shallowRef(["2024-04-09", "2024-04-18"]);

const dashedRangeUi = {
  dayActive: "border border-dashed border-warning bg-transparent text-warning rounded-[4px]",
  dayInRange: "bg-orange-1 text-gray-9 rounded-[4px] hover:bg-orange-1",
};

/** 节假日示例：停在 2024 年 4 月，清明假期就在眼前 */
const cellValue = shallowRef("2024-04-03");

const navIconValue = shallowRef("2024-04-03");
</script>

<template>
  <div class="flex w-full min-w-0 flex-col">
    <Playground
      v-model="playgroundModel"
      :controls="controls"
      :code="panelCode"
      component-name="RebornDatePickerPanel"
      title="交互演练场"
      description="调节上方参数，实时查看面板在各类型下的表现与绑定值。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <!-- 预览区：面板、绑定值与最近事件回显 -->
      <RebornDatePickerPanelPlaygroundDemo
        :key="previewKey"
        v-model:value="state.pickerValue"
        :config="playgroundModel"
        :value-format="valueFormat"
      />
    </Playground>

    <DemoSection title="基础用法">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            不传
            <code>value-format</code>：绑定值是
            <code>Date</code>
          </span>
          <RebornDatePickerPanel v-model="basicDateValue" border />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(basicDateValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>value-format="YYYY-MM-DD"</code>：绑定值是字符串
          </span>
          <RebornDatePickerPanel v-model="basicStringValue" value-format="YYYY-MM-DD" border />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(basicStringValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="选择类型">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>type="quarter"</code>
            ·
            <code>value-format="YYYY-[Q]Q"</code>
          </span>
          <RebornDatePickerPanel
            v-model="quarterValue"
            type="quarter"
            value-format="YYYY-[Q]Q"
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(quarterValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>type="daterange"</code>
            ·
            <code>value-format="YYYY-MM-DD"</code>
          </span>
          <RebornDatePickerPanel
            v-model="typeRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(typeRangeValue) }}</code>
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
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(linkedRangeValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>unlink-panels</code>：左右各自翻页
          </span>
          <RebornDatePickerPanel
            v-model="unlinkedRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            unlink-panels
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(unlinkedRangeValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>single-panel</code>：只渲染一个面板
          </span>
          <RebornDatePickerPanel
            v-model="singleRangeValue"
            type="daterange"
            value-format="YYYY-MM-DD"
            single-panel
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(singleRangeValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>

      <DemoNote>
        取消联动后左侧必须早于右侧：两侧已相邻时，左侧的「下一页」与右侧的「上一页」置灰不响应，以免两个面板显示同一个月、区间无从落点。
      </DemoNote>
    </DemoSection>

    <DemoSection title="周数">
      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <RebornDatePickerPanel
            v-model="weekNumberValue"
            value-format="YYYY-MM-DD"
            show-week-number
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(weekNumberValue) }}</code>
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
          <span class="text-dimmed text-xs font-medium">
            <code>disabled</code>
            整个面板禁用
          </span>
          <RebornDatePickerPanel
            v-model="disabledPanelValue"
            disabled
            value-format="YYYY-MM-DD"
            :color="appearance.color"
            :size="appearance.size"
            border
          />
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>disabled-method</code>
            周末不可选
          </span>
          <RebornDatePickerPanel
            v-model="weekendValue"
            :disabled-method="disableWeekend"
            value-format="YYYY-MM-DD"
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(weekendValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>start="2024-04-08"</code>
            ·
            <code>end="2024-04-24"</code>
            划定可选边界
          </span>
          <RebornDatePickerPanel
            v-model="boundedValue"
            type="daterange"
            start="2024-04-08"
            end="2024-04-24"
            value-format="YYYY-MM-DD"
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(boundedValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>disabled-method</code>
            按粒度限制：月份只开放 3-8 月，年份禁用 2024 以前
          </span>
          <RebornDatePickerPanel
            v-model="unitValue"
            type="month"
            :disabled-method="disableByUnit"
            value-format="YYYY-MM"
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            点标题切到年视图可看到年粒度规则同时生效。绑定值：<code>{{ formatPanelDisplay(unitValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>

      <DemoNote>
        <code>disabled-method</code>
        在年 / 月 / 季度视图也会被调用，传入的是该项首日。只想约束日期时要判断
        <code>unit === "date"</code>，否则 1 号恰逢周末的月份会在月视图里一起被禁。
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
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(singleShortcutValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">范围：最近 7 天 / 最近 30 天 / 本月</span>
          <RebornDatePickerPanel
            v-model="rangeShortcutValue"
            type="daterange"
            :shortcuts="rangeShortcuts"
            value-format="YYYY-MM-DD"
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(rangeShortcutValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>

      <DemoNote>
        「相对今天」的快捷项必须把
        <code>value</code>
        写成函数：直接写日期会固定在组件创建的那一刻，页面跨过零点后「今天」仍指向前一天。
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
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(todayDateValue) }}</code>
          </DemoNote>
        </div>

        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">month：文案变为「本月」，选中当前月份</span>
          <RebornDatePickerPanel
            v-model="todayMonthValue"
            type="month"
            value-format="YYYY-MM"
            show-today
            :color="appearance.color"
            :size="appearance.size"
            border
          />
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(todayMonthValue) }}</code>
          </DemoNote>
        </div>
      </DemoBlock>

      <DemoNote>
        文字颜色跟随
        <code>color</code>。当前时间所在的单位被
        <code>start</code>
        /
        <code>end</code>
        /
        <code>disabled-method</code>
        排除，或面板整体
        <code>disabled</code>
        时，这一栏置灰且点击无效。
      </DemoNote>
    </DemoSection>

    <DemoSection title="选中样式">
      <DemoBlock layout="grid" :columns="2">
        <div v-for="at in activeTypeShowcases" :key="at.value" class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            {{ at.label }} ·
            <code>{{ at.value }}</code>
          </span>
          <RebornDatePickerPanel
            v-model="at.model"
            type="week"
            :active-type="at.value"
            value-format="YYYY-MM-DD"
            :color="appearance.color"
            :size="appearance.size"
            border
          />
        </div>
      </DemoBlock>

      <DemoBlock layout="stack">
        <div class="flex min-w-0 flex-col gap-3">
          <span class="text-dimmed text-xs font-medium">
            <code>ui.dayActive</code>
            自定义：黑底正圆，今日改为下划线
          </span>
          <RebornDatePickerPanel
            v-model="customActiveValue"
            :ui="customActiveUi"
            value-format="YYYY-MM-DD"
            :size="appearance.size"
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
            :size="appearance.size"
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
            :size="appearance.size"
            border
          />
        </div>
      </DemoBlock>

      <DemoNote>
        自定义时记得把
        <code>hover:</code>
        一并写上：日期格基类带着
        <code>hover:bg-gray-2</code>，不覆盖回来的话鼠标停上去选中格会变灰。范围首尾取
        <code>ui.dayActive</code>、中间项取
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
            :color="appearance.color"
            :size="appearance.size"
            border
          >
            <template #default="{ type, text, date, selected }">
              <DateDemoCell :type="type" :text="text" :date="date" :selected="selected" />
            </template>
          </RebornDatePickerPanel>
          <DemoNote tone="dimmed">
            绑定值：<code>{{ formatPanelDisplay(cellValue) }}</code>
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
          :color="appearance.color"
          :size="appearance.size"
          border
        >
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
        </RebornDatePickerPanel>
      </DemoBlock>

      <DemoNote>
        插槽内容替换的是默认图标，不会套用
        <code>ui.icon</code>
        的尺寸，需要自己给出大小；年 / 月 / 季度视图只用
        <code>prev-year</code>
        /
        <code>next-year</code>，这两个插槽在所有视图里都会生效。
      </DemoNote>
    </DemoSection>

    <DemoSection title="事件">
      <!-- 面板、调用按钮与事件日志由子组件维护，配色与尺寸跟随演练场 -->
      <RebornDatePickerPanelEventsDemo :color="appearance.color" :size="appearance.size" />

      <DemoNote>
        点下起点就会抛 <code>calendar-change</code>，此时终点为 <code>null</code>；<code>change</code>
        要等起止都选定才抛。依赖完整区间的逻辑监听 <code>change</code>，想在选完起点时给提示才用
        <code>calendar-change</code>。
      </DemoNote>
    </DemoSection>
  </div>
</template>
