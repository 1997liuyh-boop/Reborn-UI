---
title: VariableLetterText 逐字变轴文字
description: 悬停时按顺序改变每个字符的可变字体轴，移出后恢复初始设置。
category: 文字动画
platform: web
tags: [css, tailwind, motion-v, typography]
---

::ComponentViewer{demoFile="VariableLetterTextDemo.vue" config="VariableLetterTextConfig" componentId="variable-letter-text" :componentFiles='["VariableLetterText.vue", "index.ts"]' dependencies="motion-v"}
::

## 简介

VariableLetterText 是 Web 组件，用于短标签和标题的逐字可变字体动画。

`fromFontVariationSettings` 和 `toFontVariationSettings` 定义字轴的起点和终点。`staggerDuration` 和 `staggerFrom` 分别控制相邻字符的延迟和动画方向。

`label` 提供文字内容，`transition` 配置单个字符的过渡，`class` 可以设置字体和字号。组件会保留文字中的连续空格。

### 何时使用

- 短标题悬停时需要逐字加粗，用 `toFontVariationSettings` 设置目标字重。
- 需要从标题两端或中间开始播放，用 `staggerFrom` 设置起始位置。
- 标题含固定间隔，用 `label` 传入完整的带空格文案。

### 何时不使用

- 正文需要分行入场，改用 `text-reveal`。
- 需要逐字输入和删除，改用 `reborn-typewriter`。

## 用法

### 字重变化

悬停时，组件将每个字符从 `fromFontVariationSettings` 动画到 `toFontVariationSettings`，移出后复原。

| 配置 | 典型用途 |
| --- | --- |
| `'wght' 400` | 使用常规字重作为初始状态 |
| `'wght' 900` | 悬停时强调标题 |

```vue
<template>
  <VariableLetterText
    class="font-sans text-2xl"
    label="Variable Weight"
    from-font-variation-settings="'wght' 400"
    to-font-variation-settings="'wght' 900"
  />
</template>
```

### 交错顺序

`staggerFrom` 控制从哪个字符开始，`staggerDuration` 以秒为单位配置相邻字符的延迟。

| 配置 | 典型用途 |
| --- | --- |
| `center` | 从中间向两端展开 |
| `last` | 从最后一个字符向开头播放 |

```vue
<template>
  <VariableLetterText
    class="font-sans text-2xl"
    label="From the Center"
    stagger-from="center"
    :stagger-duration="0.05"
  />
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `label` | `string` | 必填 | 要渲染的文字，保留连续空格。 |
| `fromFontVariationSettings` | `string` | `'wght' 400` | 初始字体轴设置。 |
| `toFontVariationSettings` | `string` | `'wght' 900` | 悬停时的目标字体轴设置。 |
| `transition` | `Transition` | `{ type: 'spring', duration: 0.7 }` | Motion 单字符过渡，`duration` 单位为秒。 |
| `staggerDuration` | `number` | `0.03` | 相邻字符的延迟，单位为秒。 |
| `staggerFrom` | `'first' \| 'last' \| 'center' \| number` | `'first'` | 起始位置。数值表示从零开始的字符索引。 |
| `class` | `HTMLAttributes['class']` | — | 为文字容器设置字体、字号及其他样式。 |

### Emits

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `click` | `event: MouseEvent` | 用户点击文字时透传原生事件。 |

## 注意事项

- **字体需要支持所配置的轴。** 例如使用 `wght` 时，字号所在的字体应提供可变字重。两端设置应使用相同的轴及顺序，以便连续插值。
- **系统开启减少动态效果时，文字保持初始设置。** 页面仍正常显示标签和响应点击。
- **逐字定位更适合短文本。** 字轴变化可能改变文字占用的宽度，单独渲染字符也会影响连字排版。
