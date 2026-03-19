---
title: 二维码 Qrcode
description: 二维码组件，支持颜色、样式、Logo 与纠错级别配置。
category: 杂项
tags: [qrcode, canvas, svg, uniapp, web]
badge: New
navigation:
  badges:
    - label: 通
      color: primary
---

::ComponentViewer{demoFile="RebornQrcodeDemo.vue" config="RebornQrcodeConfig" componentId="reborn-qrcode" :componentFiles='["RebornQrcode.vue", "qrcode.ts"]' :uniappFiles='["RebornQrcode.vue", "draw.ts", "qrcode.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `size` | `number` | `200` | 二维码尺寸（px）。 |
| `foreground` | `string` | `#131313` | 前景色（码点颜色）。 |
| `background` | `string` | `#FFFFFF` | 背景色。 |
| `pdColor` | `string \| null` | `null` | 码眼颜色（不传默认跟随 `foreground`）。 |
| `pdRadius` | `number` | `10` | 码眼圆角半径（兼容参数）。 |
| `text` | `string` | `https://cool-js.com/` | 二维码内容。 |
| `logo` | `string` | `''` | 中央 Logo 图片地址。 |
| `logoSize` | `number` | `40` | Logo 尺寸（px）。 |
| `padding` | `number` | `5` | 二维码内边距（px）。 |
| `mode` | `'rect' \| 'circular' \| 'line' \| 'rectSmall'` | `circular` | 码点样式。 |
| `ecc` | `'L' \| 'M' \| 'Q' \| 'H'` | `H` | 纠错级别。 |
| `pdOuterRadius` | `number \| undefined` | `undefined` | 码眼外框圆角。 |
| `pdInnerRadius` | `number \| undefined` | `undefined` | 码眼内点圆角。 |
| `dotsGradient` | `any` | - | 预留参数，保持与 UniApp 一致。 |
| `dotsImage` | `string \| null` | - | 预留参数，保持与 UniApp 一致。 |
| `backgroundGradient` | `any` | - | 预留参数，保持与 UniApp 一致。 |
| `backgroundTransparent` | `boolean` | - | 是否背景透明。 |
| `logoOptions` | `any` | - | Logo 细节配置（预留参数）。 |
| `cornersSquareGradient` | `any` | - | 预留参数。 |
| `cornersDotGradient` | `any` | - | 预留参数。 |
| `cornersSquareOptions` | `any` | - | 预留参数。 |
| `cornersDotOptions` | `any` | - | 预留参数。 |

::
