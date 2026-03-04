---
title: 下拉选择
description: 自定义下拉选择组件，支持键盘导航和动画过渡。
category: 表单与输入
tags: [css, tailwind, select, dropdown, uniapp]
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


::ComponentViewer{demoFile="RebornSelectDemo.vue" config="RebornSelectConfig" componentId="reborn-select" :componentFiles='["RebornSelect.vue", "reborn-select.config.ts"]' :uniappFiles='["RebornSelect.vue", "reborn-select.config.ts", "RebornButton.vue", "reborn-button.config.ts", "RebornPickerView.vue", "reborn-picker-view.config.ts", "RebornPopup.vue", "reborn-popup.config.ts", "RebornSelectTrigger.vue", "reborn-select-trigger.config.ts"]' dependencies="lodash-es"}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string \| number \| (string \| number)[] \| null` | `null` | 选择器的值。 |
| `title` | `string` | `'请选择'` | 弹出层的标题。 |
| `placeholder` | `string` | `'请选择'` | 选择器的占位符文本。 |
| `options` | `SelectOption[]` | `[]` | 选择器的数据源选项。 |
| `showTrigger` | `boolean` | `true` | 是否显示默认的触发器。 |
| `disabled` | `boolean` | `false` | 是否禁用选择器，同时兼容 `reborn-form`。 |
| `columnCount` | `number` | `1` | 数据源的列数，用于多列选择。 |
| `splitor` | `string` | `' - '` | 多选或多列数据在触发器中的分隔符文本。 |
| `confirmText` | `string` | `'确定'` | 弹出层确认按钮文本。 |
| `showConfirm` | `boolean` | `true` | 是否显示弹出层确认按钮。 |
| `cancelText` | `string` | `'取消'` | 弹出层取消按钮文本。 |
| `showCancel` | `boolean` | `true` | 是否显示弹出层取消按钮。 |
| `clearable` | `boolean` | `true` | 是否显示清空按钮。 |
| `color` | `'primary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'` | 选择器的主题颜色。 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 选择器的尺寸。 |

## Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: SelectValue)` | 更新绑定值。 |
| `change` | `(value: SelectValue, select: any)` | 确认选择并关闭弹窗时触发。 |
| `changing` | `(value: SelectValue)` | 滚动列表选项正在改变时触发（未确认）。 |

## Slots

| 名称 | 参数 | 描述 |
| --- | --- | --- |
| `tag` | `{ selectItem: any[] }` | 自定义选择后的被选用作显示的标签。 |
| `prepend` | `-` | 紧贴在选择列表上方的自定义内容插槽。 |
| `append` | `-` | 紧贴在选择列表下方的自定义内容插槽。 |
| `option` | `{ item: SelectOption, index: number }` | 自定义具体选项渲染内容（仅非微信小程序环境生效）。 |

## UI
各个内部组件的 UI 样式覆盖参数。

### `ui`
| 名称 | 描述 |
| --- | --- |
| `empty` | 数据为空时的整体容器样式。 |
| `buttons` | 底部按钮区域外层容器样式。 |
| `emptyText` | 数据为空时的提示文本样式。 |
| `cancel` | 取消按钮样式覆盖。 |
| `confirm` | 确认按钮样式覆盖。 |

### `triggerUi`
覆盖 `RebornSelectTrigger` 的样式参数：
- `wrapper`：触发器容器样式。
- `content`：内容区样式。
- `text`：文本样式。
- `placeholder`：占位符样式。
- `iconWrapper`：图标容器样式。
- `clearIcon`：清除图标样式。
- `arrowIcon`：箭头图标样式。

### `popupUi`
覆盖 `RebornPopup` 的样式参数：
- `wrapper`, `mask`, `popup`, `inner`, `draw`, `header`, `title`, `container` 等。

### `pickerUi`
覆盖 `RebornPickerView` 的样式参数：
- `wrapper`, `header`, `headerText`, `pickerContainer`, `item`, `itemText`, `indicator` 等。
