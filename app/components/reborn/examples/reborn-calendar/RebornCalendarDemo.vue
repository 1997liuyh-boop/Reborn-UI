<script setup lang="ts">
import type { CalendarDateType, CalendarEvent, CalendarMode } from "~/components/reborn/ui/reborn-calendar";
import { DemoBlock, DemoNote, DemoSection, Icon, Playground } from "#components";
import { computed, ref, shallowRef, useTemplateRef } from "vue";
import RebornButton from "~/components/reborn/ui/reborn-button/RebornButton.vue";
import { calendarColors, calendarControllerTypes, calendarModes, calendarTitleAligns } from "~/components/reborn/ui/reborn-calendar/reborn-calendar.config";
import RebornCalendar from "~/components/reborn/ui/reborn-calendar/RebornCalendar.vue";
import RebornCheckbox from "~/components/reborn/ui/reborn-checkbox/RebornCheckbox.vue";
import RebornRadioGroup from "~/components/reborn/ui/reborn-radio/RebornRadioGroup.vue";
import RebornCalendarEventsDemo from "./RebornCalendarEventsDemo.vue";

const colorOptions = calendarColors.map((c) => ({ label: c.charAt(0).toUpperCase() + c.slice(1), value: c }));
const controllerOptions = calendarControllerTypes.map((t) => ({
  label: t === "select" ? "年月下拉 select" : "翻页按钮 button",
  value: t,
}));
const modeOptions = calendarModes.map((m) => ({ label: m === "month" ? "月视图 month" : "年视图 year", value: m }));
const ALIGN_LABELS = { left: "靠左 left", center: "居中 center", right: "靠右 right" } as const;
const alignOptions = calendarTitleAligns.map((a) => ({ label: ALIGN_LABELS[a], value: a }));

/** 演示数据都落在本月，任何时候打开都能看到事项 */
const now = new Date();
/** 本月第 day 天 */
const day = (d: number) => new Date(now.getFullYear(), now.getMonth(), d);
/** 格式化成 M月D日，用于事件回显；设置了 valueFormat 的绑定值是字符串，原样显示 */
const label = (date?: Date | string) =>
  typeof date === "string" ? date : date ? `${date.getMonth() + 1}月${date.getDate()}日` : "未选择";

/** 一组覆盖单条、多条、超过三条（滚动）与自定义圆点色的事项 */
const sampleEvents: CalendarEvent[] = [
  { date: day(3), title: "需求评审" },
  { date: day(8), title: "版本发布", color: "success" },
  { date: day(8), title: "发布复盘会" },
  { date: day(12), title: "季度预算提交截止", color: "warning" },
  { date: day(16), title: "设计走查" },
  { date: day(16), title: "前端联调" },
  { date: day(16), title: "接口冒烟测试", color: "info" },
  { date: day(16), title: "线上故障演练", color: "error" },
  { date: day(16), title: "周报汇总" },
  { date: day(22), title: "客户回访", color: "secondary" },
  { date: day(27), title: "团队分享：日历组件的周首计算" },
];

// ─── 交互演练场 ─────────────────────────────────────────────────

/** 演练场默认状态，与组件默认值一致 */
const defaultState: Record<string, any> = {
  controllerType: "select",
  color: "primary",
  mode: "month",
  titleAlign: "right",
  border: false,
  highlightToday: false,
  lunar: false,
};

const state = ref<Record<string, any>>({ ...defaultState });
const playgroundValue = shallowRef<Date | string>();
/** 最近一次事件的回显 */
const lastEvent = shallowRef("尚未触发");

function onPanelChange(date: Date, mode: CalendarMode) {
  lastEvent.value = `panel-change：${date.getFullYear()} 年 ${date.getMonth() + 1} 月，${mode}`;
}

/** 重置演练场配置 */
function resetState() {
  state.value = { ...defaultState };
  playgroundValue.value = undefined;
  lastEvent.value = "尚未触发";
}

/** 演练场控制面板配置 */
const controls: any = [
  {
    title: "基础属性",
    children: [
      {
        label: "工具栏控制器",
        key: "controllerType",
        component: "select" as const,
        defaultValue: "select",
        props: { options: controllerOptions },
      },
      {
        label: "语义色",
        key: "color",
        component: "select" as const,
        defaultValue: "primary",
        props: { options: colorOptions },
      },
      {
        label: "视图模式（v-model:mode）",
        key: "mode",
        component: "select" as const,
        defaultValue: "month",
        props: { options: modeOptions },
      },
      {
        label: "标题对齐",
        key: "titleAlign",
        component: "select" as const,
        defaultValue: "right",
        props: { options: alignOptions },
      },
    ],
  },
  {
    title: "外观",
    children: [
      { label: "边框模式（border）", key: "border", component: "checkbox" as const, defaultValue: false },
      { label: "高亮本日 / 本月（highlightToday）", key: "highlightToday", component: "checkbox" as const, defaultValue: false },
      { label: "农历模式（lunar）", key: "lunar", component: "checkbox" as const, defaultValue: false },
    ],
  },
];

/** 演练场右上角展示的等价代码：完整列出当前全部参数 */
const calendarCode = computed(() => {
  const s = state.value;
  return [
    "<RebornCalendar",
    '  v-model="value"',
    '  v-model:mode="mode"',
    '  :events="events"',
    `  controller-type="${s.controllerType}"`,
    `  color="${s.color}"`,
    `  title-align="${s.titleAlign}"`,
    `  :border="${s.border}"`,
    `  :highlight-today="${s.highlightToday}"`,
    `  :lunar="${s.lunar}"`,
    '  @panel-change="onPanelChange"',
    "/>",
  ].join("\n");
});

// ─── 场景演示状态 ───────────────────────────────────────────────

const basicValue = shallowRef<Date | string>();

/** 事项与语义色：切换日历的 color，事项自带的 color 只影响圆点 */
const eventColor = shallowRef<(typeof calendarColors)[number]>("primary");

/** 标题对齐与边框：同一个日历切换两种外观 */
const alignValue = shallowRef<(typeof calendarTitleAligns)[number]>("right");
const bordered = shallowRef(true);

/** 农历模式：当月节日、节气照常显示，事项与农历并存 */
const lunarValue = shallowRef<Date | string>();

/** 年视图 */
const yearValue = shallowRef<Date | string>();
const yearMode = shallowRef<CalendarMode>("year");

/** 工具栏控制器：翻页按钮 + 自定义下拉文案 */
const buttonValue = shallowRef<Date | string>();
const formatterValue = shallowRef<Date | string>();
/** 年份显示为「2026」，月份显示为英文缩写 */
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function formatter(value: number, type: "year" | "month") {
  return type === "year" ? value : MONTH_ABBR[value - 1]!;
}

/** 日期区间：本月 10 日所在周到 23 日所在周 */
const rangeValue = shallowRef<Date | string>();
const range: [Date, Date] = [day(10), day(23)];

/** 时区与绑定值格式：v-model 收发 YYYY-MM-DD 字符串，「今天」与带时区的事项按纽约时间落日 */
const zonedValue = shallowRef<string>();
/** 同一时刻：北京时间 9 日 8 点，纽约还是 8 日晚上 */
const zonedEvents: CalendarEvent[] = [
  { date: new Date(Date.UTC(now.getFullYear(), now.getMonth(), 9, 0)), title: "北京 9 日 8:00 的会" },
  { date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-15`, title: "不带时区的日期" },
];

/** 自定义日期格 */
const cellValue = shallowRef<Date | string>();
/** 用「周末」与「月初」两个标记示范 data 参数 */
function cellBadge(date: Date, type: string) {
  if (type !== "current-month") return "";
  if (date.getDate() === 1) return "月初";
  return date.getDay() === 0 || date.getDay() === 6 ? "周末" : "";
}

/** 自定义工具栏 */
const headerValue = shallowRef<Date | string>();

/** 实例方法 */
const exposeValue = shallowRef<Date | string>();
const calendarRef = useTemplateRef<InstanceType<typeof RebornCalendar>>("calendarRef");
const jumpTargets: { label: string; type: CalendarDateType }[] = [
  { label: "上一年", type: "prev-year" },
  { label: "上个月", type: "prev-month" },
  { label: "今天", type: "today" },
  { label: "下个月", type: "next-month" },
  { label: "下一年", type: "next-year" },
];
</script>

<template>
  <div class="flex w-full flex-col">
    <!-- 日历需要整行宽度：控制面板放到上方，预览区占满 -->
    <Playground
      v-model="state"
      :controls="controls"
      :code="calendarCode"
      component-name="RebornCalendar"
      title="交互演练场"
      description="调节参数，查看日历在不同控制器、语义色、对齐、边框与农历模式下的表现。"
    >
      <template #tag>
        <RebornButton size="sm" variant="soft" color="neutral" @click="resetState">
          <template #leading>
            <Icon name="lucide:rotate-ccw" size="12" />
          </template>
          重置配置
        </RebornButton>
      </template>

      <!-- pt-10 让出预览区右上角的「传参明细」按钮，避免压住「今天」 -->
      <div class="flex w-full flex-col gap-4 pt-10">
        <RebornCalendar
          v-model="playgroundValue"
          v-model:mode="state.mode"
          :events="sampleEvents"
          :controller-type="state.controllerType"
          :color="state.color"
          :title-align="state.titleAlign"
          :border="state.border"
          :highlight-today="state.highlightToday"
          :lunar="state.lunar"
          @panel-change="onPanelChange"
        />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          v-model：{{ label(playgroundValue) }}；最近事件：{{ lastEvent }}
        </DemoNote>
      </div>
    </Playground>

    <DemoSection title="基础用法" class="relative z-30">
      <template #description>
        <code>v-model</code>
        绑定选中日期；未选中时视图停在本月，点日期即选中，点上下月补位的日期会跟着翻到那个月。
      </template>
      <DemoBlock layout="stack">
        <RebornCalendar v-model="basicValue" />
        <DemoNote tone="dimmed">选中：{{ label(basicValue) }}</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="事项与语义色" class="relative z-20">
      <template #description>
        <code>events</code>
        按
        <code>date</code>
        落到日期格，超过三条在事项区内滚动；<code>color</code>
        决定有事项日期的浅底、顶边与日期文字，并传给工具栏的年月下拉与月 / 年切换；事项自带的
        <code>color</code>
        只改它自己的圆点。
      </template>
      <DemoBlock layout="stack" class="gap-4">
        <RebornRadioGroup v-model="eventColor" type="pure-button" size="sm" :options="colorOptions" />
        <RebornCalendar :events="sampleEvents" :color="eventColor" />
      </DemoBlock>
      <DemoNote>16 日有 5 条事项，事项区高 65px 只露出 3 条，其余在格内滚动；滚到底不会带动页面。</DemoNote>
    </DemoSection>

    <DemoSection title="标题对齐与边框">
      <template #description>
        <code>title-align</code>
        控制表头星期与日期标题的对齐，默认
        <code>right</code>；<code>border</code>
        给主体加直角外框与格间分隔线，整体成网格。
      </template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex flex-wrap items-center gap-4">
          <RebornRadioGroup v-model="alignValue" type="pure-button" size="sm" :options="alignOptions" />
          <RebornCheckbox v-model="bordered" label="边框模式" />
        </div>
        <RebornCalendar :events="sampleEvents" :title-align="alignValue" :border="bordered" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="农历模式">
      <template #description>
        <code>lunar</code>
        开启后公历日期在上，较小的农历在下：节日、节气优先，初一显示月名，其余显示日名；工具栏显示干支年与生肖。
      </template>
      <DemoBlock layout="stack">
        <RebornCalendar v-model="lunarValue" :events="sampleEvents" lunar />
      </DemoBlock>
      <DemoNote>
        农历由浏览器内置的中国历法换算，不额外引入依赖；节气覆盖 2000–2099 年。节日与节气用语义色标出。
      </DemoNote>
    </DemoSection>

    <DemoSection title="右键管理事项" class="relative z-10">
      <template #description>
        通过
        <code>date-cell</code>
        组合右键菜单与输入弹窗，支持同一天添加多条事项、逐项删除；数据由示例维护，切换年视图后按月显示日期与内容。
      </template>
      <DemoBlock layout="stack">
        <RebornCalendarEventsDemo />
      </DemoBlock>
      <DemoNote>
        右键选择「添加事项」后，输入内容并点击「添加」；弹窗保持打开，便于连续追加。选择「删除事项」后可逐项删除，当天无事项时该菜单禁用。刷新页面会重置示例数据。
      </DemoNote>
    </DemoSection>

    <DemoSection title="年视图" class="relative z-1">
      <template #description>
        <code>v-model:mode</code>
        设为
        <code>year</code>
        时按月排成 3 行 4 列，每格按「年-月-日：内容」汇总当月事项；点月份会选中该月同一天并切回月视图。
      </template>
      <DemoBlock layout="stack">
        <RebornCalendar v-model="yearValue" v-model:mode="yearMode" :events="sampleEvents" />
        <DemoNote tone="dimmed">当前模式：{{ yearMode }}</DemoNote>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="工具栏控制器">
      <template #description>
        <code>controller-type</code>
        默认
        <code>select</code>
        用年月下拉；设为
        <code>button</code>
        换成前后翻页按钮加年月标题。<code>formatter</code>
        改写下拉选项的文案。
      </template>
      <DemoBlock layout="stack" class="gap-8">
        <RebornCalendar v-model="buttonValue" controller-type="button" />
        <RebornCalendar v-model="formatterValue" :formatter="formatter" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="日期区间">
      <template #description>
        <code>range</code>
        只显示一段日期，开始补到所在周的周日、结束补到周六，最多跨相邻两个月；此时不显示年月下拉与月 /
        年切换，今天不在区间内时「今天」置灰。
      </template>
      <DemoBlock layout="stack">
        <RebornCalendar v-model="rangeValue" :range="range" :events="sampleEvents" />
      </DemoBlock>
    </DemoSection>

    <DemoSection title="时区与绑定值格式">
      <template #description>
        <code>value-format</code>
        让
        <code>v-model</code>
        收发字符串，提交给接口不会因时区差一天；<code>timezone</code>
        决定「今天」与带时区的时刻落在哪天。
      </template>
      <DemoBlock layout="stack">
        <RebornCalendar
          v-model="zonedValue"
          value-format="YYYY-MM-DD"
          timezone="America/New_York"
          :events="zonedEvents"
        />
        <DemoNote tone="dimmed" class="font-mono text-xs">
          v-model：{{ zonedValue ?? "未选择" }}（字符串，原样提交）
        </DemoNote>
      </DemoBlock>
      <DemoNote>
        「北京 9 日 8:00 的会」是一个确定时刻，按纽约时间落在 8 日；「不带时区的日期」是墙上日期，不受时区影响。
      </DemoNote>
    </DemoSection>

    <DemoSection title="自定义日期格">
      <template #description>
        <code>date-cell</code>
        插槽替换日期格的内容（日期标题与事项区），作用域参数
        <code>data</code>
        含
        <code>type</code>
        /
        <code>isSelected</code>
        /
        <code>day</code>
        /
        <code>date</code>（开启
        <code>lunar</code>
        时还有
        <code>lunar</code>），<code>events</code>
        是当天事项。
      </template>
      <DemoBlock layout="stack">
        <RebornCalendar v-model="cellValue" :events="sampleEvents">
          <template #date-cell="{ data, events }">
            <div class="flex h-[89px] flex-col gap-1">
              <div class="flex items-center justify-between">
                <span
                  :class="[
                    data.isSelected
                      ? 'text-primary font-medium'
                      : data.type === 'current-month'
                        ? 'text-gray-9'
                        : 'text-gray-5',
                  ]"
                >
                  {{ data.day.slice(5) }}
                </span>
                <span class="text-sm text-gray-6">{{ cellBadge(data.date, data.type) }}</span>
              </div>
              <span v-if="events.length" class="text-sm text-gray-7">{{ events.length }} 条事项</span>
            </div>
          </template>
        </RebornCalendar>
      </DemoBlock>
      <DemoNote>用了插槽后默认的日期标题和事项列表会被替换，需要时在插槽里自己渲染。</DemoNote>
    </DemoSection>

    <DemoSection title="自定义工具栏">
      <template #description>
        <code>header</code>
        插槽替换整个工具栏，作用域参数
        <code>date</code>
        是标题文案，<code>selectDate</code>
        用来翻页。
      </template>
      <DemoBlock layout="stack">
        <RebornCalendar v-model="headerValue">
          <template #header="{ date, selectDate }">
            <div class="flex w-full items-center justify-between">
              <span class="text-lg font-medium text-gray-10">{{ date }}</span>
              <div class="flex items-center gap-2">
                <RebornButton size="sm" variant="soft" color="neutral" @click="selectDate('prev-month')">
                  上个月
                </RebornButton>
                <RebornButton size="sm" variant="soft" color="neutral" @click="selectDate('today')">今天</RebornButton>
                <RebornButton size="sm" variant="soft" color="neutral" @click="selectDate('next-month')">
                  下个月
                </RebornButton>
              </div>
            </div>
          </template>
        </RebornCalendar>
      </DemoBlock>
    </DemoSection>

    <DemoSection title="实例方法">
      <template #description>
        通过
        <code>ref</code>
        调用
        <code>selectDate</code>
        跳转、<code>pickDay</code>
        选中具体日期，<code>selectedDay</code>
        读当前选中日期。
      </template>
      <DemoBlock layout="stack" class="gap-4">
        <div class="flex flex-wrap items-center gap-2">
          <RebornButton
            v-for="t in jumpTargets"
            :key="t.type"
            size="sm"
            variant="outlined"
            color="neutral"
            @click="calendarRef?.selectDate(t.type)"
          >
            {{ t.label }}
          </RebornButton>
          <RebornButton size="sm" variant="outlined" color="neutral" @click="calendarRef?.pickDay(day(1))">
            本月 1 日
          </RebornButton>
        </div>
        <RebornCalendar ref="calendarRef" v-model="exposeValue" />
        <DemoNote tone="dimmed">
          selectedDay：{{ label(calendarRef?.selectedDay) }}；v-model：{{ label(exposeValue) }}
        </DemoNote>
      </DemoBlock>
    </DemoSection>
  </div>
</template>
