---
title: 单选框
description: 用于在一组选项中选择一项的单选按钮组件。
category: 表单与输入
tags: [css, tailwind, radio, uniapp]
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

::ComponentViewer{demoFile="RebornRadioDemo.vue" config="RebornRadioConfig" componentId="reborn-radio" :componentFiles='["RebornRadio.vue", "reborn-radio.config.ts"]' :uniappFiles='["RebornRadio.vue", "reborn-radio.config.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `any` | - | 当前选中值。 |
| `value` | `any` | - | 该选项的值。 |
| `label` | `string` | `""` | 选项文案。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 选中色值。 |
| `class` | `string` | `""` | 额外样式类。 |

## Events

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `any` | 选中值变化。 |
| `change` | `any` | 选中值变化时触发。 |

::
