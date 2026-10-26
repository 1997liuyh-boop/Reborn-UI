---
title: 线条阴影文字
description: 为文字添加可配置颜色的斜线条纹阴影。
category: 文字动画
platform: web
tags: [css, tailwind, magic-ui]
---

::ComponentViewer{demoFile="LineShadowTextDemo.vue" config="LineShadowTextConfig" componentId="line-shadow-text" :componentFiles='["LineShadowText.vue"]'}

## 简介

LineShadowText 在正文背后添加斜线阴影，用于 Web 标题中的文字装饰。

`text` 决定阴影文字，`shadowColor` 决定颜色，`as` 决定语义标签；三个维度互相独立。

默认插槽提供正文，`class` 调整字号和布局。没有插槽时正文使用 `text`。

### 何时使用

- 标题需要斜线阴影时，通过 `text` 明确阴影内容。
- 深色背景需要提高对比度时，通过 `shadowColor` 使用浅色。
- 文字承担标题语义时，通过 `as` 选择对应标签。

### 何时不使用

- 需要扫过式高光 —— 改用 `radiant-text`。
- 需要粒子点缀文字 —— 改用 `sparkles-text`。

## 用法

### 文字与阴影

显式提供 `text`，使复杂正文的阴影内容保持确定。

| 属性 | 作用 | 典型用途 |
| --- | --- | --- |
| `text` | 正文兜底与阴影来源 | 动态标题或带组件的正文 |
| 默认插槽 | 覆盖正文；未传 text 时提取纯文本 | 简单文字组合 |

```vue
<template>
  <LineShadowText text="Reborn" />
  <LineShadowText text="动态标题">
    <strong>动态标题</strong>
  </LineShadowText>
</template>
```

### 颜色与语义

用 `shadowColor` 配合背景，`as` 保留文字的语义。

| 属性 | 作用 | 典型用途 |
| --- | --- | --- |
| `shadowColor` | 阴影颜色 | 深色背景使用浅色 |
| `as` | 根 HTML 标签 | 页面标题与行内强调 |

```vue
<template>
  <LineShadowText as="h2" text="组件标题" shadow-color="gray" class="text-3xl" />
</template>
```

## API

### Props

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `text` | `string` | - | 阴影文字；未传时从默认插槽提取文本。 |
| `shadowColor` | `string` | `"black"` | 阴影颜色。 |
| `class` | `string` | - | 根节点类名。 |
| `as` | `keyof HTMLElement` | `"span"` | 根元素标签。 |

### Emits

无。

### Slots

| 插槽名 | 参数 | 描述 |
| --- | --- | --- |
| `default` | - | 正文；留空时渲染 text。 |

### Expose

无。

### CSS 变量

| 变量 | 定义文件 | 说明 |
| --- | --- | --- |
| `--shadow-color` | `app/components/reborn/ui/line-shadow-text/LineShadowText.vue` | 由 shadowColor 设置的阴影颜色。 |

## 注意事项

- **复杂正文需要显式 text**。组件节点内部文字不参与提取；未找到文字时阴影为空，开发环境仅提示一次。
- **阴影跟随渲染更新**。默认插槽在渲染阶段解析，动态文字更新后同步更新阴影内容。
- **仅 Web 支持**。阴影依赖伪元素与 CSS 背景裁切。
