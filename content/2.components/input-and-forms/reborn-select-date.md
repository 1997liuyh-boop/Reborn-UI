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

| 属性名        | 类型                                                                                                                                                                                          | 默认值         | 描述                           |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------------------------ |
| `modelValue`  | `string`                                                                                                                                                                                      | `""`           | 选中值。                       |
| `type`        | `"year" \| "month" \| "date"`                                                                                                                                                                 | `"date"`       | 选择器类型。                   |
| `placeholder` | `string`                                                                                                                                                                                      | `"请选择日期"` | 占位文本。                     |
| `disabled`    | `boolean`                                                                                                                                                                                     | `false`        | 是否禁用。                     |
| `clearable`   | `boolean`                                                                                                                                                                                     | `true`         | 是否允许清空。                 |
| `start`       | `string`                                                                                                                                                                                      | `"1970-01-01"` | 可选范围起点。                 |
| `end`         | `string`                                                                                                                                                                                      | `"2099-12-31"` | 可选范围终点。                 |
| `labelFormat` | `string`                                                                                                                                                                                      | -              | 显示格式模板。                 |
| `valueFormat` | `string`                                                                                                                                                                                      | -              | 值格式预留参数（当前未启用）。 |
| `size`        | `"sm" \| "md" \| "lg"`                                                                                                                                                                        | `"md"`         | 尺寸大小。                     |
| `color`       | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"`                                                                                                        | `"primary"`    | 颜色主题。                     |
| `class`       | `any`                                                                                                                                                                                         | -              | 根节点 class。                 |
| `ui`          | `Partial<{ wrapper, trigger, triggerText, placeholder, arrow, dropdown, calHeader, calNavBtn, calTitle, calWeekdays, calDays, calDay, calDayActive, calDayDisabled, calDayToday, clearBtn }>` | -              | 样式覆盖。                     |

## Slots

| 插槽名     | Props                                                                                          | 描述             |
| ---------- | ---------------------------------------------------------------------------------------------- | ---------------- |
| `trigger`  | `{ toggle, isOpen, displayText }`                                                              | 自定义触发器。   |
| `dropdown` | `{ isOpen, panelMode, yearList, monthList, calendarDays, selectDay, selectMonth, selectYear }` | 自定义下拉面板。 |

::
