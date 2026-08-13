---
title: 时间选择器
description: 支持滚轮选择、箭头调节、禁用时分秒和范围选择的时间选择器。
category: 表单与输入
badge: Update
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: UPDATE
    color: warning
---

::ComponentViewer{demoFile="RebornTimePickerDemo.vue" config="RebornTimePickerConfig" componentId="reborn-time-picker" dependencies="dayjs" :componentFiles='["RebornTimePicker.vue", "RebornTimePanel.vue", "reborn-time-picker.config.ts", "reborn-time-panel.config.ts", "index.ts"]'}
::

## API

| 属性名             | 类型                                                                                                   | 默认值         | 说明                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------ | -------------- | ---------------------------------------------------------------------------------- |
| `modelValue`       | `string \| string[]`                                                                                   | `''`           | 绑定值。单选时为时间字符串，范围模式时为 `[start, end]`。                          |
| `placeholder`      | `string`                                                                                               | `'请选择时间'` | 单选模式占位文案。                                                                 |
| `startPlaceholder` | `string`                                                                                               | `'开始时间'`   | 范围模式开始时间占位文案。                                                         |
| `endPlaceholder`   | `string`                                                                                               | `'结束时间'`   | 范围模式结束时间占位文案。                                                         |
| `rangeSeparator`   | `string`                                                                                               | `'~'`          | 范围模式触发器中的分隔符。                                                         |
| `disabled`         | `boolean`                                                                                              | `false`        | 是否禁用。                                                                         |
| `clearable`        | `boolean`                                                                                              | `true`         | 是否显示清空按钮。                                                                 |
| `isRange`          | `boolean`                                                                                              | `false`        | 开启时间范围选择，对应模板写法 `is-range`。                                        |
| `arrowControl`     | `boolean`                                                                                              | `false`        | 使用上下箭头调节时间，对应模板写法 `arrow-control`。默认模式下可使用鼠标滚轮切换。 |
| `format`           | `string`                                                                                               | `'HH:mm:ss'`   | 时间显示与输出格式。                                                               |
| `disabledHours`    | `(role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                               | `() => []`     | 返回禁用小时列表。范围模式下可按 `role` 区分开始和结束面板。                       |
| `disabledMinutes`  | `(hour: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]`                 | `() => []`     | 返回禁用分钟列表。                                                                 |
| `disabledSeconds`  | `(hour: number, minute: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]` | `() => []`     | 返回禁用秒列表。                                                                   |
| `size`             | `'sm' \| 'md' \| 'lg'`                                                                                 | `'md'`         | 组件尺寸。                                                                         |
| `color`            | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'`                 | `'primary'`    | 组件主题色。                                                                       |
| `bordered`         | `boolean`                                                                                              | `true`         | 是否显示边框。                                                                     |
| `showArrow`        | `boolean`                                                                                              | `true`         | 是否显示右侧箭头图标。                                                             |
| `arrowAnimation`   | `boolean`                                                                                              | `true`         | 展开时箭头是否旋转动画。                                                               |
| `portal`           | `boolean`                                                                                              | `true`         | 浮层是否传送到 `body`。默认开启，浮层按文档坐标锚定触发器，不受祖先 `overflow` / `transform` 裁剪；关闭后浮层留在触发器内，随父容器一起滚动、一起被裁剪。 |
| `triggerUi`        | `Partial<SelectTriggerUI>`                                                                             | `{}`           | 用于覆盖 `RebornSelectTrigger` 内部组件样式的 UI 配置对象。                        |
| `ui`               | `Partial<TimePickerUI>`                                                                                | `{}`           | 用于覆盖 `RebornTimePicker` 内部（如范围文本）样式的 UI 配置对象。                |

## Emits

| 事件名              | 参数                          | 说明                   |
| ------------------- | ----------------------------- | ---------------------- |
| `update:modelValue` | `(value: string \| string[])` | 时间变更时更新绑定值。 |
| `change`            | `(value: string \| string[])` | 时间变更后触发。       |

## Slots

| 名称 | 参数 | 描述 |
| --- | --- | --- |
| `default` | `{ isOpen, toggle, clear, hasValue, rangeDisplay, singleDisplay }` | 自定义触发器显示内容。 |
| `cover`   | `{ isOpen, toggle, clear, hasValue, rangeDisplay, singleDisplay }` | 覆盖整个触发器内容的插槽，完全替代文本和图标。 |

## UI

### `triggerUi`

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
| `dropdown`           | 下拉菜单根容器样式（含定位及阴影）。        |
| `dropdownInner`      | 下拉菜单内层容器样式。                      |

### `ui`

覆盖 `RebornTimePicker` 特有部分的样式参数：

| 名称          | 说明                       |
| ------------- | -------------------------- |
| `wrapper`     | 外层容器样式。             |
| `triggerText` | 触发器中的时间文本样式。   |
| `placeholder` | 触发器中的占位文本样式。   |
| `dropdown`    | 下拉面板过渡容器样式。     |
| `rangeText`   | 范围模式下的布局容器样式。 |
| `separator`   | 范围分隔符样式。           |

面板内部样式由 `RebornTimePanel` 管理，包含列容器、箭头按钮、选项列表和底部提示等区域，可在源码中继续扩展。
