---
title: 评分
description: 支持半星和鼠标悬停预览的星级评分组件。
category: 表单与输入
tags: [css, tailwind, rate, rating, star, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornRateDemo.vue" config="RebornRateConfig" componentId="reborn-rate" :componentFiles='["RebornRate.vue", "reborn-rate.config.ts"]' :uniappFiles='["RebornRate.vue", "reborn-rate.config.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | 当前评分值。 |
| `count` | `number` | `5` | 星星总数。 |
| `allowHalf` | `boolean` | `false` | 是否允许半星。 |
| `showValue` | `boolean` | `false` | 是否显示当前分数。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `readonly` | `boolean` | `false` | 是否只读。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"warning"` | 颜色主题。 |
| `icon` | `string` | `"i-lucide-star"` | 未选中图标类名（仅支持 Nuxt Icon）。 |
| `activeIcon` | `string` | `"i-lucide-star"` | 选中图标类名（仅支持 Nuxt Icon）。 |
| `halfIcon` | `string` | - | 半星图标类名（仅支持 Nuxt Icon）。 |
| `ui` | `Partial<{ wrapper, star, icon, iconActive, value }>` | `{}` | 自定义类名覆盖。 |

## Events

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `number` | 评分值变化。 |
| `change` | `number` | 评分值确认变化。 |

## Slots

| 插槽名 | Props | 描述 |
| --- | --- | --- |
| `icon` | `{ index, active }` | 自定义星星图标。 |
| `value` | `{ value }` | 自定义分数显示。 |

::
