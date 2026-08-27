---
title: 日期选择面板
description: 用于内嵌展示的日期/月份/年份选择面板组件，支持范围选择与视图切换，仅 web 端。
category: 表单与输入
tags: [calendar, date, select, panel, uniapp]
badge: New
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornDatePickerPanelDemo.vue" config="RebornDatePickerPanelConfig" componentId="reborn-date-picker-panel" dependencies="dayjs" :componentFiles='["RebornDatePickerPanel.vue", "reborn-date-picker-panel.config.ts"]'}
::

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `any` | `""` | 选中的值。根据 `value-format` 不同，可能是 Date、字符串或其数组。 |
| `type` | `DatePickerType` | `'date'` | 选择器类型。支持 12 种模式：<br/>- **年**: `year`, `years`, `yearrange`<br/>- **月**: `month`, `months`, `monthrange`<br/>- **日**: `date`, `dates`, `daterange`<br/>- **周**: `week`<br/>- **日期时间**: `datetime`, `datetimerange` |
| `value-format` | `string` | - | 绑定值的格式。如果不指定，则 `modelValue` 为 `Date` 对象。 |
| `disabled` | `boolean` | `false` | 是否禁用整个面板。 |
| `border` | `boolean` | `false` | 是否显示外边框和阴影。 |
| `shortcuts` | `Array<{text, value}>` | `[]` | 快捷选项配置，支持静态日期或返回日期的函数。 |
| `start` | `string` | `'1970-01-01'` | 可选日期的最早边界（含）。 |
| `end` | `string` | `'2099-12-31'` | 可选日期的最晚边界（含）。 |
| `disabledHours` | `(role?: 'start' \| 'end', comparingValue?: string \| null) => number[]` | - | 返回需禁用的小时数组；仅含时间的类型（`datetime` / `datetimerange`）生效，范围模式可按 `role` 区分开始/结束面板。 |
| `disabledMinutes` | `(hour: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]` | - | 返回需禁用的分钟数组，入参为当前选中的小时；范围模式可按 `role` 区分开始/结束面板。 |
| `disabledSeconds` | `(hour: number, minute: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]` | - | 返回需禁用的秒数组，入参为当前选中的时、分；范围模式可按 `role` 区分开始/结束面板。 |
| `disabledMilliseconds` | `(hour: number, minute: number, second: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]` | - | 返回需禁用的毫秒数组，入参为当前选中的时、分、秒；范围模式可按 `role` 区分开始/结束面板。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 整体面板尺寸。 |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 交互高亮颜色。 |
| `shape` | `'square' \| 'circle'` | `'square'` | 选中项的形状。 |
| `class` | `any` | - | 自定义外部样式类。 |
| `ui` | `Partial<DatePickerPanelStyles>` | - | 自定义内部样式覆盖。 |

### 类型详解 (Type Specifications)

| 类型 (`type`) | 绑定值 (`modelValue`) | 描述 |
| --- | --- | --- |
| `year` | `string` ("2024") | 选择单个年份。 |
| `years` | `string[]` (["2024", "2025"]) | 多选年份。 |
| `yearrange` | `string[]` (["2020", "2024"]) | 选择年份范围。 |
| `month` | `string` ("2024-04") | 选择单个月份。 |
| `months` | `string[]` (["2024-04", "2024-05"]) | 多选月份。 |
| `monthrange` | `string[]` (["2024-01", "2024-04"]) | 选择月份范围。 |
| `date` | `string` ("2024-04-03") | 选择单个日期。 |
| `dates` | `string[]` (["2024-04-03", "2024-04-04"]) | 多选日期。 |
| `daterange` | `string[]` (["2024-04-01", "2024-04-05"]) | 选择日期范围。 |
| `week` | `string[]` (["2024-03-31", "2024-04-06"]) | 选择一整周（自动选中所在周的周日到周六）。 |
| `datetime` | `string` ("2024-04-03 12:00") | 选择日期和的具体时间。 |
| `datetimerange` | `string[]` (["2024-04-03 12:00", ...]) | 选择日期时间范围。 |

## Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: string \| string[])` | 更新绑定值。范围选择时，当两个端点都选定后触发。 |
| `change` | `(value: string \| string[])` | 最终确定选择值时触发。 |

## Slots

| 名称 | 参数 | 描述 |
| --- | --- | --- |
| - | - | 暂无自定义插槽。 |

## UI

各个内部组件的 UI 样式覆盖参数。

### Web 版本 `ui`

该组件仅 Web 端提供。面板由「快捷侧栏 + 主面板（可双联）」组成，`type` 决定主面板渲染日期网格、月份/年份四列网格还是带时间列的复合视图，因此下表中不少键只在特定 `type` 或 `range` 模式下才会出现。

**布局骨架**

| 名称         | 描述                                                                                                                                          |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`    | 面板最外层容器，默认 `w-full bg-white dark:bg-gray-8 transition-all overflow-hidden`；面板底色、整体宽度、圆角改这里。                          |
| `container`  | 「快捷侧栏 + 内容区」的横向容器，默认 `flex h-full`。                                                                                          |
| `shortcuts`  | 快捷选择侧边栏容器，默认 `border-r border-gray-2 dark:border-gray-7 p-4 flex flex-col gap-4 overflow-y-auto` + 隐藏滚动条。**仅传入 `shortcuts` 且非空时渲染。** |
| `shortcut`   | 单个快捷选择项，默认 `min-w-15 text-xs text-gray-6 dark:text-gray-4 hover:bg-gray-1 dark:hover:bg-gray-7 hover:text-primary cursor-pointer transition-colors whitespace-nowrap`。 |
| `content`    | 快捷侧栏右侧的内容区，默认 `flex-1 p-4`；面板内边距改这里。                                                                                     |
| `panelLeft`  | 主（左）面板容器，默认 `w-full`。                                                                                                              |
| `panelRight` | 双联模式下的右面板容器，默认 `flex-1 px-2!`。**仅 `daterange` / `datetimerange` / `monthrange` 等双联视图渲染。**                                |

**顶部导航**

| 名称           | 描述                                                                                                                                                   |
| :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header`       | 顶部导航行，默认 `flex items-center justify-between py-4`。                                                                                              |
| `navBtn`       | 左右翻页按钮，默认 `flex items-center p-1 rounded-md hover:bg-gray-2 dark:hover:bg-gray-7 transition-colors cursor-pointer text-gray-6 dark:text-gray-3`。 |
| `navBtnHidden` | 双联模式下被隐藏的那一侧翻页按钮（占位保持对齐），默认 `p-1 opacity-0 pointer-events-none`；想彻底去掉占位就在这里加 `hidden`。                          |
| `title`        | 中间的年份/月份切换标题（点击进入年选/月选），默认 `text-sm font-medium text-gray-8 dark:text-gray-1 cursor-pointer hover:text-primary transition-colors`。 |
| `icon`         | 翻页按钮内的箭头图标，默认 `transition-all`；换大小、换颜色改这里（图标名固定为 `lucide:chevron-left/right`）。                                          |

**日期网格**

| 名称          | 描述                                                                                                                                                                   |
| :------------ | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `weekdays`    | 星期表头容器，默认 `grid grid-cols-7 gap-0 text-center justify-items-center text-xs text-gray-4 dark:text-gray-5 mb-4`。                                                 |
| `days`        | 日期网格容器，默认 `grid grid-cols-7 justify-items-center gap-4`；格子间距改这里。                                                                                       |
| `day`         | 单个日期格，默认 `flex items-center justify-center text-sm cursor-pointer transition-colors text-gray-7 dark:text-gray-2 hover:bg-gray-2 dark:hover:bg-gray-7 aspect-square w-full h-full`；格子形状（如改成圆形）在这里加 `rounded-full`。 |
| `dayActive`   | 选中日期的附加样式，默认由 `color` 变体给出（`primary` 时为 `bg-primary text-white hover:bg-primary/90`）。**不是独立节点**——选中时被合并进 `day` 所在节点。              |
| `dayInRange`  | 范围模式下落在起止之间的日期，默认由 `color` 变体给出（`bg-primary/10 dark:bg-primary/20`）。同样是合并进 `day`。                                                        |
| `dayToday`    | 今日的标识样式，默认 `font-bold underline`；仅在今日**未被选中**时叠加。同样是合并进 `day`。                                                                              |
| `dayDisabled` | 超出 `start` / `end` 或被 `disabledDate` 排除的日期，默认 `text-gray-4 dark:text-gray-5 opacity-40 pointer-events-none`。同样是合并进 `day`。                             |
| `dayHidden`   | 范围模式下非本月的补位格子，默认 `invisible`（占位但不可见）。同样是合并进 `day`；单选模式下不使用该键，非本月日期照常显示。                                              |

**年 / 月网格**

| 名称               | 描述                                                                                                                                                                         |
| :----------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grid4Year`        | 年份视图的四列网格容器，默认 `grid grid-cols-4 gap-y-2 justify-items-center overflow-auto`。                                                                                   |
| `grid4Month`       | 月份视图的四列网格容器，默认 `grid grid-cols-4 gap-y-2 justify-items-center py-2`。                                                                                            |
| `yearMonthItem`    | 单个年份/月份格，默认 `flex items-center justify-center cursor-pointer transition-colors text-gray-7 dark:text-gray-2 hover:bg-gray-2 dark:hover:bg-gray-7 w-full rounded-lg`。 |
| `yearMonthInRange` | 范围模式下落在起止之间的年/月，默认由 `color` 变体给出（`bg-primary/10 dark:bg-primary/20`）。**不是独立节点**——合并进 `yearMonthItem`；选中项走的是 `dayActive`，不是单独的键。 |
| `yearMonthOutside` | 年份视图中不属于当前十年页的年份，默认 `opacity-40`。同样是合并进 `yearMonthItem`。                                                                                            |

**日期时间复合视图（`datetime` / `datetimerange`）**

| 名称                      | 描述                                                                                                                                                                      |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `dateTimeHeader`          | 「日期段 / 时间段」切换条的容器，默认 `flex items-center justify-center gap-2 w-full`。                                                                                     |
| `dateTimeSegment`         | 切换条中的单个段落（日期或时间），默认 `ring-1 ring-gray-3 dark:ring-gray-6 text-xs h-6 leading-6 w-24 text-center rounded-md transition-all text-gray-7 dark:text-gray-2 flex-1`。 |
| `dateTimeSegmentActive`   | 可点击（当前可切换）的段落的附加样式，默认 `cursor-pointer hover:ring-primary/50 hover:text-primary`。**不是独立节点**——合并进 `dateTimeSegment`。                          |
| `dateTimeSegmentDisabled` | 不可点击的段落的附加样式，默认 `cursor-not-allowed`。同样是合并进 `dateTimeSegment`。                                                                                        |
| `dateTimeSeparator`       | 两个段落之间的 `/` 分隔符，默认 `text-gray-3 dark:text-gray-6 font-light`。                                                                                                  |

```vue
<template>
  <RebornDatePickerPanel
    v-model="date"
    type="daterange"
    :ui="{
      wrapper: 'rounded-xl shadow-lg',
      days: 'gap-2',
      day: 'rounded-full',
      dayActive: 'bg-error text-white hover:bg-error/90',
      dayInRange: 'bg-error/10',
      title: 'text-base font-semibold',
    }"
  />
</template>
```
