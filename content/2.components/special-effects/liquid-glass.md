---
title: 液态玻璃
description: 用于以 SVG 位移贴图与通道偏移模拟液态玻璃折射的容器组件。
category: 特效
tags: [svg, filter, glassmorphism]
navigation:
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="LiquidGlassDemo.vue" config="LiquidGlassConfig" componentId="liquid-glass" :componentFiles='["LiquidGlass.vue", "index.ts", "liquid-glass.config.ts"]'}

#api

## API

| 属性名           | 类型                                         | 默认值         | 描述 |
| ---------------- | -------------------------------------------- | -------------- | ---- |
| `radius`         | `number`                                     | `16`           | 玻璃容器圆角大小。 |
| `border`         | `number`                                     | `0.07`         | 折射边缘宽度比例。 |
| `lightness`      | `number`                                     | `50`           | 位移贴图亮度。 |
| `displace`       | `number`                                     | `14`           | 最终高斯模糊的位移强度。 |
| `blend`          | `string`                                     | `"difference"` | 渐变混合模式。 |
| `xChannel`       | `"R" \| "G" \| "B"`                          | `"R"`          | X 方向位移采样通道。 |
| `yChannel`       | `"R" \| "G" \| "B"`                          | `"B"`          | Y 方向位移采样通道。 |
| `alpha`          | `number`                                     | `0.93`         | 玻璃主体透明度。 |
| `blur`           | `number`                                     | `11`           | 位移贴图模糊半径。 |
| `rOffset`        | `number`                                     | `0`            | 红色通道偏移量。 |
| `gOffset`        | `number`                                     | `10`           | 绿色通道偏移量。 |
| `bOffset`        | `number`                                     | `20`           | 蓝色通道偏移量。 |
| `scale`          | `number`                                     | `-180`         | 位移缩放强度。 |
| `frost`          | `number`                                     | `0.05`         | 玻璃磨砂层透明度。 |
| `position`       | `"fixed" \| "absolute" \| "relative" \| "sticky"` | `"fixed"`      | 外层容器定位方式。 |
| `class`          | `string`                                     | `-`            | 内层插槽容器类名。 |
| `containerClass` | `string`                                     | `-`            | 外层效果容器类名。 |

| 插槽名    | 描述 |
| --------- | ---- |
| `default` | 需要包裹在液态玻璃效果内部显示的内容。 |

#credits

- 适合用于 Hero 卡片、悬浮信息面板和强调型容器。

::
