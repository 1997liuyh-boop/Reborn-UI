---
title: 搜索框
description: 仿 MasterGo 设计的高级搜索框组件，支持目录选择、图片搜索及自定义按钮。
category: 表单与输入
tags: [css, tailwind, input, search, reborn]
badge: New
navigation:
  badges:
    - label: Web
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornSearchBoxDemo.vue" config="RebornSearchBoxConfig" componentId="reborn-search-box" :componentFiles='["RebornSearchBox.vue", "reborn-search-box.config.ts"]' :uniappFiles='["RebornSearchBox.vue", "reborn-search-box.config.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `""` | 搜索框的绑定值，支持 `v-model`。 |
| `placeholder` | `string` | `"请输入搜索内容"` | 占位文本。 |
| `category` | `string` | `"全部"` | 左侧目录显示的文本。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "blue" \| "green" \| "orange"` | `"primary"` | 主题颜色。 |
| `mode` | `"associate" \| "sku"` | `"associate"` | 搜索模式。 |
| `showDropdown` | `boolean` | `true` | 是否显示下拉面板。 |
| `skuAttributes` | `SkuAttribute[]` | `[]` | SKU 模式下的属性列表。 |
| `saveHistory` | `(history: string[]) => void` | `undefined` | 自定义保存历史记录的方法。 |
| `removeHistory` | `() => void` | `undefined` | 自定义清空历史记录的方法。 |
| `class` | `any` | `undefined` | 额外样式类。 |

## 事件

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `value: string` | 当输入内容变化时触发。 |
| `search` | `value: string` | 当用户点击搜索按钮或按下回车时触发。 |
| `click-category` | `-` | 当用户点击目录区域时触发。 |
| `click-camera` | `-` | 当用户点击相机图标时触发。 |

## 插槽

| 插槽名 | 参数 | 描述 |
| --- | --- | --- |
| `category` | `{ ui }` | 自定义目录显示区域。 |
| `trailing` | `{ ui }` | 自定义后置图标区域（默认包含相机图标）。 |
| `search-button` | `{ ui }` | 自定义搜索按钮内容（默认包含搜索图标）。 |

::
