---
title: 彩虹按钮
description: 用于呈现彩虹渐变流动发光效果的按钮组件，内容经默认插槽传入。
category: 按钮
tags: [css, tailwind, button, magic-ui]
---

::ComponentViewer{demoFile="RainbowButtonDemo.vue" config="RainbowButtonConfig" componentId="rainbow-button" :componentFiles='["RainbowButton.vue"]'}

#credits

- 感谢 [Grzegorz Krol](https://github.com/Grzechu335) 移植该组件。
- 致敬 [Magic UI](https://magicui.design/docs/components/rainbow-button)。

::

## 简介

Rainbow Button 用多层背景叠加实现「深色按钮 + 底部彩虹光晕」的效果：五种彩虹色以线性渐变在按钮描边与底部投影上循环流动，`speed` 控制流动周期。按钮本体在亮色模式为深色底、暗色模式自动切换为浅色底；内容经默认插槽传入，`is` prop 可将根节点渲染为 `a` 等任意标签。仅 Web 端可用。

适用场景：

- 落地页主 CTA 需要高辨识度的彩虹发光按钮时。
- 需要通过 `is` prop 渲染为 `a` 等其他标签的发光跳转入口。

不适用场景：

- 常规业务按钮或跨端场景，改用 `reborn-button`。
- 单色流光边框效果，改用 `shimmer-button`。
- 悬停过渡动效按钮，改用 `interactive-hover-button`。

## 用法

### 基础用法

内容经默认插槽传入；`speed` 为彩虹流动动画的周期，单位秒，值越小流动越快：

```vue
<template>
  <RainbowButton>Get Unlimited Access</RainbowButton>
  <RainbowButton :speed="5">慢速流动</RainbowButton>
</template>
```

### 渲染为链接

`is` prop 指定根节点标签（默认 `button`），设为 `a` 即可作为跳转入口使用，原生属性直接透传：

```vue
<template>
  <RainbowButton
    is="a"
    href="/pricing"
    class="no-underline"
  >
    查看定价
  </RainbowButton>
</template>
```

## API

### Props

| 属性名  | 类型     | 默认值     | 描述                                       |
| ------- | -------- | ---------- | ------------------------------------------ |
| `class` | `string` | `""`       | 应用于按钮的额外 CSS 类。                  |
| `is`    | `string` | `"button"` | 渲染根节点使用的 HTML 标签，如 `a`。       |
| `speed` | `number` | `2`        | 彩虹流动动画周期（秒），值越小流动越快。   |

### Slots

| 插槽名    | 描述           |
| --------- | -------------- |
| `default` | 按钮显示内容。 |

## 注意事项

- 仅 Web 端可用。
- `speed` 为动画周期，单位秒（默认 `2`）。
- 组件未声明 `click` 等事件，点击依赖原生事件透传（直接 `@click` 即可）。
- 亮色模式为深色底、暗色模式为浅色底，配色由组件内置渐变写死；如需整体改色，只能通过 `class` 覆盖 `--color-1` 至 `--color-5` 这组 CSS 变量。
- `is` 渲染为 `a` 时注意自行处理 `href` 等原生属性与文本装饰样式。
