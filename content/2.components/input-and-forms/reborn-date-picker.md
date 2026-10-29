---
title: DatePicker 日期选择器
description: 双端日期选择器：Web 下拉日期面板支持 16 种类型，UniApp 底部弹出滚轮选年月日时分秒与范围。
category: 表单与输入
platform: both
tags: [calendar, date, picker, select, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornDatePickerDemo.vue" config="RebornDatePickerConfig" componentId="reborn-date-picker" dependencies="dayjs" :componentFiles='["RebornDatePicker.vue", "reborn-date-picker.config.ts", "reborn-date-picker.input.ts"]' :uniappFiles='["RebornDatePicker.vue", "reborn-date-picker.config.ts", "types.ts", "RebornButton.vue", "reborn-button.config.ts", "RebornPickerView.vue", "reborn-picker-view.config.ts", "RebornPopup.vue", "reborn-popup.config.ts", "RebornSelectTrigger.vue", "reborn-select-trigger.config.ts"]'}
::

> Web 端源码面板只列 date-picker 自身目录下的文件。触发器 `RebornSelectTrigger` 与下拉内容 `RebornDatePickerPanel` 是独立组件，源码分别见 `reborn-select-trigger`、`reborn-date-picker-panel` 组件页。

## 简介

DatePicker 两端同名，交互按端适配：Web 端是「触发器 + 下拉日期面板」，适合鼠标点选与跨月浏览；UniApp 端是「触发器 + 底部弹出层 + 滚轮」，适合手指拨动。两端共用 `v-model`、`format`、`valueFormat`、`start` / `end`、`placeholder`、`size`、`color`、`clearable`、`disabled` 这组参数和 `change` 事件，表单字段换端时这部分写法不用改。

粒度与范围的写法两端不同：Web 端的 `type` 一个参数同时决定粒度（年、季度、月、周、日、日期时间）和单选 / 多选 / 范围；UniApp 端的 `type` 只决定滚轮精确到哪一列（年 → 秒），范围要另开 `rangeable`，起止值绑定在 `v-model:values` 上。两端各自的取值见「两端差异对照」。

Web 端由两部分拼成：触发器沿用 `RebornSelectTrigger`，下拉内容就是 `RebornDatePickerPanel`。面板的类型、可选范围、禁用方法、快捷选项、周数、双面板与「今天」栏参数原样透传，参数名和含义与面板页一致，这些参数学一次就能两边通用。

触发器的类名逐条照搬 `reborn-select.config.ts`：`variant`、`size`、`color`、多选标签换行、禁用与错误态都相同。同一表单里 Select 与 DatePicker 并排时，高度、描边、字号和聚焦色一致。

面板里的点选先落在内部草稿上，满足条件才写回绑定值：单值与范围类型选定即写回并收起，多选类型每点一项写回，带时间的类型起止完整时写回但不收起。只选了开始日期就收起时，这个半成品会被丢弃。

### 何时使用

- 表单里需要一个日期字段，并与 `RebornSelect`、`RebornInput` 保持同一套 `variant` 与 `size`。
- 选年、季度、月、周、日或日期时间，用 `type` 切换粒度，无需换组件。
- 选一段区间，用 `daterange` 等范围类型；起止相隔较远时开启 `unlinkPanels`。
- 一次勾选多个日期，用 `dates` / `months` 等多选类型，标签过多时开启 `collapseTags`。
- 需要接入 `RebornForm` 校验，出错时触发器描边变红。
- UniApp 端选日期或时间：`type` 决定滚轮精确到年、月、日还是时分秒，`rangeable` 选起止区间并附带「近 7 天」等快捷项。

### 何时不使用

- 日期面板要常驻页面、不需要触发器 —— 改用 `reborn-date-picker-panel`。
- 只选时分秒，不涉及日期 —— 改用 `reborn-time-picker`。
- UniApp 端要把滚轮常驻在页面里、或滚轮内容不是日期 —— 改用 `reborn-picker-view`。

## 用法

::warning
除「滚轮粒度与范围（UniApp）」一节外，本节示例均为 Web 端写法。UniApp 端没有日期面板，面板类参数（多选、快捷侧栏、周数、双面板、今天栏、单元格插槽等）不生效，两端参数对照见「两端差异对照」。
::

### 基础用法

点击触发器展开日期面板，选中后自动收起。不传 `value-format` 时绑定值是 `Date` 对象，传了则按格式输出字符串；`format` 只改触发器里的展示文本，不影响绑定值。

Web 全部 16 种 `type` 均支持手动输入，编辑格式见下表。完整可选的输入会立即同步面板，按 Enter 或离开输入框后确认；范围必须两端完整，顺序写反会自动交换。编辑格式独立于 `format` 和 `valueFormat`，结束编辑后恢复 `format` 的展示格式。

多选在标签后输入，逗号分隔可一次追加多个值，已有值不会重复添加。`week` 输入一周中的任意日期后折算为该周周日至周六；`weekrange` 两端分别扩展到起始周的周日与结束周的周六。

输入会校验真实日期、`start` / `end` 和对应粒度的 `disabledMethod`，日期时间还会校验 `disabledHours` / `disabledMinutes` / `disabledSeconds` / `disabledMilliseconds`，范围按排序后的起止角色判定。年、月、季度与边界有交集时仍可输入。单值或范围输入越界、命中禁用规则时清空绑定值；多选丢弃本次追加并保留原标签。格式错误或不完整输入恢复原值，Esc 取消输入。

悬停面板中的可选日期会在触发器中以 `text-gray-5` 预览，移开恢复原值；预览不触发 `change`，点击才提交。触发器悬停边框跟随 `color`，日期浮层无描边，阴影为 `0 2px 13px 0 rgba(0, 0, 0, 0.13)`。

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

`format` 缺省时按类型取默认格式；手动输入固定使用右列格式：

| 类型 | 默认 `format` | 手动输入示例 |
| --- | --- | --- |
| `year` / `years` / `yearrange` | `YYYY` | `2026` |
| `month` / `months` / `monthrange` | `YYYY-MM` | `2026-10` |
| `quarter` / `quarters` / `quarterrange` | `YYYY-[Q]Q` | `2026-Q4` |
| `datetime` / `datetimerange` | `YYYY-MM-DD HH:mm:ss` | `2026-10-28 13:14:15` |
| `date` / `dates` / `daterange` / `week` / `weekrange` | `YYYY-MM-DD` | `2026-10-28` |

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
| `weekrange`     | `string[]` | `["2024-03-31", "2024-04-20"]`             |
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

`weekrange` 以整周为单位选择区间：面板按日期视图展示，点哪一天都会吸附到所在周，起点取那一周的周日、终点取那一周的周六，悬停预览同样按整周高亮。这样绑定值总是覆盖完整的周，后端按日期区间查询时不用再自行补齐首尾。周从周日开始，与日历表头一致。

```vue
<script setup lang="ts">
const weekRangeValue = ref([]);
</script>

<template>
  <RebornDatePicker
    v-model="weekRangeValue"
    type="weekrange"
    value-format="YYYY-MM-DD"
  />
</template>
```

### 滚轮粒度与范围（UniApp）

UniApp 端点击触发器从底部弹出滚轮，`type` 决定滚轮显示到哪一列：按「年、月、日、时、分、秒」的顺序截取前几列，表头文字取 `headers` 的对应项。`format` 与 `valueFormat` 缺省时都按 `type` 取下表的默认格式，两者分开传时触发器文本和绑定值可以用不同格式。

| `type`   | 滚轮列           | 默认 `format` / `valueFormat` | 典型用途           |
| -------- | ---------------- | ----------------------------- | ------------------ |
| `year`   | 年               | `YYYY`                        | 入学年份、年度报表 |
| `month`  | 年、月           | `YYYY-MM`                     | 账单月份           |
| `date`   | 年、月、日       | `YYYY-MM-DD`                  | 生日、预约日期     |
| `hour`   | 年、月、日、时   | `YYYY-MM-DD HH:mm:ss`         | 按整点预约         |
| `minute` | 年月日、时、分   | `YYYY-MM-DD HH:mm:ss`         | 会议开始时间       |
| `second` | 年月日、时、分、秒 | `YYYY-MM-DD HH:mm:ss`       | 需要精确到秒的记录（默认值） |

开启 `rangeable` 后，滚轮上方出现「开始 / 结束」两张卡片，点哪张就在滚轮里编辑哪一端；起止值绑定在 `v-model:values` 上，确认时抛出 `range-change`。`showShortcuts` 默认开启，没传 `shortcuts` 时内置「今天、近7天、近30天、近90天、近一年」五项，传入后整组替换。

```vue
<script setup lang="ts">
const birthday = ref("");
const range = ref<string[]>([]);
const shortcuts = [
  { label: "本周", value: ["2026-10-19", "2026-10-25"] },
  { label: "本月", value: ["2026-10-01", "2026-10-31"] },
];
</script>

<template>
  <RebornDatePicker v-model="birthday" type="date" format="YYYY 年 M 月 D 日" placeholder="请选择出生日期" />
  <RebornDatePicker v-model:values="range" type="date" rangeable :shortcuts="shortcuts" />
</template>
```

::warning
仅 UniApp 端：`rangeable`、`values`、`headers`、`title`、确认 / 取消按钮相关参数与 `range-change` 事件只在 UniApp 端存在。Web 端选范围用 `type="daterange"` 等范围类型，起止值直接是 `v-model` 的数组。
::

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

`shortcuts` 在日期面板侧栏列出常用日期，`shortcutPosition` 可选 `left`（默认）或 `right`，点击后直接写回并收起。`value` 写成函数才能每次点击都按当天重新计算，范围类型的函数返回 `[起点, 终点]`。侧栏使用 `p-2 space-y-2`（默认根字号下内边距和选项间距均为 8px）；按钮宽 104px、高 24px、水平内边距 12px，使用 `bg-gray-2 text-gray-8 text-sm`（12px）。

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
    shortcut-position="right"
  />
</template>
```

### 今天栏

`highlightToday` 控制今天（或本月、本季度、今年）的文字高亮，默认 `false`；它与底部按钮 `showToday` 分别控制。需要高亮时传入 `<RebornDatePicker highlight-today />`，已选中的今天始终保留选中样式。

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

### 默认展示日期

未选值时面板默认定位到当天所在的月份。`default-value` 改为定位到指定日期，它只决定面板先显示哪个月 / 哪一年，**不写入绑定值**——适合「多数人会选下个月某天」或「回填历史记录」这类场景，省去用户手动翻页。已有绑定值时面板跟随绑定值定位，`default-value` 不生效。

范围类型可传数组：第一项定位左面板；开启 `unlink-panels` 时第二项定位右面板，联动时右面板恒紧跟左侧，第二项不生效。字符串按 `value-format` 解析，数字视为时间戳。

```vue
<script setup lang="ts">
const value = ref(null);
const rangeValue = ref([]);
</script>

<template>
  <RebornDatePicker
    v-model="value"
    value-format="YYYY-MM-DD"
    default-value="2025-10-01"
  />
  <RebornDatePicker
    v-model="rangeValue"
    type="daterange"
    value-format="YYYY-MM-DD"
    unlink-panels
    :default-value="['2025-01-01', '2025-06-01']"
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

### 前缀

`prefix-icon` 在触发器文本前放一个图标；需要文字或多个元素时用 `#prefix` 插槽，两者同时提供以插槽为准。前缀不参与压缩，颜色与尾部图标同一档，插槽里的内容直接继承；有前缀时单值文本与占位紧贴前缀左对齐。与 `default` 插槽不同，前缀不替换文本区，展示文本、多选标签与范围两栏照常渲染；使用 `cover` 插槽时前缀与文本区一起被接管。

```vue
<template>
  <RebornDatePicker
    v-model="value"
    value-format="YYYY-MM-DD"
    prefix-icon="lucide:calendar-days"
    icon="lucide:chevron-down"
  />
  <RebornDatePicker
    v-model="rangeValue"
    type="daterange"
    value-format="YYYY-MM-DD"
  >
    <template #prefix>
      <span class="text-xs">入住</span>
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

两端只有一部分参数同名同义（见「简介」），整体形态不同，按端分表。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

`RebornDatePicker` 由选择框（`RebornSelectTrigger` 及其下拉浮层）和浮层内的 `RebornDatePickerPanel` 组合而成，描述列开头的标注说明参数作用于哪一部分：〔选择框〕只影响触发器与浮层，〔面板〕原样透传给 `RebornDatePickerPanel`，〔共用〕同时作用于两者。交互演练的控制面板按同一口径分组。

| 属性名                 | 类型                                                                                                                                                                                                  | 默认值              | 描述                                                                                 |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------ |
| `modelValue` / v-model | `any`                                                                                                                                                                                                 | `null`              | 〔共用〕绑定值，形态随 `type` 与 `valueFormat` 变化，见「选择类型」。                |
| `type`                 | `'year' \| 'years' \| 'yearrange' \| 'quarter' \| 'quarters' \| 'quarterrange' \| 'month' \| 'months' \| 'monthrange' \| 'date' \| 'dates' \| 'daterange' \| 'week' \| 'weekrange' \| 'datetime' \| 'datetimerange'` | `'date'`            | 〔共用〕选择器类型，决定粒度与单选 / 多选 / 范围。                                   |
| `valueFormat`          | `string`                                                                                                                                                                                              | `""`                | 〔共用〕绑定值的 dayjs 格式；为空时绑定值为 `Date` 对象。                            |
| `format`               | `string`                                                                                                                                                                                              | `""`                | 〔选择框〕触发器展示文本的 dayjs 格式，不影响绑定值；缺省值见「基础用法」。          |
| `start`                | `string`                                                                                                                                                                                              | `'1970-01-01'`      | 〔面板〕可选日期的最早边界（含）。                                                   |
| `end`                  | `string`                                                                                                                                                                                              | `'2099-12-31'`      | 〔面板〕可选日期的最晚边界（含）。                                                   |
| `disabledMethod`       | `(date: Date, unit: 'year' \| 'month' \| 'quarter' \| 'week' \| 'date') => boolean`                                                                                                                   | -                   | 〔面板〕逐项判定是否禁用，返回 `true` 即不可选；`unit` 为当前判定粒度。              |
| `disabledHours`        | `(role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                                              | -                   | 〔面板〕返回需禁用的小时；仅 `datetime` / `datetimerange` 生效。                     |
| `disabledMinutes`      | `(hour: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                                | -                   | 〔面板〕返回需禁用的分钟，入参为当前选中的小时。                                     |
| `disabledSeconds`      | `(hour: number, minute: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                | -                   | 〔面板〕返回需禁用的秒，入参为当前选中的时、分。                                     |
| `disabledMilliseconds` | `(hour: number, minute: number, second: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                | -                   | 〔面板〕返回需禁用的毫秒，入参为当前选中的时、分、秒。                               |
| `shortcuts`            | `{ text: string; value: any }[]`                                                                                                                                                                      | `[]`                | 〔面板〕快捷选项，非空时显示快捷侧栏。                                       |
| `shortcutPosition` | `'left' \| 'right'` | `'left'` | 〔面板〕快捷选项显示在日期面板的左侧或右侧。 |
| `activeType`           | `'fill' \| 'fillRound' \| 'outline' \| 'text'`                                                                                                                                                        | `'fill'`            | 〔面板〕选中项的表现形式。                                                           |
| `showWeekNumber`       | `boolean`                                                                                                                                                                                             | `false`             | 〔面板〕日期视图左侧显示 ISO 周数；`week` / `weekrange` 类型不生效。                  |
| `unlinkPanels`         | `boolean`                                                                                                                                                                                             | `false`             | 〔面板〕范围类型取消两个面板的联动；`singlePanel` 时无效。                           |
| `singlePanel`          | `boolean`                                                                                                                                                                                             | `false`             | 〔面板〕范围类型只渲染一个面板。                                                     |
| `showToday`            | `boolean`                                                                                                                                                                                             | `false`             | 〔面板〕面板底部显示「今天」栏，点击选中当前时间所在的单位，见「今天栏」。           |
| `highlightToday` | `boolean` | `false` | 是否高亮今天 / 本月 / 本季度 / 今年的文字，与 `showToday` 分别控制；不影响选中样式。 |
| `defaultValue`         | `Date \| string \| number \| (Date \| string \| number)[]` | -                   | 〔面板〕未选值时面板定位到的日期，不写入绑定值；缺省为当天。数组用法见「默认展示日期」。 |
| `placeholder`          | `string`                                                                                                                                                                                              | -                   | 〔选择框〕单值与多选类型的占位文本；缺省时随类型取「请选择日期」「请选择月份」等。   |
| `startPlaceholder`     | `string`                                                                                                                                                                                              | -                   | 〔选择框〕范围类型开始栏的占位文本；缺省时随类型取「开始日期」「开始月份」等。       |
| `endPlaceholder`       | `string`                                                                                                                                                                                              | -                   | 〔选择框〕范围类型结束栏的占位文本；缺省时随类型取「结束日期」「结束月份」等。       |
| `rangeSeparator`       | `string`                                                                                                                                                                                              | `"至"`              | 〔选择框〕范围类型起止之间的分隔符。                                                 |
| `collapseTags`         | `boolean`                                                                                                                                                                                             | `false`             | 〔选择框〕多选时把超出的标签合并为一段 `+N`。                                        |
| `collapseTagsTooltip`  | `boolean`                                                                                                                                                                                             | `false`             | 〔选择框〕悬停 `+N` 时以气泡展示被折叠的日期，需先开启 `collapseTags`。              |
| `maxCollapseTags`      | `number`                                                                                                                                                                                              | `1`                 | 〔选择框〕折叠前最多展示的标签个数，仅在 `collapseTags` 开启时生效。                 |
| `disabled`             | `boolean`                                                                                                                                                                                             | `false`             | 〔选择框〕是否禁用，可被外层 `RebornForm` 覆盖。                                     |
| `clearable`            | `boolean`                                                                                                                                                                                             | `true`              | 〔选择框〕有值时悬停触发器显示清空按钮，与箭头共用尾部位置。                         |
| `loading`              | `boolean`                                                                                                                                                                                             | `false`             | 〔选择框〕尾部图标换成加载指示器并隐藏清空按钮。                                     |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                                                                                                                                                                | `'md'`              | 〔共用〕尺寸档位，同时下发给面板；可被外层 `RebornForm` 覆盖。                       |
| `color`                | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'`                                                                                                                | `'primary'`         | 〔共用〕触发器聚焦 / 展开描边色，同时下发给面板决定选中色。                          |
| `variant`              | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'`                                                                                                                                              | `'outlined'`        | 〔选择框〕形态变体，与 `RebornSelect` 同一套形态语言。                               |
| `showArrow`            | `boolean`                                                                                                                                                                                             | `true`              | 〔选择框〕是否显示尾部图标。                                                         |
| `arrowAnimation`       | `boolean`                                                                                                                                                                                             | `false`             | 〔选择框〕展开时尾部图标是否旋转 180°，默认保持日历图标方向不变。                      |
| `icon`                 | `string`                                                                                                                                                                                              | `'lucide:calendar'` | 〔选择框〕尾部图标名。                                                               |
| `prefixIcon`           | `string`                                                                                                                                                                                              | -                   | 〔选择框〕触发器文本前的前缀图标名；同时提供 `prefix` 插槽时以插槽为准。             |
| `closeOn`              | `'click' \| 'mousedown'`                                                                                                                                                                              | `'mousedown'`       | 〔选择框〕`mousedown` 为外部按下、滚轮或页面滚动即收，面板内部滚动不算外部；`click` 为外部完成一次点击后收起，期间页面滚动时面板跟随触发器。 |
| `portal`               | `boolean`                                                                                                                                                                                             | `true`              | 〔选择框〕浮层是否传送到 `body`；关掉后会随父容器滚动并被 `overflow` 裁剪。          |
| `autoAdjustOverflow`   | `boolean`                                                                                                                                                                                             | `true`              | 〔选择框〕下方空间不足且上方更宽裕时向上展开；关闭后固定向下。                       |
| `class`                | `any`                                                                                                                                                                                                 | -                   | 〔选择框〕追加到触发器外层容器的类名，宽度用它设置。                                 |
| `ui`                   | `Partial<Record<'panel' \| 'dropdownHeader' \| 'dropdownFooter' \| 'tagList' \| 'tag' \| 'tagLabel' \| 'tagClose' \| 'tagCloseIcon' \| 'collapseTag', ClassValue>>`                                   | -                   | 〔选择框〕浮层页头页脚与多选标签的样式覆盖，键位见「自定义样式（ui）」。             |
| `triggerUi`            | `SelectTriggerProps["ui"] & DatePickerFieldUI`                                                                                                                                                        | -                   | 〔选择框〕触发器盒子与浮层外壳的样式覆盖，键位见「子组件样式入口」。                 |
| `panelUi`              | `DatePickerPanelProps["ui"]`                                                                                                                                                                          | -                   | 〔面板〕原样透传给 `RebornDatePickerPanel` 的 `ui`。                                 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 属性名             | 类型                                                                     | 默认值                              | 描述                                                                                         |
| ------------------ | ------------------------------------------------------------------------ | ----------------------------------- | -------------------------------------------------------------------------------------------- |
| `modelValue` / v-model | `string`                                                             | `''`                                | 单值模式的绑定值，格式由 `valueFormat` 决定；`rangeable` 开启时不使用。                      |
| `values` / v-model:values | `string[]`                                                        | `[]`                                | 范围模式的绑定值 `[开始, 结束]`，仅 `rangeable` 开启时使用。                                 |
| `type`             | `'year' \| 'month' \| 'date' \| 'hour' \| 'minute' \| 'second'`           | `'second'`                          | 滚轮精确到哪一列，按「年、月、日、时、分、秒」截取前几列。                                   |
| `rangeable`        | `boolean`                                                                | `false`                             | 开启起止区间选择，弹出层顶部出现「开始 / 结束」卡片与快捷项。                                |
| `format`           | `string`                                                                 | `''`                                | 触发器展示文本的 dayjs 格式，不影响绑定值；为空时按 `type` 取默认格式。                      |
| `valueFormat`      | `string`                                                                 | `''`                                | 绑定值的 dayjs 格式；为空时按 `type` 取默认格式，绑定值始终是字符串。                        |
| `start`            | `string`                                                                 | `'1970-01-01 00:00:00'`             | 滚轮可选的最早时间（含）。                                                                   |
| `end`              | `string`                                                                 | `'2099-12-31 23:59:59'`             | 滚轮可选的最晚时间（含）。                                                                   |
| `title`            | `string`                                                                 | `'请选择'`                          | 底部弹出层的标题。                                                                           |
| `headers`          | `string[]`                                                               | `['年', '月', '日', '时', '分', '秒']` | 各滚轮列的表头文字，按列顺序取前几项。                                                    |
| `placeholder`      | `string`                                                                 | `'请选择'`                          | 触发器未选值时的占位文本，单值与范围模式共用。                                                                   |
| `startPlaceholder` | `string`                                                                 | `'开始日期'`                        | 范围模式「开始」卡片未选值时的占位文本，不用于触发器。                                                   |
| `endPlaceholder`   | `string`                                                                 | `'结束日期'`                        | 范围模式「结束」卡片未选值时的占位文本，不用于触发器。                                                   |
| `rangeSeparator`   | `string`                                                                 | `'至'`                              | 范围模式触发器文本里起止之间的分隔符，两侧各补一个空格。                                    |
| `showShortcuts`    | `boolean`                                                                | `true`                              | 范围模式是否显示快捷项。                                                                     |
| `shortcuts`        | `{ label: string; value: string[] }[]`                                   | `[]`                                | 快捷项列表；为空时使用内置的「今天、近7天、近30天、近90天、近一年」。                        |
| `showTrigger`      | `boolean`                                                                | `true`                              | 是否渲染内置触发器；关闭后通过 `open()` 自行唤起弹出层。                                     |
| `showConfirm`      | `boolean`                                                                | `true`                              | 是否显示底部「确定」按钮。                                                                   |
| `confirmText`      | `string`                                                                 | `'确定'`                            | 「确定」按钮文字。                                                                           |
| `showCancel`       | `boolean`                                                                | `true`                              | 是否显示底部「取消」按钮。                                                                   |
| `cancelText`       | `string`                                                                 | `'取消'`                            | 「取消」按钮文字。                                                                           |
| `disabled`         | `boolean`                                                                | `false`                             | 是否禁用，可被外层 `RebornForm` 覆盖；禁用时 `open()` 无效。                                 |
| `clearable`        | `boolean`                                                                | `true`                              | 有值时触发器显示清空按钮。                                                                   |
| `size`             | `'sm' \| 'md' \| 'lg'`                                                   | `'md'`                              | 触发器尺寸档位。                                                                             |
| `color`            | `'primary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'`  | `'primary'`                         | 触发器聚焦色、滚轮指示与范围卡片的高亮色。                                                   |
| `triggerUi`        | `Partial<TriggerUiShape>`                                                | `{}`                                | 触发器 `RebornSelectTrigger` 的样式覆盖，键位见「子组件样式入口」。                          |
| `popupUi`          | `Partial<PopupUiShape>`                                                  | `{}`                                | 底部弹出层 `RebornPopup` 的样式覆盖，键位见「子组件样式入口」。                              |
| `pickerUi`         | `Partial<PickerUiShape>`                                                 | `{}`                                | 滚轮 `RebornPickerView` 的样式覆盖，键位见「子组件样式入口」。                               |
| `ui`               | `Partial<DatePickerUiShape>`                                             | `{}`                                | 弹出层内范围区、快捷项、底部按钮的样式覆盖，键位见「自定义样式（ui）」。                     |

:::

::

### Emits

两端都有 `update:modelValue` 与 `change`，含义一致：绑定值写回时触发，清空同样触发。其余事件按端分表。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

标注口径同 Props：〔面板〕事件由 `RebornDatePickerPanel` 触发后原样转发，〔共用〕事件在面板上选值与选择框内清空、移除标签时都会触发。

| 事件名              | 回调参数                                                                                   | 描述                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `update:modelValue` | `(value: any)`                                                                             | 〔共用〕绑定值写回时触发（由 `defineModel` 生成），时机与 `change` 相同。                          |
| `change`            | `(value: any)`                                                                             | 〔共用〕绑定值写回后触发；清空与移除标签同样触发。写回时机见「简介」。                             |
| `remove-tag`        | `(value: any)`                                                                             | 〔选择框〕多选类型点标签上的关闭按钮时触发，参数为被移除的值。                                     |
| `clear`             | `()`                                                                                       | 〔选择框〕点清空按钮或调用 `clear()` 后触发，先于 `change`。                                       |
| `visible-change`    | `(visible: boolean)`                                                                       | 〔选择框〕面板展开或收起时触发。                                                                   |
| `calendar-change`   | `(value: [Date, Date \| null])`                                                            | 〔面板〕范围类型点选日期或选中数组型快捷选项时触发；只选了起点时终点为 `null`，`week` 类型不触发，`weekrange` 的起止已吸附到整周。 |
| `panel-change`      | `(date: Date \| [Date, Date], mode: 'month' \| 'year', view: 'year' \| 'month' \| 'date')` | 〔面板〕翻页、切换视图或下钻时触发，参数含义见 `reborn-date-picker-panel`。                        |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 事件名              | 回调参数              | 描述                                                                     |
| ------------------- | --------------------- | ------------------------------------------------------------------------ |
| `update:modelValue` | `(value: string)`     | 单值模式点「确定」或清空时触发，清空时为 `''`。                          |
| `change`            | `(value: string)`     | 与 `update:modelValue` 同时触发，参数相同。                              |
| `update:values`     | `(value: string[])`   | 范围模式点「确定」或清空时触发，清空时为 `[]`。                          |
| `range-change`      | `(value: string[])`   | 与 `update:values` 同时触发，参数相同。                                  |

:::

::

### Slots

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 插槽名       | 作用域参数                                 | 描述                                                   |
| ------------ | ------------------------------------------ | ------------------------------------------------------ |
| `default`    | `{ displayText, placeholder, isOpen, ui }` | 〔选择框〕替换触发器的文本区，尾部箭头与清空按钮保留。 |
| `cover`      | `{ displayText, placeholder, isOpen, ui }` | 〔选择框〕接管整个触发器内容，包括尾部图标区。         |
| `prefix`     | -                                          | 〔选择框〕触发器文本前的前缀内容，提供后忽略 `prefixIcon`。 |
| `header`     | -                                          | 〔选择框〕面板上方的页头，自带下分隔线。               |
| `footer`     | -                                          | 〔选择框〕面板下方的页脚，自带上分隔线。               |
| `cell`       | `DatePickerCell`                           | 〔面板〕自定义单元格内容，对应面板的 `default` 插槽。  |
| `prev-month` | -                                          | 〔面板〕日期视图「上个月」按钮的图标。                 |
| `next-month` | -                                          | 〔面板〕日期视图「下个月」按钮的图标。                 |
| `prev-year`  | -                                          | 〔面板〕「上一年」按钮的图标。                         |
| `next-year`  | -                                          | 〔面板〕「下一年」按钮的图标。                         |

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

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 插槽名 | 作用域参数 | 描述                                                       |
| ------ | ---------- | ---------------------------------------------------------- |
| `tag`  | -          | 替换触发器里的展示内容，用于把已选日期渲染成标签等自定义样式。 |

:::

::

### Expose

两端都暴露 `clear()`，含义一致：清空绑定值并触发事件。UniApp 端因为是弹出层交互，额外暴露了开关与设值方法。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 方法名  | 签名         | 描述                                                                  |
| ------- | ------------ | --------------------------------------------------------------------- |
| `clear` | `() => void` | 清空为 `null`（单值）或 `[]`（多选与范围），依次抛出 `clear`、`change`。 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 方法名      | 签名                                                     | 描述                                                                                     |
| ----------- | -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `open`      | `(cb?: ((value: string \| string[]) => void) \| null) => void` | 打开底部弹出层，禁用时无效；传入的回调在点「确定」时收到选中值。                    |
| `close`     | `() => void`                                             | 关闭弹出层，不触发确认。                                                                 |
| `clear`     | `() => void`                                             | 清空为 `''`（单值）或 `[]`（范围），并抛出对应的更新与变更事件。                         |
| `confirm`   | `() => void`                                             | 以当前滚轮选中值执行确认；范围不完整或开始晚于结束时提示并中断，否则写回后关闭弹出层。   |
| `setValue`  | `(val: string) => void`                                  | 设置单值模式的滚轮位置，空值时回到当前时间；只改内部状态，不触发事件。                   |
| `setValues` | `(val: string[]) => void`                                | 设置范围模式的起止值；只改内部状态，不触发事件。                                         |
| `setRange`  | `(index: number) => void`                                | 切换范围模式正在编辑的一端：`0` 为开始，`1` 为结束。                                     |

:::

::

### 自定义样式（ui）

两端形态不同，`ui` 键位完全不同，不要跨端照抄：Web 端改下拉浮层里的页头页脚与多选标签，UniApp 端改底部弹出层里的范围区、快捷项与按钮。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

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

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

16 个键逐字来自 `packages/uniapp-project/src/components/reborn-date-picker/reborn-date-picker.config.ts` 的 `slots`，以「内置类 + `ui.键`」合并，调用方的类排在后面。

| 键名               | 对应节点                         | 默认关键类名                                                                 | 渲染 / 失效条件                                   |
| ------------------ | -------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| `wrapper`          | 无                               | `w-full`                                                                     | 预留键，当前没有接到任何节点，写入不生效          |
| `popupOp`          | 无                               | `flex flex-row items-center justify-center gap-2 p-3`                        | 预留键，当前没有接到任何节点，写入不生效          |
| `rangeBox`         | 滚轮上方的范围区                 | `px-3 pb-5 pt-2`                                                             | 仅 `rangeable` 开启时渲染                         |
| `shortcuts`        | 快捷项容器                       | `mb-4 flex flex-row flex-wrap items-center gap-2`                            | 仅 `rangeable` 且 `showShortcuts` 开启时渲染      |
| `shortcutItem`     | 单个快捷项                       | `flex items-center gap-1 rounded-md border border-solid px-2 py-1 text-xs`   | 选中态的描边与文字色由 `color` 给出，写入的类叠加在两种状态上 |
| `rangeValues`      | 「开始 ~ 结束」两张卡片的横向容器 | `flex flex-row items-center justify-center`                                 | 同 `rangeBox`                                     |
| `rangeStart`       | 开始卡片                         | `flex-1 rounded-xl border border-solid p-2 text-center`                      | 正在编辑时的高亮描边由 `color` 给出               |
| `rangeEnd`         | 结束卡片                         | 同 `rangeStart`                                                              | 同 `rangeStart`                                   |
| `rangeValueText`   | 卡片里已有值时的文字             | `text-center block w-full`                                                   | 作为 `RebornText` 的 `ui.base` 下发；与 `rangePlaceholder` 二选一 |
| `rangePlaceholder` | 卡片里尚无值时的占位文字         | `text-surface-400 block w-full text-center`                                  | 同上                                              |
| `separator`        | 两张卡片之间的分隔符             | `text-gray-5 mx-3 text-sm`                                                   | 同 `rangeBox`                                     |
| `footer`           | 底部按钮栏                       | `flex flex-row items-center justify-center gap-2 px-3 pt-3 pb-[calc(0.75rem+var(--window-bottom))]` | 底部安全区已含在 `var(--window-bottom)` 里，改内边距时要保留 |
| `cancel`           | 「取消」按钮外层                 | `flex-1`                                                                     | 始终渲染；`showCancel` 关闭时只去掉里面的按钮，外层仍占一份宽 |
| `cancelButton`     | 「取消」按钮本体                 | `w-full`                                                                     | 作为 `RebornButton` 的 `ui.base` 下发；仅 `showCancel` 开启时渲染 |
| `confirm`          | 「确定」按钮外层                 | `flex-1`                                                                     | 始终渲染；`showConfirm` 关闭时只去掉里面的按钮，外层仍占一份宽 |
| `confirmButton`    | 「确定」按钮本体                 | `w-full`                                                                     | 作为 `RebornButton` 的 `ui.base` 下发；仅 `showConfirm` 开启时渲染 |

```vue
<template>
  <!-- 范围卡片改小圆角，「确定」按钮占两份宽 -->
  <RebornDatePicker
    v-model:values="range"
    type="date"
    rangeable
    :ui="{
      rangeStart: 'rounded-lg',
      rangeEnd: 'rounded-lg',
      cancel: 'flex-none w-[200rpx]',
    }"
  />
</template>
```

:::

::

### 子组件样式入口

下面这些键**不属于 `reborn-date-picker` 自身**——它们改的是内部子组件的样式，通过 `triggerUi` / `panelUi`（Web）或 `triggerUi` / `popupUi` / `pickerUi`（UniApp）透传下去，键位与默认值以对应子组件页为准。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### `triggerUi`（15 个键，`RebornSelectTrigger`）

`triggerUi` 里两部分键混写，组件内部自动拆分：浮层外壳的 4 个键交给 `RebornSelectTrigger`，其余 11 个键合并进触发器盒子的类名。

| 名称                 | 归属     | 描述                                                   |
| -------------------- | -------- | ------------------------------------------------------ |
| `wrapper`            | 浮层外壳 | 触发器与浮层的共同外层容器                             |
| `dropdown`           | 浮层外壳 | 浮层容器；组件已追加 `w-max min-w-0`，宽度随面板撑开   |
| `dropdownInner`      | 浮层外壳 | 浮层内层滚动容器                                       |
| `arrow`              | 浮层外壳 | 浮层指向触发器的小箭头，不是触发器尾部图标             |
| `trigger`            | 触发器   | 触发器盒子，形态、尺寸、配色类名都落在这里             |
| `triggerText`        | 触发器   | 单值与多选的已选文本                                   |
| `input` | 触发器 | `date` / `daterange` 的日期输入框，预览为 `text-gray-5`，确定值为 `text-gray-9` |
| `triggerIconWrapper` | 触发器   | 尾部图标区                                             |
| `placeholder`        | 触发器   | 占位文本，范围类型未选的一栏也用它着色                 |
| `clearBtn`           | 触发器   | 清空按钮                                               |
| `triggerLoadingIcon` | 触发器   | 加载指示器                                             |
| `rangeWrapper`       | 触发器   | 范围类型开始 / 结束两栏的容器                          |
| `rangeText`          | 触发器   | 范围类型的开始 / 结束文本                              |
| `rangeSeparator`     | 触发器   | 范围类型起止之间的分隔符                               |
| `prefix`             | 触发器   | 前缀容器，仅提供 `prefix` 插槽或 `prefixIcon` 时渲染   |
| `prefixIcon`         | 触发器   | `prefixIcon` 渲染的图标，尺寸随 `size` 变化            |

::warning
`triggerUi.arrow` 改的是浮层小箭头。触发器尾部日历图标的类名不在 `triggerUi` 里：换图标用 `icon`，隐藏用 `:show-arrow="false"`，关旋转用 `:arrow-animation="false"`；需要改样式时用 `default` / `cover` 插槽自绘。
::

#### `panelUi`（`RebornDatePickerPanel`）

`panelUi` 原样作为面板的 `ui` 传入，键位与默认类名见 `reborn-date-picker-panel` 的「自定义样式（ui）」。面板的 `border`、`width`、`overflow`、`disabled`、`class` 由组件固定或不下发，无法通过 `panelUi` 改变其行为。

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

三个对象分别原样作为子组件的 `ui` 传入，键名来自组件源码里的 `TriggerUiShape`、`PopupUiShape`、`PickerUiShape`。

| 参数        | 子组件                | 可用键                                                                                         |
| ----------- | --------------------- | ---------------------------------------------------------------------------------------------- |
| `triggerUi` | `RebornSelectTrigger` | `wrapper`、`content`、`text`、`placeholder`、`iconWrapper`、`clearIcon`、`arrowIcon`            |
| `popupUi`   | `RebornPopup`         | `wrapper`、`mask`、`popup`、`inner`、`draw`、`header`、`title`、`container`                     |
| `pickerUi`  | `RebornPickerView`    | `wrapper`、`header`、`headerText`、`pickerContainer`、`item`、`itemText`、`indicator`           |

:::

::

## 两端差异对照

| 维度         | Web                                                                    | UniApp                                                                    |
| ------------ | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 交互形态     | 触发器下方展开日期面板，鼠标点选                                       | 触发器唤起底部弹出层，手指拨动滚轮后点「确定」                            |
| `type` 取值  | 16 种：年 / 季度 / 月 / 周 / 日 / 日期时间，各有单选、多选或范围变体    | 6 种：`year` → `second`，只决定滚轮显示到哪一列                           |
| 范围选择     | `type="daterange"` 等范围类型，起止值是 `v-model` 的数组               | `rangeable` 开关，起止值绑定在 `v-model:values`，确认时抛 `range-change`  |
| 多选         | `dates` / `months` 等多选类型，支持标签折叠                            | 不支持                                                                    |
| 绑定值形态   | 不传 `valueFormat` 时是 `Date` 对象                                    | 始终是字符串，`valueFormat` 缺省按 `type` 取默认格式                      |
| 写回时机     | 选定即写回（带时间的类型值完整时写回）                                 | 只在点「确定」或清空时写回，拨动滚轮不写回                                |
| 快捷项       | `shortcuts: { text, value }[]`，`shortcutPosition` 控制左右侧栏，空数组时不显示 | `shortcuts: { label, value }[]`，仅范围模式，空数组时用内置五项           |
| `color` 取值 | 7 种，含 `secondary`                                                   | 6 种，不含 `secondary`                                                    |
| 形态变体     | `variant` 四种，与 `RebornSelect` 一致                                 | 无 `variant`                                                              |
| 样式覆盖入口 | `ui` + `triggerUi` + `panelUi`                                         | `ui` + `triggerUi` + `popupUi` + `pickerUi`                               |

## 注意事项

- **写回时机随类型不同**。单值与范围类型选定即写回并收起；多选类型每点一项写回、面板不收；`datetime` / `datetimerange` 在值完整时写回，但要点击外部才收起。
- **范围只选一半会被丢弃**。点了开始日期就收起面板，绑定值保持原样；下次展开时草稿按绑定值重置。
- **多选类型的「今天」只追加不取消**。今天已在选中集合里时再点「今天」不做处理，取消请点对应格子或标签的关闭按钮。
- **清空结果不是空字符串**。单值类型清空为 `null`，多选与范围类型清空为 `[]`；表单规则要按这个形态写，例如范围用 `z.array().length(2)`。
- **`loading` 只作用于触发器**。它隐藏清空按钮并换掉尾部图标，面板照常可展开、可选，需要禁止操作请同时传 `disabled`。
- **`cell` 插槽要按 `type` 分支**。四种视图共用这一个插槽，只写日期格的内容会让年、月、季度视图也显示成日期样式。
- **`clear()` 不检查禁用状态**。点击清空按钮在禁用时不可达，但通过实例调用 `clear()` 仍会清空并抛出事件，调用方需自行判断。
- **校验在写回与外部收起时触发**。写回时跑 `change` 校验，点击外部收起时跑 `blur` 校验；按 Esc 或再次点击触发器收起不触发 `blur`。
- **`default-value` 不是初始值**。它只决定未选值时面板定位到哪个月，不写入绑定值；需要预填值请直接给 `v-model` 赋值。
- **不要写 `dark:` 前缀**。触发器与面板的颜色都来自会随主题切换的灰阶与语义色 token，覆盖样式时直接写 `bg-gray-2`、`text-primary` 即可。
- **UniApp 端由 `reborn-select-date` 改名而来**。组件名改为 `RebornDatePicker`，路径改为 `components/reborn-date-picker/RebornDatePicker.vue`，`labelFormat` 改名为 `format`（与 Web 端同名同义）；其余参数、事件与 Expose 不变。旧名不再保留，升级时需替换导入路径与 `label-format` 写法，否则组件解析失败、展示格式回落为按 `type` 的默认值。
- **两端的 `type` 不能共用同一个值**。Web 的 `type` 同时决定粒度与单选 / 多选 / 范围，UniApp 的 `type` 只决定滚轮列数；`date`、`month`、`year` 两端都有且含义接近，`daterange`、`dates` 等只在 Web 有效，`hour`、`minute`、`second` 只在 UniApp 有效，跨端共用代码时要按端分别传值。
- **UniApp 端的范围值不在 `v-model` 上**。开启 `rangeable` 后起止值写进 `v-model:values` 并抛 `range-change`，`modelValue` 与 `change` 不再更新；表单规则要校验 `values` 字段。
- **UniApp 端只在点「确定」时写回**。拨动滚轮、切换开始 / 结束卡片、点快捷项都只改弹出层内的状态，点「取消」或遮罩关闭会丢弃；需要即时联动时在 `open()` 的回调或 `change` / `range-change` 里处理。
- **UniApp 端 `ui.wrapper` 与 `ui.popupOp` 是预留键**。它们在 `reborn-date-picker.config.ts` 里有默认类名，但模板里没有接到任何节点，写入不生效；改弹出层外壳请用 `popupUi`，改触发器宽度请包一层容器。

- **Web 原生属性透传到触发器根节点。** `id`、`style`、`data-*`、`aria-*` 与未声明事件随父级更新，前缀插槽动态增删时也会同步触发器布局。
