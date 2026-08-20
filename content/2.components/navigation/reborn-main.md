---
title: 主体布局
description: 用于渲染语义化 main 页面主体区域、默认最小高度撑满一屏的布局组件，仅 web 端。
category: 导航
badge: New
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

::ComponentViewer{demoFile="RebornMainDemo.vue" config="RebornMainConfig" componentId="reborn-main" :componentFiles='["RebornMain.vue", "reborn-main.config.ts"]'}
::

## 简介

Main 渲染一个语义化的 `<main>` 元素作为页面主体区域，默认样式仅 `min-h-screen`——保证主体内容至少撑满一屏，避免内容过短时 Footer 上浮到视口中间。它与 `reborn-container` 是配套关系、分工不同：

- **Main 管「纵向」**：语义化主体标签 + 最小高度，直接作为 Header 与 Footer 之间的整块区域。
- **Container 管「横向」**：限宽、居中、留边，通常作为 Main 的子级包裹每一屏内容。

典型页面骨架：

```text
RebornHeader
RebornMain            ← 语义化 <main>，min-h-screen
  └─ RebornContainer  ← 限宽居中
RebornFooter
```

不适用场景：

- UniApp 端不可用（仅 web），页面容器改用 `reborn-page`。
- 只需要限宽居中的普通内容容器，直接用 `reborn-container`。

## 用法

### 基础用法

与 `reborn-header`、`reborn-container` 配合组成页面骨架，Main 内部再由 Container 控制内容宽度：

```vue
<template>
  <RebornHeader title="Reborn UI" />
  <RebornMain class="bg-gray-50 dark:bg-gray-900/50">
    <RebornContainer class="py-12">
      <h1 class="text-4xl font-bold">页面主体</h1>
      <p class="mt-4 text-gray-500">内容不足一屏时，Main 仍会撑满视口高度。</p>
    </RebornContainer>
  </RebornMain>
</template>
```

### 自定义主体样式

`ui.base` 覆盖主体容器类名。例如页面顶部存在固定 Header 时，将最小高度改为扣除 Header 高度：

```vue
<template>
  <RebornMain :ui="{ base: 'min-h-[calc(100vh-var(--ui-header-height))]' }">
    <RebornContainer class="py-8">正文内容</RebornContainer>
  </RebornMain>
</template>
```

## API

### Props

| 属性名  | 类型                            | 默认值 | 描述                                               |
| :------ | :------------------------------ | :----- | :------------------------------------------------- |
| `ui`    | `Partial<{ base: any }>`        | `{}`   | 按键覆盖内部节点类名，见下方「自定义样式（ui）」。 |
| `class` | `any`                           | -      | 追加到 `<main>` 根节点的自定义类名。               |

### Slots

| 插槽名    | 描述               |
| :-------- | :----------------- |
| `default` | 容器内部插槽内容。 |

### 自定义样式（ui）

| 键名   | 说明                                          |
| :----- | :-------------------------------------------- |
| `base` | 主体 `<main>` 容器，默认仅 `min-h-screen`。 |

## 注意事项

- 仅 Web 端可用。
- 接口极简：仅 `ui.base` 与 `class` 两个配置项，内容全部走默认插槽，无事件与 expose。
- 默认最小高度是整屏（`min-h-screen`），不会自动扣除 Header 高度；页面存在固定 Header 时可用 `ui.base` 覆盖为 `min-h-[calc(100vh-var(--ui-header-height))]`。
- 组件固定渲染 `<main>` 标签，一个页面只应出现一次；需要多个语义化区块时用 `reborn-container` 的 `as="section"`。
