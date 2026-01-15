---
title: 多选框
description: 适用于单选或组合选择的多选框组件。
category: 表单与输入
tags: [css, tailwind, checkbox]
---

::ComponentViewer{demoFile="RebornCheckboxDemo.vue" config="RebornCheckboxConfig" componentId="reborn-checkbox" :componentFiles='["RebornCheckbox.vue", "reborn-checkbox.config.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `boolean \| (string \| number)[]` | `false` | 受控选中状态或选中值数组。 |
| `defaultValue` | `boolean \| (string \| number)[]` | `false` | 非受控默认值。 |
| `value` | `string \| number` | `""` | 组内模式下的选项值。 |
| `label` | `string` | `""` | 复选框文本。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 选中色值。 |
| `class` | `string` | `""` | 额外样式类。 |

::
