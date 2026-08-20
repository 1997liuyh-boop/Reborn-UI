---
title: 水波纹
description: 用于渲染多圈同心圆扩散水波背景的装饰效果组件。
category: 特效
tags: [css, tailwind, magic-ui]
---

::ComponentViewer{demoFile="RippleDemo.vue" config="RippleConfig" componentId="ripple" :componentFiles='["Ripple.vue", "RippleCircle.vue", "RippleContainer.vue", "index.ts"]'}

#api

在父容器内铺满并渲染多圈同心圆呼吸波纹，适合落地页 Hero 区背景装饰，或围绕中心元素（图标、按钮）制造扩散氛围。

## API

### Props

| 属性名                        | 类型     | 默认值 | 描述                                                |
| ----------------------------- | -------- | ------ | --------------------------------------------------- |
| `baseCircleSize`              | `number` | `210`  | 最内圈圆的直径（px）。                              |
| `baseCircleOpacity`           | `number` | `0.24` | 最内圈圆的初始透明度。                              |
| `spaceBetweenCircle`          | `number` | `70`   | 相邻两圈之间的直径增量（px）。                      |
| `circleOpacityDowngradeRatio` | `number` | `0.03` | 每向外一圈透明度递减的比例。                        |
| `circleClass`                 | `string` | `-`    | 应用于每个波纹圆圈的额外 CSS 类（边框、填充色等）。 |
| `waveSpeed`                   | `number` | `80`   | 相邻圆圈的动画延迟步长（毫秒），决定扩散节奏。      |
| `numberOfCircles`             | `number` | `7`    | 波纹圆圈的数量。                                    |
| `class`                       | `string` | `-`    | 应用于波纹容器的额外 CSS 类。                       |

### RippleCircle Props

以下为内部子组件 `RippleCircle` 的属性，由 `Ripple` 按上表参数逐圈计算传入，一般无需直接使用。

| 属性名           | 类型     | 默认值 | 描述                             |
| ---------------- | -------- | ------ | -------------------------------- |
| `size`           | `number` | `210`  | 圆圈直径（px）。                 |
| `opacity`        | `number` | `0.24` | 圆圈透明度。                     |
| `animationDelay` | `number` | `-`    | 呼吸动画的延迟（毫秒）。         |
| `borderStyle`    | `string` | `-`    | 边框样式（`solid` / `dashed`）。 |

### Slots

| 插槽名    | 描述                                                        |
| --------- | ----------------------------------------------------------- |
| `default` | 由辅助组件 `RippleContainer` 提供，放置波纹上层居中的内容。 |

### 注意事项

- 仅 Web 端可用；呼吸动画的 keyframes 内置在组件 scoped 样式中，无需修改 `main.css`。
- 组件以绝对定位铺满父容器，父容器需设置 `relative` 与 `overflow-hidden`。
- 圈数由 `numberOfCircles` 控制（默认 7），每向外一圈透明度按 `circleOpacityDowngradeRatio` 递减，最外圈自动使用虚线边框。
- 按钮点击波纹反馈请改用 ripple-button；点击烟花特效请改用 reborn-fireworks。

#credits

- 灵感来自 [Magic UI 的 Ripple](https://magicui.design/docs/components/ripple)。

::
