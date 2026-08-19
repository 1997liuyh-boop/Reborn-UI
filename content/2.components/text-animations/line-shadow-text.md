---
title: 线条阴影文字
description: 用于给插槽文字添加斜线条纹阴影装饰的静态文字效果组件。
category: 文字动画
tags: [css, tailwind, magic-ui]
---

::ComponentViewer{demoFile="LineShadowTextDemo.vue" config="LineShadowTextConfig" componentId="line-shadow-text" :componentFiles='["LineShadowText.vue"]'}

#api

## API

| 属性名       | 类型     | 默认值   | 描述                          |
| ------------ | -------- | -------- | ----------------------------- |
| `shadowColor`| `string` | `"black"`| 阴影效果的颜色。              |
| `class`      | `string` | `""`     | 用于自定义样式的额外 CSS 类。 |
| `as`         | `string` | `"span"` | 渲染文字所用的 HTML 元素。    |

#credits

- 感谢 [SivaReddy Uppathi](https://github.com/sivareddyuppathi) 提供该组件。
- 移植自 [Magic UI 的 Line Shadow Text](https://magicui.design/docs/components/line-shadow-text)

::
