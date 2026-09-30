---
title: DatePickerPanel 日期选择面板
description: 内嵌日期面板：15 种类型覆盖年 / 季 / 月 / 周 / 日 / 时间，支持多选、范围、双面板联动与周数，仅 Web。
category: 表单与输入
platform: web
tags: [calendar, date, select, panel]
badge: New
---

::warning
仅 Web 端提供。UniApp 端改用 `reborn-select-date`。
::

::ComponentViewer{demoFile="RebornDatePickerPanelDemo.vue" config="RebornDatePickerPanelConfig" componentId="reborn-date-picker-panel" dependencies="dayjs" :componentFiles='["RebornDatePickerPanel.vue", "reborn-date-picker-panel.config.ts"]'}
::

## 简介

DatePickerPanel 是直接铺在页面里的日期面板，没有输入框和弹层。它也是 `reborn-date-picker` 的下拉内容，两者参数一致。

`type` 决定选择粒度（年 / 季度 / 月 / 周 / 日 / 日期时间），也决定是单选、多选还是范围选择。选中项的外观由 `activeType` 与 `color` 组合给出，`size` 控制格子尺寸，`width` 决定面板由内容撑开还是铺满父容器。

可选范围由 `start` / `end` 划定边界，再由 `disabledMethod` 逐项排除。`shortcuts` 在左侧加快捷侧栏。范围类型默认并排两个联动面板，`unlinkPanels` 取消联动、`singlePanel` 收成一个面板；`showWeekNumber` 在日期视图左侧加一列 ISO 周数，`showToday` 在底部加一栏，一键选中当前时间所在的单位。单元格内容与翻页图标都可以用插槽替换，翻页和切换视图会抛出 `panel-change`。

### 何时使用

- 日历常驻页面，例如排班、预约页的侧栏，用 `type="date"` 或 `type="dates"`。
- 需要一次选出起止区间，并且希望两个月并排对照，用 `type="daterange"`。
- 按周统计、需要看清每一行是第几周，用 `showWeekNumber`。
- 可选日期由业务规则决定，例如只开放工作日，用 `disabledMethod`。
- 常用区间需要一键选中，例如「最近一周」，用 `shortcuts`。

### 何时不使用

- 表单里的日期字段，需要输入框展示已选值并在点击时展开 —— 改用 `reborn-date-picker`。
- 只选时分秒、不涉及日期 —— 改用 `reborn-time-picker`。
- UniApp 端或需要滚轮式选择 —— 改用 `reborn-select-date`。

## 用法

### 基础用法

默认 `type="date"`。不传 `valueFormat` 时绑定值是 `Date` 对象，传入后按该格式输出字符串，面板也按同一格式回读。

```vue
<script setup lang="ts">
const date = ref("");
</script>

<template>
  <RebornDatePickerPanel
    v-model="date"
    value-format="YYYY-MM-DD"
    border
  />
</template>
```

### 选择类型

15 种 `type` 按粒度分组，每组都有单选、多选（复数形式）和范围（`range` 后缀）三种。`week` 一次点选即选中整周（周日至周六），绑定值是起止两天。

| 类型            | 绑定值     | 示例值                                     |
| --------------- | ---------- | ------------------------------------------ |
| `year`          | `string`   | `"2024"`                                   |
| `years`         | `string[]` | `["2024", "2025"]`                         |
| `yearrange`     | `string[]` | `["2020", "2024"]`                         |
| `quarter`       | `string`   | `"2024-Q2"`                                |
| `quarters`      | `string[]` | `["2024-Q1", "2024-Q3"]`                   |
| `quarterrange`  | `string[]` | `["2024-Q1", "2025-Q2"]`                   |
| `month`         | `string`   | `"2024-04"`                                |
| `months`        | `string[]` | `["2024-04", "2024-05"]`                   |
| `monthrange`    | `string[]` | `["2024-01", "2024-04"]`                   |
| `date`          | `string`   | `"2024-04-03"`                             |
| `dates`         | `string[]` | `["2024-04-03", "2024-04-04"]`             |
| `daterange`     | `string[]` | `["2024-04-01", "2024-04-05"]`             |
| `week`          | `string[]` | `["2024-03-31", "2024-04-06"]`             |
| `datetime`      | `string`   | `"2024-04-03 12:00"`                       |
| `datetimerange` | `string[]` | `["2024-04-03 12:00", "2024-04-05 18:00"]` |

表中示例值假设已按对应格式设置 `valueFormat`（如季度用 `YYYY-[Q]Q`、日期时间用 `YYYY-MM-DD HH:mm`）；不传时单值为 `Date`，多值为 `Date[]`。季度值取该季度首月 1 日。

```vue
<template>
  <RebornDatePickerPanel
    v-model="quarter"
    type="quarter"
    value-format="YYYY-[Q]Q"
  />
  <RebornDatePickerPanel
    v-model="range"
    type="daterange"
    value-format="YYYY-MM-DD"
  />
</template>
```

### 范围与双面板

范围类型（`yearrange` / `quarterrange` / `monthrange` / `daterange` / `datetimerange`）默认并排两个面板，两侧联动翻页。下面两个开关改变面板组合：

| 属性           | 效果                                                   | 典型用途                                 |
| -------------- | ------------------------------------------------------ | ---------------------------------------- |
| 默认           | 双面板联动，右侧始终紧跟左侧                           | 区间通常落在相邻两个月内                 |
| `unlinkPanels` | 双面板各自翻页，左侧始终早于右侧                       | 起止相隔很远，例如跨年对比               |
| `singlePanel`  | 只渲染一个面板，起止都在这一个面板里点选               | 容器宽度不够放两个面板                   |

```vue
<template>
  <RebornDatePickerPanel
    v-model="range"
    type="daterange"
    unlink-panels
  />
  <RebornDatePickerPanel
    v-model="range"
    type="daterange"
    single-panel
  />
</template>
```

::tip
联动时一次翻页走过两个面板的跨度：日期视图 2 个月，月 / 季度视图 2 年，年视图 20 年，翻完左右两页都是新内容。`daterange` 从日期视图切到月 / 季度视图时一次只走 1 年，因为两侧此时展示的是相邻月份所在的年份。
::

### 周数

`showWeekNumber` 在日期视图最左侧加一列 ISO 周数，表头为「周」，每一行的周数按该行的周一计算。加列后网格由 7 列变 8 列，面板最小宽度随之变宽。

```vue
<template>
  <RebornDatePickerPanel
    v-model="date"
    show-week-number
  />
</template>
```

`week` 类型本身按周选择，传入 `showWeekNumber` 不生效。

### 禁用规则

可选范围分两层：`start` / `end` 划定边界（含），`disabledMethod` 在边界内逐项排除。`disabledMethod` 的第二个参数标出当前判定的粒度，同一个方法可以同时约束日期、月份和年份。

| `unit`    | 何时传入                     | 典型用途                   |
| --------- | ---------------------------- | -------------------------- |
| `date`    | 日期视图的每一格             | 排除周末、节假日           |
| `week`    | `week` 类型的日期格          | 排除已结算的周             |
| `month`   | 月份视图的每一格             | 只开放本年度已过去的月份   |
| `quarter` | 季度视图的每一格             | 排除未来季度               |
| `year`    | 年份视图的每一格             | 限定可选年份区间           |

```vue
<script setup lang="ts">
// 周六、周日不可选
function disabledMethod(date: Date, unit: string) {
  return unit === "date" && [0, 6].includes(date.getDay());
}
</script>

<template>
  <RebornDatePickerPanel
    v-model="date"
    start="2024-01-01"
    end="2024-12-31"
    :disabled-method="disabledMethod"
  />
</template>
```

`disabled` 则禁用整个面板：每一格都按禁用样式渲染，已选值与范围高亮不再显示，翻页、切换视图、快捷选项与时间段一律不响应。

### 快捷选项

`shortcuts` 传入非空数组时，面板左侧出现快捷侧栏。`value` 可以是 `Date`、`Date` 数组，或返回二者的函数；函数写法在点击时才计算，适合「最近 N 天」这类相对日期。

```vue
<script setup lang="ts">
const shortcuts = [
  { text: "今天", value: () => new Date() },
  {
    text: "最近一周",
    value: () => [new Date(Date.now() - 6 * 86400000), new Date()],
  },
];
</script>

<template>
  <RebornDatePickerPanel
    v-model="range"
    type="daterange"
    :shortcuts="shortcuts"
  />
</template>
```

### 今天栏

`showToday` 在面板底部加一栏，点击选中当前时间所在的单位，文案随类型变为「今天」「本周」「本月」「本季度」「今年」，`datetime` 为「此刻」。点击后视图翻回当前年月，抛出的事件与手动点选这一格相同；文字色跟随 `color`，字号跟随 `size`。

- `datetime` 的日期取今天，时分秒取点击时的时间。
- 范围类型一次写入完整范围，起止都落在当前单位上，例如 `daterange` 得到 `[今天, 今天]`，依次抛出 `update:modelValue`、`calendar-change` 与 `change`；`datetimerange` 的起止时间取 `00:00:00` 与 `23:59:59`，覆盖一整天。
- 多选类型只追加：今天已在选中集合里时点击不做处理，不会把它取消掉。
- 面板 `disabled`，或今天被 `start` / `end` / `disabledMethod` 排除时，这一栏置灰且点击无效；`datetime` 另外校验此刻的时分秒是否落在 `disabledHours` 等方法返回的禁用项里。

```vue
<template>
  <RebornDatePickerPanel
    v-model="date"
    value-format="YYYY-MM-DD"
    show-today
  />
  <RebornDatePickerPanel
    v-model="month"
    type="month"
    value-format="YYYY-MM"
    show-today
  />
</template>
```

### 选中样式

`activeType` 决定选中项的外观，未选中格子的悬停圆角也由它给出；具体配色取自 `color`。

| 取值        | 外观                         | 典型用途                         |
| ----------- | ---------------------------- | -------------------------------- |
| `fill`      | 实心底色，4px 圆角           | 默认，选中态最醒目               |
| `fillRound` | 实心底色，正圆               | 与圆形头像、胶囊按钮风格统一     |
| `outline`   | 描边加主题色文字             | 面板嵌在彩色卡片里，实心底太重   |
| `text`      | 只改文字颜色，无底色         | 密集的只读日历，只需轻量标记     |

```vue
<template>
  <RebornDatePickerPanel
    v-model="range"
    type="daterange"
    active-type="fillRound"
    color="success"
  />
</template>
```

范围与多选时，首尾之外的中间项在 `fill` / `fillRound` / `outline` 下取同色板第 1 阶浅底，逐列相接连成一条带子，只有两端收圆角。

### 自定义单元格

默认插槽替换每个格子里的内容，作用域参数是当前格子的信息（`DatePickerCell`）。插槽内容渲染在格子内部，选中、范围、禁用的样式仍由面板施加。年、月、季度、日期四种视图共用这一个插槽，用 `type` 区分。

```vue
<template>
  <RebornDatePickerPanel v-model="date">
    <template #default="{ type, text, date }">
      <div class="flex flex-col items-center leading-none">
        <span>{{ text }}</span>
        <span
          v-if="type === 'date' && isHoliday(date)"
          class="text-[10px] text-error"
          >休</span
        >
      </div>
    </template>
  </RebornDatePickerPanel>
</template>
```

日期格默认只有 30px 见方，插槽内容多于一行时需自行压缩行高与字号。

### 导航图标

四个导航插槽替换翻页按钮里的图标，按钮本身的点击与禁用逻辑不变。日期视图外侧的双箭头是 `prev-year` / `next-year`，内侧的单箭头是 `prev-month` / `next-month`；年、月、季度视图只有 `prev-year` / `next-year` 一组。

```vue
<template>
  <RebornDatePickerPanel v-model="date">
    <template #prev-year>
      <Icon name="lucide:arrow-left-to-line" />
    </template>
    <template #next-year>
      <Icon name="lucide:arrow-right-to-line" />
    </template>
  </RebornDatePickerPanel>
</template>
```

### 事件

除 `update:modelValue` 与 `change` 外，面板还抛出三个事件：

| 事件              | 触发时机                                       | 典型用途                               |
| ----------------- | ---------------------------------------------- | -------------------------------------- |
| `calendar-change` | 范围类型每次点选日期，包括只选了起点时         | 选完起点后实时提示「请选择结束日期」   |
| `panel-change`    | 翻页、切换年 / 月视图、从年月视图下钻          | 按面板所示月份按需加载排班、价格等数据 |
| `clear`           | 调用暴露的 `clear()` 方法                      | 清空后重置关联筛选项                   |

```vue
<script setup lang="ts">
const panel = ref();

function onPanelChange(date: Date | [Date, Date], mode: "month" | "year") {
  loadSchedule(Array.isArray(date) ? date[0] : date, mode);
}
</script>

<template>
  <RebornDatePickerPanel
    ref="panel"
    v-model="range"
    type="daterange"
    @panel-change="onPanelChange"
  />
  <RebornButton @click="panel.clear()">清空</RebornButton>
</template>
```

## API

### Props

| 属性名                 | 类型                                                                                                                                                                                                                  | 默认值         | 描述                                                                                                                                                                                                                                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modelValue`           | `any`                                                                                                                                                                                                                 | `""`           | 绑定值。单值类型为 `Date` 或字符串，多选与范围类型为其数组，取决于 `valueFormat`。                                                                                                                                                                                                                                |
| `type`                 | `'year' \| 'years' \| 'yearrange' \| 'quarter' \| 'quarters' \| 'quarterrange' \| 'month' \| 'months' \| 'monthrange' \| 'date' \| 'dates' \| 'daterange' \| 'week' \| 'datetime' \| 'datetimerange'`             | `'date'`       | 选择器类型，决定粒度与单选 / 多选 / 范围。各类型的绑定值见「选择类型」。                                                                                                                                                                                                                                          |
| `valueFormat`          | `string`                                                                                                                                                                                                              | `""`           | 绑定值的 dayjs 格式；为空时绑定值为 `Date` 对象。季度类型可用 `Q` 令牌（如 `YYYY-[Q]Q`），面板按同一格式回读。                                                                                                                                                                                                    |
| `start`                | `string`                                                                                                                                                                                                              | `'1970-01-01'` | 可选日期的最早边界（含）。                                                                                                                                                                                                                                                                                        |
| `end`                  | `string`                                                                                                                                                                                                              | `'2099-12-31'` | 可选日期的最晚边界（含）。                                                                                                                                                                                                                                                                                        |
| `disabledMethod`       | `(date: Date, unit: 'year' \| 'month' \| 'quarter' \| 'week' \| 'date') => boolean`                                                                                                                                  | -              | 逐项判定是否禁用，返回 `true` 即该项不可选。`unit` 标识当前判定粒度：日期格传 `date`（`week` 类型传 `week`），年 / 月 / 季度视图分别传 `year` / `month` / `quarter`。被排除的项连成灰底带子（`dayDisabledBand`）、文字取 `dayDisabled` 灰色，悬停显示禁用光标，点击被脚本层拦截。                                |
| `disabledHours`        | `(role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                                                              | -              | 返回需禁用的小时数组；仅 `datetime` / `datetimerange` 生效，范围类型可按 `role` 区分开始 / 结束时间。                                                                                                                                                                                                             |
| `disabledMinutes`      | `(hour: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                                                | -              | 返回需禁用的分钟数组，入参为当前选中的小时；范围类型可按 `role` 区分开始 / 结束时间。                                                                                                                                                                                                                             |
| `disabledSeconds`      | `(hour: number, minute: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                                | -              | 返回需禁用的秒数组，入参为当前选中的时、分；范围类型可按 `role` 区分开始 / 结束时间。                                                                                                                                                                                                                             |
| `disabledMilliseconds` | `(hour: number, minute: number, second: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                | -              | 返回需禁用的毫秒数组，入参为当前选中的时、分、秒；范围类型可按 `role` 区分开始 / 结束时间。                                                                                                                                                                                                                       |
| `shortcuts`            | `{ text: string; value: any }[]`                                                                                                                                                                                      | `[]`           | 快捷选项；非空时渲染左侧快捷侧栏。`value` 为 `Date`、`Date` 数组或返回二者的函数。                                                                                                                                                                                                                                |
| `showWeekNumber`       | `boolean`                                                                                                                                                                                                             | `false`        | 日期视图左侧显示 ISO 周数；`week` 类型不生效。                                                                                                                                                                                                                                                                    |
| `unlinkPanels`         | `boolean`                                                                                                                                                                                                             | `false`        | 范围类型取消两个面板的联动，左右各自翻页，左侧始终早于右侧；`singlePanel` 时无效。                                                                                                                                                                                                                                |
| `singlePanel`          | `boolean`                                                                                                                                                                                                             | `false`        | 范围类型只渲染一个面板；`datetimerange` 的起止时间一并放在该面板头部。                                                                                                                                                                                                                                            |
| `showToday`            | `boolean`                                                                                                                                                                                                             | `false`        | 面板底部显示「今天」栏，点击选中当前时间所在的单位，见「今天栏」。                                                                                                                                                                                                                     |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                                                                                                                                                                                | `'md'`         | 尺寸：日期格分别为 26 / 30 / 34px，字号与图标同步缩放。                                                                                                                                                                                                                                                           |
| `color`                | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'`                                                                                                                                | `'primary'`    | 选中、范围与今日标识的语义色。                                                                                                                                                                                                                                                                                    |
| `activeType`           | `'fill' \| 'fillRound' \| 'outline' \| 'text'`                                                                                                                                                                        | `'fill'`       | 选中项的表现形式：`fill` 背景填色（4px 圆角）、`fillRound` 背景填色且为正圆、`outline` 描边加文字、`text` 仅文字变色。未选中格子的悬停圆角也由它给出。                                                                                                                                                            |
| `width`                | `'auto' \| 'full'`                                                                                                                                                                                                    | `'auto'`       | 宽度模式：`auto` 由内部元素撑开，各视图网格共用同一套最小宽度，切换年 / 月 / 季度视图时宽度不跳动；`full` 占满父容器。                                                                                                                                                                                            |
| `overflow`             | `'hidden' \| 'visible'`                                                                                                                                                                                               | `'visible'`    | 最外层容器的溢出处理；需要裁掉超出圆角的内容时设为 `hidden`。                                                                                                                                                                                                                                                     |
| `disabled`             | `boolean`                                                                                                                                                                                                             | `false`        | 禁用整个面板：所有格子进入禁用样式（灰带 + 禁用光标），标题转为 gray-4，翻页图标降低透明度；已选值与范围高亮不再显示，翻页、切换视图、快捷选项与时间段一律不响应。                                                                                                                                                |
| `border`               | `boolean`                                                                                                                                                                                                             | `false`        | 显示外边框、12px 圆角与浅阴影。                                                                                                                                                                                                                                                                                   |
| `class`                | `any`                                                                                                                                                                                                                 | -              | 追加到最外层容器的类名。                                                                                                                                                                                                                                                                                          |
| `ui`                   | `object`                                                                                                                                                                                                              | -              | 细粒度样式覆盖，键位见「自定义样式（ui）」。                                                                                                                                                                                                                                                                      |

### Emits

| 事件名              | 回调参数                                                                  | 描述                                                                                                                                         |
| ------------------- | ------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: any)`                                                            | 绑定值变化时触发。范围类型每次点选都会触发，只选了起点时为 `[start, ""]`。                                                                   |
| `change`            | `(value: any)`                                                            | 选择完成时触发。范围类型在起止都选定后触发；`dates` 类型不触发。                                                                             |
| `calendar-change`   | `(value: [Date, Date \| null])`                                           | 范围类型点选日期或选中数组型快捷选项时触发；只选了起点时终点为 `null`。`week` 类型不触发。                                                   |
| `panel-change`      | `(date: Date \| [Date, Date], mode: 'month' \| 'year', view: 'year' \| 'month' \| 'date')` | 翻页、切换视图或下钻时触发。`date` 为面板所示年月的 1 日（年视图为十年页首年），双面板时为 `[左, 右]`；`mode` 在日期视图跨月翻页时为 `month`，其余为 `year`；`view` 为变化后的视图。 |
| `clear`             | `()`                                                                      | 调用 `clear()` 清空后触发。                                                                                                                  |

### Slots

| 插槽名       | 作用域参数       | 描述                                                                                           |
| ------------ | ---------------- | ---------------------------------------------------------------------------------------------- |
| `default`    | `DatePickerCell` | 自定义单元格内容，四种视图共用；默认显示年份、`N月`、`第N季度` 或日期数字。                    |
| `prev-month` | -                | 日期视图「上个月」按钮的图标，默认 `lucide:chevron-left`。                                     |
| `next-month` | -                | 日期视图「下个月」按钮的图标，默认 `lucide:chevron-right`。                                    |
| `prev-year`  | -                | 「上一年」按钮的图标：日期视图默认 `lucide:chevrons-left`，年 / 月 / 季度视图默认 `lucide:chevron-left`。 |
| `next-year`  | -                | 「下一年」按钮的图标：日期视图默认 `lucide:chevrons-right`，年 / 月 / 季度视图默认 `lucide:chevron-right`。 |

`DatePickerCell` 的字段：

| 字段       | 类型                                        | 说明                                                                     |
| ---------- | ------------------------------------------- | ------------------------------------------------------------------------ |
| `type`     | `'year' \| 'month' \| 'quarter' \| 'date'` | 格子所属视图。                                                           |
| `text`     | `number`                                    | 默认显示的数字：年份、月份（1-12）、季度号（1-4）或日。                  |
| `date`     | `Date`                                      | 格子代表的日期；年、月、季度取其首日。                                   |
| `disabled` | `boolean`                                   | 是否不可选。                                                             |
| `selected` | `boolean`                                   | 是否为选中项；范围类型只有首尾两端为 `true`。                            |
| `inRange`  | `boolean`                                   | 是否落在范围之内，含悬停预览。                                           |
| `isToday`  | `boolean`                                   | 是否为今天 / 本月 / 本季度 / 今年。                                      |
| `outside`  | `boolean`                                   | 是否为补位格：日期视图的上下月、年份视图当前十年页之外的年份。           |

### Expose

| 方法名  | 签名         | 描述                                                                                          |
| ------- | ------------ | --------------------------------------------------------------------------------------------- |
| `clear` | `() => void` | 清空选中值：范围与多选类型置为 `[]`，其余置为 `""`；原本有值时先抛 `change`，最后总会抛 `clear`。 |

### 自定义样式（ui）

面板由「快捷侧栏 + 主面板（可双联）」组成，`type` 决定主面板渲染日期网格、年 / 月 / 季度网格还是带时间段的复合视图，因此不少键只在特定类型下出现。

**布局骨架**

| 键名         | 说明                                                                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`    | 面板最外层容器，默认 `bg-gray-1 transition-all`，溢出由 `overflow` 变体给出（默认 `overflow-visible`），宽度由 `width` 变体给出（`auto` 为 `w-fit`、`full` 为 `w-full`）；面板底色与圆角改这里。 |
| `container`  | 「快捷侧栏 + 内容区」的横向容器，默认 `flex h-full`。                                                                                                     |
| `shortcuts`  | 快捷侧栏容器，默认 `border-r border-gray-2 p-4 flex flex-col gap-4 overflow-y-auto` + 隐藏滚动条。**仅 `shortcuts` 非空时渲染。**                         |
| `shortcut`   | 单个快捷选项，默认 `min-w-15 text-sm text-gray-6 hover:bg-gray-2 hover:text-primary cursor-pointer transition-colors whitespace-nowrap`。                  |
| `content`    | 快捷侧栏右侧的内容区，默认 `flex-1`；双面板时为 `flex flex-row divide-x divide-gray-2`。                                                                  |
| `panelLeft`  | 主（左）面板容器，单面板时为 `w-full`，双面板时为 `flex-1`。                                                                                              |
| `panelRight` | 右面板容器，默认 `flex-1`。**仅范围类型且未开启 `singlePanel` 时渲染。**                                                                                  |

**顶部导航**

| 键名             | 说明                                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header`         | 顶部导航行，默认 `flex items-center justify-between px-[20px] pt-[16px] pb-[12px]`。                                                                             |
| `navGroup`       | 单侧翻页按钮组，默认 `flex items-center gap-[8px]`；日期视图同侧有「跨年 + 跨月」两个按钮，间距改这里。                                                          |
| `navBtn`         | 翻页按钮，默认 `flex items-center rounded-md hover:bg-gray-2 transition-colors cursor-pointer text-gray-6`。                                                     |
| `navBtnHidden`   | 联动双面板时左侧的「下一页」与右侧的「上一页」按钮，默认 `opacity-0 pointer-events-none`，仍占位以保持标题居中；想彻底去掉占位就在这里加 `hidden`。              |
| `navBtnDisabled` | 取消联动后两侧已不能再靠拢时的翻页按钮，默认 `opacity-40 cursor-not-allowed hover:bg-transparent`。                                                              |
| `title`          | 中间的年份 / 月份标题（点击切到年视图或月视图），默认 `text-base font-medium text-gray-10 cursor-pointer hover:text-primary transition-colors`。                 |
| `icon`           | 翻页按钮内的默认图标，默认 `transition-all size-[16px]`；导航插槽替换图标后不再套用。                                                                            |

**日期网格**

| 键名                            | 说明                                                                                                                                                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `weekdays`                      | 星期表头容器，默认 `grid grid-cols-7 justify-items-center text-sm text-gray-6 px-[20px] pt-[8px] pb-[12px]`；显示周数时为 8 列。                                                                                                                 |
| `weekday`                       | 单个星期标签，默认 `size-[30px] flex items-center justify-center`；与日期格同宽同高，两套栅格才逐列对齐。                                                                                                                                        |
| `weekNumberHeader`              | 周数列的表头「周」，默认 `size-[30px] flex items-center justify-center`。**仅 `showWeekNumber` 且非 `week` 类型时渲染。**                                                                                                                        |
| `weekNumber`                    | 每行最左侧的周数格，默认 `flex h-[30px] w-full items-center justify-center text-sm text-gray-5`。渲染条件同 `weekNumberHeader`。                                                                                                                  |
| `days`                          | 日期网格容器，默认 `grid grid-cols-7 gap-y-[12px] px-[20px] pb-[16px] min-w-[334px]`；列不加 `gap-x`（会切断范围带子），`min-w` 保证每列 ≥ 42px。显示周数时为 8 列，`min-w` 按尺寸取 344 / 376 / 408px。                                         |
| `dayCell`                       | 日期格外面的格位，默认 `flex h-[38px] my-[-4px] w-full items-center justify-center`：宽度撑满所在列，**范围底色画在这一层**，相邻两列首尾相接连成带子；负外边距把高度压回 30px，带子因此上下各超出日期格 4px。                                   |
| `dayRangeStart` / `dayRangeEnd` | 范围带子的首端 / 末端，默认 `w-[calc(50%+19px)] ml-auto justify-start pl-[4px]`（末端为镜像的 `mr-auto justify-end pr-[4px]`）：带子只画内侧半列并在端点外侧超出 4px 后封口，封口圆角由 `activeType` 给出。合并进 `dayCell`；起止为同一天时不画。 |
| `day`                           | 单个日期格，默认 `size-[30px] box-border flex items-center justify-center text-base cursor-pointer transition-colors text-gray-9 hover:bg-gray-2`；圆角由 `activeType` 给出。默认插槽的内容渲染在这一层里面。                                     |
| `dayActive`                     | 选中日期的附加样式，由 `color` × `activeType` 给出（`primary` + `fill` 时为 `bg-primary text-gray-1 hover:bg-primary rounded-[4px]`）。**不是独立节点**，合并进 `day`。                                                                          |
| `dayInRange`                    | 范围内日期的底色，同时并进 `dayCell` 与 `day`：前者铺满整列连成带子，后者负责文字色与悬停。填色与描边类型取同色板第 1 阶浅底加 `gray-9`，`text` 类型只改文字色。                                                                                |
| `dayToday`                      | 今日标识，默认 `font-medium` 加 `color` 的语义色；仅在今日未被选中时叠加。合并进 `day`。                                                                                                                                                         |
| `dayDisabled`                   | 越界或被 `disabledMethod` 排除的日期格，默认 `text-gray-5 cursor-not-allowed hover:bg-transparent`。合并进 `day`。                                                                                                                               |
| `dayDisabledBand`               | 禁用日期的灰底带子，默认 `bg-gray-2`，画在 `dayCell` 上；连续禁用格连成整条灰带，范围高亮优先于灰带。                                                                                                                                            |
| `dayOutside`                    | 非本月的补位格，默认 `text-gray-5`：只调淡文字，照常可点。`daterange` / `datetimerange` 双面板下补位格不显示选中与范围，只在日期真正归属的一侧高亮。合并进 `day`。                                                                               |

**年 / 月 / 季度网格**

| 键名                                        | 说明                                                                                                                                                                                              |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grid4Year`                                 | 年份视图的四列网格，默认 `grid grid-cols-4 gap-y-[30px] justify-items-center px-[20px] pb-[16px] min-w-[334px] overflow-auto`；`min-w` 与日期网格一致，切换视图时宽度不跳动。                     |
| `grid4Month`                                | 月份视图的四列网格，默认 `grid grid-cols-4 gap-y-[30px] justify-items-center px-[20px] pb-[16px] min-w-[334px]`。                                                                                 |
| `grid2Quarter`                              | 季度视图的两列网格（四个季度排成两行），默认 `grid grid-cols-2 gap-y-[30px] justify-items-center px-[20px] pb-[16px] min-w-[334px]`。                                                             |
| `yearMonthItem`                             | 单个年 / 月 / 季度格，默认 `h-[30px] box-border flex items-center justify-center cursor-pointer transition-colors text-base text-gray-9 hover:bg-gray-2 w-full`；宽度撑满所在列，范围底色因此连续。 |
| `yearMonthInRange`                          | 范围内的年 / 月 / 季度，配色规则同 `dayInRange`；填色与描边类型额外带 `rounded-none`，中间项才能连成直带。合并进 `yearMonthItem`，首尾两端取 `dayActive`。                                        |
| `yearMonthRangeStart` / `yearMonthRangeEnd` | 范围两端的封口，填色与描边类型下为 `rounded-r-none` / `rounded-l-none`：内侧圆角压平、外侧保留圆角。合并进 `yearMonthItem`；起止落在同一格时不加。                                                |
| `yearMonthOutside`                          | 年份视图中不属于当前十年页的年份，默认 `opacity-40`。合并进 `yearMonthItem`。                                                                                                                     |

**底部今天栏**

| 键名             | 说明                                                                                                                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `footer`         | 底部「今天」栏，默认 `text-base leading-[1.5] py-[8px] text-center border-t border-gray-2 cursor-pointer transition-opacity hover:opacity-80`；文字色由 `color` 变体给出（`primary` 为 `text-primary`，`neutral` 为 `text-gray-6`），`sm` / `lg` 字号改为 `text-sm` / `text-lg`。**仅 `showToday` 时渲染。** |
| `footerDisabled` | 今天不可选时的附加样式，默认 `text-gray-5 cursor-not-allowed hover:opacity-100`。**不是独立节点**，合并进 `footer`。                                                           |

**日期时间复合视图（`datetime` / `datetimerange`）**

| 键名                      | 说明                                                                                                                                             |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dateTimeHeader`          | 「日期段 / 时间段」切换条的容器，默认 `flex items-center justify-center gap-2 w-full`。                                                          |
| `dateTimeSegment`         | 切换条中的单个段落，默认 `ring-1 ring-gray-3 text-sm h-6 leading-6 w-24 text-center rounded-md transition-all text-gray-7 flex-1`。              |
| `dateTimeSegmentActive`   | 可点击段落的附加样式，默认 `cursor-pointer hover:ring-primary/50 hover:text-primary`。**不是独立节点**，合并进 `dateTimeSegment`。               |
| `dateTimeSegmentDisabled` | 不可点击段落的附加样式，默认 `cursor-not-allowed`。合并进 `dateTimeSegment`。                                                                    |
| `dateTimeSeparator`       | 两个段落之间的 `/` 分隔符，默认 `text-gray-3 font-light`。                                                                                       |

```vue
<template>
  <RebornDatePickerPanel
    v-model="range"
    type="daterange"
    :ui="{
      wrapper: 'rounded-xl shadow-lg',
      day: 'rounded-full',
      dayActive: 'bg-error text-white hover:bg-error/90',
      dayInRange: 'bg-error/10',
      title: 'text-base font-semibold',
    }"
  />
</template>
```

## 注意事项

- **不传 `valueFormat` 时绑定值是 `Date`**。面板每次抛出的都是新的 `Date` 实例；要与后端字符串对接，请显式设置 `valueFormat`，否则 `v-model` 拿到的不是字符串。
- **范围选择中途的绑定值只有一端**。点下起点时 `update:modelValue` 就会抛出 `[start, ""]`，`change` 要等终点选定才抛；依赖完整区间的逻辑请监听 `change` 而非 `v-model`。
- **`dates` 类型不抛 `change`**。多选日期每次点选只更新 `v-model`，没有「选择完成」的时点；需要提交时机请自行加确认按钮。
- **`week` 类型不抛 `calendar-change`，也不显示周数**。一次点选即选中整周，没有「只选了起点」的中间态；它本身就是按周选择，`showWeekNumber` 对它无效。
- **取消联动后左侧必须早于右侧**。`unlinkPanels` 下两侧已相邻时，左侧的「下一页」和右侧的「上一页」置灰不响应（`navBtnDisabled`）；日期视图的跨年按钮要求两侧相隔超过 12 个月才可用。
- **`singlePanel` 优先于 `unlinkPanels`**。只剩一个面板时不存在联动关系，同时传入时 `unlinkPanels` 无效。
- **单面板点击补位格会翻页**。点中上下月的日期后，面板翻到该日期所在月份，以便看到选中结果；双面板下点击补位格不翻页，选中结果在日期真正归属的那一侧面板显示。
- **多选类型的「今天」只追加不取消**。今天已在选中集合里时再点「今天」不做处理，取消请直接点对应的格子。
- **`clear()` 不受 `disabled` 限制**。禁用只拦截用户操作，程序化清空照常生效，并依次抛出 `update:modelValue`、`change`（原本有值时）与 `clear`。
