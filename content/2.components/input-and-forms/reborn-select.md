---
title: select 下拉选择
description: 用于从选项列表中单选或多选的双端下拉选择组件，uniapp 端为弹层滚动选择。
category: 表单与输入
tags: [css, tailwind, select, dropdown, uniapp]
badge: Update
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: UPDATE
    color: warning
---

::ComponentViewer{demoFile="RebornSelectDemo.vue" config="RebornSelectConfig" componentId="reborn-select" :componentFiles='["RebornSelect.vue", "RebornSelectTrigger.vue", "reborn-select.config.ts", "reborn-select-trigger.config.ts", "RebornTransition.vue"]' :uniappFiles='["RebornDropdownSelect.vue", "reborn-dropdown-select.config.ts", "RebornSelectTrigger.vue", "reborn-select-trigger.config.ts", "RebornTransition.vue", "reborn-transition.config.ts"]'}
::

## API

| 属性名                | 类型                                                                                   | 默认值                         | 描述                                                                                                                                                                                                 | 平台   |
| --------------------- | -------------------------------------------------------------------------------------- | ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `modelValue`          | `any` (Web) / `string \| number \| (string \| number)[] \| null` (UniApp)              | `null`                         | 选择器的值。                                                                                                                                                                                         | 通用   |
| `multiple`            | `boolean`                                                                              | `false`                        | 是否为多选模式。开启后 `modelValue` 为数组格式。                                                                                                                                                     | Web    |
| `collapseTags`        | `boolean`                                                                              | `false`                        | 多选时把超出的标签合并为一段 “+N” 文字。关闭时标签换行铺开、全部可见，触发器高度随行数增长。                                                                                                         | Web    |
| `collapseTagsTooltip` | `boolean`                                                                              | `false`                        | 鼠标悬停 “+N” 文字时以气泡展示被折叠的具体选项，需先开启 `collapseTags`。                                                                                                                            | Web    |
| `maxCollapseTags`     | `number`                                                                               | `1`                            | 折叠前最多展示的标签个数，仅在 `collapseTags` 开启时生效。                                                                                                                                           | Web    |
| `multipleLimit`       | `number`                                                                               | `0`                            | 多选时最多可选个数，`0` 为不限制。                                                                                                                                                                   | Web    |
| `options`             | `SelectOption[]`                                                                       | `[]`                           | 选择器的数据源选项。`SelectOption` 包含 `label`、`value`、`disabled` 等字段。                                                                                                                        | 通用   |
| `placeholder`         | `string`                                                                               | `'请选择'`                     | 选择器的占位符文本。                                                                                                                                                                                 | 通用   |
| `disabled`            | `boolean`                                                                              | `false`                        | 是否禁用选择器。UniApp 版本兼容 `reborn-form`。                                                                                                                                                      | 通用   |
| `clearable`           | `boolean`                                                                              | `true`                         | 是否显示清空按钮。`loading` 期间自动隐藏，避免与转圈图标争抢尾部同一格。                                                                                                                             | 通用   |
| `loading`             | `boolean`                                                                              | `false`                        | 加载中状态。触发器的箭头替换为 `RebornLoading`（`ring` 形态、颜色继承触发器文字色），下拉面板改为「加载中」占位（`header` / `footer` 插槽不受影响）。                                                | Web    |
| `allowSearch`         | `boolean`                                                                              | `false`                        | 是否支持搜索选项。开启后展开下拉时触发器变为输入框并自动聚焦：单选态输入框顶掉展示文本、已选文本降级为占位符；多选态输入框跟在标签末尾随标签一起换行。收起时关键词自动清空。                         | Web    |
| `filterOption`        | `boolean \| ((inputValue: string, option: SelectOption) => boolean)`                   | `true`                         | 搜索的匹配规则，需配合 `allowSearch`。`true` 按 `label` 做不区分大小写的包含匹配；传函数可自定义（返回 `true` 表示保留该项）；传 `false` 关闭本地过滤，列表完全由 `options` 决定——远程搜索用这一档。 | Web    |
| `virtual`             | `boolean`                                                                              | `false`                        | 是否开启虚拟滚动 + 虚拟列表。开启后只渲染可视区内的选项，DOM 数量与数据量脱钩，上万条也能秒开；代价是每项高度必须恒定（见 `virtualItemHeight`）。                                                    | Web    |
| `virtualItemHeight`   | `number`                                                                               | `33`                           | 虚拟列表单项的占位高度（px，含项与项之间的 4px 行距），默认 `33` 正是 `md` 尺寸下选项的实测步长。若通过 `ui.option` 改了字号或内边距，必须同步改这里，否则滚动条与内容会错位。                       | Web    |
| `virtualBuffer`       | `number`                                                                               | `4`                            | 虚拟列表上下各多渲染几项，用于抵消快速滚动时的白屏。                                                                                                                                                 | Web    |
| `color`               | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'`                    | 选择器的主题颜色。                                                                                                                                                                                   | 通用   |
| `variant`             | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'`                               | `'outlined'`                   | 形态变体：描边 / 填充 / 无边框 / 下划线。`borderless` 与 `underlined` 的水平内边距为 `0`，便于与相邻文本对齐。                                                                                       | Web    |
| `showArrow`           | `boolean`                                                                              | `true`                         | 是否显示右侧箭头图标。                                                                                                                                                                               | Web    |
| `arrowAnimation`      | `boolean`                                                                              | `true`                         | 展开时箭头是否旋转动画。                                                                                                                                                                             | Web    |
| `icon`                | `string`                                                                               | `'lucide:chevron-down'`        | 右侧箭头图标名。                                                                                                                                                                                     | Web    |
| `closeOn`             | `'click' \| 'mousedown'`                                                               | `'click'`                      | 关闭下拉的时机：`'click'` 在触发器（含浮层）外完成一次点击后才收起；`'mousedown'` 外部一有动静就收起——外部按下左键 / 右键 / 中键立即收起，浮层外的页面滚动同样收起，浮层内部滚动选项列表不受影响。   | Web    |
| `portal`              | `boolean`                                                                              | `true`                         | 浮层是否传送到 `body`。默认开启，浮层按文档坐标锚定触发器，不受任何祖先 `overflow` / `transform` 裁剪（如 `RebornDialog` 内）；关闭后浮层留在触发器内，随父容器一起滚动、一起被裁剪。                | Web    |
| `autoAdjustOverflow`  | `boolean`                                                                              | `true`                         | 下拉框是否自动调整位置：下方空间不足且上方更宽裕时向上展开；关闭后固定向下展开。                                                                                                           | Web    |
| `size`                | `'sm' \| 'md' \| 'lg'` (Web) / `'sm' \| 'md' \| 'lg'` (UniApp)                         | `'md'` (Web) / `'lg'` (UniApp) | 选择器的尺寸。                                                                                                                                                                                       | 通用   |
| `class`               | `any`                                                                                  | -                              | 自定义样式类名。                                                                                                                                                                                     | Web    |
| `triggerUi`           | `Partial<SelectTriggerUI>`                                                             | `{}`                           | 用于覆盖 `RebornSelectTrigger` 内部组件样式的 UI 配置对象。                                                                                                                                          | Web    |
| `ui`                  | `Partial<SelectUI>`                                                                    | `{}`                           | 用于覆盖 `RebornSelect` 内部（如选项列表）样式的 UI 配置对象。                                                                                                                                       | Web    |
| `title`               | `string`                                                                               | `'请选择'`                     | 弹出层的标题。                                                                                                                                                                                       | UniApp |
| `showTrigger`         | `boolean`                                                                              | `true`                         | 是否显示默认的触发器。                                                                                                                                                                               | UniApp |
| `columnCount`         | `number`                                                                               | `1`                            | 数据源的列数，用于多列选择。                                                                                                                                                                         | UniApp |
| `splitor`             | `string`                                                                               | `' - '`                        | 多选或多列数据在触发器中的分隔符文本。                                                                                                                                                               | UniApp |
| `confirmText`         | `string`                                                                               | `'确定'`                       | 弹出层确认按钮文本。                                                                                                                                                                                 | UniApp |
| `showConfirm`         | `boolean`                                                                              | `true`                         | 是否显示弹出层确认按钮。                                                                                                                                                                             | UniApp |
| `cancelText`          | `string`                                                                               | `'取消'`                       | 弹出层取消按钮文本。                                                                                                                                                                                 | UniApp |
| `showCancel`          | `boolean`                                                                              | `true`                         | 是否显示弹出层取消按钮。                                                                                                                                                                             | UniApp |
| `popupUi`             | `Partial<PopupUI>`                                                                     | -                              | 底部弹出层（RebornPopup）样式覆盖对象，可重写遮罩、面板、头部、标题等区域。键位见下方 UniApp `popupUi`。                                                                                             | UniApp |
| `pickerUi`            | `Partial<PickerUI>`                                                                    | -                              | 滚轮选择器（RebornPickerView）样式覆盖对象，可重写表头、选项、指示器等区域。键位见下方 UniApp `pickerUi`。                                                                                           | UniApp |

## Emits

| 事件名              | 参数                 | 描述                                                                                                                                                        | 平台   |
| ------------------- | -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `update:modelValue` | `(value: any)`       | 更新绑定值。                                                                                                                                                | 通用   |
| `change`            | `(value: any)`       | 选择值改变时触发。Web 版本在选择时立即触发，UniApp 版本在确认后触发。                                                                                       | 通用   |
| `remove-tag`        | `(value: any)`       | 多选模式下移除单个标签时触发，回传被移除的值。                                                                                                              | Web    |
| `clear`             | -                    | 点击清空按钮时触发。                                                                                                                                        | Web    |
| `visible-change`    | `(visible: boolean)` | 下拉框展开 / 收起时触发。                                                                                                                                   | Web    |
| `search`            | `(value: string)`    | 搜索关键词变化时触发，需开启 `allowSearch`。远程搜索在此发请求；面板收起时关键词会被静默清空，不会额外触发一次本事件。                                      | Web    |
| `dropdown-scroll`   | `(event: Event)`     | 下拉选项列表滚动时触发，原样透出原生 `scroll` 事件。据 `event.target` 的 `scrollTop` / `scrollHeight` / `clientHeight` 判断触底即可实现无限滚动与分页续接。 | Web    |
| `changing`          | `(value: any)`       | 滚动列表选项正在改变时触发（未确认）。                                                                                                                      | UniApp |

## Slots

### 通用插槽

| 名称      | 参数                                           | 描述                                                                                                                                  | 平台差异                           |
| --------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `default` | `{ displayText, placeholder, isOpen, ui }`     | 自定义触发器内容。                                                                                                                    | Web 平台在 `RebornSelect` 中开放。 |
| `cover`   | `{ displayText, placeholder, isOpen, ui }`     | 覆盖整个触发器内容的插槽，完全替代文本和图标。                                                                                        | Web 平台在 `RebornSelect` 中开放。 |
| `option`  | **Web**: `{ option, active }`<br>**UniApp**: - | 自定义选项渲染内容。Web 版本提供 `option` 对象和 `active` 状态。                                                                      | Web 平台特有。                     |
| `header`  | -                                              | 下拉菜单页头。位于滚动列表之外，列表滚动时固定不动，适合放统计信息或批量操作。                                                        | Web 平台特有。                     |
| `footer`  | -                                              | 下拉菜单页脚。同样固定不动，适合放「新建选项」入口，或分页加载的进度提示——用 `loading` 做分页提示会把整个列表换成占位并丢失滚动位置。 | Web 平台特有。                     |

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

| 名称                 | 描述                                             |
| -------------------- | ------------------------------------------------ |
| `wrapper`            | 触发器最外层容器样式。                           |
| `trigger`            | 触发器按钮样式。                                 |
| `triggerText`        | 触发器文本样式。                                 |
| `triggerIconWrapper` | 触发器右侧图标（清除/箭头）的包装容器样式。      |
| `placeholder`        | 占位符文本样式。                                 |
| `clearBtn`           | 清空按钮样式。                                   |
| `arrow`              | 箭头图标样式。                                   |
| `searchInput`        | `allowSearch` 开启后，触发器内搜索输入框的样式。 |
| `triggerLoadingIcon` | `loading` 开启后，触发器尾部 `RebornLoading` 指示器的样式（转圈动画由 `RebornLoading` 自带，颜色靠 `text-*` 继承）。 |
| `dropdown`           | 下拉菜单根容器样式。                             |
| `dropdownInner`      | 下拉菜单内层容器样式。                           |

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
| `dropdownHeader`   | 下拉菜单页头容器样式（`header` 插槽的外壳）。        |
| `dropdownFooter`   | 下拉菜单页脚容器样式（`footer` 插槽的外壳）。        |
| `loading`          | 下拉面板「加载中」占位区域样式。                     |
| `loadingIcon`      | 下拉面板「加载中」占位里的转圈图标样式。             |
| `optionList`       | 选项行容器样式，行间距在这里声明（虚拟与非虚拟模式共用）。 |
| `virtualPhantom`   | 虚拟列表占位层样式，高度由「总条数 × 步长」写成行内样式，负责撑出真实滚动条。 |
| `virtualWindow`    | 虚拟列表窗口层样式，脱离文档流贴在占位层顶部，靠行内 `translateY` 滑到当前区间。 |

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
