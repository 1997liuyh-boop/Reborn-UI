---
title: 闪光按钮
description: 用于呈现环绕闪光流动动画的按钮组件，闪光颜色、速度与背景可配置。
category: 按钮
tags: [css, tailwind, button, magic-ui]
---

::ComponentViewer{demoFile="ShimmerButtonDemo.vue" config="ShimmerButtonConfig" componentId="shimmer-button" :componentFiles='["ShimmerButton.vue"]'}

#credits

- 移植自 [Magic UI Shimmer Button](https://magicui.design/docs/components/shimmer-button)。

::

## 简介

Shimmer Button 通过旋转的圆锥渐变光斑沿按钮边缘持续游走，形成一圈流动的「流光描边」，并叠加内阴影高光在悬停/按下时增强立体感。闪光颜色（`shimmerColor`）、描边宽度（`shimmerSize`）、动画周期（`shimmerDuration`）与按钮背景（`background`）、圆角（`borderRadius`）均可配置，按钮内容经默认插槽传入。仅 Web 端可用。

适用场景：

- 落地页主 CTA 需要持续闪光动画吸引注意时。
- 深色主题下需要高对比发光效果的按钮。
- 需要自定义闪光颜色（`shimmerColor`）与动画周期（`shimmerDuration`）的营销按钮。

不适用场景：

- 常规业务表单按钮，改用 `reborn-button`（同时支持 Web 与 UniApp）。
- 需要点击波纹反馈，改用 `ripple-button`。
- 需要彩虹渐变效果，改用 `rainbow-button`。

## 用法

### 基础用法

内容经默认插槽传入；默认为纯黑背景加白色流光，适合深色场景直接使用：

```vue
<template>
  <ShimmerButton class="shadow-2xl" shimmer-size="2px">
    <span class="text-sm font-medium text-white lg:text-lg">
      Cool Button
    </span>
  </ShimmerButton>
</template>
```

### 自定义闪光与背景

`shimmerColor` 控制光斑颜色，`shimmerDuration` 控制一轮流光的周期（CSS 时间字符串），`shimmerSize` 控制流光描边宽度（CSS 长度字符串）；`background` 与 `borderRadius` 定义按钮底色与圆角。浅色主题下需自行传浅色背景并同步调整文字与闪光颜色：

```vue
<template>
  <ShimmerButton
    background="rgba(99, 102, 241, 1)"
    shimmer-color="#a5b4fc"
    shimmer-duration="2s"
    shimmer-size="0.1em"
    border-radius="12px"
  >
    <span class="text-white">立即订阅</span>
  </ShimmerButton>
</template>
```

## API

### Props

| 属性名            | 类型     | 默认值               | 描述                                                      |
| ----------------- | -------- | -------------------- | --------------------------------------------------------- |
| `shimmerColor`    | `string` | `"#ffffff"`          | 闪光光斑的颜色。                                          |
| `shimmerSize`     | `string` | `"0.05em"`           | 流光描边的宽度，CSS 长度字符串。                          |
| `borderRadius`    | `string` | `"100px"`            | 按钮的圆角半径，CSS 长度字符串。                          |
| `shimmerDuration` | `string` | `"3s"`               | 一轮流光动画的周期，CSS 时间字符串。                      |
| `background`      | `string` | `"rgba(0, 0, 0, 1)"` | 按钮的背景色，可使用 rgb 或十六进制。                     |
| `class`           | `string` | `""`                 | 应用于按钮的额外 CSS 类。                                 |

### Slots

| 插槽名    | 描述                                   |
| --------- | -------------------------------------- |
| `default` | 按钮显示内容，渲染在流光层之上。       |

## 注意事项

- 仅 Web 端可用。
- `shimmerDuration`（默认 `"3s"`）、`shimmerSize`（默认 `"0.05em"`）、`borderRadius`（默认 `"100px"`）均为 CSS 字符串，不是数字。
- 背景默认为纯黑 `rgba(0, 0, 0, 1)`，浅色主题需自行传 `background` 并同步调整文字颜色（组件文字色为 `text-white dark:text-black`）。
- 按钮内容通过默认插槽传入；组件未声明 `click` 等事件，点击依赖原生事件透传（直接 `@click` 即可）。
- 流光依赖 CSS 容器查询单位（`cqh` / `cqw`）与 `conic-gradient`，在过旧浏览器上会没有流光效果。
