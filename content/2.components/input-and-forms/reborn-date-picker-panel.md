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
| 名称 | 描述 |
| --- | --- |
| `wrapper` | 面板最外层容器。 |
| `container` | 包含快捷选择和主面板的内部容器。 |
| `shortcuts` | 快捷选择侧边栏容器。 |
| `shortcut` | 单个快捷选择项。 |
| `header` | 顶部导航区域样式。 |
| `navBtn` | 左右导航切换按钮样式。 |
| `title` | 中间年份/月份切换标题样式。 |
| `weekdays` | 星期表头展示容器样式。 |
| `days` | 日期/月份/年份网格展示容器样式。 |
| `day` | 单个日期单元格的基础样式。 |
| `dayActive` | 选中状态下的日期单元格样式。 |
| `dayDisabled` | 禁用或非当前范围的日期样式。 |
| `dayToday` | 今日日期的标识样式。 |
