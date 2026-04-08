---
title: 下拉选择
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

::ComponentViewer{demoFile="RebornSelectDemo.vue" config="RebornSelectConfig" componentId="reborn-select" :componentFiles='["RebornSelect.vue", "RebornSelectTrigger.vue", "reborn-select.config.ts", "reborn-select-trigger.config.ts", "RebornTransition.vue"]' :uniappFiles='["RebornDropdownSelect.vue", "reborn-dropdown-select.config.ts", "RebornSelectTrigger.vue", "reborn-select-trigger.config.ts", "RebornTransition.vue", "reborn-transition.config.ts"]'}
::

## API

| 属性名        | 类型                                                                                                           | 默认值                         | 描述                                                                          | 平台   |
| ------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------- | ------ |
| `modelValue`  | `any` (Web) / `string \| number \| (string \| number)[] \| null` (UniApp)                                      | `null`                         | 选择器的值。                                                                  | 通用   |
| `multiple`    | `boolean`                                                                                                      | `false`                        | 是否为多选模式。开启后 `modelValue` 为数组格式。                              | Web    |
| `options`     | `SelectOption[]`                                                                                               | `[]`                           | 选择器的数据源选项。`SelectOption` 包含 `label`、`value`、`disabled` 等字段。 | 通用   |
| `placeholder` | `string`                                                                                                       | `'请选择'`                     | 选择器的占位符文本。                                                          | 通用   |
| `disabled`    | `boolean`                                                                                                      | `false`                        | 是否禁用选择器。UniApp 版本兼容 `reborn-form`。                               | 通用   |
| `clearable`   | `boolean`                                                                                                      | `true`                         | 是否显示清空按钮。                                                            | 通用   |
| `color`       | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'`                         | `'primary'`                    | 选择器的主题颜色。                                                            | 通用   |
| `bordered`    | `boolean`                                                                                                      | `true`                         | 是否显示边框。                                                                | Web    |
| `showArrow`   | `boolean`                                                                                                      | `true`                         | 是否显示右侧箭头图标。                                                        | Web    |
| `arrowAnimation` | `boolean`                                                                                                   | `true`                         | 展开时箭头是否旋转动画。                                                      | Web    |
| `size`        | `'sm' \| 'md' \| 'lg'` (Web) / `'sm' \| 'md' \| 'lg'` (UniApp)                                                 | `'md'` (Web) / `'lg'` (UniApp) | 选择器的尺寸。                                                                | 通用   |
| `class`       | `any`                                                                                                          | -                              | 自定义样式类名。                                                              | Web    |
| `triggerUi`   | `Partial<SelectTriggerUI>`                                                                                     | `{}`                           | 用于覆盖 `RebornSelectTrigger` 内部组件样式的 UI 配置对象。                   | Web    |
| `ui`          | `Partial<SelectUI>`                                                                                            | `{}`                           | 用于覆盖 `RebornSelect` 内部（如选项列表）样式的 UI 配置对象。                | Web    |
| `title`       | `string`                                                                                                       | `'请选择'`                     | 弹出层的标题。                                                                | UniApp |
| `showTrigger` | `boolean`                                                                                                      | `true`                         | 是否显示默认的触发器。                                                        | UniApp |
| `columnCount` | `number`                                                                                                       | `1`                            | 数据源的列数，用于多列选择。                                                  | UniApp |
| `splitor`     | `string`                                                                                                       | `' - '`                        | 多选或多列数据在触发器中的分隔符文本。                                        | UniApp |
| `confirmText` | `string`                                                                                                       | `'确定'`                       | 弹出层确认按钮文本。                                                          | UniApp |
| `showConfirm` | `boolean`                                                                                                      | `true`                         | 是否显示弹出层确认按钮。                                                      | UniApp |
| `cancelText`  | `string`                                                                                                       | `'取消'`                       | 弹出层取消按钮文本。                                                          | UniApp |
| `showCancel`  | `boolean`                                                                                                      | `true`                         | 是否显示弹出层取消按钮。                                                      | UniApp |

## Emits

| 事件名              | 参数           | 描述                                                                  | 平台   |
| ------------------- | -------------- | --------------------------------------------------------------------- | ------ |
| `update:modelValue` | `(value: any)` | 更新绑定值。                                                          | 通用   |
| `change`            | `(value: any)` | 选择值改变时触发。Web 版本在选择时立即触发，UniApp 版本在确认后触发。 | 通用   |
| `changing`          | `(value: any)` | 滚动列表选项正在改变时触发（未确认）。                                | UniApp |

## Slots

### 通用插槽

| 名称      | 参数                                             | 描述                                                           | 平台差异                           |
| --------- | ------------------------------------------------ | -------------------------------------------------------------- | ---------------------------------- |
| `default` | `{ displayText, placeholder, isOpen, ui }`       | 自定义触发器内容。                                             | Web 平台在 `RebornSelect` 中开放。 |
| `cover`   | `{ displayText, placeholder, isOpen, ui }`       | 覆盖整个触发器内容的插槽，完全替代文本和图标。                 | Web 平台在 `RebornSelect` 中开放。 |
| `option`  | **Web**: `{ option, active }`<br>**UniApp**: - | 自定义选项渲染内容。Web 版本提供 `option` 对象和 `active` 状态。 | Web 平台特有。                     |

### UniApp 专属插槽

| 名称      | 参数                    | 描述                                                                              |
| --------- | ----------------------- | --------------------------------------------------------------------------------- |
| `tag`     | `{ selectItem: any[] }` | 自定义选择后在触发器中显示的标签内容。`selectItem` 为当前选中的完整选项对象数组。 |
| `prepend` | -                       | 在选择列表上方插入自定义内容，位于 `RebornPickerView` 之前。                      |
| `append`  | -                       | 在选择列表下方插入自定义内容，位于 `RebornPickerView` 之后、按钮区域之前。        |
| `empty`   | -                       | 自定义数据为空时的显示内容，默认显示"暂无数据"。                                  |

## UI

### Web 版本 `triggerUi`

覆盖 `RebornSelectTrigger` 的样式参数：

| 名称                 | 描述                                        |
| -------------------- | ------------------------------------------- |
| `wrapper`            | 触发器最外层容器样式。                      |
| `trigger`            | 触发器按钮样式。                            |
| `triggerText`        | 触发器文本样式。                            |
| `triggerIconWrapper` | 触发器右侧图标（清除/箭头）的包装容器样式。 |
| `placeholder`        | 占位符文本样式。                            |
| `clearBtn`           | 清空按钮样式。                              |
| `arrow`              | 箭头图标样式。                              |
| `dropdown`           | 下拉菜单根容器样式。                        |
| `dropdownInner`      | 下拉菜单内层容器样式。                      |

### Web 版本 `ui`

覆盖 `RebornSelect` 内部列表的样式参数：

| 名称               | 描述                                                 |
| ------------------ | ---------------------------------------------------- |
| `dropdown`         | 下拉列表内容区域样式（含 `max-height`）。            |
| `option`           | 选项整体容器样式。                                   |
| `optionContent`    | 选项内容区（包含文本及选中图标）的包装样式。         |
| `optionLabel`      | 选项文本样式。                                       |
| `optionActive`     | 选中选项的背景/文本颜色样式（由 `color` 变量控制）。 |
| `optionActiveIcon` | 选中状态下的 Check 图标样式。                        |
| `optionHighlight`  | 键盘或鼠标悬停时的背景高亮样式。                     |
| `empty`            | 数据为空时的显示区域样式。                           |

### UniApp 版本 `ui`

| 名称            | 描述                       |
| --------------- | -------------------------- |
| `empty`         | 数据为空时的整体容器样式。 |
| `buttons`       | 底部按钮区域外层容器样式。 |
| `emptyText`     | 数据为空时的提示文本样式。 |
| `cancel`        | 取消按钮容器样式。         |
| `cancelButton`  | 取消按钮样式覆盖。         |
| `confirm`       | 确认按钮容器样式。         |
| `confirmButton` | 确认按钮样式覆盖。         |

### UniApp `triggerUi`

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

### UniApp `popupUi`

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

### UniApp `pickerUi`

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
