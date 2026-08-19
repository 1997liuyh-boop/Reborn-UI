---
title: 穿梭框
description: 直观的双列数据转移组件，支持搜索过滤、全选/反选、可选头部扩展勾选菜单、禁用条目、单向模式、操作撤回及分页，适用于权限分配、购物选择等场景。
category: 杂项
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

## 基础用法

::ComponentViewer{demoFile="RebornTransferDemo.vue" config="RebornTransferConfig" componentId="reborn-transfer" :componentFiles='["RebornTransfer.vue", "reborn-transfer.config.ts"]'}
::

## API

### Props

| 属性名                   | 类型                                                        | 默认值                   | 描述                                                                                                                                                     |
| :----------------------- | :---------------------------------------------------------- | :----------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v-model` / `modelValue` | `string[]`                                                  | `[]`                     | 当前位于**目标列表（右侧）**的条目 key 集合，与 `dataSource` 中条目的唯一标识对应                                                                        |
| `dataSource`             | `TransferDataRecord[]`                                      | `[]`                     | 数据源，包含所有可选条目；字段名可通过 `field-names` 映射                                                                                                |
| `field-names`            | `TransferFieldNames`                                        | `{}`                     | 数据源字段别名，见下方 [字段映射](#字段映射)                                                                                                             |
| `default-target-keys`    | `string[]`                                                  | `[]`                     | 默认已在目标列表的 key；**仅初始化一次**，且会过滤掉 `dataSource` 中不存在的 key。当未绑定 `v-model` 或目标列表为空时生效                                |
| `titles`                 | `[string, string]`                                          | `['源列表', '目标列表']` | 两个面板的标题，索引 0 为源列表，1 为目标列表                                                                                                            |
| `operation-buttons`      | `TransferOperationButtons`                                  | `-`                      | 中间三个操作按钮的自定义配置（图标、文案、无障碍等），见下方 [操作按钮配置](#操作按钮配置)                                                               |
| `disabled`               | `boolean`                                                   | `false`                  | 是否禁用整体穿梭框（包括所有勾选与移动操作）                                                                                                             |
| `show-search`            | `boolean`                                                   | `false`                  | 是否在两个面板顶部显示搜索框                                                                                                                             |
| `header-select`          | `'none' \| 'checkbox' \| 'menu' \| 'both'`                  | `'checkbox'`             | 面板头部选择控件模式：`checkbox` 显示全选复选框、`menu` 显示下拉扩展菜单（全选所有 / 全选当页 / 反选当页）、`both` 两者同时显示、`none` 隐藏所有选择控件 |
| `search-placeholder`     | `string`                                                    | `'请输入搜索内容'`       | 搜索框占位符文字                                                                                                                                         |
| `filter-option`          | `(inputValue: string, item: TransferDataRecord) => boolean` | `-`                      | 自定义过滤函数，返回 `true` 表示条目匹配搜索词（`item` 为原始数据对象）                                                                                  |
| `size`                   | `'sm' \| 'md' \| 'lg'`                                      | `'md'`                   | 组件尺寸                                                                                                                                                 |
| `check-shape`            | `'square' \| 'rounded' \| 'circle'`                         | `'rounded'`              | 选中框外观：`square` 方形、`rounded` 圆角、`circle` 圆形                                                                                                 |
| `one-way`                | `boolean`                                                   | `false`                  | 单向模式：仅允许从左向右移动；右侧为只读展示，每条目提供独立撤回按钮                                                                                     |
| `show-undo`              | `boolean`                                                   | `false`                  | 是否显示中间撤回按钮（撤销上一次穿梭操作）                                                                                                               |
| `pagination`             | `boolean \| TransferPaginationConfig`                       | `false`                  | 是否开启列表分页；传 `true` 默认每页 10 条；传对象时可配置 `pageSize`（`number`，默认 `10`）指定每页条数                                                 |
| `width`                  | `string \| number`                                          | `-`                      | 组件整体宽度，支持数字（px）或 CSS 长度，如 `640`、`'100%'`                                                                                              |
| `height`                 | `string \| number`                                          | `-`                      | 组件整体高度；设置后列表区域在固定高度内滚动（头部、搜索、分页栏固定不滚动）                                                                             |
| `class`                  | `any`                                                       | `-`                      | 根节点自定义类名                                                                                                                                         |
| `ui`                     | `Record<string, string>`                                    | `{}`                     | 为组件内部各区域追加自定义 class，见下方 [自定义样式](#自定义样式ui-属性)                                                                                |

### Emits

| 事件名              | 参数                                                                                        | 描述                                              |
| :------------------ | :------------------------------------------------------------------------------------------ | :------------------------------------------------ |
| `update:modelValue` | `(nextTargetKeys: string[])`                                                                | 目标列表 key 集合变化时触发（`v-model` 双向绑定） |
| `change`            | `(nextTargetKeys: string[], direction: 'right' \| 'left', moveKeys: string[])`              | 条目在两列之间转移时触发                          |
| `selectChange`      | `(sourceSelectedKeys: string[], targetSelectedKeys: string[])`                              | 任意面板的勾选状态发生变化时触发                  |
| `undo`              | `(nextTargetKeys: string[], payload: { direction: 'right' \| 'left', moveKeys: string[] })` | 点击撤回按钮，恢复至上一次穿梭前的目标列表        |

### Slots

| 插槽名               | 参数                                                             | 描述                       |
| :------------------- | :--------------------------------------------------------------- | :------------------------- |
| `item`               | `{ item: TransferDataRecord }` — 原始数据对象，字段名未归一化    | 自定义列表条目内容         |
| `operation-to-right` | [`TransferOperationSlotProps`](#transferoperationslotprops-包含) | 完全自定义「移至右侧」按钮 |
| `operation-to-left`  | [`TransferOperationSlotProps`](#transferoperationslotprops-包含) | 完全自定义「移回左侧」按钮 |
| `operation-undo`     | [`TransferOperationSlotProps`](#transferoperationslotprops-包含) | 完全自定义「撤回」按钮     |

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

下面示例中：`panel` 只影响左右两个列表面板的外框；`panelTitle` 只影响面板标题文字；`searchInput` 只影响搜索输入框；`operationBtn` 只影响中间三个箭头/撤回按钮。

```vue
<RebornTransfer
  v-model="targetKeys"
  :data-source="list"
  :ui="{
    panel: 'shadow-xl border-primary/30',
    panelTitle: 'text-primary font-bold',
    searchInput: 'rounded-full bg-white',
    operationBtn: 'rounded-full',
  }"
/>
```

**整体与面板(ui)**

| 名称             | 对应区域                                         |
| :--------------- | :----------------------------------------------- |
| `root`           | 最外层横向容器（包住左面板 + 中间按钮 + 右面板） |
| `panel`          | 单个列表面板（左/右各一块，改一次两边都生效）    |
| `panelHeader`    | 面板顶部栏（全选、标题、计数）                   |
| `panelTitleArea` | 标题与计数所在的横向区域                         |
| `panelTitle`     | 面板标题文字                                     |
| `panelCount`     | 「已选/总数」计数文字                            |

**头部扩展勾选菜单(ui)**（需 `header-select="menu"` 或 `header-select="both"`）

| 名称                        | 对应区域                                 |
| :-------------------------- | :--------------------------------------- |
| `headerSelectControls`      | 全选框与下拉菜单所在的一行               |
| `headerSelectMenu`          | 下拉菜单定位容器                         |
| `headerSelectTrigger`       | 下拉箭头按钮                             |
| `headerSelectIcon`          | 下拉箭头图标                             |
| `headerSelectDropdown`      | 下拉浮层外框                             |
| `headerSelectDropdownInner` | 下拉浮层内边距容器                       |
| `headerSelectItem`          | 「全选所有 / 全选当页 / 反选当页」菜单项 |

**搜索与列表(ui)**

| 名称               | 对应区域                            |
| :----------------- | :---------------------------------- |
| `panelSearch`      | 搜索框所在横条（含底边线）          |
| `searchWrapper`    | 搜索图标 + 输入框的横向布局         |
| `searchIcon`       | 搜索图标                            |
| `searchInput`      | 搜索输入框本体                      |
| `panelContent`     | 列表与分页的外层（含高度限制）      |
| `panelBody`        | 可滚动的列表区域                    |
| `panelBodyFill`    | 开启分页时，列表占满剩余高度的容器  |
| `panelBodyRounded` | 列表底部圆角（无搜索/分页时的底角） |
| `panelFooter`      | 底部分页栏                          |
| `panelEmpty`       | 无数据时的空状态占位                |

**条目与勾选(ui)**

| 名称           | 对应区域                                          |
| :------------- | :------------------------------------------------ |
| `checkAll`     | 头部「全选」复选框                                |
| `itemCheck`    | 每一行的条目复选框                                |
| `item`         | 单行列表项（含 hover 背景，单向模式右侧行也用它） |
| `itemContent`  | 条目文字区域                                      |
| `itemLabel`    | 主标题                                            |
| `itemDesc`     | 副标题/描述                                       |
| `itemUndoBtn`  | 单向模式下，右侧每行旁的撤回按钮                  |
| `itemUndoIcon` | 撤回按钮内的图标                                  |

**中间操作区(ui)**

| 名称                  | 对应区域                   |
| :-------------------- | :------------------------- |
| `operations`          | 三个按钮的纵向容器         |
| `operationBtn`        | 单个操作按钮（箭头、撤回） |
| `operationBtnLabeled` | 带文字标签时的按钮宽度布局 |
| `operationBtnIcon`    | 按钮内图标容器             |
| `operationBtnLabel`   | 按钮上的文字标签           |

### 差异说明

- **Web 端**：
  - 内嵌 `RebornPagination`、`RebornTransition`（头部扩展菜单动画）。
  - 支持 `operation-buttons`、操作区插槽，以及 `ui` 按区域追加自定义 class。
- **UniApp 端**：暂未提供对应组件，后续对齐时将保持 `v-model`（目标 key 列表）与 `change` / `selectChange` 事件语义一致。
