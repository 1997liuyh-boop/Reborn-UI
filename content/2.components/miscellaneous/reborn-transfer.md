---
title: Transfer 穿梭框
description: 用于在双列列表间移动条目的穿梭框组件，支持搜索过滤、全选、单向模式、撤回、分页、虚拟滚动，以及头部、条目、底部与操作按钮插槽。
category: 表单与输入
platform: web
---

## 基础用法

::ComponentViewer{demoFile="RebornTransferDemo.vue" config="RebornTransferConfig" componentId="reborn-transfer" :componentFiles='["RebornTransfer.vue", "reborn-transfer.config.ts"]'}
::

## API

### Props

| 属性名                   | 类型                                                                                   | 默认值                   | 描述                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| :----------------------- | :------------------------------------------------------------------------------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `v-model` / `modelValue` | `string[]`                                                                             | `[]`                     | 当前位于**目标列表（右侧）**的条目 key 集合，与 `dataSource` 中条目的唯一标识对应                                                                                                                                                                                                                                                                                                                                                                                                                             |
| `dataSource`             | `TransferDataRecord[]`                                                                 | `[]`                     | 数据源，包含所有可选条目；字段名可通过 `field-names` 映射                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| `field-names`            | `TransferFieldNames`                                                                   | `{}`                     | 数据源字段别名，见下方 [字段映射](#字段映射)                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `default-target-keys`    | `string[]`                                                                             | `[]`                     | 默认已在目标列表的 key；**仅初始化一次**，且会过滤掉 `dataSource` 中不存在的 key。当未绑定 `v-model` 或目标列表为空时生效                                                                                                                                                                                                                                                                                                                                                                                     |
| `titles`                 | `[string, string]`                                                                     | `['源列表', '目标列表']` | 两个面板的标题，索引 0 为源列表，1 为目标列表                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `operation-buttons`      | `TransferOperationButtons`                                                             | `-`                      | 中间三个操作按钮的图标、文案与无障碍配置，见下方 [操作按钮配置](#操作按钮配置)；要换掉整个按钮用 `operation` 插槽                                                                                                                                                                                                                                                                                                                                                                                             |
| `disabled`               | `boolean`                                                                              | `false`                  | 是否禁用整体穿梭框（包括所有勾选与移动操作）                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| `show-search`            | `boolean`                                                                              | `false`                  | 是否在列表上方显示搜索框（`RebornInput` 的 `sm` 档，后缀为搜索图标），搜索框与列表同属内容区，不单独画分隔线                                                                                                                                                                                                                                                                                                                                                                                                  |
| `header-select`          | `'none' \| 'checkbox' \| 'menu' \| 'both'`                                             | `'both'`                 | 面板头部选择控件：`checkbox` 显示全选复选框（只作用于当前页）；`menu` 显示无边框的 `RebornSelect` 多选下拉，计数文案改为显示在下拉触发器里，下拉逐行列出搜索结果内的全部条目（不受分页限制），点一行切换该条勾选，下拉保持打开，禁用条目置灰不可点；单向模式右侧的条目全部呈选中，只有开启单向模式后移入的可以取消（即退回左侧），开启前就在右侧的置灰；`both` 两者同时显示；`none` 只留计数文案。下拉只在整体禁用时禁用，面板没有条目时展开显示「暂无数据」。`variant="borderless"` 时不渲染头部，此项不生效 |
| `search-placeholder`     | `string`                                                                               | `'请输入搜索内容'`       | 搜索框占位符文字                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `filter-option`          | `(inputValue: string, item: TransferDataRecord) => boolean`                            | `-`                      | 自定义搜索方法，返回 `true` 表示条目匹配搜索词（`item` 为原始数据对象，配置了 `fieldNames` 时按原始字段名取值）；不传时按 `label` 做包含匹配，英文不区分大小写                                                                                                                                                                                                                                                                                                                                                |
| `variant`                | `'outlined' \| 'borderless'`                                                           | `'outlined'`             | 形态变体：`outlined` 为 8px 圆角描边面板并带头部；`borderless` 去掉面板边框与底部分隔线，且不渲染头部（全选、下拉菜单、标题、计数以及 `title` / `extra` 插槽一并隐藏）                                                                                                                                                                                                                                                                                                                                        |
| `color`                  | `'primary' \| 'secondary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'neutral'` | `'primary'`              | 语义色，决定复选框的勾选色、选中条目的底色（各色系的浅色阶，`neutral` 为 `gray-2`）、头部下拉中已选选项的颜色（透传给 `RebornSelect` 的 `color`）与中间操作按钮的颜色；操作按钮禁用时固定为 `neutral`，避免彩色底的禁用按钮被误认为可点                                                                                                                                                                                                                                                                       |
| `check-shape`            | `'square' \| 'rounded' \| 'circle'`                                                    | `'rounded'`              | 选中框外观：`square` 方形、`rounded` 圆角、`circle` 圆形                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| `one-way`                | `boolean`                                                                              | `false`                  | 单向模式：仅允许从左向右移动，右侧条目不可勾选。开启后移入右侧的条目在行尾显示「撤回」按钮，可逐条退回左侧；开启前就在右侧的条目（含 `v-model` / `default-target-keys` 给出的初始值）视为已定结果，没有撤回按钮。每次开启都会重新计算可撤回范围                                                                                                                                                                                                                                                               |
| `show-undo`              | `boolean`                                                                              | `false`                  | 是否显示中间撤回按钮（撤销上一次穿梭操作）                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| `pagination`             | `boolean \| TransferPaginationConfig`                                                  | `false`                  | 是否开启列表分页；传 `true` 默认每页 10 条；传对象时可配置 `pageSize`（`number`，默认 `10`）指定每页条数                                                                                                                                                                                                                                                                                                                                                                                                      |
| `virtual-scroll`         | `boolean`                                                                              | `false`                  | 是否开启虚拟滚动：列表只渲染可视区附近的条目，滚动时按位置替换，适合上千条又不想分页的数据；头部下拉同样按虚拟列表渲染。开启后每行高度固定为 `virtual-item-height` 减去 4px 行间距，面板需要确定的高度（传 `height` 或由父元素给出）；与 `pagination` 同时开启时只作用于当前页                                                                                                                                                                                                                                |
| `virtual-item-height`    | `number`                                                                               | `32`                     | 虚拟滚动的行步长（px），即行高加 4px 行间距。默认值对应只有 label 的条目（行高 28）；带 description 的条目行高 50，应传 `54`；用插槽改了条目内容时须与实际高度一致，否则相邻行会重叠或留出空白                                                                                                                                                                                                                                                                                                                |
| `virtual-buffer`         | `number`                                                                               | `4`                      | 虚拟滚动在可视区上下各多渲染的条数，快速滚动时减少空白                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| `width`                  | `string \| number`                                                                     | `-`                      | 组件整体宽度，支持数字（px）或 CSS 长度，如 `640`、`'100%'`                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `height`                 | `string \| number`                                                                     | `-`                      | 组件整体高度。不传时根节点撑满父元素（`h-full`）：父元素给定高度，列表在面板内滚动，头部、搜索框与底部栏不随列表滚动；父元素高度为 auto，列表随条目增高                                                                                                                                                                                                                                                                                                                                                       |
| `class`                  | `any`                                                                                  | `-`                      | 根节点自定义类名                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `ui`                     | `Record<string, string>`                                                               | `{}`                     | 为组件内部各区域追加自定义 class，见下方 [自定义样式](#自定义样式ui-属性)                                                                                                                                                                                                                                                                                                                                                                                                                                     |

### Emits

| 事件名              | 回调参数                                                                                    | 描述                                              |
| :------------------ | :------------------------------------------------------------------------------------------ | :------------------------------------------------ |
| `update:modelValue` | `(nextTargetKeys: string[])`                                                                | 目标列表 key 集合变化时触发（`v-model` 双向绑定） |
| `change`            | `(nextTargetKeys: string[], direction: 'right' \| 'left', moveKeys: string[])`              | 条目在两列之间转移时触发                          |
| `selectChange`      | `(sourceSelectedKeys: string[], targetSelectedKeys: string[])`                              | 任意面板的勾选状态发生变化时触发                  |
| `undo`              | `(nextTargetKeys: string[], payload: { direction: 'right' \| 'left', moveKeys: string[] })` | 点击撤回按钮，恢复至上一次穿梭前的目标列表        |

### Slots

| 插槽名               | 作用域参数                                                                   | 描述                                                                                                                                                                                       |
| :------------------- | :--------------------------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`              | [`TransferTitleSlotProps`](#transfertitleslotprops-包含)                     | 头部左侧的勾选区，默认是全选复选框（文案为计数）；左右面板共用，用 `direction` 区分。下拉不在插槽内，仍按 `header-select` 显示；开启下拉时计数文案显示在下拉触发器里，默认复选框不再带文案 |
| `extra`              | `{ direction: 'left' \| 'right', title: string }`                            | 头部右侧区域，默认是面板标题                                                                                                                                                               |
| `default`            | [`TransferItemSlotProps`](#transferitemslotprops-包含)                       | 条目的文案区域；条目前的复选框、单向模式右侧的撤回按钮仍由组件渲染                                                                                                                         |
| `item`               | `{ item: TransferDataRecord }`                                               | 旧版条目插槽，保留兼容；与 `default` 同时提供时 `default` 优先                                                                                                                             |
| `footer`             | `{ direction: 'left' \| 'right', total: number, checkedCount: number }`      | 面板底部区域，渲染在分页栏下方；提供后未开分页也会显示底部栏                                                                                                                               |
| `operation`          | [`TransferOperationButtonSlotProps`](#transferoperationbuttonslotprops-包含) | 整个替换中间的操作按钮，每个可见按钮调用一次，用 `action` 区分                                                                                                                             |
| `operation-to-right` | [`TransferOperationSlotProps`](#transferoperationslotprops-包含)             | 只替换「移至右侧」按钮的内部内容，外壳仍是 `RebornButton`                                                                                                                                  |
| `operation-to-left`  | [`TransferOperationSlotProps`](#transferoperationslotprops-包含)             | 只替换「移回左侧」按钮的内部内容                                                                                                                                                           |
| `operation-undo`     | [`TransferOperationSlotProps`](#transferoperationslotprops-包含)             | 只替换「撤回」按钮的内部内容                                                                                                                                                               |

#### `TransferTitleSlotProps` 包含：

`checked`、`indeterminate`、`toggle` 只针对当前页，与默认全选复选框一致；需要跨页挑选条目时保留 `header-select` 的下拉菜单，它逐行列出搜索结果内的全部条目。

| 字段            | 类型                | 描述                                                      |
| :-------------- | :------------------ | :-------------------------------------------------------- |
| `direction`     | `'left' \| 'right'` | 当前面板方向                                              |
| `selectable`    | `boolean`           | 当前面板条目是否可勾选，单向模式下右侧为 `false`          |
| `checked`       | `boolean`           | 当前页可选条目是否已全部勾选                              |
| `indeterminate` | `boolean`           | 当前页可选条目是否部分勾选                                |
| `disabled`      | `boolean`           | 全选是否不可用（整体禁用或当前页没有可选条目）            |
| `countText`     | `string`            | 默认计数文案：未勾选时为「N 项」，有勾选时为「选中 N 项」 |
| `checkedCount`  | `number`            | 搜索结果内已勾选的条目数                                  |
| `total`         | `number`            | 搜索结果总条目数                                          |
| `toggle`        | `() => void`        | 切换当前页全选，与默认全选复选框的行为一致                |

#### `TransferItemSlotProps` 包含：

| 字段        | 类型                 | 描述                                     |
| :---------- | :------------------- | :--------------------------------------- |
| `item`      | `TransferDataRecord` | 原始数据对象，字段名未归一化             |
| `direction` | `'left' \| 'right'`  | 条目所在面板方向                         |
| `checked`   | `boolean`            | 条目是否已勾选，单向模式右侧恒为 `false` |
| `disabled`  | `boolean`            | 条目是否禁用（整体禁用或条目自身禁用）   |

#### `TransferOperationButtonSlotProps` 包含：

| 字段       | 类型                              | 描述                                                                                 |
| :--------- | :-------------------------------- | :----------------------------------------------------------------------------------- |
| `action`   | `'toRight' \| 'toLeft' \| 'undo'` | 按钮对应的操作：移至右侧、移回左侧、撤回上一步                                       |
| `config`   | `ResolvedOperationButton`         | 合并 `operation-buttons` 后的按钮配置（`title`、`label`、`icon`、`trailingIcon` 等） |
| `disabled` | `boolean`                         | 当前是否不可操作                                                                     |
| `onClick`  | `() => void`                      | 执行该操作；禁用时调用不会生效                                                       |

#### `TransferOperationSlotProps` 包含：

| 字段       | 类型                                                 | 描述                                                            |
| :--------- | :--------------------------------------------------- | :-------------------------------------------------------------- |
| `ui`       | `Record<string, (opts?: { class?: any }) => string>` | 组件内部样式函数集合，可在插槽内复用                            |
| `config`   | `ResolvedOperationButton`                            | 解析后的按钮配置（`title`、`label`、`icon`、`trailingIcon` 等） |
| `disabled` | `boolean`                                            | 当前按钮是否处于禁用状态                                        |

### 字段映射

当`后端字段名`与`默认字段结构`不一致时，通过 `field-names` 配置别名：

```vue
<RebornTransfer
  v-model="targetKeys"
  :data-source="list"
  :field-names="{
    key: 'id',
    label: 'name',
    description: 'remark',
    disabled: 'isDisabled',
  }"
/>
```

**默认字段结构**

| 字段          | 类型      | 描述                                 |
| :------------ | :-------- | :----------------------------------- |
| `key`         | `string`  | 唯一标识                             |
| `label`       | `string`  | 显示文字                             |
| `description` | `string`  | 可选，显示在 `label` 下方            |
| `disabled`    | `boolean` | 是否禁用此条目，禁用后无法勾选和移动 |

### 操作按钮配置

`operation-buttons` 支持分别配置 `toRight`、`toLeft`、`undo`：

| 字段                             | 类型      | 描述                                                                    |
| :------------------------------- | :-------- | :---------------------------------------------------------------------- |
| `title`                          | `string`  | 悬停提示（`title` 属性）                                                |
| `label`                          | `string`  | 按钮可见文案，位于前置图标与后置图标之间                                |
| `icon` / `leadingIcon`           | `string`  | 前置图标（Nuxt Icon name），二者完全等价，同时设置时 `leadingIcon` 优先 |
| `iconClass` / `leadingIconClass` | `string`  | 前置图标样式 class，二者完全等价                                        |
| `trailingIcon`                   | `string`  | 后置图标                                                                |
| `trailingIconClass`              | `string`  | 后置图标样式 class                                                      |
| `ariaLabel`                      | `string`  | 无障碍 `aria-label`，默认回退到 `title` 或 `label`                      |
| `showIcon`                       | `boolean` | 是否显示前置图标，默认 `true`                                           |
| `showTrailingIcon`               | `boolean` | 是否显示后置图标，默认在配置了 `trailingIcon` 时为 `true`               |

### 自定义样式（`ui` 属性）

下面示例中：`panel` 只影响左右两个列表面板的外框；`panelTitle` 只影响面板标题文字；`searchInput` 只影响搜索框的输入外壳；`operationBtn` 只影响中间三个箭头/撤回按钮。

```vue
<RebornTransfer
  v-model="targetKeys"
  :data-source="list"
  :ui="{
    panel: 'shadow-xl border-primary/30',
    panelTitle: 'text-primary font-bold',
    searchInput: 'rounded-full',
    operationBtn: 'rounded-full',
  }"
/>
```

**整体与面板(ui)**

| 名称             | 对应区域                                                                                                                    |
| :--------------- | :-------------------------------------------------------------------------------------------------------------------------- |
| `root`           | 最外层横向容器（包住左面板 + 中间按钮 + 右面板），默认 `h-full`                                                             |
| `panel`          | 单个列表面板（左/右各一块，改一次两边都生效）                                                                               |
| `panelHeader`    | 面板顶部栏（勾选区、下拉菜单、标题）；`borderless` 下不渲染                                                                 |
| `panelTitleArea` | 头部右侧区域，`extra` 插槽渲染在这里                                                                                        |
| `panelTitle`     | 面板标题文字（`extra` 插槽的默认内容）                                                                                      |
| `panelCount`     | 计数文字（未勾选时为「N 项」，有勾选时为「选中 N 项」）；显示全选复选框且未开下拉时作为其文案，开启下拉时显示在下拉触发器里 |

**头部下拉(ui)**（需 `header-select="menu"` 或 `header-select="both"`）

| 名称                   | 对应区域                                                                                  |
| :--------------------- | :---------------------------------------------------------------------------------------- |
| `headerSelectControls` | 头部左侧一行：`title` 插槽（默认全选复选框）+ 下拉                                        |
| `headerSelectMenu`     | 下拉外层（传给 `RebornSelect` 的 class，包住触发器），默认收成内容宽度                    |
| `headerSelectTrigger`  | 下拉触发器（`RebornSelect` 的 `triggerUi.trigger`），内含计数文案与下拉箭头               |
| `headerSelectDropdown` | 下拉浮层（`RebornSelect` 的 `triggerUi.dropdown`，挂到 body 下），默认给出最小与最大宽度  |
| `headerSelectItem`     | 单个选项（`RebornSelect` 的 `ui.option`），对应一个条目；默认留空，沿用下拉选择的选项样式 |

**搜索与列表(ui)**

| 名称              | 对应区域                                                                                                      |
| :---------------- | :------------------------------------------------------------------------------------------------------------ |
| `panelContent`    | 头部以下的内容区（搜索框 + 列表 + 底部栏），占满面板剩余高度                                                  |
| `panelSearch`     | 搜索框外层，左右内边距与条目对齐，不画上下分隔线                                                              |
| `searchInput`     | 搜索框的输入外壳（传给 `RebornInput` 的 class，落在带边框的 wrapper 上）                                      |
| `panelBody`       | 可滚动的列表区域（`RebornScrollbar` 的根节点）                                                                |
| `panelList`       | 列表内层（`RebornScrollbar` 的内容容器），控制条目间距                                                        |
| `virtualPhantom`  | 开启 `virtual-scroll` 时的占位层，高度按「条数 × 步长」撑出完整滚动条                                         |
| `virtualWindow`   | 开启 `virtual-scroll` 时的窗口层，包住当前渲染的条目，靠 `translateY` 移到可视区；行间距须与 `panelList` 一致 |
| `panelFooter`     | 底部栏（分页 + `footer` 插槽）                                                                                |
| `panelPagination` | 底部栏中的分页                                                                                                |
| `panelEmpty`      | 无数据时的空状态占位                                                                                          |

**条目与勾选(ui)**

| 名称           | 对应区域                                                             |
| :------------- | :------------------------------------------------------------------- |
| `checkAll`     | 头部全选复选框的方框，覆盖到 `RebornCheckbox` 的 `control`           |
| `itemCheck`    | 每一行复选框的方框，覆盖到 `RebornCheckbox` 的 `control`             |
| `item`         | 单行列表项（含 hover 背景，单向模式右侧行也用它）                    |
| `itemSelected` | 勾选后的条目底色，色值随 `color` 变化                                |
| `itemContent`  | 条目内容区域（包住复选框与文字）                                     |
| `itemLabel`    | 主标题                                                               |
| `itemDesc`     | 副标题/描述                                                          |
| `itemUndoBtn`  | 单向模式下右侧行尾的「撤回」按钮，只出现在开启单向模式后移入的条目上 |
| `itemUndoIcon` | 撤回按钮内的图标                                                     |

**中间操作区(ui)**

| 名称                   | 对应区域                                                                   |
| :--------------------- | :------------------------------------------------------------------------- |
| `operations`           | 三个按钮的纵向容器                                                         |
| `operationBtn`         | 单个操作按钮（`RebornButton` 的根节点）；用 `operation` 插槽替换后不再生效 |
| `operationBtnIconOnly` | 只有图标、没有文案时追加，把按钮收成正方形                                 |
| `operationBtnIcon`     | 按钮内图标容器                                                             |
| `operationBtnLabel`    | 按钮上的文字标签                                                           |

### 差异说明

- **Web 端**：
  - 内嵌 `RebornInput`（搜索）、`RebornScrollbar`（列表滚动）、`RebornCheckbox`、`RebornButton`（操作按钮）、`RebornPagination` 与 `RebornSelect`（头部下拉，`borderless` 形态的多选，浮层挂到 body 下，不会被面板的 `overflow-hidden` 裁切）。
  - 不提供尺寸档位：文字统一用 `text-sm`，搜索框与按钮取各自的 `sm` 档，高度交给父元素或 `height`。
- **UniApp 端**：暂未提供对应组件，后续对齐时将保持 `v-model`（目标 key 列表）与 `change` / `selectChange` 事件语义一致。
