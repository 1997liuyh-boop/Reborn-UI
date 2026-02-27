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

::ComponentViewer{demoFile="RebornTextDemo.vue" config="RebornTextConfig" componentId="reborn-text" :componentFiles='["RebornText.vue", "reborn-text.config.ts"]' :uniapp="true"}

#api

## API

| 属性名      | 类型                                                                                   | 默认值      | 描述                          |
| ----------- | -------------------------------------------------------------------------------------- | ----------- | ----------------------------- |
| `value`     | `string \| number \| null`                                                             | `null`      | 显示的值。                    |
| `type`      | `"default" \| "phone" \| "name" \| "amount" \| "card" \| "email"`                      | `"default"` | 文本类型。                    |
| `color`     | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | -           | 文本颜色。                    |
| `size`      | `number`                                                                               | -           | 字体大小（px）。              |
| `mask`      | `boolean`                                                                              | `false`     | 是否开启脱敏。                |
| `currency`  | `string`                                                                               | `"¥"`       | 金额货币符号。                |
| `precision` | `number`                                                                               | `2`         | 金额小数位数。                |
| `maskStart` | `number`                                                                               | `3`         | 脱敏起始位置。                |
| `maskEnd`   | `number`                                                                               | `4`         | 脱敏结束位置。                |
| `maskChar`  | `string`                                                                               | `"*"`       | 脱敏替换字符。                |
| `ellipsis`  | `boolean`                                                                              | `false`     | 是否显示省略号。              |
| `lines`     | `number`                                                                               | `1`         | 最大行数（ellipsis 时生效）。 |
| `preWrap`   | `boolean`                                                                              | `false`     | 是否保留空白。                |
| `class`     | `any`                                                                                  | -           | 根节点自定义 class。          |
| `ui`        | `{ base?: ClassValue }`                                                                | -           | 样式覆盖。                    |

::
