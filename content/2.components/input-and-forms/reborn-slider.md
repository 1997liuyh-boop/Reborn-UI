---
title: 滑块
description: 支持单值和范围选择的滑块组件。
category: 表单与输入
tags: [css, tailwind, slider, range, uniapp]
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

::ComponentViewer{demoFile="RebornSliderDemo.vue" config="RebornSliderConfig" componentId="reborn-slider" :componentFiles='["RebornSlider.vue", "reborn-slider.config.ts"]' :uniapp="true"}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `number` | `0` | 单值模式下绑定值。 |
| `values` | `number[]` | `[0, 0]` | 范围模式下绑定值（`v-model:values`）。 |
| `min` | `number` | `0` | 最小值。 |
| `max` | `number` | `100` | 最大值。 |
| `step` | `number` | `1` | 步长。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `showValue` | `boolean` | `false` | 是否显示当前值。 |
| `range` | `boolean` | `false` | 是否启用范围模式。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 颜色主题。 |

## Events

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `number` | 单值变化。 |
| `update:values` | `number[]` | 范围值变化。 |
| `change` | `number \| number[]` | 拖拽结束后的最终值。 |
| `changing` | `number \| number[]` | 拖拽中的实时值。 |

## Slots

| 插槽名 | Props | 描述 |
| --- | --- | --- |
| `thumb` | `{ value, style }` | 自定义滑块。 |
| `value` | `{ value }` | 自定义数值显示。 |

::
