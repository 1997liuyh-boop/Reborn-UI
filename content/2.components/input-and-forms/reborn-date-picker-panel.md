---
title: DatePickerPanel 日期选择面板
description: 用于内嵌展示的日期/月份/年份选择面板组件，支持范围选择与视图切换，仅 web 端。
category: 表单与输入
platform: web
tags: [calendar, date, select, panel, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornDatePickerPanelDemo.vue" config="RebornDatePickerPanelConfig" componentId="reborn-date-picker-panel" dependencies="dayjs" :componentFiles='["RebornDatePickerPanel.vue", "reborn-date-picker-panel.config.ts"]'}
::

## API

| 属性名                 | 类型                                                                                                                                                                                                                                                                                                                                                                                                                                               | 默认值         | 描述                                                                                                                                                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `modelValue`           | `any`                                                                                                                                                                                                                                                                                                                                                                                                                                              | `""`           | 选中的值。根据 `value-format` 不同，可能是 Date、字符串或其数组。                                                                                                                                                                                                                                                              |
| `type`                 | `DatePickerType`                                                                                                                                                                                                                                                                                                                                                                                                                                   | `'date'`       | 选择器类型。支持 15 种模式：<br/>- **年**: `year`, `years`, `yearrange`<br/>- **季度**: `quarter`, `quarters`, `quarterrange`<br/>- **月**: `month`, `months`, `monthrange`<br/>- **日**: `date`, `dates`, `daterange`<br/>- **周**: `week`<br/>- **日期时间**: `datetime`, `datetimerange`                                    |
| `value-format`         | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                           | -              | 绑定值的格式。如果不指定，则 `modelValue` 为 `Date` 对象。                                                                                                                                                                                                                                                                     |
| `disabled`             | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                          | `false`        | 是否禁用整个面板：所有日期格进入禁用样式（灰带 + 禁用光标），标题转为 gray-4、翻页图标降低透明度，点击一律不响应；已选值与范围高亮也不再显示，面板整体呈灰。                                                                                                                                                                                                                                                                                     |
| `border`               | `boolean`                                                                                                                                                                                                                                                                                                                                                                                                                                          | `false`        | 是否显示外边框和阴影。                                                                                                                                                                                                                                                                                                         |
| `shortcuts`            | `Array<{text, value}>`                                                                                                                                                                                                                                                                                                                                                                                                                             | `[]`           | 快捷选项配置，支持静态日期或返回日期的函数。                                                                                                                                                                                                                                                                                   |
| `start`                | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                           | `'1970-01-01'` | 可选日期的最早边界（含）。                                                                                                                                                                                                                                                                                                     |
| `end`                  | `string`                                                                                                                                                                                                                                                                                                                                                                                                                                           | `'2099-12-31'` | 可选日期的最晚边界（含）。                                                                                                                                                                                                                                                                                                     |
| `disabledMethod`       | `(date: Date, unit: 'year' \| 'month' \| 'quarter' \| 'week' \| 'date') => boolean`                                                                                                                                                                                                                                                                                                                                                               | -              | 逐项判定是否禁用，返回 `true` 即该项不可选。`unit` 标识当前判定粒度：日期格传 `date`（`week` 类型传 `week`），年 / 月 / 季度视图分别传 `year` / `month` / `quarter`——同一个方法可按粒度限制任意档位。被排除的项连成灰底带子（`dayDisabledBand`）、文字取 `dayDisabled` 灰色，悬停显示禁用光标，点击被脚本层守卫拦截。          |
| `disabledHours`        | `(role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                                                                                                                                                                                                                                                                                           | -              | 返回需禁用的小时数组；仅含时间的类型（`datetime` / `datetimerange`）生效，范围模式可按 `role` 区分开始/结束面板。                                                                                                                                                                                                              |
| `disabledMinutes`      | `(hour: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                                                                                                                                                                                                                                                                             | -              | 返回需禁用的分钟数组，入参为当前选中的小时；范围模式可按 `role` 区分开始/结束面板。                                                                                                                                                                                                                                            |
| `disabledSeconds`      | `(hour: number, minute: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                                                                                                                                                                                                                                                             | -              | 返回需禁用的秒数组，入参为当前选中的时、分；范围模式可按 `role` 区分开始/结束面板。                                                                                                                                                                                                                                            |
| `disabledMilliseconds` | `(hour: number, minute: number, second: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                                                                                                                                                                                                                                                                                                                             | -              | 返回需禁用的毫秒数组，入参为当前选中的时、分、秒；范围模式可按 `role` 区分开始/结束面板。                                                                                                                                                                                                                                      |
| `size`                 | `'sm' \| 'md' \| 'lg'`                                                                                                                                                                                                                                                                                                                                                                                                                             | `'md'`         | 整体面板尺寸。                                                                                                                                                                                                                                                                                                                 |
| `color`                | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'`                                                                                                                                                                                                                                                                                                                                                             | `'primary'`    | 交互高亮颜色。                                                                                                                                                                                                                                                                                                                 |
| `width`                | `'auto' \| 'full'`                                                                                                                                                                                                                                                                                                                                                                                                                                 | `'auto'`       | 宽度模式：`auto` 由内部元素撑开——各视图网格共用同一套最小宽度，切换年 / 月 / 季度视图时宽度不跳动；`full` 占满父容器。                                                                                                                                                                                                         |
| `activeType`           | `'fill'                                                                                                                \| 'fillRound'    \| 'outline'                                                                                                                                                                                                                                                                                   \| 'text'` | `'fill'`       | 选中项的表现形式：`fill` 背景填色（4px 圆角）、`fillRound` 背景填色且为正圆、`outline` 描边加文字、`text` 仅文字变色。未选中格子的悬停圆角也由它给出，悬停与选中共用同一套圆角。范围与多选时，首尾之外的中间项在 `fill` / `fillRound` / `outline` 下取同色板第 1 阶浅底加 `gray-9`，底色逐列相接连成一条带子，只有两端收圆角。 |
| `class`                | `any`                                                                                                                                                                                                                                                                                                                                                                                                                                              | -              | 自定义外部样式类。                                                                                                                                                                                                                                                                                                             |
| `ui`                   | `Partial<DatePickerPanelStyles>`                                                                                                                                                                                                                                                                                                                                                                                                                   | -              | 自定义内部样式覆盖。                                                                                                                                                                                                                                                                                                           |

### 类型详解 (Type Specifications)

| 类型 (`type`)   | 绑定值 (`modelValue`)                     | 描述                                                                                                        |
| --------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `year`          | `string` ("2024")                         | 选择单个年份。                                                                                              |
| `years`         | `string[]` (["2024", "2025"])             | 多选年份。                                                                                                  |
| `yearrange`     | `string[]` (["2020", "2024"])             | 选择年份范围。                                                                                              |
| `quarter`       | `string` ("2024-Q2")                      | 选择单个季度；季度值取该季度首月 1 号，`value-format` 可用 `Q` 令牌（如 `YYYY-[Q]Q`），面板也按该格式回读。 |
| `quarters`      | `string[]` (["2024-Q1", "2024-Q3"])       | 多选季度。                                                                                                  |
| `quarterrange`  | `string[]` (["2024-Q1", "2025-Q2"])       | 选择季度范围，双联面板按相邻两年展示。                                                                      |
| `month`         | `string` ("2024-04")                      | 选择单个月份。                                                                                              |
| `months`        | `string[]` (["2024-04", "2024-05"])       | 多选月份。                                                                                                  |
| `monthrange`    | `string[]` (["2024-01", "2024-04"])       | 选择月份范围。                                                                                              |
| `date`          | `string` ("2024-04-03")                   | 选择单个日期。                                                                                              |
| `dates`         | `string[]` (["2024-04-03", "2024-04-04"]) | 多选日期。                                                                                                  |
| `daterange`     | `string[]` (["2024-04-01", "2024-04-05"]) | 选择日期范围。                                                                                              |
| `week`          | `string[]` (["2024-03-31", "2024-04-06"]) | 选择一整周（自动选中所在周的周日到周六）。                                                                  |
| `datetime`      | `string` ("2024-04-03 12:00")             | 选择日期和的具体时间。                                                                                      |
| `datetimerange` | `string[]` (["2024-04-03 12:00", ...])    | 选择日期时间范围。                                                                                          |

## Emits

| 事件名              | 参数                          | 描述                                             |
| ------------------- | ----------------------------- | ------------------------------------------------ |
| `update:modelValue` | `(value: string \| string[])` | 更新绑定值。范围选择时，当两个端点都选定后触发。 |
| `change`            | `(value: string \| string[])` | 最终确定选择值时触发。                           |

## Slots

| 名称 | 参数 | 描述             |
| ---- | ---- | ---------------- |
| -    | -    | 暂无自定义插槽。 |

## UI

各个内部组件的 UI 样式覆盖参数。

### Web 版本 `ui`

该组件仅 Web 端提供。面板由「快捷侧栏 + 主面板（可双联）」组成，`type` 决定主面板渲染日期网格、月份/年份四列网格还是带时间列的复合视图，因此下表中不少键只在特定 `type` 或 `range` 模式下才会出现。

**布局骨架**

| 名称         | 描述                                                                                                                                                      |
| :----------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`    | 面板最外层容器，默认 `bg-gray-1 transition-all overflow-hidden`，宽度由 `width` 变体给出（`auto` 为 `w-fit`、`full` 为 `w-full`）；面板底色与圆角改这里。 |
| `container`  | 「快捷侧栏 + 内容区」的横向容器，默认 `flex h-full`。                                                                                                     |
| `shortcuts`  | 快捷选择侧边栏容器，默认 `border-r border-gray-2 p-4 flex flex-col gap-4 overflow-y-auto` + 隐藏滚动条。**仅传入 `shortcuts` 且非空时渲染。**             |
| `shortcut`   | 单个快捷选择项，默认 `min-w-15 text-sm text-gray-6 hover:bg-gray-2 hover:text-primary cursor-pointer transition-colors whitespace-nowrap`。               |
| `content`    | 快捷侧栏右侧的内容区，默认 `flex-1`；面板内边距由头部与各网格自带（左右 20px）。                                                                          |
| `panelLeft`  | 主（左）面板容器，默认 `w-full`。                                                                                                                         |
| `panelRight` | 双联模式下的右面板容器，默认 `flex-1`。**仅 `daterange` / `datetimerange` / `monthrange` / `quarterrange` / `yearrange` 渲染。**                          |

**顶部导航**

| 名称           | 描述                                                                                                                                                        |
| :------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header`       | 顶部导航行，默认 `flex items-center justify-between px-[20px] pt-[16px] pb-[12px]`。                                                                        |
| `navGroup`     | 单侧翻页按钮组，默认 `flex items-center gap-[8px]`；日期视图同侧有「跨年 + 跨月」两个按钮，间距改这里。                                                     |
| `navBtn`       | 左右翻页按钮，默认 `flex items-center rounded-md hover:bg-gray-2 transition-colors cursor-pointer text-gray-6`。                                            |
| `navBtnHidden` | 双联模式下被隐藏的那一侧翻页按钮组（占位保持对齐），默认 `opacity-0 pointer-events-none`；想彻底去掉占位就在这里加 `hidden`。                               |
| `title`        | 中间的年份/月份切换标题（点击进入年选/月选），默认 `text-base font-medium text-gray-10 cursor-pointer hover:text-primary transition-colors`（14px / 500）。 |
| `icon`         | 翻页按钮内的箭头图标，默认 `transition-all size-[16px]`；日期视图外侧用 `lucide:chevrons-left/right` 跨年，内侧用 `lucide:chevron-left/right` 跨月。        |

**日期网格**

| 名称                            | 描述                                                                                                                                                                                                                                                                                             |
| :------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `weekdays`                      | 星期表头容器，默认 `grid grid-cols-7 justify-items-center text-sm text-gray-6 px-[20px] pt-[8px] pb-[12px]`；上 8px、下 12px 分别与头部、日期网格拉开间距。                                                                                                                                      |
| `weekday`                       | 单个星期标签，默认 `size-[30px] flex items-center justify-center`；与日期格同宽同高，两套栅格才逐列对齐。                                                                                                                                                                                        |
| `days`                          | 日期网格容器，默认 `grid grid-cols-7 gap-y-[12px] px-[20px] pb-[16px] min-w-[334px]`；行距 12px，列不加 `gap-x`（会切断范围带子），左右间隔靠列宽富余实现：`min-w` 保证每列 ≥ 42px，30px 的日期格之间留 12px。                                                                                   |
| `dayCell`                       | 日期格外面的格位，默认 `flex h-[38px] my-[-4px] w-full items-center justify-center`：宽度撑满所在列，**范围模式的底色画在这一层**，相邻两列首尾相接连成一条不断的带子。高度取「日期格 + 上下各 4px」，负外边距把占位压回 30px——行高不变，带子却能上下各超出日期格 4px；日期格本身仍是 30px。      |
| `dayRangeStart` / `dayRangeEnd` | 范围带子的首端 / 末端，默认 `w-[calc(50%+19px)] ml-auto justify-start pl-[4px]`（末端为镜像的 `mr-auto justify-end pr-[4px]`）：带子只画「内侧半列 + 半个日期格 + 外扩 4px」，端点外侧固定超出日期格 4px 后封口，不随列宽富余变化。封口圆角由 `activeType` 给出（`fill` 与 `outline` 为 `rounded-l-[4px]` / `rounded-r-[4px]`，`fillRound` 为 `rounded-l-full` / `rounded-r-full`，`text` 不加）。合并进 `dayCell`；起止为同一天时不画带子。 |
| `day`                           | 单个日期格，默认 `size-[30px] box-border flex items-center justify-center text-base cursor-pointer transition-colors text-gray-9 hover:bg-gray-2`（30px / 14px / 正文色）；圆角由 `activeType` 给出。                                                                                            |
| `dayActive`                     | 选中日期的附加样式，默认由 `color` × `activeType` 复合变体给出（`primary` + `fill` 时为 `bg-primary text-gray-1 hover:bg-primary rounded-[4px]`）。**不是独立节点**——选中时并入 `day` 节点，冲突类名由 tailwind-merge 裁决。                                                                     |
| `dayInRange`                    | 范围模式下落在起止之间的日期底色（带子本身），同时并进 `dayCell` 与 `day` 两层：前者铺满整列连成带子，后者负责文字色与悬停。填色与描边三种类型默认取同色板第 1 阶浅底加 `gray-9`（`primary` 时 `bg-brand-1 text-gray-9`），`text` 类型只改文字色、不加底色。带子本身不带圆角，圆角只出现在两端。 |
| `dayToday`                      | 今日的标识样式，默认 `font-medium` 加 `color` 变体的语义色；仅在今日**未被选中**时叠加。同样是合并进 `day`。                                                                                                                                                                                     |
| `dayDisabled`                   | 越界、被 `disabledMethod` 排除的日期格，默认 `text-gray-5 cursor-not-allowed hover:bg-transparent`——保留指针事件才能显示禁用光标，点击由脚本层守卫拦截，悬停不再出现灰底反馈。同样是合并进 `day`。 |
| `dayDisabledBand`               | 禁用日期的灰底带子层，默认 `bg-gray-2`，画在 `dayCell` 上：只有被规则排除的格子进灰带，连续禁用格的底色逐格相接、连成整条灰带；范围带子（选中高亮）优先于灰带。 |
| `dayOutside`                    | 非本月的补位格，默认 `text-gray-5`：只调淡文字，保留手型光标与悬停反馈，照常可点——单面板点中后翻到该日期所在月份。`daterange` / `datetimerange` 的补位格不显示选中态与范围带子，只画在日期真正归属的那侧面板，避免双面板重复高亮。合并进 `day`。 |

**年 / 月 / 季度网格**

| 名称               | 描述                                                                                                                                                                                                                                                                 |
| :----------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `grid4Year`        | 年份视图的四列网格容器，默认 `grid grid-cols-4 gap-y-[30px] justify-items-center px-[20px] pb-[16px] min-w-[334px] overflow-auto`；`min-w` 与日期网格取同一数值，切换视图时面板宽度不跳动。                                                                          |
| `grid4Month`       | 月份视图的四列网格容器，默认 `grid grid-cols-4 gap-y-[30px] justify-items-center px-[20px] pb-[16px] min-w-[334px]`。                                                                                                                                                |
| `grid2Quarter`     | 季度视图的两列网格容器（四个季度排成两行），默认 `grid grid-cols-2 gap-y-[30px] justify-items-center px-[20px] pb-[16px] min-w-[334px]`。                                                                                                                            |
| `yearMonthItem`    | 单个年份 / 月份 / 季度格，默认 `h-[30px] box-border flex items-center justify-center cursor-pointer transition-colors text-base text-gray-9 hover:bg-gray-2 w-full`（高 30px / 14px / 正文色）；圆角由 `activeType` 给出，宽度撑满所在列，范围底色因此同样是连续的。 |
| `yearMonthInRange` | 范围模式下落在起止**之间**的年 / 月 / 季度，配色规则与 `dayInRange` 相同；`fill` / `fillRound` / `outline` 下额外带 `rounded-none`——浅色底画在 `yearMonthItem` 上，必须压掉它自带的圆角，中间项才能连成不断的直带。**不是独立节点**——合并进 `yearMonthItem`；首尾两端取 `dayActive`。 |
| `yearMonthRangeStart` / `yearMonthRangeEnd` | 年 / 月 / 季度范围两端的封口：`fill` / `fillRound` / `outline` 下为 `rounded-r-none` / `rounded-l-none`——端点内侧圆角压平、外侧保留 `activeType` 的圆角，实心端点与中间项的直带无缝相接，整条带子只在最外两端收圆，轮廓与日期网格的范围带一致。合并进 `yearMonthItem`；起止落在同一格时不加（保留完整圆角）。 |
| `yearMonthOutside` | 年份视图中不属于当前十年页的年份，默认 `opacity-40`。同样是合并进 `yearMonthItem`。                                                                                                                                                                                  |

**日期时间复合视图（`datetime` / `datetimerange`）**

| 名称                      | 描述                                                                                                                                               |
| :------------------------ | :------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dateTimeHeader`          | 「日期段 / 时间段」切换条的容器，默认 `flex items-center justify-center gap-2 w-full`。                                                            |
| `dateTimeSegment`         | 切换条中的单个段落（日期或时间），默认 `ring-1 ring-gray-3 text-sm h-6 leading-6 w-24 text-center rounded-md transition-all text-gray-7 flex-1`。  |
| `dateTimeSegmentActive`   | 可点击（当前可切换）的段落的附加样式，默认 `cursor-pointer hover:ring-primary/50 hover:text-primary`。**不是独立节点**——合并进 `dateTimeSegment`。 |
| `dateTimeSegmentDisabled` | 不可点击的段落的附加样式，默认 `cursor-not-allowed`。同样是合并进 `dateTimeSegment`。                                                              |
| `dateTimeSeparator`       | 两个段落之间的 `/` 分隔符，默认 `text-gray-3 font-light`。                                                                                         |

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
