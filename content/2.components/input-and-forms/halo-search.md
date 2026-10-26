---
title: 光晕搜索框
description: 发光光环搜索输入框：悬停与聚焦时光环旋转，支持 v-model 绑定关键词与回车 search 事件。
category: 表单与输入
platform: web
tags: [css, tailwind, input, ui-verse]
---

::ComponentViewer{demoFile="HaloSearchDemo.vue" config="HaloSearchConfig" componentId="halo-search" :componentFiles='["HaloSearch.vue"]'}
::

## 简介

HaloSearch 是仅 Web 的装饰性搜索输入框，以多层锥形渐变光环提供悬停与聚焦反馈。

`modelValue` 绑定关键词，输入框回车时派发 `search`；悬停时光环缓慢旋转，聚焦时加速转动。

`class` 控制根容器，其余透传属性和原生事件落在内部 input；它提供搜索入口，不内置历史记录或结果列表。

### 何时使用

- 搜索入口需要光晕聚焦反馈——用 `modelValue` 绑定关键词。
- 需要从业务状态回填关键词——更新 `modelValue` 并监听回车搜索事件。
- 需要在展示区中定位搜索入口——用 `class` 调整根容器布局。

### 何时不使用

- 搜索需要历史记录与清空等业务能力——改用 `reborn-search-box`。
- 提交后需要文字消散动画——改用 `vanishing-input`。

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

### 绑定关键词与回车搜索

`v-model` 绑定输入框的字符串，按回车派发 `search`，参数为当前关键词；输入法组字中的回车不会触发。`placeholder` 等属性直接写在组件上即可透传给输入框。

```vue
<script setup lang="ts">
import { shallowRef } from "vue";

const keyword = shallowRef("");

function onSearch(value: string) {
  console.log("搜索：", value);
}
</script>

<template>
  <HaloSearch v-model="keyword" placeholder="搜索组件…" @search="onSearch" />
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
| `modelValue` | `string` | `""` | 输入框的关键词，配合 `v-model` 使用。 |
| `class` | `string` | `""` | 追加到根容器的额外 CSS 类；其余透传属性落到内部输入框。 |

### Emits

| 事件名 | 回调参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `(value: string)` | 输入时触发。 |
| `search` | `(keyword: string)` | 在输入框内按回车时触发（输入法组字中的回车除外），参数为当前关键词。 |

### 来源

- 设计灵感来自未来感 UI 概念与现代 Web/App 设计中流行的氛围光效。
- 来源于 UiVerse 搜索输入挑战。

## 注意事项

- **只能用于 Web 页面**。当前只有 Web 组件实现，UniApp 页面无法直接复用。
- **透传属性落在输入框上**。组件关闭了 `inheritAttrs`，除 `class` 外的属性与原生事件绑定到内部 `input`；`style` 同样作用于输入框而不是外层容器，外层布局请用 `class`。
- **配色适合深色背景**。输入框与光环为深色系写死配色（黑底白字、紫粉色光环），置于浅色背景会显得突兀，建议深色背景使用。
- **尺寸不会随容器伸缩**。输入框尺寸固定（约 301×56px），不随容器伸缩；整体缩放请用 `transform: scale` 而非宽高类。
- **搜索图标不能提交**。右侧搜索图标为纯装饰元素，点击无回调；提交请监听回车触发的 `search`。
