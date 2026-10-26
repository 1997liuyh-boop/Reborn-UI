---
title: 对比
description: 用于以滑动分割线对比两张图片或两块自定义内容的对比组件。
category: 数据展示
platform: web
tags: [css, tailwind, aceternity-ui]
---

::ComponentViewer{demoFile="CompareDemo.vue" config="CompareConfig" componentId="compare" :componentFiles='["Compare.vue", "StarField.vue"]'}
::

## 简介

Compare 是仅 Web 的双内容对比组件，用可移动分界线同时展示两侧区域。

`firstImage` / `secondImage` 提供默认图片，`slideMode` 选择悬停或拖动，`percentage` 可控制分界比例。

`autoplay` / `autoplayDuration` 控制自动演示，`showHandlebar` 控制手柄；两个内容插槽和 `handle` 插槽可替换默认视觉，交互过程通过事件通知。

### 何时使用

- 展示处理前后的图片差异——用 `firstImage` / `secondImage` 提供两侧图片。
- 需要拖动而非悬停改变分界——用 `slideMode="drag"`。
- 需要与外部数值联动分界位置——用 `percentage` 绑定 0–100 的比例。

### 何时不使用

- 需要浏览多张图片而非两侧对比——改用 `images-slider`。
- 需要检查单张图片局部细节——改用 `lens`。

## 用法

### 基础用法

`slideMode="drag"` 让用户拖动分界线查看两侧图片。

| 配置 | 典型用途 |
| --- | --- |
| `firstImage` | 处理前后素材 |
| `slideMode` | 选择拖动或悬停 |

```vue
<template>
  <Compare
    first-image="/before.jpg" second-image="/after.jpg"
    first-image-alt="处理前" second-image-alt="处理后"
    slide-mode="drag" class="h-64 w-full"
  />
</template>
```

## API
### Props

| 属性名                  | 类型                | 默认值          | 描述                               |
| ----------------------- | ------------------- | --------------- | ---------------------------------- |
| `firstImage` | `string`            | `""`            | 第一张图片的 URL。                 |
| `secondImage` | `string`            | `""`            | 第二张图片的 URL。                 |
| `firstImageAlt` | `string`            | `"First image"` | 第一张图片的替代文本。             |
| `secondImageAlt` | `string`            | `"Second image"`| 第二张图片的替代文本。             |
| `class` | `string`            | `""`            | 组件的额外类名。                   |
| `firstContentClass` | `string`            | `""`            | 应用于第一侧内容包装器的类。       |
| `secondContentClass` | `string`            | `""`            | 应用于第二侧内容包装器的类。       |
| `percentage` | `number \| null` | - | 滑块位置（0-100），支持 `v-model:percentage`；显式 `undefined` / `null` 复位到 `initialSliderPercentage`，不主动回写父模型；未绑定时由组件内部维护。 |
| `initialSliderPercentage` | `number`           | `50`            | 未绑定 `percentage` 时的初始位置（0-100）；`hover` 模式下指针离开后也回到该位置，修改它会立即复位。 |
| `slideMode` | `"hover" \| "drag"` | `"hover"`       | 滑块的交互模式。                   |
| `showHandlebar` | `boolean`           | `true`          | 是否显示手柄。                     |
| `autoplay` | `boolean`           | `false`         | 是否启用自动播放。                 |
| `autoplayDuration` | `number`            | `5000`          | 自动播放周期（毫秒）。             |

### Emits

| 事件名             | 负载    | 描述                                   |
| ------------------ | ------- | -------------------------------------- |
| `update:percentage`| `number`| 滑块位置变化时触发（0-100），配合 `v-model:percentage` 使用；组件卸载后不再触发。 |
| `drag:start`       | -       | 开始拖动时触发。                       |
| `drag:end`         | -       | 结束拖动时触发。                       |
| `hover:enter`      | -       | 鼠标进入组件时触发。                   |
| `hover:leave`      | -       | 鼠标离开组件时触发。                   |

### Slots

| 插槽名           | 默认内容                                           | 描述                                                         |
| ---------------- | -------------------------------------------------- | ------------------------------------------------------------ |
| `first-content`  | 若提供 `firstImage` 则为 `<img>` 元素             | 左/第一侧展示的内容，拥有容器的全部宽高。                    |
| `second-content` | 若提供 `secondImage` 则为 `<img>` 元素            | 右/第二侧展示的内容，拥有容器的全部宽高。                    |
| `handle`         | 默认带圆点图标的滑块手柄                          | 自定义滑块手柄，需自行使用绝对定位放在分割线处。             |

### 来源

- 感谢 [M Atif](https://github.com/atif0075) 提供该组件。
- 灵感来自 [Aceternity UI's Compare](https://ui.aceternity.com/components/compare)。

## 注意事项

- **空模型会复位而非写回默认值**。显式 `null` / `undefined` 回到 `initialSliderPercentage`，组件不会仅因这次复位主动修改父模型。
- **悬停模式离开后会回位**。`slideMode="hover"` 使用初始比例恢复分界，需要保留用户选择时改用拖动模式。
- **对比内容应有一致尺寸**。组件裁剪两侧区域而不做图片配准，输入比例不一致时需先调整素材。
