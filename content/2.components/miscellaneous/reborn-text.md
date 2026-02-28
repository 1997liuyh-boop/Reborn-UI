---
title: 文本 Text
description: 支持格式化、脱敏和省略号的增强文本组件。
category: 杂项
tags: [css, tailwind, text, format, mask, uniapp]
badge: New
navigation:
  badges:
    - label: Web
      color: primary
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornTextDemo.vue" config="RebornTextConfig" componentId="reborn-text" :componentFiles='["RebornText.vue", "reborn-text.config.ts"]' :uniappFiles='["RebornText.vue", "reborn-text.config.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `value` | `string \| number \| null` | `null` | 显示的值。 |
| `type` | `string` | `"default"` | 文本类型：`default`、`phone`、`name`、`amount`、`card`、`email`。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | - | 文本颜色。 |
| `size` | `number` | - | 字体大小（px）。 |
| `mask` | `boolean` | `false` | 是否开启脱敏。 |
| `currency` | `string` | `"¥"` | 金额货币符号。 |
| `precision` | `number` | `2` | 金额小数位数。 |
| `maskStart` | `number` | `3` | 脱敏起始位置（保留前 N 位）。 |
| `maskEnd` | `number` | `4` | 脱敏结束位置（保留后 N 位）。 |
| `maskChar` | `string` | `"*"` | 脱敏替换字符。 |
| `ellipsis` | `boolean` | `false` | 是否显示省略号。 |
| `lines` | `number` | `1` | 最大行数（ellipsis 时生效）。 |
| `preWrap` | `boolean` | `false` | 是否保留空白。 |

## 格式化类型

| 类型 | 说明 | 示例 |
| --- | --- | --- |
| `phone` | 手机号脱敏，保留前3后4 | `138****5678` |
| `name` | 姓名脱敏，保留首尾字 | `张*丰` |
| `amount` | 金额格式化，千分位 + 货币符号 | `¥12,345.60` |
| `card` | 银行卡脱敏 | `622***7890` |
| `email` | 邮箱脱敏 | `h***o@example.com` |

::
