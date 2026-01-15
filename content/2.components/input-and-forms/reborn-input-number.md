---
title: 数字输入框
description: 带有增减按钮的数字输入组件。
category: 表单与输入
tags: [css, tailwind, input-number]
---

::ComponentViewer{demoFile="RebornInputNumberDemo.vue" config="RebornInputNumberConfig" componentId="reborn-input-number" :componentFiles='["RebornInputNumber.vue", "reborn-input-number.config.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | 受控值。 |
| `defaultValue` | `number` | `0` | 非受控默认值。 |
| `min` | `number` | `-` | 最小值。 |
| `max` | `number` | `-` | 最大值。 |
| `step` | `number` | `1` | 步进值。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 聚焦与按钮强调色。 |
| `class` | `string` | `""` | 额外样式类。 |

## CSS Variables

| 变量名 | 描述 | 移动端值 (默认) | 桌面端值 (min-width: 768px) |
| :--- | :--- | :--- | :--- |
| `--input-lg-height` | 大尺寸输入框高度 | `96px` | `48px` |
| `--input-md-height` | 中尺寸输入框高度 | `90px` | `45px` |
| `--input-sm-height` | 小尺寸输入框高度 | `80px` | `40px` |

::
