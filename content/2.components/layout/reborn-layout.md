---
title: 布局容器 Layout
description: 由顶栏、侧边栏、主区域、底栏拼装后台页面骨架的容器组件，方向可自动推断。
category: 布局
tags: [css, tailwind, layout, container, flex]
badge: New
---

::ComponentViewer{demoFile="RebornLayoutDemo.vue" config="RebornLayoutConfig" componentId="reborn-layout" :componentFiles='["RebornLayout.vue", "RebornLayoutHeader.vue", "RebornLayoutAside.vue", "RebornLayoutMain.vue", "RebornLayoutFooter.vue", "reborn-layout.config.ts"]'}

#api

## API

### 结构约束

- `RebornLayout` 的直接子元素必须是 `RebornLayoutHeader`、`RebornLayoutAside`、`RebornLayoutMain`、`RebornLayoutFooter` 或嵌套的 `RebornLayout` 之一。
- 后四者的父元素必须是 `RebornLayout`，脱离容器单独使用时 flex 尺寸不生效。
- 未传 `direction` 时，容器会扫描默认插槽：命中 Header 或 Footer 即纵向排列，否则横向。

### RebornLayout

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `direction` | `'horizontal' \| 'vertical'` | `-` | 排列方向。不传时由子元素自动推断。 |
| `as` | `string \| Component` | `section` | 渲染的 HTML 元素或组件。 |
| `class` | `any` | `-` | 根节点自定义类名。 |
| `ui` | `{ root?: ClassValue }` | `-` | 细粒度样式覆盖。 |

### RebornLayoutHeader

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `height` | `string` | `60px` | 顶栏高度，接受任意合法 CSS 长度。 |
| `as` | `string \| Component` | `header` | 渲染的 HTML 元素或组件。 |
| `class` | `any` | `-` | 自定义类名。 |
| `ui` | `{ header?: ClassValue }` | `-` | 细粒度样式覆盖。 |

### RebornLayoutAside

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `width` | `string` | `300px` | 侧边栏宽度，接受任意合法 CSS 长度。 |
| `as` | `string \| Component` | `aside` | 渲染的 HTML 元素或组件。 |
| `class` | `any` | `-` | 自定义类名。 |
| `ui` | `{ aside?: ClassValue }` | `-` | 细粒度样式覆盖。 |

### RebornLayoutMain

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `as` | `string \| Component` | `main` | 渲染的 HTML 元素或组件。 |
| `class` | `any` | `-` | 自定义类名。 |
| `ui` | `{ main?: ClassValue }` | `-` | 细粒度样式覆盖。 |

### RebornLayoutFooter

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `height` | `string` | `60px` | 底栏高度，接受任意合法 CSS 长度。 |
| `as` | `string \| Component` | `footer` | 渲染的 HTML 元素或组件。 |
| `class` | `any` | `-` | 自定义类名。 |
| `ui` | `{ footer?: ClassValue }` | `-` | 细粒度样式覆盖。 |

### 插槽

| 插槽名 | 描述 |
| --- | --- |
| `default` | 五个组件均只有默认插槽，承载各自区块的内容。 |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件家族仅 Web 端提供，**五个组件各有自己的 `ui`，且各自只有一个键**——键名与组件同名，传给谁就只影响谁的根节点。

| 键名     | 传给            | 说明                                                                                                                    |
| -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `root`   | `RebornLayout`  | 布局容器。默认 `box-border flex min-h-0 min-w-0 flex-auto basis-auto`，主轴方向由 `direction` 与子节点自动推导；整体高度、边框改这里。 |
| `header` | `RebornLayoutHeader` | 顶栏。默认 `box-border shrink-0 px-5 h-[var(--reborn-layout-header-height)]`，高度走 CSS 变量，底色与分割线加在这里。   |
| `aside`  | `RebornLayoutAside`  | 侧栏。默认 `box-border shrink-0 overflow-auto w-[var(--reborn-layout-aside-width)]`，宽度走 CSS 变量。                  |
| `main`   | `RebornLayoutMain`   | 主区。默认 `box-border block min-w-0 flex-1 basis-auto overflow-auto p-5`，内容内边距与滚动行为改这里。                 |
| `footer` | `RebornLayoutFooter` | 底栏。默认 `box-border shrink-0 px-5 h-[var(--reborn-layout-footer-height)]`，高度走 CSS 变量。                         |

```vue
<template>
  <RebornLayout :ui="{ root: 'h-screen' }">
    <RebornLayoutHeader :ui="{ header: 'border-b border-gray-2' }">顶栏</RebornLayoutHeader>
    <RebornLayout>
      <RebornLayoutAside :ui="{ aside: 'bg-gray-1' }">侧栏</RebornLayoutAside>
      <RebornLayoutMain :ui="{ main: 'p-6' }">内容</RebornLayoutMain>
    </RebornLayout>
  </RebornLayout>
</template>
```

### 与相似组件的区别

| 组件 | 用途 |
| --- | --- |
| `RebornLayout` 家族 | 后台页面骨架拼装，纯 flex 布局，无视觉样式。 |
| `RebornContainer` | 限宽居中的内容容器（`max-w` + `mx-auto`），用于文档/落地页正文。 |
| `RebornHeader` | 带交互的站点导航头，内置移动端抽屉与吸顶模式。 |
| `RebornMain` | 语义化 `<main>` 包装，不参与 flex 拼版。 |

::
