---
title: 验证码输入
description: 用于短信验证码、OTP 等固定位数分格输入的双端组件。
category: 表单与输入
tags: [css, tailwind, otp, input, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornInputOtpDemo.vue" config="RebornInputOtpConfig" componentId="reborn-input-otp" :componentFiles='["RebornInputOtp.vue", "reborn-input-otp.config.ts"]' :uniappFiles='["RebornInputOtp.vue", "reborn-input-otp.config.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `""` | 输入值。 |
| `length` | `number` | `4` | 验证码位数。 |
| `autofocus` | `boolean` | `false` | 是否自动聚焦。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `inputType` | `"text" \| "number"` | `"number"` | 输入类型。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 颜色主题。 |

## Events

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `string` | 输入值变化。 |
| `done` | `string` | 输入完成（达到指定位数）。 |
| `focus` | `FocusEvent` | 输入框获焦。 |
| `blur` | `FocusEvent` | 输入框失焦。 |

::
