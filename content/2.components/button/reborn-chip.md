---
title: Chip
description: 轻量级提示点/标记组件。
category: 按钮
tags: [css, tailwind, chip, uniapp]
badge: New
navigation:
  badges:
    - label: New
      color: primary
    - label: UniApp
      color: success
---

::ComponentViewer{demoFile="RebornChipDemo.vue" config="RebornChipConfig" componentId="reborn-chip" :componentFiles='["RebornChip.vue", "chip.ts"]' :uniapp="true"}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 芯片颜色。 |
| `size` | `"3xs" \| "2xs" \| "xs" \| "sm" \| "md" \| "lg" \| "xl" \| "2xl" \| "3xl"` | `"md"` | 芯片尺寸。 |
| `text` | `string \| number` | `-` | 芯片文本内容。 |
| `position` | `"top-right" \| "bottom-right" \| "top-left" \| "bottom-left"` | `"top-right"` | 相对位置。 |
| `show` | `boolean` | `true` | 是否显示，可配合 `v-model:show` 使用。 |
| `inset` | `boolean` | `false` | 是否使用内嵌位置（与 position 组合）。 |
| `standalone` | `boolean` | `false` | 是否作为独立芯片渲染。 |
| `class`/`customClass` | `string` | `-` | 自定义样式类。 |

::
