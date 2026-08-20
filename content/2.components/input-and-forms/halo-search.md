---
title: 光晕搜索框
description: 用于视觉展示的发光光环搜索输入框组件，无取值 API。
category: 表单与输入
tags: [css, tailwind, input, ui-verse]
---

::ComponentViewer{demoFile="HaloSearchDemo.vue" config="HaloSearchConfig" componentId="halo-search" :componentFiles='["HaloSearch.vue"]'}

#credits

- 设计灵感来自未来感 UI 概念与现代 Web/App 设计中流行的氛围光效。
- 来源于 UiVerse 搜索输入挑战。

::

## 简介

HaloSearch 是一个纯装饰性的发光搜索输入框：多层锥形渐变（conic-gradient）光环叠加出氛围光效，悬停时光环缓慢旋转，聚焦输入时光环快速转动一圈形成「充能」反馈。它定位于视觉区块而非表单控件——组件只有 `class` 一个 prop，没有事件、插槽和 `v-model`，输入内容无法通过组件 API 读取。

适用场景：

- 落地页 / 概念页需要未来感搜索入口的视觉区块。
- 悬停与输入时需要光晕动效反馈的装饰性搜索框。

不适用场景：

- 需要绑定输入值并触发搜索的功能性搜索框，改用 `reborn-search-box`。
- 需要占位符轮播与提交动画的输入框，改用 `vanishing-input`。

## 用法

### 基础用法

直接放置即可，无需任何配置；悬停光环旋转，聚焦后触发一圈快速转动动画。建议放在深色背景中并预留光晕扩散空间：

```vue
<template>
  <div class="flex h-96 w-full items-center justify-center bg-black">
    <HaloSearch />
  </div>
</template>
```

### 自定义定位

`class` 追加到根容器，用于外部布局（如外边距、定位）；组件内部输入框为固定尺寸（约 301×56px），如需整体缩放可配合 `scale-*` 类：

```vue
<template>
  <HaloSearch class="mt-24 scale-90" />
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `class` | `string` | `""` | 追加到根容器的额外 CSS 类。 |

## 注意事项

- 仅 Web 端可用。
- 仅有 `class` 一个 prop，无事件、无插槽、无 `v-model`；输入框为内部原生 `input`（`name="text"`），内容无法通过组件 API 读取，若需取值只能自行查询 DOM。
- 输入框与光环为深色系写死配色（黑底白字、紫粉色光环），置于浅色背景会显得突兀，建议深色背景使用。
- 输入框尺寸固定（约 301×56px），不随容器伸缩；整体缩放请用 `transform: scale` 而非宽高类。
- 右侧搜索按钮为纯装饰元素，点击无回调。
