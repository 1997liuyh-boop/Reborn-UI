---
title: Safari 模型
description: 用于以 Safari 浏览器外框展示产品截图的 SVG 设备模型组件。
category: 设备模型
tags: [css, tailwind, device-mockup, magic-ui]
badge: New
---

::ComponentViewer{demoFile="SafariMockupDemo.vue" config="SafariMockupConfig" componentId="safari-mockup" :componentFiles='["SafariMockup.vue"]'}

#api

## API

| 属性名 | 类型     | 默认值 | 描述                              |
| ------ | -------- | ------ | --------------------------------- |
| `url`  | `string` | `null` | 模型地址栏中显示的 URL。          |
| `src`  | `string` | `null` | 在模型中显示的图片 URL。          |
| `width`| `number` | `1203` | 模型 SVG 的宽度（像素）。         |
| `height`| `number`| `753`  | 模型 SVG 的高度（像素）。         |

#credits

- 移植自 [Magic UI](https://magicui.design/docs/components/safari)。

::
