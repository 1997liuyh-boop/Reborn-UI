---
title: 滚动岛
description: 用于以灵动岛样式悬浮显示页面滚动进度并可展开附加内容的组件。
category: 导航
platform: web
tags: [css, tailwind, number-flow]
---

::ComponentViewer{demoFile="ScrollIslandDemo.vue" config="ScrollIslandConfig" componentId="scroll-island" :componentFiles='["ScrollIsland.vue"]' dependencies="@number-flow/vue"}
::

## 简介

ScrollIsland 是仅 Web 的悬浮阅读进度组件，可展开默认插槽中的附加内容。

进度来源于页面滚动位置与可滚动高度，`title` 设置提示文字，`height` 决定收起时的高度。

`class` 调整外层布局，默认插槽提供展开内容；进度环颜色读取 Nuxt 当前主题，不改写站点主题类。

### 何时使用

- 长文章需要常驻阅读进度——用 `title` 标识当前进度区域。
- 需要调整浮层收起高度——用 `height` 设置像素高度。
- 页面固定层需要调整位置——用 `class` 覆盖容器布局。

### 何时不使用

- 需要根据章节跳转而非展示百分比——改用 `reborn-anchor`。
- 只需一个回到顶部入口——改用 `reborn-back-top`。

## 用法

### 基础用法

`title` 标识进度区域，默认插槽提供展开后的补充说明。

| 配置 | 典型用途 |
| --- | --- |
| `title` | 阅读进度标题 |
| `height` | 收起高度（px） |

```vue
<template>
  <ScrollIsland title="阅读进度" :height="44">
    <div class="p-2">
      点击进度条可收起此说明。
    </div>
  </ScrollIsland>
</template>
```

## API

### Props
| 属性名   | 类型     | 默认值      | 描述                                |
| -------- | -------- | ----------- | ----------------------------------- |
| `class` | `string` | `""`        | 自定义样式的额外 CSS 类。           |
| `title` | `string` | `"Progress"`| 组件头部显示的标题。                |
| `height` | `number` | `44`        | 组件高度。                          |

进度环的深浅配色读取 Nuxt 的 `useColorMode`（来自 `@nuxtjs/color-mode`，`@nuxt/ui` 已内置），只读取站点当前主题、不改写 `html` 上的主题类，所以需要在装有该模块的 Nuxt 项目中使用。

### Slots

| 插槽名 | 作用域参数 | 描述 |
| --- | --- | --- |
| `default` | - | 点击展开后展示的附加内容。 |

### 来源

- 灵感来自 [Ali Samadi](https://x.com/alisamadi__/status/1854312982559502556) 与 [Nitish Khagwal](https://x.com/nitishkmrk)
- [NumberFlow by Maxwell Barvian](https://number-flow.barvian.me/vue) 用于数字格式化与动画。

## 注意事项

- **进度来源是页面滚动**。它监听窗口滚动，嵌套滚动容器中的进度不能直接代替页面进度。
- **依赖 Nuxt 主题上下文**。组件读取 `useColorMode`，需在安装了 `@nuxtjs/color-mode` 的 Nuxt 项目中使用。
- **不可滚动页面显示零进度**。内容高度不超过窗口时分母没有有效滚动范围，组件按 0 处理，避免无效数字。
