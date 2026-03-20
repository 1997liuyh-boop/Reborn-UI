---
title: 级联选择器
description: 在包含多层级的数据结构中进行选择，常用作省市区选择、分类选择等场景。
category: Input and Forms
badge: New
navigation:
  badges:
    - label: UniApp
      color: success
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
| `ui` | `CascaderUI` | `{}` | 样式覆盖对象 |

## Events

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `update:modelValue` | 选中项改变时触发 (v-model) | `(value: (string \| number)[] \| (string \| number)[][])` |
| `change` | 选中项改变时触发 | `(value: (string \| number)[] \| (string \| number)[][])` |

## CascaderUI Slots

| 插槽名 | 描述 |
| :--- | :--- |
| `root` | 根容器样式 |
| `popup` | 弹窗容器样式 |
| `tabs` | 顶部导航标签栏样式 |
| `tab` | 单个导航标签样式 |
| `list` | 选项列表容器样式 |
| `item` | 选项行容器样式 |
| `itemText` | 选项文字样式 |

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
