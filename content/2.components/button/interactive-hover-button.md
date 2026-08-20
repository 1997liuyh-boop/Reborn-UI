---
title: 交互悬停按钮
description: 用于悬停时产生动态过渡效果的文字按钮组件，文字经 text prop 传入。
category: 按钮
tags: [css, tailwind, button, magic-ui]
---

::ComponentViewer{demoFile="InteractiveHoverButtonDemo.vue" config="InteractiveHoverButtonConfig" componentId="interactive-hover-button" :componentFiles='["InteractiveHoverButton.vue"]'}

#credits

- 感谢 [Whbbit1999](https://github.com/Whbbit1999) 提供该组件。
- 灵感并移植自 [Magic UI Interactive Hover Button](https://magicui.design/docs/components/interactive-hover-button)。

::

## 简介

Interactive Hover Button 是一个悬停动效按钮：常态下显示「圆点 + 文字」，悬停时左侧圆点放大约 100 倍铺满整个按钮成为背景色，原文字右移淡出，同时一组「文字 + 右箭头」从右侧滑入，整个过程由 300ms 的 CSS 过渡完成。按钮文字经 `text` prop 传入（不是插槽），配色使用主题的 `primary` / `background` 色因而自动适配明暗模式。仅 Web 端可用。

适用场景：

- 落地页 CTA 按钮需要悬停过渡动效吸引点击时。
- 明暗模式站点中需要一个自适应配色的强调按钮。

不适用场景：

- 常规业务按钮或跨端场景，改用 `reborn-button`。
- 需要点击波纹反馈，改用 `ripple-button`。
- 需要流光边框效果，改用 `shimmer-button`。

## 用法

### 基础用法

文字通过 `text` prop 传入（默认 `"Button"`），点击直接监听原生 `@click`：

```vue
<template>
  <InteractiveHoverButton
    text="开始使用"
    @click="onStart"
  />
</template>

<script setup lang="ts">
function onStart() {
  console.log("clicked");
}
</script>
```

### 自定义样式

`class` 追加到按钮根元素，可覆盖圆角、边框、字号等；动效圆点与悬停背景固定使用主题 `primary` 色：

```vue
<template>
  <InteractiveHoverButton
    text="了解更多"
    class="rounded-lg border-2 text-lg"
  />
</template>
```

## API

### Props

| 属性名  | 类型     | 默认值     | 描述                       |
| ------- | -------- | ---------- | -------------------------- |
| `text`  | `string` | `"Button"` | 按钮内部显示的文字。       |
| `class` | `string` | `""`       | 用于样式的额外类名。       |

## 注意事项

- 仅 Web 端可用。
- 按钮文字通过 `text` prop 传入（默认 `"Button"`），没有默认插槽，无法嵌入图标等自定义内容。
- 组件未声明 `click` 等事件，点击依赖原生事件透传（直接 `@click` 即可）。
- 悬停铺满的背景色与圆点固定取主题 `primary` 色、文字取 `primary-foreground`；文字过长时按钮宽度随之增长，动效滑入距离固定（`translate-x-12`），过长文本观感会打折扣。
- 动效依赖 `:hover`，触屏设备上无悬停态，仅表现为普通按钮。
