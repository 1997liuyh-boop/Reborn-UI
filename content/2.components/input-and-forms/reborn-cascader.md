---
title: Cascader 级联选择器
description: 多层级数据的逐级选择器：Web 端多列面板、父子关联勾选与搜索，UniApp 端底部弹窗。
category: 表单与输入
platform: both
tags: [cascader, select, tree, form, uniapp]
badge: New
---

::ComponentViewer{demoFile="RebornCascaderDemo.vue" config="RebornCascaderConfig" componentId="reborn-cascader" :componentFiles='["RebornCascader.vue", "RebornCascaderPanel.vue", "useCascaderTree.ts", "reborn-cascader.config.ts"]' :uniappFiles='["RebornCascader.vue", "reborn-cascader.config.ts"]'}
::

## 简介

Cascader 用于在树形数据里逐级选到某一个（或某一批）节点，典型场景是省市区、组织架构、商品分类。Web 与 UniApp 两端同名，但交互形态不同：Web 是触发器 + 多列浮层面板，UniApp 是触发器 + 底部弹窗；**两端的 API 目前并不一致**，详见「两端差异对照」。

Web 端的行为由几组正交维度拼出来：`multiple` 决定单选还是多选，`check-strictly` 决定「只能选叶子 / 父子勾选是否联动」，`path-mode` 决定绑定值是单个值还是整条路径，三者互不干扰，可以任意组合。`expand-trigger` 与 `expand-child` 只管「下一列什么时候出现」，不影响选中规则。

其余 API 按职责分三组：输入与回显（`allow-search`、`input-value`、`format-label`、`fallback`、`max-tag-count`、`tag-nowrap`），数据与性能（`options`、`field-names`、`value-key`、`load-more`、`loading`、`virtual-list-props`），外观与浮层（`size`、`color`、`variant`、`error`、`popup-container`、`trigger-props`）。触发器、浮层、多选标签三部分的样式与 `reborn-select` 同源，同一张表单里不会出现两种选择框。

### 何时使用

- 数据本身有层级，且用户需要逐级收敛，如省 / 市 / 区 —— 用 `options` 传树形数据。
- 需要一次选多个分支，并希望勾父节点就等于勾下面全部叶子 —— 开 `multiple`，保持 `check-strictly` 关闭。
- 需要允许选中中间层级（例如「选到市即可」）—— 开 `check-strictly`。
- 层级很深、用户更习惯搜索而不是逐级点 —— 开 `allow-search`，命中的选项会拍平成一列。
- 下级数据要按需请求 —— 传 `load-more`，并在数据里标好 `isLeaf`。

### 何时不使用

- 单层选项、没有父子关系 —— 改用 `reborn-select`。
- 需要展示整棵树并任意展开收起、跨层级勾选 —— 改用 `reborn-tree-select`。
- 只是把若干选项在两个列表间搬运 —— 改用 `reborn-transfer`。

## 用法

### 基础用法

默认 `path-mode` 为 `false`，绑定值就是选中那一项的 `value`；开启后绑定值变成从根到该项的整条路径数组。两种形态互斥，切换时旧值必然对不上，需要自己清空。

```vue
<template>
  <!-- 值模式：'jiangbei' -->
  <RebornCascader v-model="value" :options="options" placeholder="请选择地区" allow-clear />

  <!-- 路径模式：['zhejiang', 'ningbo', 'jiangbei'] -->
  <RebornCascader v-model="path" :options="options" path-mode />
</template>

<script setup>
const value = ref('jiangbei')
const path = ref(['zhejiang', 'ningbo', 'jiangbei'])
const options = [
  { label: '浙江省', value: 'zhejiang', children: [
    { label: '宁波市', value: 'ningbo', children: [{ label: '江北区', value: 'jiangbei' }] },
  ] },
]
</script>
```

### 展开方式与可选层级

| 参数 | 取值 | 行为 | 典型用途 |
| :--- | :--- | :--- | :--- |
| `expand-trigger` | `'click'`（默认） | 点击非叶子节点才展开下一列 | 触屏 / 误触成本高的表单 |
| `expand-trigger` | `'hover'` | 鼠标划过即展开下一列 | 桌面端深层目录，减少点击 |
| `check-strictly` | `false`（默认） | 单选只能选叶子；多选父子联动 | 省市区这类必须选到底的数据 |
| `check-strictly` | `true` | 单选任意层级可选；多选各级独立 | 「选到市即可」的筛选条件 |
| `expand-child` | `true` | 激活某项后沿它第一个可用子项一路展开到叶子 | 默认铺开整条链路，少点几次 |

```vue
<template>
  <RebornCascader v-model="value" :options="options" expand-trigger="hover" />
  <RebornCascader v-model="value" :options="options" check-strictly />
  <RebornCascader v-model="value" :options="options" expand-child />
</template>
```

### 多选与父子关联

开启 `multiple` 后，每个选项前会渲染一个 `reborn-checkbox`。默认父子关联：勾父节点等于勾它名下全部未禁用的叶子，只勾了一部分时父节点显示**半选**；此时绑定值里只会出现叶子。开启 `check-strictly` 后各级独立勾选，绑定值里出现什么就是你勾了什么，也不再有半选。

`max-tag-count` 大于 0 时只显示前 N 个标签，其余收敛成一个 `+N`，悬停可看到被折叠的内容。

```vue
<template>
  <!-- 父子关联：勾「杭州市」→ ['xihu', 'yuhang', 'binjiang'] -->
  <RebornCascader v-model="value" :options="options" multiple allow-clear />

  <!-- 父子不关联：勾「杭州市」→ ['hangzhou'] -->
  <RebornCascader v-model="strict" :options="options" multiple check-strictly />

  <!-- 最多显示 2 个标签 -->
  <RebornCascader v-model="value" :options="options" multiple :max-tag-count="2" />
</template>
```

### 搜索

`allow-search` 把触发器变成输入框，多选模式下默认开启。输入后面板被一列拍平的结果顶掉，默认按整条路径文本匹配；`search-option-only-label` 改成只显示（并只匹配）选项自身的文本。`filter-option` 可以整条换掉匹配规则，`search-delay` 只影响 `search` 事件的防抖节奏，本地过滤始终立即生效。

```vue
<template>
  <RebornCascader
    v-model="value"
    v-model:input-value="keyword"
    :options="options"
    allow-search
    :filter-option="(input, option) => option.label.includes(input)"
    :search-delay="300"
    @search="fetchRemote"
  />
</template>
```

### 异步加载

传入 `load-more` 即开启懒加载：展开一个非叶子节点时调用它，`done(children)` 回传的子节点会写回该选项对象。数据里必须自己标 `isLeaf`——组件看到「没有 children」时，无从判断是「真的到底了」还是「还没请求」。

```vue
<template>
  <RebornCascader v-model="value" :options="options" :load-more="loadMore" />
</template>

<script setup>
const options = ref([{ label: '浙江省', value: 'zhejiang', isLeaf: false }])

function loadMore(option, done) {
  fetchChildren(option.value).then((children) => {
    done(children.map(item => ({ ...item, isLeaf: true })))
  })
}
</script>
```

### 尺寸、形态与状态

`size`（`sm` / `md` / `lg`）与 `variant`（`outlined` / `filled` / `borderless` / `underlined`）取自 `reborn-select` 的同一套档位；放进 `reborn-form` 时会自动继承表单的尺寸与禁用状态。`error` 画红框，`loading` 把箭头换成转圈并让面板进入加载态。

```vue
<template>
  <RebornCascader :options="options" size="sm" />
  <RebornCascader :options="options" variant="filled" />
  <RebornCascader :options="options" error />
  <RebornCascader :options="options" loading />
</template>
```

### 独立面板

`RebornCascaderPanel` 就是浮层里的那块多列面板，可以单独放进页面当常驻控件。它自带外框（`bordered` 默认 `true`），被 `RebornCascader` 内嵌时会关掉，免得和浮层的描边叠成两圈。

```vue
<template>
  <RebornCascaderPanel v-model="value" :options="options" />
</template>
```

## API

### Props

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

#### RebornCascader 全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `modelValue` | `CascaderValue` | - | 绑定值（`v-model`）。形态由 `multiple` 与 `path-mode` 决定 |
| `defaultValue` | `CascaderValue` | `undefined` | 默认值（非受控），仅在未绑定 `v-model` 时生效 |
| `pathMode` | `boolean` | `false` | 绑定值是否为路径 |
| `multiple` | `boolean` | `false` | 是否为多选状态（多选默认开启搜索） |
| `options` | `CascaderOption[]` | `[]` | 级联选择器的选项 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `error` | `boolean` | `false` | 是否为错误状态 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 选择框的大小 |
| `allowSearch` | `boolean` | 单选 `false`、多选 `true` | 是否允许搜索 |
| `allowClear` | `boolean` | `false` | 是否允许清除 |
| `inputValue` | `string` | - | 输入框的值（`v-model:input-value`） |
| `defaultInputValue` | `string` | `''` | 输入框的默认值（非受控） |
| `popupVisible` | `boolean` | - | 是否显示下拉框（`v-model:popup-visible`） |
| `defaultPopupVisible` | `boolean` | `false` | 是否默认显示下拉框（非受控） |
| `expandTrigger` | `'click' \| 'hover'` | `'click'` | 展开下一级的触发方式 |
| `placeholder` | `string` | `'请选择'` | 占位符 |
| `filterOption` | `(inputValue: string, option: CascaderOption) => boolean` | - | 自定义选项过滤方法 |
| `popupContainer` | `string \| HTMLElement` | - | 弹出框的挂载容器 |
| `maxTagCount` | `number` | `0` | 多选模式下最多显示的标签数量，`0` 表示不限制 |
| `formatLabel` | `(options: CascaderOption[]) => string` | - | 格式化展示内容，入参是从根到该项的整条路径 |
| `triggerProps` | `CascaderTriggerProps` | - | 下拉菜单的触发器属性，透传给 `RebornSelectTrigger` |
| `checkStrictly` | `boolean` | `false` | 是否开启严格选择模式 |
| `loadMore` | `(option: CascaderOption, done: (children?: CascaderOption[]) => void) => void` | - | 数据懒加载函数，传入时开启懒加载 |
| `loading` | `boolean` | `false` | 是否为加载中状态 |
| `searchOptionOnlyLabel` | `boolean` | `false` | 搜索结果是否仅展示选项自身标签 |
| `searchDelay` | `number` | `500` | 触发 `search` 事件的延迟时间（毫秒） |
| `fieldNames` | `CascaderFieldNames` | - | 自定义 `CascaderOption` 中的字段 |
| `valueKey` | `string` | `'value'` | 用于确定选项键值的属性名 |
| `fallback` | `boolean \| ((value) => string)` | `true` | 自定义不存在选项的值的展示 |
| `expandChild` | `boolean` | `false` | 是否展开子菜单 |
| `virtualListProps` | `VirtualListProps` | - | 传递虚拟列表属性，传入此参数以开启虚拟滚动 |
| `tagNowrap` | `boolean` | `false` | 标签内容不换行 |
| `color` | `'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'` | `'primary'` | 配色，决定聚焦描边、选中底色与勾选框颜色 |
| `variant` | `'outlined' \| 'filled' \| 'borderless' \| 'underlined'` | `'outlined'` | 形态变体 |
| `class` | `any` | - | 自定义类名，落在浮层锚点（组件根节点）上 |
| `triggerUi` | `SelectTriggerUI & CascaderFieldUI` | - | 触发器盒子与浮层的样式覆盖，组件内部自动拆分下发 |
| `ui` | `CascaderUI` | - | 下拉面板与多选标签的样式覆盖 |

#### RebornCascaderPanel 全部属性

| 属性名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `modelValue` | `CascaderValue` | - | 绑定值（`v-model`） |
| `defaultValue` | `CascaderValue` | `undefined` | 默认值（非受控） |
| `pathMode` | `boolean` | `false` | 绑定值是否为路径 |
| `multiple` | `boolean` | `false` | 是否为多选状态 |
| `options` | `CascaderOption[]` | `[]` | 级联选择器的选项 |
| `expandTrigger` | `'click' \| 'hover'` | `'click'` | 展开下一级的触发方式 |
| `checkStrictly` | `boolean` | `false` | 是否开启严格选择模式 |
| `loadMore` | `(option: CascaderOption, done: (children?: CascaderOption[]) => void) => void` | - | 数据懒加载函数 |
| `fieldNames` | `CascaderFieldNames` | - | 自定义 `CascaderOption` 中的字段 |
| `valueKey` | `string` | `'value'` | 用于确定选项键值的属性名 |
| `expandChild` | `boolean` | `false` | 是否展开子菜单 |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | 尺寸规格，决定列宽下限 |
| `color` | `'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'` | `'primary'` | 配色 |
| `bordered` | `boolean` | `true` | 是否绘制面板外框 |
| `disabled` | `boolean` | `false` | 整体禁用 |
| `virtualListProps` | `VirtualListProps` | - | 传入即开启虚拟滚动 |
| `class` | `any` | - | 自定义类名 |
| `ui` | `CascaderPanelUI` | - | 面板内部的样式覆盖 |

#### CascaderOption

| 属性名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `value` | `string \| number \| Record<string, any>` | - | 选项值，对象值按 `value-key` 判定同一性 |
| `label` | `string` | - | 选项文本 |
| `render` | `() => VNodeChild` | - | 自定义渲染，返回值直接作为选项内容 |
| `disabled` | `boolean` | `false` | 是否禁用，会向下继承给子选项 |
| `tagProps` | `Record<string, any>` | - | 该选项的多选标签属性，透传给 `RebornBadge` |
| `children` | `CascaderOption[]` | - | 下一级选项 |
| `isLeaf` | `boolean` | `false` | 是否是叶子节点，懒加载时必须显式标注 |

#### CascaderFieldNames / VirtualListProps

| 属性名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `CascaderFieldNames.value` | `string` | `'value'` | 取值字段名 |
| `CascaderFieldNames.label` | `string` | `'label'` | 文本字段名 |
| `CascaderFieldNames.children` | `string` | `'children'` | 子选项字段名 |
| `CascaderFieldNames.disabled` | `string` | `'disabled'` | 禁用字段名 |
| `CascaderFieldNames.isLeaf` | `string` | `'isLeaf'` | 叶子标记字段名 |
| `CascaderFieldNames.tagProps` | `string` | `'tagProps'` | 标签属性字段名 |
| `CascaderFieldNames.render` | `string` | `'render'` | 自定义渲染字段名 |
| `VirtualListProps.height` | `number` | `33` | 单项占位高度（px，含项间 4px 间距） |
| `VirtualListProps.buffer` | `number` | `4` | 可视区上下各多渲染的项数 |
| `VirtualListProps.threshold` | `number` | `0` | 列内选项数超过该值才启用虚拟滚动 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 属性名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `modelValue` | `(string \| number)[] \| (string \| number)[][]` | `[]` | 绑定值，单选为路径数组，多选为路径数组的数组 |
| `options` | `CascaderOption[]` | `[]` | 选项数据 |
| `title` | `string` | `'请选择'` | 弹窗标题 |
| `placeholder` | `string` | `'请选择'` | 占位提示 |
| `showTrigger` | `boolean` | `true` | 是否显示触发器 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `labelKey` | `string` | `'label'` | 标签字段 |
| `valueKey` | `string` | `'value'` | 值字段 |
| `childrenKey` | `string` | `'children'` | 子选项字段 |
| `textSeparator` | `string` | `' / '` | 触发器文本分隔符 |
| `height` | `number \| string` | `600` | 列表高度（rpx） |
| `size` | `CascaderSize` | `'md'` | 尺寸 |
| `color` | `CascaderColor` | `'primary'` | 颜色 |
| `customClass` | `string` | `''` | 自定义类名 |
| `customStyle` | `string` | `''` | 自定义行内样式 |
| `lazy` | `boolean` | `false` | 是否动态加载子节点 |
| `lazyLoad` | `(node, resolve, reject) => void` | - | 加载动态数据的方法 |
| `leafLevel` | `number` | `0` | 查询次级菜单层级，`0` 为不限制 |
| `multiple` | `boolean` | `false` | 是否多选 |
| `ellipsis` | `boolean` | `true` | 选项文本是否省略 |
| `lines` | `number` | `1` | 省略行数 |
| `ui` | `CascaderUI` | `{}` | 样式覆盖对象 |

:::

::

### Emits

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

`RebornCascader`：

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `change` | 选中值改变时触发 | `(value: CascaderValue)` |
| `input-value-change` | 输入值改变时触发 | `(value: string)` |
| `clear` | 点击清除按钮时触发 | - |
| `search` | 用户搜索时触发，按 `search-delay` 防抖 | `(value: string)` |
| `popup-visible-change` | 下拉框的显示状态改变时触发 | `(visible: boolean)` |
| `focus` | 获得焦点时触发 | `(ev: FocusEvent)` |
| `blur` | 失去焦点时触发 | `(ev: FocusEvent)` |

`RebornCascaderPanel`：

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `change` | 选中值改变时触发 | `(value: CascaderValue)` |
| `select` | 完成一次选中动作时触发，无论值是否真的改变 | `(value: 该项按 path-mode 折算出的值)` |

此外，三个 `v-model` 各自对应一个更新事件：`update:modelValue`、`update:inputValue`、`update:popupVisible`（面板只有 `update:modelValue`）。

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `update:modelValue` | 选中项改变时触发（`v-model`） | `(value: (string \| number)[] \| (string \| number)[][])` |
| `change` | 选中项改变时触发 | `(value: (string \| number)[] \| (string \| number)[][])` |

:::

::

### Slots

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

`RebornCascader`：

| 名称 | 参数 | 描述 |
| :--- | :--- | :--- |
| `label` | `{ data: CascaderOption \| null }` | 选择框的显示内容；多选时逐个标签渲染，`data` 为该标签对应的选项（值不在选项里时为 `null`） |
| `prefix` | - | 前缀元素 |
| `arrow-icon` | - | 选择框的箭头图标 |
| `loading-icon` | - | 选择框的加载中图标，`loading` 为真时替换箭头 |
| `search-icon` | - | 选择框的搜索图标，搜索态下替换箭头 |
| `empty` | - | 选项为空、或搜索无结果时的显示内容 |
| `option` | `{ data: CascaderOption, level: number, checked: boolean, indeterminate: boolean }` | 选项内容，面板与搜索结果共用 |

`RebornCascaderPanel`：

| 名称 | 参数 | 描述 |
| :--- | :--- | :--- |
| `empty` | - | 选项为空时的显示内容 |
| `option` | `{ data: CascaderOption, level: number, checked: boolean, indeterminate: boolean }` | 选项内容 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 名称 | 参数 | 描述 |
| :--- | :--- | :--- |
| `tabs` | `{ label, index, current }` | 顶部已选路径导航标签的内容 |
| `item` | `{ item, listIndex, active }` | 选项行的内容 |

:::

::

### Expose

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

`RebornCascader`：

| 方法名 | 参数 | 描述 |
| :--- | :--- | :--- |
| `open` | - | 展开下拉面板（禁用状态下无效） |
| `close` | - | 收起下拉面板 |
| `focus` | - | 让触发器获得焦点 |
| `blur` | - | 让触发器失去焦点 |

`RebornCascaderPanel`：

| 方法名 | 参数 | 描述 |
| :--- | :--- | :--- |
| `syncActivePath` | - | 把展开路径同步到当前选中项 |
| `pick` | `(key: string)` | 按节点 key 完成一次选中（多选为切换勾选） |
| `activeNodes` | - | 当前展开路径上的节点（只读计算属性） |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 方法名 | 参数 | 描述 |
| :--- | :--- | :--- |
| `open` | - | 打开底部弹出层（禁用状态下无效）；懒加载模式下首次打开会请求根级选项 |
| `close` | - | 关闭底部弹出层；关闭前未确认的浏览 / 勾选不会提交 |
| `clear` | - | 清空选中值与展开路径，并触发 `update:modelValue` 与 `change` 事件 |

:::

::

### 自定义样式（ui）

两端交互形态不同（Web 是多列并排的浮层面板，UniApp 是底部弹窗 + 横向滑动列），因此**键位完全不同**，不要跨端照抄。

Web 端还有一个独立入口 `triggerUi`：它承接触发器盒子与浮层外壳两部分的键（`trigger`、`triggerText`、`triggerIconWrapper`、`placeholder`、`clearBtn`、`arrow`、`searchInput`、`triggerLoadingIcon`、`wrapper`、`dropdown`、`dropdownInner`、`arrow`），键名与 `reborn-select` 完全一致，组件内部会自动拆分下发。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名 | 说明 |
| :--- | :--- |
| `dropdown` | 浮层内容区，默认 `flex max-h-none w-full p-0`。级联的滚动发生在每一列内部，这一层不滚动也不留内边距；浮层本身（定位、描边、阴影）属于 `RebornSelectTrigger`，请用 `triggerUi.dropdown`。 |
| `panel` | 多列横向容器，默认 `flex w-full items-stretch overflow-x-auto scrollbar-hide`；列数超出浮层宽度时横向滚动。 |
| `column` | 单列容器，默认 `flex max-h-60 min-w-[160px] max-w-[280px] shrink-0 flex-col overflow-y-auto px-[4px] py-[6px] scrollbar-hide`；列宽、列高改这里。 |
| `columnDivider` | 列之间的分割线，默认 `w-px shrink-0 self-stretch bg-gray-2`。 |
| `option` | 单个选项行，默认与 `reborn-select` 的选项同款：`flex cursor-pointer items-center rounded-sm px-[6px] py-[4px] text-base ...`。 |
| `optionContent` | 选项行内部的横向容器，默认 `flex w-full items-center gap-1`。**填充 `option` 插槽后不再渲染。** |
| `optionLabel` | 选项文字节点，默认 `min-w-0 flex-1 truncate`。**填充 `option` 插槽后不再渲染。** |
| `optionActive` | 选中项的附加样式，由 `color` 给出（如 `bg-brand-1 text-primary`）。**不是独立节点**，命中时合并进 `option`。 |
| `optionHighlight` | 展开路径上或鼠标悬停项的附加样式，默认 `bg-gray-2`。同样合并进 `option`，且选中态优先。 |
| `optionCheckbox` | 多选时选项行首勾选框的外层节点，默认 `shrink-0`；勾选框本体是 `reborn-checkbox`，样式请用它自己的 props。**仅 `multiple` 为真时渲染。** |
| `optionArrow` | 非叶子节点行尾的箭头，默认 `size-4 shrink-0 text-gray-5`。 |
| `optionLoading` | 懒加载子节点时行尾的转圈图标，默认 `size-4 shrink-0 animate-spin text-gray-5`。 |
| `optionList` | 选项行的排布容器，默认 `space-y-[4px]`；行间距改这里。 |
| `virtualPhantom` | 虚拟滚动占位层，默认 `relative w-full`；高度由组件按「条数 × 步长」写成行内样式。**仅传入 `virtual-list-props` 时生效。** |
| `virtualWindow` | 虚拟滚动窗口层，默认 `absolute inset-x-0 top-0`。**仅传入 `virtual-list-props` 时生效。** |
| `searchList` | 搜索结果列表容器，默认 `flex max-h-60 w-full flex-col overflow-y-auto px-[4px] py-[6px] scrollbar-hide`。**仅搜索态且关键词非空时渲染。** |
| `empty` | 空态提示，默认 `flex items-center justify-center py-6 text-base text-gray-5`。 |
| `loading` | `loading` 为真时浮层里的加载占位容器，默认 `flex items-center justify-center gap-2 py-6 text-base text-gray-5`。 |
| `loadingIcon` | 加载占位里的转圈图标，默认 `size-4 shrink-0 animate-spin`。 |
| `prefix` | 触发器前缀容器，默认 `flex shrink-0 items-center text-gray-6`。**仅填充 `prefix` 插槽时渲染。** |
| `tagList` | 多选标签区，默认 `flex min-w-0 flex-1 items-center gap-1 overflow-hidden`。 |
| `tag` | 单个标签的主体（下发给 `RebornBadge` 的 `ui.base`），默认 `rounded-sm! border-gray-3 bg-gray-2 text-gray-9`。 |
| `tagLabel` | 标签文字节点，默认随 `tag-nowrap` 在「换行」与「单行截断」之间切换。 |
| `tagClose` | 标签关闭按钮，默认 `shrink-0 text-gray-5 transition-colors hover:text-gray-8`。 |
| `tagCloseIcon` | 标签关闭图标，默认 `size-full`。 |
| `collapseTag` | `max-tag-count` 折叠出的 `+N` 标签的附加样式，默认空。 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名 | 说明 |
| :--- | :--- |
| `root` | 组件根节点，默认 `w-full`；触发器（`RebornSelectTrigger`）样式请用它自己的 props。 |
| `popup` | 底部弹窗内部的内容容器，默认 `bg-white dark:bg-slate-900 rounded-t-[32rpx] overflow-hidden`。 |
| `tabsScroll` | 顶部已选路径导航的横向滚动容器。**仅单选模式渲染。** |
| `tabs` | 导航标签的横向排布容器，默认 `flex flex-row items-center p-2 gap-1.5`。**仅单选模式渲染。** |
| `tab` | 单个导航标签的外层节点；标签内的胶囊是 `RebornBadge`，颜色请用它自己的 props。 |
| `list` | 列表区域容器，默认 `h-[600rpx]`。**高度由 `height` prop 以内联 style 写入，会盖掉这里的高度类。** |
| `loading` | 根级懒加载时的加载态容器。**仅 `lazy` 首次加载时渲染。** |
| `loadingText` | 加载态文案容器，默认 `mt-2 text-[24rpx] text-gray-400`。 |
| `listScroll` | 多列横向滑动的 `scroll-view`，默认 `w-full h-full no-scrollbar`。 |
| `listInner` | 横向滑动区内部的列容器，默认 `flex flex-row h-full min-w-full`。 |
| `column` | 单列容器，默认带右侧分隔线 `border-r border-gray-100`。 |
| `columnScroll` | 列内纵向滚动的 `scroll-view`，默认 `h-full`。 |
| `item` | 单个选项行，默认 `flex flex-row items-center justify-between px-[32rpx] py-[24rpx] ...`；行高改这里。 |
| `itemActive` | 当前展开路径上选项的附加样式，默认 `bg-primary/5`。**不是独立节点**，合并进 `item`。 |
| `itemInner` | 选项行左侧「勾选框 + 文字」的横向容器。 |
| `checkbox` | 多选模式下勾选框的外层节点，默认 `mr-2`。**仅 `multiple` 为真时渲染。** |
| `itemText` | 未选中选项的文字样式（下发给 `RebornText` 的 `custom-class`）。**填充 `item` 插槽后失效。** |
| `itemTextActive` | 选中选项的文字样式，与 `itemText` **二选一**。 |
| `nodeLoading` | 懒加载子节点时行尾的加载指示器容器。 |
| `nodeArrow` | 非叶子节点行尾的箭头，默认 `i-lucide-chevron-right ...`；换图标直接改这里。 |
| `footer` | 多选模式底部操作栏。**仅 `multiple` 为真时渲染。** |
| `footerText` | 底部「已选 N 项」文案。 |
| `footerActions` | 底部按钮组容器；「清空」「确认」是 `RebornButton`，样式请用它自己的 props。 |

:::

::

### CSS 变量

Web 端不自带私有变量，尺寸与字号全部取自全局令牌，定义在 `app/assets/theme/typography.css`：

| 变量 | 取值 | 用途 |
| :--- | :--- | :--- |
| `--height-input-sm` / `-md` / `-lg` | `24px` / `32px` / `40px` | 触发器高度三档 |
| `--spacing-input-px-sm` / `-md` / `-lg` | `10px` / `12px` / `16px` | 触发器水平内边距三档 |

## 两端差异对照

| 维度 | Web | UniApp |
| :--- | :--- | :--- |
| 形态 | 触发器 + 多列浮层面板，列间 1px 分割线 | 触发器 + 底部弹窗，横向滑动列 |
| API | 值 / 路径双模式、搜索、虚拟滚动、`field-names` 等完整参数 | 仅路径模式，参数集为 `labelKey` / `valueKey` / `lazy` / `leafLevel` 等旧式命名 |
| 绑定值 | 默认为选项值，`path-mode` 才是路径 | 恒为路径数组（多选为路径数组的数组） |
| 懒加载 | `load-more(option, done)` | `lazy` + `lazyLoad(node, resolve, reject)` |
| 多选确认 | 勾完即写回 `v-model` | 弹窗底部「确认」后才写回 |
| 独立面板 | 提供 `RebornCascaderPanel` | 无 |

## 注意事项

- **Web 与 UniApp 的 API 尚未对齐。** Web 端本轮已整体换成上表中的新参数集，UniApp 端仍是旧参数集（`labelKey` / `textSeparator` / `lazy` / `leafLevel` 等）。后果是同一份业务代码不能两端直接复用，跨端页面请分别按各自的表传参。
- **值的匹配是严格的。** 绑定值与选项值按「类型 + 值」比对，数字 `1` 匹配不上字符串 `'1'`；对象值只比对 `value-key` 指定的那个属性。匹配不上的值不会消失，而是交给 `fallback` 兜底展示（默认把值本身转成文本）——回显成一串 id 时，先检查两边的值类型是否一致。
- **多选 + 父子关联时，绑定值里只会出现叶子。** 勾「杭州市」写回的是它名下三个区，而不是 `'hangzhou'`。需要拿到父节点本身，请开 `check-strictly`。
- **子树里有禁用且未勾选的叶子时，父节点永远停在半选。** 勾选联动只会写未禁用的叶子，这是实情而非 bug：那棵子树确实没被全选。
- **懒加载必须自己标 `isLeaf`。** 组件看到「没有 children」时无从区分「到底了」与「还没请求」，未标 `isLeaf` 的节点一律按可展开处理；`done()` 不传子节点时组件会把该节点补标为叶子。
- **懒加载回写依赖响应式。** `done(children)` 是把子节点写回你传进来的那个选项对象，所以 `options` 必须是响应式数据（`ref` / `reactive`），否则面板不会更新。
- **`virtual-list-props` 要求每项等高。** 虚拟滚动按「下标 × 步长」算位置，改了 `ui.option` 的字号或内边距，必须同步改 `height`，否则滚动条与内容会错位。
- **`popup-container` 指向的容器必须已经在文档里。** 它最终传给 `Teleport`，目标不存在时会直接报错；传选择器字符串时请确认该节点先于选择器挂载。
