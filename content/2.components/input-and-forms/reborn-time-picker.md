---
title: 时间选择器
description: 用于选择时分秒的时间选择器组件，支持滚轮与箭头两种调节方式及时间范围选择。
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
| `disabledMilliseconds` | `(hour: number, minute: number, second: number, role?: 'start' \| 'end', comparingValue?: string \| null) => number[]` | `() => []` | 返回禁用毫秒列表，入参为当前时、分、秒。范围模式下可按 `role` 区分开始和结束面板。 |
| `class`            | `any`                                                                                                  | -              | 追加到触发器根元素的自定义类名。                                                   |
| `size`             | `'sm' \| 'md' \| 'lg'`                                                                                 | `'md'`         | 组件尺寸。                                                                         |
| `color`            | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'`                 | `'primary'`    | 组件主题色。                                                                       |
| `bordered`         | `boolean`                                                                                              | `true`         | 是否显示边框。                                                                     |
| `showArrow`        | `boolean`                                                                                              | `true`         | 是否显示右侧箭头图标。                                                             |
| `arrowAnimation`   | `boolean`                                                                                              | `true`         | 展开时箭头是否旋转动画。                                                               |
| `portal`           | `boolean`                                                                                              | `true`         | 浮层是否传送到 `body`。默认开启，浮层按文档坐标锚定触发器，不受祖先 `overflow` / `transform` 裁剪；关闭后浮层留在触发器内，随父容器一起滚动、一起被裁剪。 |
| `autoAdjustOverflow` | `boolean`                                                                                            | `true`         | 下拉框是否自动调整位置：下方空间不足且上方更宽裕时向上展开；关闭后固定向下展开。 |
| `triggerUi`        | `Partial<SelectTriggerUI>`                                                                             | `{}`           | 用于覆盖 `RebornSelectTrigger` 内部组件样式的 UI 配置对象。                        |
| `ui`               | `Partial<TimePickerUI>`                                                                                | `{}`           | 用于覆盖 `RebornTimePicker` 内部（如范围文本）样式的 UI 配置对象。                |

## Emits

| 事件名              | 参数                          | 说明                   |
| ------------------- | ----------------------------- | ---------------------- |
| `update:modelValue` | `(value: string \| string[])` | 时间变更时更新绑定值。 |
| `change`            | `(value: string \| string[])` | 时间变更后触发。       |
| `clear`             | -                             | 点击面板底部「清空」按钮清空值后触发（`RebornTimePanel` 事件）。 |
| `confirm`           | `(value: string \| string[])` | 点击面板底部「确定」按钮时触发，携带当前选中值并收起面板（`RebornTimePanel` 事件）。 |

## Slots

| 名称 | 参数 | 描述 |
| --- | --- | --- |
| `default` | `{ isOpen, toggle, clear, hasValue, rangeDisplay, singleDisplay }` | 自定义触发器显示内容。 |
| `cover`   | `{ isOpen, toggle, clear, hasValue, rangeDisplay, singleDisplay }` | 覆盖整个触发器内容的插槽，完全替代文本和图标。 |
| `footer`  | -                                                                  | 自定义面板底部操作栏内容，默认渲染「清空」和「确定」按钮（`RebornTimePanel` 插槽）。 |

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

### 自定义样式（ui）

`RebornTimePicker` 上的 `ui` 只作用于**触发器区域与浮层容器**（仅 Web 端）：

| 键名          | 说明                                                                                                                                                                     |
| :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`     | 组件最外层容器（`RebornSelectTrigger` 的根节点），默认 `relative inline-flex w-full group outline-none`；改宽度、改成行内块状排布都在这里。                               |
| `dropdown`    | 弹出浮层的根容器，默认为空，但会叠加 `size`×`isRange` 复合变体给出的最小宽度（单选 `min-w-40/45/52`，范围 `min-w-72/80/88`）；想让面板更宽或加阴影改这里。与 `triggerUi.dropdown` 可同时使用，二者会一起合并。 |
| `rangeText`   | 范围模式下「开始 ~ 结束」的行容器，默认 `flex items-center gap-2 truncate w-full`。**仅在未填充 default 插槽时渲染**，填充该插槽会替换掉该节点，`ui.rangeText` 随之失效。 |
| `triggerText` | 触发器中已选时间的文本节点，默认 `truncate text-gray-8 dark:text-gray-1 flex-1`。**仅在未填充 default 插槽时渲染**，填充该插槽会替换掉该节点，`ui.triggerText` 随之失效。 |
| `placeholder` | 触发器中的占位文本节点，默认 `truncate text-gray-4 dark:text-gray-5 flex-1`。**仅在未填充 default 插槽时渲染**，填充该插槽会替换掉该节点，`ui.placeholder` 随之失效。     |
| `separator`   | 范围模式下的分隔符节点（文字内容由 `rangeSeparator` 决定），默认 `shrink-0 text-gray-4 dark:text-gray-5`。**仅在未填充 default 插槽时渲染**，填充该插槽会替换掉该节点，`ui.separator` 随之失效。 |

**面板内部的 `ui` 要写在 `RebornTimePanel` 上**——`RebornTimePicker` 不会把 `ui` 下发给内部弹出的面板。需要调整时/分/秒滚动列的样式时，直接内联使用面板组件：

| 键名             | 说明                                                                                                                                                 |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`        | 面板根节点，默认 `w-full`，另按 `size` 追加内边距（`p-1`）。                                                                                          |
| `rangeWrapper`   | 范围模式下「开始面板 / 分隔符 / 结束面板」的栅格容器，默认 `grid gap-4 md:grid-cols-[1fr_auto_1fr]`。**仅 `isRange` 为真时渲染。**                     |
| `rangeSeparator` | 范围模式下两个面板之间的分隔符，默认 `hidden items-center justify-center text-gray-4 md:flex`（窄屏隐藏）。                                            |
| `section`        | 单个时间面板的纵向分区容器（滚动列 + 底部栏的父级），默认 `space-y-4`。                                                                                |
| `columns`        | 时/分/秒滚动列的横向容器，默认 `relative flex w-full overflow-hidden` + 按显示的列数生成的 `grid-cols-*`，另按 `size` 追加 `h-45 gap-2`；面板高度改这里。 |
| `column`         | 单列（如「时」列）容器，默认 `relative flex flex-1 flex-col items-center`。                                                                            |
| `arrowButton`    | 列上下两端的箭头按钮，默认 `flex w-full shrink-0 cursor-pointer items-center justify-center text-gray-4 hover:text-primary z-20`。**仅 `arrowControl` 为真时渲染。** |
| `list`           | 列内可滚动的选项列表，默认 `flex-1 flex flex-col items-center w-full overflow-y-auto scrollbar-hide`，另按 `size` 追加上下留白 `py-16`。                |
| `item`           | 单个时间选项，默认 `flex w-full shrink-0 cursor-pointer items-center justify-center transition-all`，另按 `size` 追加 `h-8 text-sm`；**行高改这里时要同步 `columns` 的高度与 `list` 的 `py`，否则选中项会对不上 `indicator`。** |
| `itemActive`     | 选中项的附加样式，默认 `font-semibold text-primary scale-110`。**不是独立节点**——选中时被合并进 `item` 所在节点。                                      |
| `itemDisabled`   | 被 `disabledHours` / `disabledMinutes` / `disabledSeconds` / `disabledMilliseconds` 排除的选项，默认 `cursor-not-allowed opacity-30 grayscale`。同样是合并进 `item`。 |
| `itemIdle`       | 未选中且可用的选项，默认 `text-gray-4 hover:text-gray-7`。同样是合并进 `item`。                                                                        |
| `indicator`      | 列中央标示当前选中行的横线框，默认 `absolute left-2 right-2 top-1/2 z-10 -translate-y-1/2 pointer-events-none border-y border-gray-2`。                 |
| `mask`           | 列上下两端的渐隐遮罩，默认 `absolute inset-0 pointer-events-none z-10 bg-gradient-to-b from-white/80 via-transparent to-white/80`；深色底上需要改这里的渐变色。 |
| `footer`         | 面板底部操作栏（默认「清空」「确定」两个按钮），默认 `flex items-center justify-end gap-3 border-t border-gray-2 p-2`。填充 `footer` 插槽只替换栏内内容，`ui.footer` 仍生效。 |

```vue
<template>
  <!-- 触发器与浮层 -->
  <RebornTimePicker
    v-model="time"
    :ui="{
      wrapper: 'w-60',
      dropdown: 'min-w-60 shadow-lg',
      triggerText: 'font-mono text-primary',
    }"
  />

  <!-- 面板（内联使用时才能改面板样式） -->
  <RebornTimePanel
    v-model="time"
    :ui="{
      columns: 'h-60',
      item: 'h-10 text-base',
      list: 'py-25',
      itemActive: 'font-bold text-error scale-100',
      indicator: 'border-primary',
    }"
  />
</template>
```
