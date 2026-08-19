---
title: 旋转文字
description: 用于让一段文字沿圆形路径持续环绕旋转的动画组件。
category: 文字动画
tags: [css, tailwind, magic-ui]
---

::ComponentViewer{demoFile="SpinningTextDemo.vue" config="SpinningTextConfig" componentId="spinning-text" :componentFiles='["SpinningText.vue"]'}

#api

## API

| 属性名      | 类型                                                    | 默认值 | 描述                                   |
| ----------- | ------------------------------------------------------- | ------ | -------------------------------------- |
| `duration`  | `number`                                                | `10`   | 完成一圈旋转动画的持续时间。           |
| `reverse`   | `boolean`                                               | `false`| 是否反向旋转。                         |
| `radius`    | `number`                                                | `5`    | 文字旋转路径的半径。                   |
| `transition`| `motion-v Transition`                                   | ``     | 动画的自定义过渡效果。                 |
| `variants`  | `{container: motion-v Variant, item: motion-v Variant}` | ``     | 容器与子项动画的变体。                 |
| `class`     | `string`                                                | `""`   | 文字容器的自定义类名。                 |

#credits

- 感谢 [Whbbit1999](https://github.com/Whbbit1999) 提供该组件。
- 移植自 [Magic UI Spinning Text](https://magicui.design/docs/components/spinning-text)。

::
