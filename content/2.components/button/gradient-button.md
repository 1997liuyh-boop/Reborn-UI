---
title: 渐变按钮
description: 用于带旋转圆锥渐变发光边框的动效按钮组件。
category: 按钮
tags: [css, tailwind, button]
---

::ComponentViewer{demoFile="GradientButtonDemo.vue" config="GradientButtonConfig" componentId="gradient-button" :componentFiles='["GradientButton.vue"]'}
::

## 简介

Gradient Button 通过 `conic-gradient` 圆锥渐变加旋转动画，在按钮四周形成持续流转的发光边框：外层渐变层以 `duration` 为周期旋转，`blur` 让边缘晕染成光圈，内层内容区以 `bgColor` 背景色盖住中间部分，只露出 `borderWidth` 宽度的渐变描边。按钮文字或任意内容经默认插槽传入。仅 Web 端可用。

适用场景：

- 落地页主 CTA 需要持续旋转的渐变发光边框吸引注意。
- 需要自定义边框颜色数组（`colors`）与模糊光晕（`blur`）的按钮。

不适用场景：

- 常规功能按钮（含 UniApp），改用 `reborn-button`。
- 需要光斑扫过效果，改用 `shimmer-button`；需要彩虹底色流动，改用 `rainbow-button`。

## 用法

### 基础用法

内容经默认插槽传入。`bgColor` 是内容区背景色（默认 `#000`），浅色主题下需自行传入浅色，可依据明暗模式切换：

```vue
<script lang="ts" setup>
import { useColorMode } from "@vueuse/core";
import { computed } from "vue";

const isDark = computed(() => useColorMode().value === "dark");
const bgColor = computed(() => (isDark.value ? "#000" : "#fff"));
</script>

<template>
  <GradientButton :bg-color="bgColor">Zooooooooooom 🚀</GradientButton>
</template>
```

### 自定义渐变与动画

`colors` 定义圆锥渐变的颜色数组（首尾同色才能无缝旋转），`duration` 控制旋转周期（毫秒），`borderWidth` / `borderRadius` / `blur` 分别控制描边宽度、圆角与光晕强度（均为 px）：

```vue
<template>
  <GradientButton
    :colors="['#00c6ff', '#a855f7', '#ec4899', '#00c6ff']"
    :duration="1500"
    :border-width="3"
    :border-radius="9999"
    :blur="6"
  >
    立即开始
  </GradientButton>
</template>
```

## API

### Props

| 属性名         | 类型       | 默认值     | 描述                                                     |
| -------------- | ---------- | ---------- | -------------------------------------------------------- |
| `borderWidth`  | `number`   | `2`        | 渐变边框的像素宽度。                                     |
| `colors`       | `string[]` | 彩虹色数组 | 用于圆锥渐变边框的颜色数组，首尾同色才能无缝旋转。       |
| `duration`     | `number`   | `2500`     | 渐变旋转动画的持续时间（毫秒）。                         |
| `borderRadius` | `number`   | `8`        | 圆角半径（像素）。                                       |
| `blur`         | `number`   | `4`        | 渐变边框的模糊强度（像素），值越大光晕越柔和。           |
| `class`        | `string`   | `""`       | 用于自定义样式的额外 CSS 类。                            |
| `bgColor`      | `string`   | `"#000"`   | 按钮内容区的背景色，浅色主题下需自行改为浅色。           |

### Slots

| 插槽名    | 描述                                       |
| --------- | ------------------------------------------ |
| `default` | 按钮内容，渲染在渐变边框内的内容区中。     |

## 注意事项

- 仅 Web 端可用。
- `bgColor` 是按钮内容区背景色（默认 `#000`），浅色主题下需自行改为浅色，示例中依据明暗模式切换。
- `duration` 单位为毫秒（默认 `2500`）；`colors` 需首尾同色才能无缝旋转（默认数组首尾均为 `#FF0000`）。
- 组件未声明 `click` 等事件，点击依赖原生事件透传（直接 `@click` 即可）；按钮内容通过默认插槽传入。
