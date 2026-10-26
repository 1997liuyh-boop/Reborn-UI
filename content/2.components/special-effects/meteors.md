---
title: 流星雨
description: 用于在卡片等容器内渲染划过的流星雨背景动画的装饰组件。
category: 特效
platform: web
tags: [css, tailwind, aceternity-ui]
---

::ComponentViewer{demoFile="MeteorsDemo.vue" config="MeteorsConfig" componentId="meteors" :componentFiles='["Meteors.vue"]'}

#api

## API

| 属性名 | 类型     | 默认值 | 描述                                        |
| ------ | -------- | ------ | ------------------------------------------- |
| `count`| `number` | `20`   | 动画中显示的流星数量。                      |
| `class`| `string` | `""`   | 应用于流星的额外 CSS 类，便于自定义。       |

组件根节点是一层铺满定位父容器的 `absolute inset-0` 盒子，并带 `pointer-events-none`，不会挡住下方内容的点击。`class` 是声明的属性，会加到每一颗流星上；`style`、`data-*` 等未声明的属性落在这一层上，例如 `style="opacity: 0.5"` 会让整层流星半透明。父容器仍需 `relative` 与 `overflow-hidden`，否则流星以更外层的定位祖先为基准并溢出。

#instructions

在 `main.css` 的 inline theme 中添加以下内容：

```css
@theme inline {
  --animate-meteor-effect: meteor 5s linear infinite;
  @keyframes meteor {
    0% {
      transform: rotate(215deg) translateX(0);
      opacity: 1;
    }
    70% {
      opacity: 1;
    }
    100% {
      transform: rotate(215deg) translateX(-500px);
      opacity: 0;
    }
  }
}
```

#credits

- 移植自 [Aceternity UI 的 Meteor Effect](https://ui.aceternity.com/components/meteors)

::
