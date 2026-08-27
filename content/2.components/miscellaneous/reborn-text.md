---
title: 文本 Text
description: 用于展示文本并内置类型格式化、脱敏与多行省略的增强文本组件。
category: 杂项
tags: [css, tailwind, text, format, mask, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
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

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端 DOM 结构不同，可用键位也不同：

::tabs{sync="platform"}

:::tabs-item{label="Web" icon="tabler:world"}

| 键名       | 说明                                                                                                                                              |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `base`     | 根元素（`<span>`）。默认 `inline [flex-shrink:unset]`，字号、颜色、多行省略等都作用在这里；`class` prop 也会并到同一节点。                          |
| `currency` | 货币符号节点。**仅在传入 `currency` 且未填充 default 插槽时渲染**，填充 default 插槽会替换掉整块兜底内容，`ui.currency` 随之失效。位置由 `currencyPosition` 决定（`after` 时排在数字后面）。 |

:::

:::tabs-item{label="UniApp" icon="tabler:brand-wechat"}

| 键名   | 说明                                                                                                                    |
| ------ | ----------------------------------------------------------------------------------------------------------------------- |
| `base` | 根元素（`<view>` 或 `<text>`，取决于是否需要多行省略）。默认 `reborn-text [flex-shrink:unset] text-28`；`className` prop 也会并到同一节点。 |

:::

::

```vue
<template>
  <RebornText
    type="amount"
    :value="12345.6"
    :ui="{ base: 'font-semibold text-error', currency: 'mr-0.5 text-xs align-top' }"
  />
</template>
```

::
