---
title: 下拉选择2
description: 自定义下拉选择组件，支持键盘导航和动画过渡。
category: 表单与输入
tags: [css, tailwind, select, dropdown, uniapp]
badge: Update
navigation:
  badges:
    - label: 通
      color: primary
  chip:
    label: UPDATE
    color: warning
---


::ComponentViewer{demoFile="RebornSelectDemo2.vue" config="RebornSelectConfig2" componentId="reborn-select-2" :componentFiles='[]' :uniappFiles='["RebornSelect.vue", "reborn-select.config.ts", "RebornButton.vue", "reborn-button.config.ts", "RebornPickerView.vue", "reborn-picker-view.config.ts", "RebornPopup.vue", "reborn-popup.config.ts", "RebornSelectTrigger.vue", "reborn-select-trigger.config.ts"]' dependencies="lodash-es"}
::


## API

| 属性名 | 类型 | 默认值 | 描述 | 平台 |
| --- | --- | --- | --- | --- |
| `modelValue` | `any` (Web) / `string \| number \| (string \| number)[] \| null` (UniApp) | `null` | 选择器的值。 | 通用 |
| `multiple` | `boolean` | `false` | 是否为多选模式。开启后 `modelValue` 为数组格式。 | Web |
| `options` | `SelectOption[]` | `[]` | 选择器的数据源选项。`SelectOption` 包含 `label`、`value`、`disabled` 等字段。 | 通用 |
| `placeholder` | `string` | `'请选择'` | 选择器的占位符文本。 | 通用 |
| `disabled` | `boolean` | `false` | 是否禁用选择器。UniApp 版本兼容 `reborn-form`。 | 通用 |
| `clearable` | `boolean` | `true` | 是否显示清空按钮。 | 通用 |
| `color` | `'primary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 选择器的主题颜色。 | 通用 |
| `size` | `'sm' \| 'md' \| 'lg'` (Web) / `'sm' \| 'md' \| 'lg'` (UniApp) | `'md'` (Web) / `'lg'` (UniApp) | 选择器的尺寸。 | 通用 |
| `class` | `any` | - | 自定义样式类名。 | Web |
| `title` | `string` | `'请选择'` | 弹出层的标题。 | UniApp |
| `showTrigger` | `boolean` | `true` | 是否显示默认的触发器。 | UniApp |
| `columnCount` | `number` | `1` | 数据源的列数，用于多列选择。 | UniApp |
| `splitor` | `string` | `' - '` | 多选或多列数据在触发器中的分隔符文本。 | UniApp |
| `confirmText` | `string` | `'确定'` | 弹出层确认按钮文本。 | UniApp |
| `showConfirm` | `boolean` | `true` | 是否显示弹出层确认按钮。 | UniApp |
| `cancelText` | `string` | `'取消'` | 弹出层取消按钮文本。 | UniApp |
| `showCancel` | `boolean` | `true` | 是否显示弹出层取消按钮。 | UniApp |

## Emits

| 事件名 | 参数 | 描述 | 平台 |
| --- | --- | --- | --- |
| `update:modelValue` | `(value: any)` | 更新绑定值。 | 通用 |
| `change` | `(value: any)` (Web) / `(value: SelectValue, select: any)` (UniApp) | 选择值改变时触发。Web 版本在选择时立即触发，UniApp 版本在确认后触发。 | 通用 |
| `changing` | `(value: SelectValue)` | 滚动列表选项正在改变时触发（未确认）。 | UniApp |

## Slots

### 通用插槽

| 名称 | 参数 | 描述 | 平台差异 |
| --- | --- | --- | --- |
| `option` | **Web**: `{ option: SelectOption, active: boolean }`<br>**UniApp**: `{ item: SelectOption, index: number }` | 自定义选项渲染内容。 | Web 版本提供 `active` 状态，UniApp 版本提供 `index` 索引。UniApp 版本仅在非微信小程序环境生效。 |

### UniApp 专属插槽

| 名称 | 参数 | 描述 |
| --- | --- | --- |
| `tag` | `{ selectItem: any[] }` | 自定义选择后在触发器中显示的标签内容。`selectItem` 为当前选中的完整选项对象数组。 |
| `prepend` | - | 在选择列表上方插入自定义内容，位于 `RebornPickerView` 之前。 |
| `append` | - | 在选择列表下方插入自定义内容，位于 `RebornPickerView` 之后、按钮区域之前。 |
| `empty` | - | 自定义数据为空时的显示内容，默认显示"暂无数据"。 |

## UI

各个内部组件的 UI 样式覆盖参数。

### Web 版本 `ui`
| 名称 | 描述 |
| --- | --- |
| `wrapper` | 选择器最外层容器样式。 |
| `trigger` | 触发器按钮样式。 |
| `triggerText` | 触发器文本样式。 |
| `placeholder` | 占位符文本样式。 |
| `arrow` | 箭头图标样式。 |
| `dropdown` | 下拉菜单容器样式。 |
| `option` | 选项样式。 |
| `optionActive` | 选中选项的样式。 |
| `clearBtn` | 清空按钮样式。 |

### UniApp 版本 `ui`
| 名称 | 描述 |
| --- | --- |
| `empty` | 数据为空时的整体容器样式。 |
| `buttons` | 底部按钮区域外层容器样式。 |
| `emptyText` | 数据为空时的提示文本样式。 |
| `cancel` | 取消按钮容器样式。 |
| `cancelButton` | 取消按钮样式覆盖。 |
| `confirm` | 确认按钮容器样式。 |
| `confirmButton` | 确认按钮样式覆盖。 |

### UniApp 版本 `triggerUi`
覆盖 `RebornSelectTrigger` 的样式参数：
| 名称 | 描述 |
| --- | --- |
| `wrapper` | 触发器容器样式。 |
| `content` | 内容区样式。 |
| `text` | 文本样式。 |
| `placeholder` | 占位符样式。 |
| `iconWrapper` | 图标容器样式。 |
| `clearIcon` | 清除图标样式。 |
| `arrowIcon` | 箭头图标样式。 |

### UniApp 版本 `popupUi`
覆盖 `RebornPopup` 的样式参数：
| 名称 | 描述 |
| --- | --- |
| `wrapper` | 弹出层最外层容器样式。 |
| `mask` | 遮罩层样式。 |
| `popup` | 弹出层内容容器样式。 |
| `inner` | 弹出层内部容器样式。 |
| `draw` | 抽屉样式。 |
| `header` | 头部容器样式。 |
| `title` | 标题文本样式。 |
| `container` | 内容容器样式。 |

### UniApp 版本 `pickerUi`
覆盖 `RebornPickerView` 的样式参数：
| 名称 | 描述 |
| --- | --- |
| `wrapper` | 选择器容器样式。 |
| `header` | 头部容器样式。 |
| `headerText` | 头部文本样式。 |
| `pickerContainer` | 选择器列表容器样式。 |
| `item` | 选项样式。 |
| `itemText` | 选项文本样式。 |
| `indicator` | 指示器样式。 |
