---
title: 日期选择
description: 自定义日历式日期选择组件，支持年、月、日模式以及时间范围选择。
category: Input and Forms
badge: New
navigation:
  badges:
    - label: 通
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornSelectDateDemo.vue" config="RebornSelectDateConfig" componentId="reborn-select-date" :componentFiles='["RebornSelectDate.vue", "reborn-select-date.config.ts"]' :uniappFiles='["RebornSelectDate.vue", "reborn-select-date.config.ts", "RebornButton.vue", "reborn-button.config.ts", "RebornPickerView.vue", "reborn-picker-view.config.ts", "RebornPopup.vue", "reborn-popup.config.ts", "RebornSelectTrigger.vue", "reborn-select-trigger.config.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `''` | 选择器的值（非范围选择时绑定）。 |
| `values` | `string[]` | `[]` | 选择器的值（范围选择时绑定，包含开始和结束值）。 |
| `title` | `string` | `'请选择'` | 弹出层标题。 |
| `headers` | `string[]` | `["年", "月", "日", "时", "分", "秒"]` | 选择器表头文本。 |
| `placeholder` | `string` | `'请选择'` | 选择器的占位符。 |
| `showTrigger` | `boolean` | `true` | 是否显示默认的触发器。 |
| `disabled` | `boolean` | `false` | 是否禁用，同时兼容 `reborn-form`。 |
| `confirmText` | `string` | `'确定'` | 确认按钮文本。 |
| `showConfirm` | `boolean` | `true` | 是否显示确认按钮。 |
| `cancelText` | `string` | `'取消'` | 取消按钮文本。 |
| `showCancel` | `boolean` | `true` | 是否显示取消按钮。 |
| `labelFormat` | `string` | `''` | 触发器文本显示格式模板（如 `YYYY-MM-DD HH:mm:ss`）。如果不传则根据 `type` 自动推导。 |
| `valueFormat` | `string` | `''` | 绑定值对应的格式模板。如果不传则根据 `type` 自动推导。 |
| `start` | `string` | `'1970-01-01 00:00:00'` | 允许选择的最早时间。 |
| `end` | `string` | `'2099-12-31 23:59:59'` | 允许选择的最晚时间。 |
| `type` | `'year' \| 'month' \| 'date' \| 'hour' \| 'minute' \| 'second'` | `'second'` | 时间选择器精度级别。 |
| `rangeable` | `boolean` | `false` | 是否开启时间范围选择。 |
| `startPlaceholder` | `string` | `'开始日期'` | 范围选择时的起始占位符。 |
| `endPlaceholder` | `string` | `'结束日期'` | 范围选择时的结束占位符。 |
| `rangeSeparator` | `string` | `'至'` | 触发器中范围值的分隔符。 |
| `showShortcuts` | `boolean` | `true` | 范围选择时是否显示快捷选项区域。 |
| `shortcuts` | `SelectDateShortcut[]` | 内部默认选项 | 快捷选项数据列表，如“近7天”、“近30天”等。 |
| `clearable` | `boolean` | `true` | 是否显示清空按钮。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸。 |
| `color` | `'primary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 选择器的主题颜色。 |

## Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | 非范围选择时，更新绑定值。 |
| `change` | `(value: string)` | 非范围选择时，确认选择时触发。 |
| `update:values` | `(value: string[])` | 范围选择时，更新绑定的范围数组。 |
| `range-change` | `(value: string[])` | 范围选择时，确认选择时触发。 |

## Slots

| 名称 | 参数 | 描述 |
| --- | --- | --- |
| `tag` | `-` | 自定义选择后的展示标签。 |

## UI
各个内部组件的 UI 样式覆盖参数。

### `ui`
| 名称 | 描述 |
| --- | --- |
| `wrapper` | 外层容器样式。 |
| `popupOp` | 弹出层底部操作区样式。 |
| `rangeBox` | 范围选择模式上方的选项盒样式。 |
| `rangeValues` | 范围选择模式两个日期显示组的样式。 |
| `rangeStart` | 范围选择模式开始日期项的样式。 |
| `rangeEnd` | 范围选择模式结束日期项的样式。 |
| `shortcuts` | 快捷选择项的区域样式。 |
| `separator` | 范围模式内部分隔符样式。 |

### `triggerUi`
覆盖 `RebornSelectTrigger`。支持 `wrapper`, `content`, `text`, `placeholder`, `iconWrapper`, `clearIcon`, `arrowIcon` 等。

### `popupUi`
覆盖 `RebornPopup`。支持 `wrapper`, `mask`, `popup`, `inner`, `draw`, `header`, `title`, `container` 等。

### `pickerUi`
覆盖 `RebornPickerView`。支持 `wrapper`, `header`, `headerText`, `pickerContainer`, `item`, `itemText`, `indicator` 等。
