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

两端形态不同（Web 是「触发器 + 日历浮层」，UniApp 是「触发器 + 底部弹窗 + 滚动选择器」），**键位完全不同**，不要跨端照抄。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

Web 端的 `cal*` 系列键会被转发给内部的 `RebornDatePickerPanel`（`calHeader` → 面板的 `header`，`calDay` → 面板的 `day`，以此类推）；**面板其余键位（年/月网格、日期时间段落等）不对外开放**，需要完整控制时请直接使用 `RebornDatePickerPanel`。

| 名称             | 描述                                                                                                                                                                     |
| :--------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`        | 组件最外层容器（`RebornSelectTrigger` 的根节点），默认为空；改宽度、加 `block` 之类的布局在这里。                                                                          |
| `dropdown`       | 日历浮层的根容器，默认 `w-[var(--rb-trigger-width,100%)]`（跟随触发器宽度）；想让浮层比触发器宽就在这里写死宽度。与 `triggerUi.dropdown` 会一起合并。                      |
| `content`        | 浮层内部包裹日历面板的容器，默认 `w-full`；面板内边距改这里（面板自身的 `wrapper` 已被强制为 `p-0`）。                                                                     |
| `calHeader`      | 日历顶部导航行，默认 `flex items-center justify-between mb-2`。                                                                                                            |
| `calNavBtn`      | 日历左右翻页按钮，默认 `p-1 rounded-md hover:bg-gray-2 dark:hover:bg-gray-7 transition-colors cursor-pointer text-gray-6 dark:text-gray-3`。                               |
| `calTitle`       | 日历中间的年月标题（点击切换年/月视图），默认 `text-sm font-medium text-gray-8 dark:text-gray-1 cursor-pointer hover:text-primary transition-colors`。                      |
| `calWeekdays`    | 星期表头容器，默认 `grid grid-cols-7 gap-0 text-center text-xs text-gray-4 dark:text-gray-5`。                                                                             |
| `calDays`        | 日期网格容器，默认 `grid grid-cols-7 gap-0.5`；格子间距改这里。                                                                                                            |
| `calDay`         | 单个日期格，默认 `flex items-center justify-center rounded-md text-sm cursor-pointer transition-colors text-gray-7 dark:text-gray-2 hover:bg-gray-2 dark:hover:bg-gray-7`。 |
| `calDayActive`   | 选中日期的附加样式，默认由 `color` 变体给出（`primary` 时为 `bg-primary text-white hover:bg-primary/90`）。**不是独立节点**——选中时被合并进 `calDay` 所在节点。             |
| `calDayToday`    | 今日的标识样式，默认 `font-bold`。同样是合并进 `calDay`。                                                                                                                  |
| `calDayDisabled` | 超出 `start` / `end` 范围的日期，默认 `text-gray-4 dark:text-gray-5 opacity-40 pointer-events-none`。同样是合并进 `calDay`。                                                |

> 触发器盒子本身（边框、文本、清空按钮、箭头）不在这张表里，改它请用 `triggerUi`，见下一节。

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 名称               | 描述                                                                                                                                                              |
| :----------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`          | 组件根节点，默认 `w-full`。                                                                                                                                        |
| `popupOp`          | 弹窗顶部操作区容器，默认 `flex flex-row items-center justify-center gap-2 p-3`。                                                                                    |
| `rangeBox`         | 范围模式下滚动选择器上方的「起止 + 快捷项」区块，默认 `px-3 pb-5 pt-2`。**仅 `rangeable` 为真时渲染。**                                                              |
| `shortcuts`        | 快捷选择项的区域容器，默认 `mb-4 flex flex-row flex-wrap items-center gap-2`。**仅传入 `shortcuts` 时渲染。**                                                        |
| `shortcutItem`     | 单个快捷选择项，默认 `flex cursor-pointer items-center gap-1 rounded-md border border-solid px-2 py-1 text-xs transition-colors`；选中态的描边/文字色由 `color` 变体给出，写在这里的类会叠加在两种状态上。 |
| `rangeValues`      | 「开始日期 ~ 结束日期」的横向容器，默认 `flex flex-row items-center justify-center`。                                                                                |
| `rangeStart`       | 开始日期的可点击卡片，默认 `flex-1 rounded-xl border border-solid p-2 text-center transition-colors`；正在编辑时的高亮描边由 `color` 变体给出。                       |
| `rangeEnd`         | 结束日期的可点击卡片，默认同 `rangeStart`。                                                                                                                         |
| `rangeValueText`   | 起止卡片内**已有值**时的文字样式（作为 `RebornText` 的 `ui.base` 下发），默认 `text-center block w-full`。                                                            |
| `rangePlaceholder` | 起止卡片内**尚无值**时的占位文字样式，默认 `text-surface-400 block w-full text-center`；与 `rangeValueText` 二选一。                                                 |
| `separator`        | 起止卡片之间的分隔符，默认 `text-gray-5 mx-3 text-sm`。                                                                                                             |
| `footer`           | 底部按钮栏，默认 `flex flex-row items-center justify-center gap-2 px-3 pt-3 pb-[calc(0.75rem+var(--window-bottom))]`；底部安全区已包含在内，改内边距时请保留 `var(--window-bottom)`。 |
| `cancel`           | 「取消」按钮的外层容器，默认 `flex-1`；想让两个按钮不等宽就改这里的 `flex-*`。                                                                                       |
| `cancelButton`     | 「取消」按钮本体（作为 `RebornButton` 的 `ui.base` 下发），默认 `w-full`。                                                                                           |
| `confirm`          | 「确定」按钮的外层容器，默认 `flex-1`。                                                                                                                             |
| `confirmButton`    | 「确定」按钮本体（作为 `RebornButton` 的 `ui.base` 下发），默认 `w-full`。                                                                                           |

> 弹窗外壳（遮罩、圆角、标题栏）属于 `RebornPopup`，滚动列属于 `RebornPickerView`，分别用 `popupUi` / `pickerUi`，见下面两节。

:::

::

```vue
<template>
  <!-- Web：浮层加宽、选中日期改成圆形红底 -->
  <RebornSelectDate
    v-model="date"
    :ui="{
      dropdown: 'w-80',
      calDays: 'gap-1',
      calDay: 'rounded-full',
      calDayActive: 'bg-error text-white hover:bg-error/90',
    }"
  />

  <!-- UniApp：底部按钮改成「确定」占两份宽 -->
  <RebornSelectDate
    v-model="date"
    rangeable
    :ui="{
      rangeStart: 'rounded-lg',
      rangeEnd: 'rounded-lg',
      cancel: 'flex-none w-[200rpx]',
      confirm: 'flex-1',
    }"
  />
</template>
```

### `triggerUi`
覆盖 `RebornSelectTrigger`。支持 `wrapper`, `content`, `text`, `placeholder`, `iconWrapper`, `clearIcon`, `arrowIcon` 等。

### `popupUi`
覆盖 `RebornPopup`。支持 `wrapper`, `mask`, `popup`, `inner`, `draw`, `header`, `title`, `container` 等。

### `pickerUi`
覆盖 `RebornPickerView`。支持 `wrapper`, `header`, `headerText`, `pickerContainer`, `item`, `itemText`, `indicator` 等。
