---
title: 数字输入框
description: 带有增减按钮的数字输入组件。
category: 表单与输入
tags: [css, tailwind, input-number, uniapp]
badge: New
navigation:
  badges:
    - label: New
      color: primary
    - label: UniApp
      color: success
---

::ComponentViewer{demoFile="RebornInputNumberDemo.vue" config="RebornInputNumberConfig" componentId="reborn-input-number" :componentFiles='["RebornInputNumber.vue", "reborn-input-number.config.ts"]' :uniapp="true"}

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
| `ui` | `object` | `{}` | UI 定制对象，支持 `wrapper`, `button`, `input`, `divider`, `icon`。详见下表。 |

### UI Prop Keys

| Key | 描述 |
| --- | --- |
| `wrapper` | 最外层容器，控制背景、边框、圆角等。 |
| `button` | 加减按钮容器，可控制宽度、内边距、悬停背景等。 |
| `input` | 中间输入框，控制文字样式。 |
| `divider` | 分割线。 |
| `icon` | 加减图标，控制大小 (e.g. `size-5`) 或颜色。 |

## CSS Variables

| 变量名 | 描述 | 移动端值 (默认) | 桌面端值 (min-width: 768px) |
| :--- | :--- | :--- | :--- |
| `--input-lg-height` | 大尺寸输入框高度 | `96px` | `48px` |
| `--input-md-height` | 中尺寸输入框高度 | `90px` | `45px` |
| `--input-sm-height` | 小尺寸输入框高度 | `80px` | `40px` |

::
