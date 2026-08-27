---
title: 级联选择器
description: 用于在树形多层级数据中逐级选择的级联选择器组件，双端可用。
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

::ComponentViewer{demoFile="RebornCascaderDemo.vue" config="RebornCascaderConfig" componentId="reborn-cascader" :uniappFiles='["RebornCascader.vue", "reborn-cascader.config.ts"]'}
::

# API

## Props

| 属性名 | 类型 | 默认值 | 描述 |
| :--- | :--- | :--- | :--- |
| `modelValue` | `(string \| number)[] \| (string \| number)[][]` | `[]` | 绑定值，数组形式存储选中路径的值 |
| `options` | `CascaderOption[]` | `[]` | 级联数据源，树形结构 |
| `title` | `string` | `'请选择'` | 弹窗标题 |
| `placeholder` | `string` | `'请选择'` | 触发器占位文本 |
| `showTrigger` | `boolean` | `true` | 是否显示默认触发器 |
| `disabled` | `boolean` | `false` | 是否禁用 |
| `labelKey` | `string` | `'label'` | 选项标签字段名 |
| `valueKey` | `string` | `'value'` | 选项值字段名 |
| `childrenKey`| `string` | `'children'`| 指定选项的子选项字段 |
| `textSeparator`| `string` | `' / '` | 触发器文本分隔符 |
| `height` | `number \| string` | `600` | 列表容器高度 (rpx) |
| `size` | `CascaderSize` | `'md'` | 尺寸 (sm, md, lg) |
| `color` | `CascaderColor` | `'primary'` | 主题颜色 |
| `lazy` | `boolean` | `false` | 是否开启懒加载 |
| `lazyLoad` | `function` | - | 动态加载方法 `(node, resolve, reject) => void` |
| `leafLevel` | `number` | `0` | 限制选择层级 (0为不限制) |
| `multiple` | `boolean` | `false` | 是否多选 |
| `portal` | `boolean` | `true` | （Web）浮层是否传送到 `body`。默认开启，浮层按文档坐标锚定触发器，不受祖先 `overflow` / `transform` 裁剪；关闭后浮层留在触发器内，随父容器一起滚动、一起被裁剪 |
| `ui` | `CascaderUI` | `{}` | 样式覆盖对象 |

## Events

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `update:modelValue` | 选中项改变时触发 (v-model) | `(value: (string \| number)[] \| (string \| number)[][])` |
| `change` | 选中项改变时触发 | `(value: (string \| number)[] \| (string \| number)[][])` |

## Slots

| 名称 | 参数 | 描述 |
| :--- | :--- | :--- |
| `default` | `{ isOpen, open, close, clear, hasValue, displayText }` | 自定义触发器显示内容；`showTrigger` 为 `false` 时整体替换触发区域，作用域提供 `open` / `close` / `clear` 等方法（Web 端） |
| `option` | `{ option, columnIndex }` | 自定义下拉面板中单个选项的渲染内容，作用域提供选项对象与所在列索引（Web 端） |
| `tabs` | `{ label, index, current }` | 自定义顶部已选路径导航标签的内容（UniApp 端） |
| `item` | `{ item, listIndex, active }` | 自定义选项行的内容，作用域提供选项对象、列索引与是否激活（UniApp 端） |

## Expose

通过模板 ref 可调用以下方法：

| 方法名 | 参数 | 描述 |
| :--- | :--- | :--- |
| `open` | - | 打开选择面板（禁用状态下无效）；UniApp 端懒加载模式下首次打开会请求根级选项 |
| `close` | - | 关闭选择面板；关闭前未确认的选择不会提交 |
| `clear` | - | 清空选中值与展开路径，并触发 `update:modelValue` 与 `change` 事件（空数组） |

## 自定义样式（ui）

两端的交互形态不同（Web 是多列并排的浮层面板，UniApp 是底部弹窗 + 横向滑动列），因此**键位完全不同**，不要跨端照抄。

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名             | 说明                                                                                                                                                        |
| :--------------- | :---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `wrapper`        | 组件最外层容器（`RebornSelectTrigger` 的根节点），默认 `relative inline-flex w-full group outline-none`；改宽度在这里。**`showTrigger` 为 `false` 时整个触发器与浮层都不渲染**，此时下面所有键都失效。 |
| `triggerText`    | 触发器中已选路径文本，默认 `truncate text-gray-8 dark:text-gray-1 flex-1`。**仅在未填充 default 插槽时渲染**，填充该插槽会替换掉该节点，`ui.triggerText` 随之失效。 |
| `placeholder`    | 触发器中的占位文本，默认 `truncate text-gray-4 dark:text-gray-5 flex-1`。**仅在未填充 default 插槽时渲染**，填充该插槽会替换掉该节点，`ui.placeholder` 随之失效。 |
| `panel`          | 浮层内部「多列并排」的横向容器，默认 `flex w-max items-start gap-2 bg-transparent p-1`；列间距改这里。浮层本身（定位、阴影）属于 `RebornSelectTrigger`，请用它的 `ui.dropdown`。 |
| `column`         | 单列容器，默认 `min-w-[160px] shrink-0 overflow-y-auto rounded-ui-md border border-gray-2 bg-white py-1 min-h-[280px] shadow-lg`；列宽、列高、边框改这里。      |
| `option`         | 单个选项行，默认 `relative flex items-center gap-2 px-3 py-2 text-base text-gray-900 cursor-pointer transition-colors hover:bg-gray-1`。                       |
| `optionActive`   | 高亮（当前展开路径上的）选项的附加样式，默认 `font-medium`。**不是独立节点**——高亮时被合并进 `option` 所在节点。                                              |
| `optionDisabled` | 禁用选项的附加样式，默认 `cursor-not-allowed opacity-50 hover:bg-transparent`。同样是合并进 `option`。                                                        |
| `optionLabel`    | 选项文字节点，默认 `flex-1 truncate`。**仅在未填充 `option` 插槽时渲染**，填充该插槽会替换掉该节点，`ui.optionLabel` 随之失效。                                |
| `optionIcon`     | 非叶子节点右侧的箭头图标，默认 `shrink-0 text-gray-5`。**仅在未填充 `option` 插槽时渲染**，填充该插槽会替换掉该节点，`ui.optionIcon` 随之失效。                |
| `empty`          | `options` 为空数组时的空态提示，默认 `min-w-[160px] rounded-ui-md border border-gray-2 bg-white px-4 py-6 text-base text-gray-5 shadow-lg`。                   |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名             | 说明                                                                                                                                                     |
| :--------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `root`           | 组件根节点，默认 `w-full`；触发器（`RebornSelectTrigger`）样式请用它自己的 props，不走这里。                                                              |
| `popup`          | 底部弹窗内部的内容容器，默认 `bg-white dark:bg-slate-900 rounded-t-[32rpx] overflow-hidden`；底色与顶部圆角改这里。弹窗遮罩与动画属于 `RebornPopup`，不走这里。 |
| `tabsScroll`     | 顶部已选路径导航的横向滚动容器，默认 `w-full border-b border-gray-100 dark:border-slate-800 no-scrollbar`。**仅单选模式（`multiple` 为 `false`）渲染。**   |
| `tabs`           | 导航标签的横向排布容器，默认 `flex flex-row items-center p-2 gap-1.5`。**仅单选模式渲染。**                                                               |
| `tab`            | 单个导航标签的外层节点，默认 `reborn-cascader-tab shrink-0 text-28 [.reborn-cascader-tab_+_&]:ml-1`；标签内的胶囊是 `RebornBadge`，颜色请用它自己的 props。填充 `tabs` 插槽只替换标签内部，`ui.tab` 仍生效。 |
| `list`           | 列表区域容器，默认 `h-[600rpx]`。**高度由 `height` prop 以内联 `style` 写入，会盖掉这里的高度类**——想改高度请用 `height`，这里只适合加背景、内边距。      |
| `loading`        | 根级懒加载时的加载态容器，默认 `flex flex-col items-center justify-center h-full w-full`。**仅 `lazy` 首次加载时渲染。**                                    |
| `loadingText`    | 加载态文案「正在加载数据...」，默认 `mt-2 text-[24rpx] text-gray-400`。                                                                                    |
| `listScroll`     | 多列横向滑动的 `scroll-view`，默认 `w-full h-full no-scrollbar`。                                                                                          |
| `listInner`      | 横向滑动区内部的列容器，默认 `flex flex-row h-full min-w-full`。                                                                                           |
| `column`         | 单列容器，默认 `shrink-0 h-full border-r border-gray-100 dark:border-slate-800 last:border-r-0`；列宽由内部按层级计算的类追加，改这里可覆盖列分隔线。      |
| `columnScroll`   | 列内纵向滚动的 `scroll-view`，默认 `h-full`。                                                                                                              |
| `item`           | 单个选项行，默认 `flex flex-row items-center justify-between px-[32rpx] py-[24rpx] active:bg-gray-50 dark:active:bg-slate-800 transition-colors`；行高改这里。 |
| `itemActive`     | 当前展开路径上的选项的附加样式，默认 `bg-primary/5 dark:bg-primary/10`。**不是独立节点**——命中时被合并进 `item` 所在节点。                                 |
| `itemInner`      | 选项行左侧「勾选框 + 文字」的横向容器，默认 `flex flex-row items-center`。                                                                                 |
| `checkbox`       | 多选模式下的勾选框外层节点，默认 `mr-2`。**仅 `multiple` 为真时渲染**；勾选框本体的方框与对勾是组件内部硬编码的类，没有对应 ui 键。                        |
| `itemText`       | 未选中选项的文字样式（作为 `RebornText` 的 `custom-class` 下发），默认 `text-[28rpx]`。**仅在未填充 `item` 插槽时渲染**，填充该插槽会替换掉该节点，`ui.itemText` 随之失效。 |
| `itemTextActive` | 选中选项的文字样式，默认 `text-primary font-medium`；与 `itemText` **二选一**（不是叠加）。同样受 `item` 插槽陷阱影响。                                    |
| `nodeLoading`    | 懒加载子节点时行尾的加载指示器容器，默认 `ml-auto h-[32rpx] w-[32rpx]`。                                                                                   |
| `nodeArrow`      | 非叶子节点行尾的箭头，默认 `i-lucide-chevron-right text-[32rpx] text-gray-300 ml-auto`；换图标直接改这里的 `i-lucide-*`。                                    |
| `footer`         | 多选模式底部操作栏，默认 `flex flex-row items-center justify-between px-[32rpx] py-[24rpx] border-t border-gray-100 dark:border-slate-800`。**仅 `multiple` 为真时渲染。** |
| `footerText`     | 底部「已选 N 项」文案，默认 `text-[24rpx] text-gray-500`。                                                                                                 |
| `footerActions`  | 底部按钮组容器，默认 `flex flex-row gap-2`；「清空」「确认」是 `RebornButton`，样式请用它自己的 props。                                                     |

:::

::

```vue
<template>
  <!-- Web：加宽列、把高亮项改成实心底色 -->
  <RebornCascader
    v-model="value"
    :options="options"
    :ui="{
      column: 'min-w-[200px] min-h-[320px]',
      option: 'py-2.5',
      optionActive: 'bg-primary/10 font-semibold text-primary',
    }"
  />

  <!-- UniApp：加高行高、换掉行尾箭头 -->
  <RebornCascader
    v-model="value"
    :options="options"
    :height="700"
    :ui="{
      item: 'py-[32rpx]',
      itemActive: 'bg-primary/10',
      nodeArrow: 'i-lucide-arrow-right text-[32rpx] text-primary ml-auto',
    }"
  />
</template>
```

## 示例代码

```vue
<template>
  <RebornCascader
    v-model="value"
    :options="options"
    placeholder="请选择"
  />
</template>

<script setup>
const value = ref([])
const options = [
  {
    label: '浙江',
    value: 'zj',
    children: [
      { label: '杭州', value: 'hz' },
      { label: '宁波', value: 'nb' }
    ]
  }
]
</script>
```
