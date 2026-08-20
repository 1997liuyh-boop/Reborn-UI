---
title: 日期选择
description: 用于通过弹出面板选择日期时间的选择器组件，支持年月日时分秒多粒度与范围选择。
category: 表单与输入
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornSelectDateDemo.vue" config="RebornSelectDateConfig" componentId="reborn-select-date" dependencies="dayjs" :componentFiles='["RebornSelectDate.vue", "reborn-select-date.config.ts"]' :uniappFiles='["RebornSelectDate.vue", "reborn-select-date.config.ts", "RebornButton.vue", "reborn-button.config.ts", "RebornPickerView.vue", "reborn-picker-view.config.ts", "RebornPopup.vue", "reborn-popup.config.ts", "RebornSelectTrigger.vue", "reborn-select-trigger.config.ts"]'}

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
| `bordered` | `boolean` | `true` | 是否显示边框。 |
| `showArrow` | `boolean` | `true` | 是否显示右侧箭头图标。 |
| `arrowAnimation` | `boolean` | `true` | 展开时箭头是否旋转动画。 |
| `portal` | `boolean` | `true` | 浮层是否传送到 `body`。默认开启，浮层按文档坐标锚定触发器，不受祖先 `overflow` / `transform` 裁剪；关闭后浮层留在触发器内，随父容器一起滚动、一起被裁剪。 |
| `triggerUi` | `Partial<SelectTriggerUI>` | `{}` | 用于覆盖 `RebornSelectTrigger` 内部组件样式的 UI 配置对象。 |
| `class` | `any` | - | 追加到触发器根元素的自定义类名（Web 端）。 |
| `ui` | `Partial<SelectDateUiShape>` | `{}` | 组件自身样式覆盖对象，两端键位不同：UniApp 端可重写范围选择区、快捷选项、底部按钮等（见下方 `ui`），Web 端可重写日历面板各区域。 |
| `popupUi` | `Partial<PopupUiShape>` | `{}` | 底部弹出层（RebornPopup）样式覆盖对象，可重写遮罩、面板、头部、标题等区域（UniApp 端，见下方 `popupUi`）。 |
| `pickerUi` | `Partial<PickerUiShape>` | `{}` | 滚轮选择器（RebornPickerView）样式覆盖对象，可重写表头、选项、指示器等区域（UniApp 端，见下方 `pickerUi`）。 |

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
| `default` | `{ displayText, placeholder, isOpen, ui }` | 自定义触发器内容。 |
| `cover`   | `{ displayText, placeholder, isOpen, ui }` | 覆盖整个触发器内容的插槽，完全替代文本和图标。 |
| `tag`     | `-`                                        | 自定义选择后的展示标签（UniApp 端）。 |

## Expose

通过模板 ref 可调用以下方法（UniApp 端）：

| 方法名 | 参数 | 描述 |
| --- | --- | --- |
| `open` | `(cb?: (value: string \| string[]) => void)` | 打开底部选择弹出层（禁用状态下无效）；可传入回调，在确认时接收选中值。 |
| `close` | - | 关闭底部选择弹出层（不触发确认）。 |
| `clear` | - | 清空已选值并触发 `change` / `range-change` 事件。 |
| `confirm` | - | 以当前滚轮选中值执行确认逻辑（范围不完整或倒序时会提示并中断），随后关闭弹出层。 |
| `setValue` | `(val: string)` | 设置非范围模式的当前选中值（空值时重置为当前时间，仅更新内部状态，不触发事件）。 |
| `setValues` | `(val: string[])` | 设置范围模式的开始/结束值数组（仅更新内部状态，不触发事件）。 |
| `setRange` | `(index: number)` | 切换范围模式当前编辑项：`0` 为开始时间，`1` 为结束时间。 |

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
