---
title: DatePicker 日期选择器
description: 表单日期选择器：触发器与 Select 同形态、尺寸、配色，下拉为日期面板，支持 15 种类型，仅 Web。
category: 表单与输入
platform: web
tags: [calendar, date, picker, select]
badge: New
---

::warning
仅 Web 端提供。UniApp 端改用 `reborn-select-date`。
::

::ComponentViewer{demoFile="RebornDatePickerDemo.vue" config="RebornDatePickerConfig" componentId="reborn-date-picker" dependencies="dayjs" :componentFiles='["RebornDatePicker.vue", "reborn-date-picker.config.ts"]'}
::

> 源码面板只列 date-picker 自身目录下的文件。触发器 `RebornSelectTrigger` 与下拉内容 `RebornDatePickerPanel` 是独立组件，源码分别见 `reborn-select-trigger`、`reborn-date-picker-panel` 组件页。

## 简介

DatePicker 由两部分拼成：触发器沿用 `RebornSelectTrigger`，下拉内容就是 `RebornDatePickerPanel`。面板的类型、可选范围、禁用方法、快捷选项、周数、双面板与「今天」栏参数原样透传，参数名和含义与面板页一致，这些参数学一次就能两边通用。

触发器的类名逐条照搬 `reborn-select.config.ts`：`variant`、`size`、`color`、多选标签换行、禁用与错误态都相同。同一表单里 Select 与 DatePicker 并排时，高度、描边、字号和聚焦色一致。

面板里的点选先落在内部草稿上，满足条件才写回绑定值：单值与范围类型选定即写回并收起，多选类型每点一项写回，带时间的类型起止完整时写回但不收起。只选了开始日期就收起时，这个半成品会被丢弃。

### 何时使用

- 表单里需要一个日期字段，并与 `RebornSelect`、`RebornInput` 保持同一套 `variant` 与 `size`。
- 选年、季度、月、周、日或日期时间，用 `type` 切换粒度，无需换组件。
- 选一段区间，用 `daterange` 等范围类型；起止相隔较远时开启 `unlinkPanels`。
- 一次勾选多个日期，用 `dates` / `months` 等多选类型，标签过多时开启 `collapseTags`。
- 需要接入 `RebornForm` 校验，出错时触发器描边变红。

### 何时不使用

- 日期面板要常驻页面、不需要触发器 —— 改用 `reborn-date-picker-panel`。
- 只选时分秒，不涉及日期 —— 改用 `reborn-time-picker`。
- UniApp 端的日期选择 —— 改用 `reborn-select-date`。

## 用法

### 基础用法

点击触发器展开日期面板，选中后自动收起。不传 `value-format` 时绑定值是 `Date` 对象，传了则按格式输出字符串；`format` 只改触发器里的展示文本，不影响绑定值。

```vue
<script setup lang="ts">
const dateValue = ref(null);
const stringValue = ref("2024-04-03");
</script>

<template>
  <RebornDatePicker
    v-model="dateValue"
    class="w-full"
  />
  <RebornDatePicker
    v-model="stringValue"
    value-format="YYYY-MM-DD"
    format="YYYY 年 M 月 D 日"
    class="w-full"
  />
</template>
```

`format` 缺省时按类型取默认格式：

| 类型                                  | 默认 `format`         |
| ------------------------------------- | --------------------- |
| `year` / `years` / `yearrange`        | `YYYY`                |
| `month` / `months` / `monthrange`     | `YYYY-MM`             |
| `quarter` / `quarters` / `quarterrange` | `YYYY-[Q]Q`         |
| `datetime` / `datetimerange`          | `YYYY-MM-DD HH:mm:ss` |
| 其余                                  | `YYYY-MM-DD`          |

### 选择类型

`type` 决定面板粒度与绑定值形态；占位文本缺省时随类型切换，例如 `month` 显示「请选择月份」。`datetime` 需要在面板里调时分秒，选完日期不会立即收起。

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

示例值假定 `valueFormat` 分别为 `YYYY`、`YYYY-[Q]Q`、`YYYY-MM`、`YYYY-MM-DD`、`YYYY-MM-DD HH:mm`。不传 `valueFormat` 时单值为 `Date`，多值为 `Date[]`；清空后单值为 `null`，多选与范围类型为 `[]`。

```vue
<script setup lang="ts">
const weekValue = ref([]);
const quarterValue = ref(null);
const datetimeValue = ref(null);
</script>

<template>
  <RebornDatePicker
    v-model="weekValue"
    type="week"
    value-format="YYYY-MM-DD"
  />
  <RebornDatePicker
    v-model="quarterValue"
    type="quarter"
    value-format="YYYY-[Q]Q"
  />
  <RebornDatePicker
    v-model="datetimeValue"
    type="datetime"
    value-format="YYYY-MM-DD HH:mm:ss"
    show-week-number
  />
</template>
```

### 范围选择

范围类型的触发器分成开始、结束两栏，起止都选定才写回绑定值；只点了开始日期就收起，这个半成品会被丢弃。`unlink-panels` 让左右面板各自翻页，`single-panel` 只保留一个面板。

| 属性           | 效果                                     | 典型用途                   |
| -------------- | ---------------------------------------- | -------------------------- |
| 默认           | 双面板联动，右侧始终紧跟左侧             | 区间通常落在相邻两个月内   |
| `unlinkPanels` | 双面板各自翻页，左侧始终早于右侧         | 起止相隔很远，例如跨年对比 |
| `singlePanel`  | 只渲染一个面板，起止都在这一个面板里点选 | 容器宽度不够放两个面板     |

```vue
<script setup lang="ts">
const rangeValue = ref([]);
const monthRangeValue = ref([]);
</script>

<template>
  <RebornDatePicker
    v-model="rangeValue"
    type="daterange"
    value-format="YYYY-MM-DD"
    unlink-panels
  />
  <RebornDatePicker
    v-model="monthRangeValue"
    type="monthrange"
    value-format="YYYY-MM"
    range-separator="→"
    start-placeholder="入职月份"
    end-placeholder="离职月份"
  />
</template>
```

### 多选与标签折叠

`dates` / `months` / `years` / `quarters` 每点一项立即写回，面板保持展开以便继续勾选。已选项以标签展示，默认逐行铺开；开启 `collapse-tags` 后超出 `max-collapse-tags` 的部分合并为 +N，触发器高度保持不变。

```vue
<script setup lang="ts">
const datesValue = ref([]);
</script>

<template>
  <RebornDatePicker
    v-model="datesValue"
    type="dates"
    value-format="YYYY-MM-DD"
    collapse-tags
    collapse-tags-tooltip
    :max-collapse-tags="2"
  />
</template>
```

### 形态、尺寸与配色

`variant`、`size`、`color` 与 `RebornSelect` 共用同一套类名，同一表单里两者并排时高度、描边与聚焦色一致。`color` 还会下发给面板，决定选中日期的底色。

| 形态         | 效果                                   | 典型用途                     |
| ------------ | -------------------------------------- | ---------------------------- |
| `outlined`   | 底色 + 1px 描边（默认）                | 常规表单                     |
| `filled`     | 灰底、透明描边，展开时转为底色         | 背景较空、需要弱化边框的表单 |
| `borderless` | 无背景无描边，水平内边距归零           | 嵌在表格单元格或文本行里     |
| `underlined` | 只保留底部下划线，圆角压平             | 极简风格的表单               |

```vue
<template>
  <RebornDatePicker
    v-model="value"
    variant="filled"
    size="lg"
    color="success"
    value-format="YYYY-MM-DD"
  />
</template>
```

### 可选范围与禁用日期

`start` / `end` 圈定整体可选区间；`disabled-method` 逐项判定，第二个参数 `unit` 标明当前是日、周、月、季度还是年粒度；`disabled-hours` 等方法只作用于带时间的类型。

```vue
<script setup lang="ts">
const value = ref(null);
const timeValue = ref(null);

// 只在日期粒度禁用周末，年 / 月视图不受影响
function disableWeekend(date: Date, unit: string) {
  const day = date.getDay();
  return unit === "date" && (day === 0 || day === 6);
}

// 只开放 9:00-18:00
function disableNightHours() {
  return [0, 1, 2, 3, 4, 5, 6, 7, 8, 19, 20, 21, 22, 23];
}
</script>

<template>
  <RebornDatePicker
    v-model="value"
    value-format="YYYY-MM-DD"
    start="2024-01-01"
    end="2024-12-31"
    :disabled-method="disableWeekend"
  />
  <RebornDatePicker
    v-model="timeValue"
    type="datetime"
    value-format="YYYY-MM-DD HH:mm:ss"
    :disabled-hours="disableNightHours"
  />
</template>
```

### 快捷选项

`shortcuts` 在面板左侧列出常用日期，点击后直接写回并收起。`value` 写成函数才能每次点击都按当天重新计算，范围类型的函数返回 `[起点, 终点]`。

```vue
<script setup lang="ts">
const rangeValue = ref([]);

function daysFromToday(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d;
}

const rangeShortcuts = [
  { text: "最近 7 天", value: () => [daysFromToday(-6), daysFromToday(0)] },
  { text: "最近 30 天", value: () => [daysFromToday(-29), daysFromToday(0)] },
];
</script>

<template>
  <RebornDatePicker
    v-model="rangeValue"
    type="daterange"
    value-format="YYYY-MM-DD"
    :shortcuts="rangeShortcuts"
  />
</template>
```

### 今天栏

`show-today` 在面板底部加一栏，点击选中当前时间所在的单位，文案随类型变为「今天」「本周」「本月」「本季度」「今年」。写回时机与手动点选一致：单值与范围类型写回并收起，多选类型只追加、面板不收。

- `datetime` 显示「此刻」，日期取今天，时分秒取点击时的时间；与手动点选一样写回后不收起，点击外部收起。
- 范围类型的起止都落在当前单位上，例如 `daterange` 得到 `[今天, 今天]`；`datetimerange` 的起止时间取 `00:00:00` 与 `23:59:59`，覆盖一整天。
- 今天被 `start` / `end` / `disabled-method` 排除时，这一栏置灰且点击无效；`datetime` 另外校验此刻的时分秒是否落在 `disabled-hours` 等方法返回的禁用项里。

```vue
<script setup lang="ts">
const value = ref(null);
const monthValue = ref(null);
</script>

<template>
  <RebornDatePicker
    v-model="value"
    value-format="YYYY-MM-DD"
    show-today
  />
  <RebornDatePicker
    v-model="monthValue"
    type="month"
    value-format="YYYY-MM"
    show-today
  />
</template>
```

### 加载与禁用

`loading` 把尾部图标换成转圈并隐藏清空按钮，只作用于触发器，面板照常可选；`disabled` 后触发器置灰、点击无响应。

```vue
<template>
  <RebornDatePicker
    v-model="value"
    value-format="YYYY-MM-DD"
    loading
  />
  <RebornDatePicker
    v-model="rangeValue"
    type="daterange"
    value-format="YYYY-MM-DD"
    disabled
  />
</template>
```

### 页头与页脚

`header` / `footer` 插槽分别渲染在面板上方和下方，自带分隔线，适合放说明文字或提示。不传插槽时对应的容器不渲染。

```vue
<template>
  <RebornDatePicker
    v-model="value"
    value-format="YYYY-MM-DD"
    :disabled-method="disableWeekend"
  >
    <template #header>请选择到店日期</template>
    <template #footer>
      <span class="flex items-center gap-1">
        <Icon
          name="lucide:info"
          class="size-3.5"
        />周末门店休息，不可预约
      </span>
    </template>
  </RebornDatePicker>
</template>
```

### 自定义单元格与导航图标

`cell` 插槽接管每个格子的内容，作用域参数与面板的 `default` 插槽相同；`prev-month` / `next-month` / `prev-year` / `next-year` 替换翻页按钮里的图标。

```vue
<template>
  <RebornDatePicker
    v-model="value"
    value-format="YYYY-MM-DD"
  >
    <template #cell="{ type, text }">
      <span v-if="type === 'date'">{{ text }}</span>
      <span v-else-if="type === 'month'">{{ text }}月</span>
      <span v-else-if="type === 'quarter'">第{{ text }}季度</span>
      <span v-else>{{ text }}</span>
    </template>
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
</template>
```

### 自定义触发器

`default` 插槽只替换触发器的文本区，尾部箭头与清空按钮保留；`cover` 插槽连同尾部图标区一起接管。两者的作用域参数都有 `displayText`、`placeholder`、`isOpen` 和 `ui`，`ui` 是触发器的类名函数，调用它能沿用内置的文本与占位样式。

```vue
<template>
  <RebornDatePicker
    v-model="value"
    value-format="YYYY-MM-DD"
  >
    <template #default="{ displayText, placeholder, ui }">
      <span class="flex min-w-0 flex-1 items-center gap-2">
        <Icon
          name="lucide:plane"
          class="text-primary size-4 shrink-0"
        />
        <span :class="displayText ? ui.triggerText() : ui.placeholder()">
          {{ displayText || placeholder }}
        </span>
      </span>
    </template>
  </RebornDatePicker>
</template>
```

### 事件

除 `RebornSelect` 已有的 `change`、`clear`、`remove-tag`、`visible-change` 外，还转发面板的 `calendar-change`（仅范围类型）与 `panel-change`。通过实例调用 `clear()` 与点清空按钮效果相同。

```vue
<script setup lang="ts">
const picker = ref();
const value = ref([]);
</script>

<template>
  <RebornDatePicker
    ref="picker"
    v-model="value"
    type="daterange"
    value-format="YYYY-MM-DD"
    @change="(v) => console.log('change', v)"
    @visible-change="(visible) => console.log('visible-change', visible)"
    @calendar-change="(range) => console.log('calendar-change', range)"
    @panel-change="(date, mode, view) => console.log('panel-change', date, mode, view)"
  />
  <RebornButton @click="picker?.clear()">清空</RebornButton>
</template>
```

### 与表单联动

放进 `RebornFormItem` 后，选中值会触发 change 校验，收起面板会触发 blur 校验，出错时触发器描边变红；表单的 `size` 与 `disabled` 同样会下发。

```vue
<script setup lang="ts">
import { z } from "zod";

const formModel = reactive({ departDate: "", tripRange: [] as string[] });
const formRules = z.object({
  departDate: z.string({ message: "请选择出发日期" }).min(1, "请选择出发日期"),
  tripRange: z.array(z.string()).length(2, "请选择行程区间"),
});
</script>

<template>
  <RebornForm
    :model-value="formModel"
    :rules="formRules"
    :trigger="['change', 'blur']"
  >
    <RebornFormItem
      label="出发日期"
      prop="departDate"
    >
      <RebornDatePicker
        v-model="formModel.departDate"
        value-format="YYYY-MM-DD"
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
      />
    </RebornFormItem>
  </RebornForm>
</template>
```

### 自定义样式

样式分三条通道：`trigger-ui` 覆盖触发器盒子（含范围两栏与分隔符），`panel-ui` 原样透传给日期面板，`ui` 覆盖浮层页头页脚与多选标签。

```vue
<template>
  <RebornDatePicker
    v-model="rangeValue"
    type="daterange"
    value-format="YYYY-MM-DD"
    :trigger-ui="{ trigger: 'border-dashed border-2 rounded-2xl h-14', rangeSeparator: 'text-primary' }"
    :panel-ui="{ dayActive: 'bg-success text-gray-1 rounded-full hover:bg-success' }"
  />
  <RebornDatePicker
    v-model="datesValue"
    type="dates"
    value-format="YYYY-MM-DD"
    :ui="{ tag: 'border-primary/30 bg-primary/10 text-primary', dropdownHeader: 'font-medium text-gray-9' }"
  >
    <template #header>可多选，已选 {{ datesValue.length }} 天</template>
  </RebornDatePicker>
</template>
```

## API

### Props

| 属性名                 | 类型                                                                                                                                                                                                      | 默认值          | 描述                                                                                              |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------- |
| `modelValue` / v-model | `any`                                                                                                                                                                                                     | `null`          | 绑定值，形态随 `type` 与 `valueFormat` 变化，见「选择类型」。                                     |
| `type`                 | `'year' \| 'years' \| 'yearrange' \| 'quarter' \| 'quarters' \| 'quarterrange' \| 'month' \| 'months' \| 'monthrange' \| 'date' \| 'dates' \| 'daterange' \| 'week' \| 'datetime' \| 'datetimerange'` | `'date'`        | 选择器类型，决定粒度与单选 / 多选 / 范围。                                                        |
| `valueFormat`          | `string`                                                                                                                                                                                                  | `""`            | 绑定值的 dayjs 格式；为空时绑定值为 `Date` 对象。                                                 |
| `format`               | `string`                                                                                                                                                                                                  | `""`            | 触发器展示文本的 dayjs 格式，不影响绑定值；缺省值见「基础用法」。                                 |
| `start`                | `string`                                                                                                                                                                                                  | `'1970-01-01'`  | 可选日期的最早边界（含）。                                                                        |
| `end`                  | `string`                                                                                                                                                                                                  | `'2099-12-31'`  | 可选日期的最晚边界（含）。                                                                        |
| `disabledMethod`       | `(date: Date, unit: 'year' \| 'month' \| 'quarter' \| 'week' \| 'date') => boolean`                                                                                                                      | -               | 逐项判定是否禁用，返回 `true` 即不可选；`unit` 为当前判定粒度。                                   |
| `disabledHours`        | `(role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                                                  | -               | 返回需禁用的小时；仅 `datetime` / `datetimerange` 生效。                                          |
| `disabledMinutes`      | `(hour: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                                    | -               | 返回需禁用的分钟，入参为当前选中的小时。                                                          |
| `disabledSeconds`      | `(hour: number, minute: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                    | -               | 返回需禁用的秒，入参为当前选中的时、分。                                                          |
| `disabledMilliseconds` | `(hour: number, minute: number, second: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                    | -               | 返回需禁用的毫秒，入参为当前选中的时、分、秒。                                                    |
| `shortcuts`            | `{ text: string; value: any }[]`                                                                                                                                                                          | `[]`            | 快捷选项，非空时面板左侧出现快捷侧栏。                                                            |
| `activeType`           | `'fill' \| 'fillRound' \| 'outline' \| 'text'`                                                                                                                                                            | `'fill'`        | 面板选中项的表现形式，透传给面板。                                                                |
| `showWeekNumber`       | `boolean`                                                                                                                                                                                                 | `false`         | 日期视图左侧显示 ISO 周数；`week` 类型不生效。                                                    |
| `unlinkPanels`         | `boolean`                                                                                                                                                                                                 | `false`         | 范围类型取消两个面板的联动；`singlePanel` 时无效。                                                |
| `singlePanel`          | `boolean`                                                                                                                                                                                                 | `false`         | 范围类型只渲染一个面板。                                                                          |
| `showToday`            | `boolean`                                                                                                                                                                                                 | `false`         | 面板底部显示「今天」栏，点击选中当前时间所在的单位，见「今天栏」。                                |
| `placeholder`          | `string`                                                                                                                                                                                                  | -               | 单值与多选类型的占位文本；缺省时随类型取「请选择日期」「请选择月份」等。                          |
| `startPlaceholder`     | `string`                                                                                                                                                                                                  | -               | 范围类型开始栏的占位文本；缺省时随类型取「开始日期」「开始月份」等。                              |
| `endPlaceholder`       | `string`                                                                                                                                                                                                  | -               | 范围类型结束栏的占位文本；缺省时随类型取「结束日期」「结束月份」等。                              |
| `rangeSeparator`       | `string`                                                                                                                                                                                                  | `"至"`          | 范围类型起止之间的分隔符。                                                                        |
| `collapseTags`         | `boolean`                                                                                                                                                                                                 | `false`         | 多选时把超出的标签合并为一段 `+N`。                                                               |
| `collapseTagsTooltip`  | `boolean`                                                                                                                                                                                                 | `false`         | 悬停 `+N` 时以气泡展示被折叠的日期，需先开启 `collapseTags`。                                     |
| `maxCollapseTags`      | `number`                                                                                                                                                                                                  | `1`             | 折叠前最多展示的标签个数，仅在 `collapseTags` 开启时生效。                                        |
| `disabled`             | `boolean`                                                                                                                                                                                                 | `false`         | 是否禁用，可被外层 `RebornForm` 覆盖。                                                            |
| `clearable`            | `boolean`                                                                                                                                                                                                 | `true`          | 有值时悬停触发器显示清空按钮，与箭头共用尾部位置。                                                |
| `loading`              | `boolean`                                                                                                                                                                                                 | `false`         | 尾部图标换成加载指示器并隐藏清空按钮。                                                            |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                                                                                                                                                                    | `'md'`          | 尺寸档位，同时下发给面板；可被外层 `RebornForm` 覆盖。                                            |
| `color`                | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'`                                                                                                                    | `'primary'`     | 触发器聚焦 / 展开描边色，同时下发给面板决定选中色。                                               |
| `variant`              | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'`                                                                                                                                                  | `'outlined'`    | 形态变体，与 `RebornSelect` 同一套形态语言。                                                      |
| `showArrow`            | `boolean`                                                                                                                                                                                                 | `true`          | 是否显示尾部图标。                                                                                |
| `arrowAnimation`       | `boolean`                                                                                                                                                                                                 | `true`          | 展开时尾部图标是否旋转 180°。                                                                     |
| `icon`                 | `string`                                                                                                                                                                                                  | `'lucide:calendar'` | 尾部图标名。                                                                                  |
| `closeOn`              | `'click' \| 'mousedown'`                                                                                                                                                                                  | `'click'`       | `click` 为外部完成一次点击后收起，`mousedown` 为外部按下即收（滚动亦收）。                        |
| `portal`               | `boolean`                                                                                                                                                                                                 | `true`          | 浮层是否传送到 `body`；关掉后会随父容器滚动并被 `overflow` 裁剪。                                 |
| `autoAdjustOverflow`   | `boolean`                                                                                                                                                                                                 | `true`          | 下方空间不足且上方更宽裕时向上展开；关闭后固定向下。                                              |
| `class`                | `any`                                                                                                                                                                                                     | -               | 追加到触发器外层容器的类名，宽度用它设置。                                                        |
| `ui`                   | `Partial<Record<'panel' \| 'dropdownHeader' \| 'dropdownFooter' \| 'tagList' \| 'tag' \| 'tagLabel' \| 'tagClose' \| 'tagCloseIcon' \| 'collapseTag', ClassValue>>`                                                                                                                                                                              | -               | 浮层页头页脚与多选标签的样式覆盖，键位见「自定义样式（ui）」。                                    |
| `triggerUi`            | `SelectTriggerProps["ui"] & DatePickerFieldUI`                                                                                                                                                                              | -               | 触发器盒子与浮层外壳的样式覆盖，键位见「子组件样式入口」。                                        |
| `panelUi`              | `DatePickerPanelProps["ui"]`                                                                                                                                                                              | -               | 原样透传给 `RebornDatePickerPanel` 的 `ui`。                                                      |

### Emits

| 事件名              | 回调参数                                                                                   | 描述                                                                                         |
| ------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: any)`                                                                             | 绑定值写回时触发（由 `defineModel` 生成），时机与 `change` 相同。                            |
| `change`            | `(value: any)`                                                                             | 绑定值写回后触发；清空与移除标签同样触发。写回时机见「简介」。                               |
| `remove-tag`        | `(value: any)`                                                                             | 多选类型点标签上的关闭按钮时触发，参数为被移除的值。                                         |
| `clear`             | `()`                                                                                       | 点清空按钮或调用 `clear()` 后触发，先于 `change`。                                           |
| `visible-change`    | `(visible: boolean)`                                                                       | 面板展开或收起时触发。                                                                       |
| `calendar-change`   | `(value: [Date, Date \| null])`                                                            | 转发自面板：范围类型点选日期或选中数组型快捷选项时触发；只选了起点时终点为 `null`，`week` 类型不触发。           |
| `panel-change`      | `(date: Date \| [Date, Date], mode: 'month' \| 'year', view: 'year' \| 'month' \| 'date')` | 转发自面板：翻页、切换视图或下钻时触发，参数含义见 `reborn-date-picker-panel`。              |

### Slots

| 插槽名       | 作用域参数                                | 描述                                                        |
| ------------ | ----------------------------------------- | ----------------------------------------------------------- |
| `default`    | `{ displayText, placeholder, isOpen, ui }` | 替换触发器的文本区，尾部箭头与清空按钮保留。                |
| `cover`      | `{ displayText, placeholder, isOpen, ui }` | 接管整个触发器内容，包括尾部图标区。                        |
| `header`     | -                                         | 面板上方的页头，自带下分隔线。                              |
| `footer`     | -                                         | 面板下方的页脚，自带上分隔线。                              |
| `cell`       | `DatePickerCell`                          | 自定义单元格内容，对应面板的 `default` 插槽。               |
| `prev-month` | -                                         | 日期视图「上个月」按钮的图标。                              |
| `next-month` | -                                         | 日期视图「下个月」按钮的图标。                              |
| `prev-year`  | -                                         | 「上一年」按钮的图标。                                      |
| `next-year`  | -                                         | 「下一年」按钮的图标。                                      |

`default` / `cover` 的作用域参数：

| 字段          | 类型                                          | 说明                                                      |
| ------------- | --------------------------------------------- | --------------------------------------------------------- |
| `displayText` | `string`                                      | 按 `format` 格式化后的展示文本；无值时为空字符串。        |
| `placeholder` | `string`                                      | 当前生效的占位文本。                                      |
| `isOpen`      | `boolean`                                     | 面板是否展开。                                            |
| `ui`          | `Record<keyof typeof theme.slots, (opts?: { class?: any }) => string>` | 组件全部样式槽位的类名函数，如 `ui.triggerText()`、`ui.placeholder()`，已合并 `triggerUi` / `ui` 覆盖。 |

`cell` 的作用域参数 `DatePickerCell`：

| 字段       | 类型                                       | 说明                                                             |
| ---------- | ------------------------------------------ | ---------------------------------------------------------------- |
| `type`     | `'year' \| 'month' \| 'quarter' \| 'date'` | 格子所属视图。                                                   |
| `text`     | `number`                                   | 默认显示的数字：年份、月份（1-12）、季度号（1-4）或日。          |
| `date`     | `Date`                                     | 格子代表的日期；年、月、季度取其首日。                           |
| `disabled` | `boolean`                                  | 是否不可选。                                                     |
| `selected` | `boolean`                                  | 是否为选中项；范围类型只有首尾两端为 `true`。                    |
| `inRange`  | `boolean`                                  | 是否落在范围之内，含悬停预览。                                   |
| `isToday`  | `boolean`                                  | 是否为今天 / 本月 / 本季度 / 今年。                              |
| `outside`  | `boolean`                                  | 是否为补位格：日期视图的上下月、年份视图当前十年页之外的年份。   |

### Expose

| 方法名  | 签名         | 描述                                                                  |
| ------- | ------------ | --------------------------------------------------------------------- |
| `clear` | `() => void` | 清空为 `null`（单值）或 `[]`（多选与范围），依次抛出 `clear`、`change`。 |

### 自定义样式（ui）

`ui` 管浮层里的页头页脚、面板容器与多选标签，9 个键逐字来自 `reborn-date-picker.config.ts` 的 `slots` 中非触发器部分。触发器盒子与浮层外壳走 `triggerUi`，面板内部走 `panelUi`。每个键都以 `cn(内置类, ui.键)` 合并，调用方的类排在最后，冲突时胜出。

| 键名             | 对应节点                   | 默认关键类名                                          | 渲染 / 失效条件                                         |
| ---------------- | -------------------------- | ----------------------------------------------------- | ------------------------------------------------------- |
| `panel`          | 包住日期面板的容器         | `w-max`                                               | 始终渲染                                                |
| `dropdownHeader` | 页头容器                   | `border-b border-gray-3 px-[10px] py-[6px] text-sm`   | 仅传入 `header` 插槽时渲染                              |
| `dropdownFooter` | 页脚容器                   | `border-t border-gray-3 px-[10px] py-[6px] text-sm`   | 仅传入 `footer` 插槽时渲染                              |
| `tagList`        | 多选标签区                 | `flex min-w-0 flex-1 gap-1 overflow-hidden`           | 仅多选且有已选项时渲染；使用 `default` / `cover` 插槽后不渲染 |
| `tag`            | 单个标签                   | `rounded-sm! border-gray-3 bg-gray-2 text-gray-9`     | 作为 `RebornBadge` 的 `base` 下发                       |
| `tagLabel`       | 标签文字                   | `truncate`                                            | 同 `tagList`                                            |
| `tagClose`       | 标签关闭按钮               | `shrink-0 text-gray-5 hover:text-gray-8`              | 组件禁用时不渲染                                        |
| `tagCloseIcon`   | 标签关闭图标               | `size-full`                                           | 同 `tagClose`                                           |
| `collapseTag`    | 折叠后的 `+N` 标签         | 空                                                    | 以 `ui.tag({ class: ui.collapseTag() })` 叠加；仅开启 `collapseTags` 且有折叠项时渲染 |

::tip
`tag` 的圆角与各档高度（`h-4!` / `h-5!` / `h-6!`）带 `!`，是为了压过 `RebornBadge` 自身的尺寸类。覆盖这两类属性时同样要写 `!`，例如 `rounded-full!`。
::

```vue
<template>
  <RebornDatePicker
    v-model="datesValue"
    type="dates"
    value-format="YYYY-MM-DD"
    :ui="{
      tag: 'border-primary/30 bg-primary/10 text-primary rounded-full!',
      dropdownHeader: 'font-medium text-gray-9',
    }"
  >
    <template #header>可多选，已选 {{ datesValue.length }} 天</template>
  </RebornDatePicker>
</template>
```

### 子组件样式入口

下面这些键**不属于 `reborn-date-picker` 自身**——它们改的是内部子组件的样式，通过 `triggerUi` / `panelUi` 透传下去，键位与默认值以对应子组件页为准。

#### `triggerUi`（13 个键，`RebornSelectTrigger`）

`triggerUi` 里两部分键混写，组件内部自动拆分：浮层外壳的 4 个键交给 `RebornSelectTrigger`，其余 9 个键合并进触发器盒子的类名。

| 名称                 | 归属     | 描述                                                   |
| -------------------- | -------- | ------------------------------------------------------ |
| `wrapper`            | 浮层外壳 | 触发器与浮层的共同外层容器                             |
| `dropdown`           | 浮层外壳 | 浮层容器；组件已追加 `w-max min-w-0`，宽度随面板撑开   |
| `dropdownInner`      | 浮层外壳 | 浮层内层滚动容器                                       |
| `arrow`              | 浮层外壳 | 浮层指向触发器的小箭头，不是触发器尾部图标             |
| `trigger`            | 触发器   | 触发器盒子，形态、尺寸、配色类名都落在这里             |
| `triggerText`        | 触发器   | 单值与多选的已选文本                                   |
| `triggerIconWrapper` | 触发器   | 尾部图标区                                             |
| `placeholder`        | 触发器   | 占位文本，范围类型未选的一栏也用它着色                 |
| `clearBtn`           | 触发器   | 清空按钮                                               |
| `triggerLoadingIcon` | 触发器   | 加载指示器                                             |
| `rangeWrapper`       | 触发器   | 范围类型开始 / 结束两栏的容器                          |
| `rangeText`          | 触发器   | 范围类型的开始 / 结束文本                              |
| `rangeSeparator`     | 触发器   | 范围类型起止之间的分隔符                               |

::warning
`triggerUi.arrow` 改的是浮层小箭头。触发器尾部日历图标的类名不在 `triggerUi` 里：换图标用 `icon`，隐藏用 `:show-arrow="false"`，关旋转用 `:arrow-animation="false"`；需要改样式时用 `default` / `cover` 插槽自绘。
::

#### `panelUi`（`RebornDatePickerPanel`）

`panelUi` 原样作为面板的 `ui` 传入，键位与默认类名见 `reborn-date-picker-panel` 的「自定义样式（ui）」。面板的 `border`、`width`、`overflow`、`disabled`、`class` 由组件固定或不下发，无法通过 `panelUi` 改变其行为。

## 注意事项

- **写回时机随类型不同**。单值与范围类型选定即写回并收起；多选类型每点一项写回、面板不收；`datetime` / `datetimerange` 在值完整时写回，但要点击外部才收起。
- **范围只选一半会被丢弃**。点了开始日期就收起面板，绑定值保持原样；下次展开时草稿按绑定值重置。
- **多选类型的「今天」只追加不取消**。今天已在选中集合里时再点「今天」不做处理，取消请点对应格子或标签的关闭按钮。
- **清空结果不是空字符串**。单值类型清空为 `null`，多选与范围类型清空为 `[]`；表单规则要按这个形态写，例如范围用 `z.array().length(2)`。
- **`loading` 只作用于触发器**。它隐藏清空按钮并换掉尾部图标，面板照常可展开、可选，需要禁止操作请同时传 `disabled`。
- **`cell` 插槽要按 `type` 分支**。四种视图共用这一个插槽，只写日期格的内容会让年、月、季度视图也显示成日期样式。
- **`clear()` 不检查禁用状态**。点击清空按钮在禁用时不可达，但通过实例调用 `clear()` 仍会清空并抛出事件，调用方需自行判断。
- **校验在写回与外部收起时触发**。写回时跑 `change` 校验，点击外部收起时跑 `blur` 校验；按 Esc 或再次点击触发器收起不触发 `blur`。
- **`style` 属性不生效**。组件关闭了属性继承且未转发 `$attrs`，宽度等尺寸请用 `class` 设置。
- **不要写 `dark:` 前缀**。触发器与面板的颜色都来自会随主题切换的灰阶与语义色 token，覆盖样式时直接写 `bg-gray-2`、`text-primary` 即可。
