---
title: 容器
description: 用于将页面内容水平居中并按屏幕断点限制最大宽度的布局容器组件，仅 web 端。
category: 导航
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::warning
仅 Web 端组件。UniApp 页面容器请使用 `reborn-page`。
::

::ComponentViewer{demoFile="RebornContainerDemo.vue" config="RebornContainerConfig" componentId="reborn-container" :componentFiles='["RebornContainer.vue", "reborn-container.config.ts"]'}
::

## 简介

Container 是最基础的页面宽度约束容器：内容水平居中（`mx-auto`）、最大宽度由 CSS 变量 `--ui-container` 控制，并随断点提供响应式水平内边距（`px-4 sm:px-6 lg:px-8`）。它没有事件与交互逻辑，只负责「限宽 + 居中 + 留边」。

在页面骨架中的位置：`reborn-header`（顶部导航）与 Container 使用同一个 `--ui-container` 最大宽度，因此 Container 内的内容会与 Header 内容左右对齐；`reborn-main` 负责语义化的页面主体区域，Container 通常作为 Main 的直接子级包裹每一屏内容；`reborn-footer` 为页面底部。典型结构：

```text
RebornHeader
RebornMain
  └─ RebornContainer  ← 每一屏内容的限宽容器
RebornFooter
```

适用场景：

- 落地页、文档页等需要内容居中且限制最大宽度的整页布局。
- 需要通过 `as` 渲染为 `section`、`article` 等语义化标签的外层容器。

不适用场景：

- UniApp 端不可用（仅 web），小程序页面容器改用 `reborn-page`。
- 需要标题栏加内容体的卡片式分组，改用 `reborn-card`。

## 用法

### 基础用法

直接包裹内容即可获得居中、限宽、带响应式留边的布局：

```vue
<template>
  <RebornContainer>
    <h1 class="text-3xl font-bold">页面标题</h1>
    <p class="mt-4 text-gray-500">正文内容会保持在最大宽度内水平居中。</p>
  </RebornContainer>
</template>
```

### 更换渲染标签

通过 `as` 指定渲染的 HTML 元素或组件（默认 `div`），便于输出语义化结构：

```vue
<template>
  <RebornContainer as="section" class="py-16">
    <h2 class="text-2xl font-semibold">特性介绍</h2>
  </RebornContainer>
</template>
```

### 自定义样式

`class` 追加到根节点；`ui.root` 用于覆盖根节点类名，例如收窄最大宽度：

```vue
<template>
  <RebornContainer :ui="{ root: 'max-w-3xl' }">
    <article class="prose">窄版正文排版</article>
  </RebornContainer>
</template>
```

## API

### Props

| 属性名  | 类型                              | 默认值  | 描述                                               |
| :------ | :-------------------------------- | :------ | :------------------------------------------------- |
| `as`    | `any`                             | `'div'` | 容器渲染的 HTML 元素或组件。                       |
| `class` | `any`                             | -       | 追加到根节点的自定义类名。                         |
| `ui`    | `Partial<{ root: ClassValue }>`   | -       | 按键覆盖内部节点类名，见下方「自定义样式（ui）」。 |

### Slots

| 插槽名    | 描述               |
| :-------- | :----------------- |
| `default` | 容器默认插槽内容。 |

### 自定义样式（ui）

| 键名   | 说明                                                                     |
| :----- | :----------------------------------------------------------------------- |
| `root` | 根容器，默认 `w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8`。 |

## 注意事项

- 仅 Web 端可用。
- 纯布局组件：只有 `as` / `class` / `ui` 三个 props 与默认插槽，无事件与交互逻辑。
- 最大宽度来自 CSS 变量 `--ui-container`，可在全局样式中覆盖该变量统一调整站点版心；单个容器则用 `ui.root` 覆盖 `max-w-*`。
- `class` 与 `ui.root` 都会合并到根节点上，`class` 优先级更高（合并顺序在 `ui.root` 之后）。
