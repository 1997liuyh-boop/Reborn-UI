---
title: 图案背景
description: 用于为区块提供图案纹理背景的容器组件，内容经默认插槽传入。
category: 特效
tags: [css, tailwind, background]
---

::ComponentViewer{demoFile="PatternBackgroundDemo.vue" config="PatternBackgroundConfig" componentId="pattern-background" :componentFiles='["PatternBackground.vue", "index.ts"]' dependencies="class-variance-authority"}

#api

为 Hero 区、演示区提供网格 / 点阵 / 大点阵三种图案背景，支持八个方向的滚动动画与椭圆遮罩渐隐，内容经默认插槽叠放在图案之上。

## API

| 属性名      | 类型                                                                                                     | 默认值      | 描述                                                                |
| ----------- | -------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------------------------------------- |
| `class`     | `string`                                                                                                 | `-`         | 应用于容器的额外 CSS 类（如高度、圆角、布局）。                     |
| `animate`   | `boolean`                                                                                                | `false`     | 是否开启背景图案的滚动动画。                                        |
| `direction` | `"top" \| "bottom" \| "left" \| "right" \| "top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `"top"`     | 动画滚动方向，仅在 `animate` 开启时生效。                           |
| `variant`   | `"grid" \| "dot" \| "big-dot"`                                                                           | `"grid"`    | 图案样式：网格、点阵或大点阵。                                      |
| `size`      | `"xs" \| "sm" \| "md" \| "lg" \| "xl"`                                                                   | `"md"`      | 图案单元尺寸（对应 background-size 8px 到 40px）。                  |
| `mask`      | `"ellipse" \| "ellipse-top"`                                                                             | `"ellipse"` | 遮罩样式，把图案向页面背景色渐隐（居中椭圆或顶部椭圆）。            |
| `speed`     | `number`                                                                                                 | `10000`     | 动画一轮时长（毫秒），预设 5000（快）/ 10000（默认）/ 25000（慢）。 |

| 插槽名    | 描述                           |
| --------- | ------------------------------ |
| `default` | 叠放在图案背景之上展示的内容。 |

### 注意事项

- 仅 Web 端可用，依赖 `class-variance-authority`；滚动动画的 keyframes 内置在组件 scoped 样式中，无需修改 `main.css`。
- 图案颜色为内置的 neutral 色阶（明暗模式各一套），如需自定义可通过 `class` 覆盖背景渐变。
- 未传 `mask` 时同样会应用默认的 `ellipse` 遮罩，图案边缘会渐隐至页面背景色。
- 方向、样式、速度等取值常量定义在 `index.ts` 中（`PATTERN_BACKGROUND_*`），可直接导入使用。
- 纯色或渐变背景用 Tailwind 类即可，无需本组件；需要流星划过的动态背景请改用 meteors。

#credits

- 灵感来自 [Inspira UI](https://inspira-ui.com) 的 Pattern Background。

::
