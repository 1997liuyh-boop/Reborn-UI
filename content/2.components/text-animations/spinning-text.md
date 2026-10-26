---
title: 旋转文字
description: 用于让一段文字沿圆形路径持续环绕旋转的动画组件。
category: 文字动画
platform: web
tags: [css, tailwind, magic-ui]
---

::ComponentViewer{demoFile="SpinningTextDemo.vue" config="SpinningTextConfig" componentId="spinning-text" :componentFiles='["SpinningText.vue"]'}
::

## 简介

SpinningText 是仅 Web 的环形文字动画，将字符沿圆周定位后持续旋转。

`text` 决定字符，`radius` 决定路径大小，`duration` / `reverse` 决定一圈时间与方向。

`transition` 定制过渡，`variants` 分别覆盖容器和字母动画；字母圆周定位与动画分层，`class` 控制外层文字样式。

### 何时使用

- 短句需形成圆形标识——用 `text` 提供文字、`radius` 设置圆周半径。
- 需要不同旋转节奏——用 `duration` 设置一圈的秒数。
- 需要反向运动——开启 `reverse`。

### 何时不使用

- 内容是需要顺序阅读的长段落——改用 `text-reveal`。
- 内容需要逐字替换——改用 `reborn-typewriter`。

## 用法

### 基础用法

`text` 沿圆周排列，`radius` 按字符宽度计算路径，`duration` 以秒计。

| 配置 | 典型用途 |
| --- | --- |
| `text` | 沿圆周排列的文本 |
| `radius` | 圆周半径（ch） |
| `duration` | 一圈旋转时间 |

```vue
<template>
  <div class="flex size-64 items-center justify-center">
    <SpinningText
      text="持续探索 · " :radius="5"
      :duration="12"
    />
  </div>
</template>
```

## API

### Props

`text` 为必填文本，按字符沿圆周排列。
| 属性名      | 类型                                                    | 默认值 | 描述                                   |
| ----------- | ------------------------------------------------------- | ------ | -------------------------------------- |
| `text` | `string` | 必填 | 沿圆周排列的文本。 |
| `duration` | `number`                                                | `10`   | 完成一圈旋转动画的持续时间。           |
| `reverse` | `boolean`                                               | `false`| 是否反向旋转。                         |
| `radius` | `number`                                                | `5`    | 文字旋转路径的半径。                   |
| `transition` | `motion-v Transition`                                   | ``     | 动画的自定义过渡效果。                 |
| `variants` | `{container: motion-v Variants, item: motion-v Variants}` | ``     | 容器与每个字母的变体表（以 `hidden` / `visible` 为键），分别合并进内置变体；字母的沿圆定位在外层完成，item 变体里的缩放等变换不会打乱排布。 |
| `class` | `string`                                                | `""`   | 文字容器的自定义类名。                 |

### 来源

- 感谢 [Whbbit1999](https://github.com/Whbbit1999) 提供该组件。
- 移植自 [Magic UI Spinning Text](https://magicui.design/docs/components/spinning-text)。

## 注意事项

- **半径按字符单位计算**。`radius` 对应 `ch` 倍数而非像素，修改字号或字体也会改变实际路径大小。
- **自定义过渡可覆盖一圈时长**。`transition.duration` 优先于 `duration`，同时配置时需核对实际节奏。
- **旋转不适合长段落阅读**。字符逐一沿圆周排列，过长文本会拥挤，宜限制为短标签或口号。
