---
title: 日期选择
description: 自定义日历式日期选择组件，支持年、月、日模式。
category: 表单与输入
tags: [css, tailwind, date, calendar, picker, uniapp]
badge: New
navigation:
  badges:
    - label: Web
      color: primary
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornSelectDateDemo.vue" config="RebornSelectDateConfig" componentId="reborn-select-date" :componentFiles='["RebornSelectDate.vue", "reborn-select-date.config.ts"]' :uniapp="true"}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `""` | 选中日期值（格式：`YYYY-MM-DD`、`YYYY-MM` 或 `YYYY`）。 |
| `type` | `"year" \| "month" \| "date"` | `"date"` | 选择器类型。 |
| `placeholder` | `string` | `"请选择日期"` | 占位文本。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `clearable` | `boolean` | `true` | 是否允许清空。 |
| `start` | `string` | `"1970-01-01"` | 可选日期范围起点。 |
| `end` | `string` | `"2099-12-31"` | 可选日期范围终点。 |
| `labelFormat` | `string` | - | 显示文本格式化模板（如 `YYYY年MM月DD日`）。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 颜色主题。 |
| `ui` | `Partial<{ wrapper, trigger, triggerText, placeholder, arrow, dropdown, calHeader, calNavBtn, calTitle, calWeekdays, calDays, calDay, calDayActive, calDayDisabled, calDayToday, clearBtn }>` | `{}` | 自定义类名覆盖。 |

## Events

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `string` | 选中值变化。 |
| `change` | `string` | 选中日期确认。 |

## 选择模式

| 模式 | 值格式 | 说明 |
| --- | --- | --- |
| `date` | `2024-01-15` | 日历视图，选择具体日期。 |
| `month` | `2024-01` | 月份网格，选择年月。 |
| `year` | `2024` | 年份网格，选择年份。 |

::
