---
title: 多选框
description: 适用于单选或组合选择的多选框组件。
category: 表单与输入
tags: [css, tailwind, checkbox, uniapp]
badge: New
navigation:
  badges:
    - label: 通
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornCheckboxDemo.vue" config="RebornCheckboxConfig" componentId="reborn-checkbox" :componentFiles='["RebornCheckbox.vue", "reborn-checkbox.config.ts"]' :uniappFiles='["RebornCheckbox.vue", "reborn-checkbox.config.ts"]'}

#api

## API

| 属性名         | 类型                                                                                   | 默认值      | 描述                                                                                    |
| -------------- | -------------------------------------------------------------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `modelValue`   | `boolean \| (string \| number)[]`                                                      | `false`     | 受控选中状态或选中值数组。                                                              |
| `defaultValue` | `boolean \| (string \| number)[]`                                                      | `false`     | 非受控默认值。                                                                          |
| `value`        | `string \| number`                                                                     | `""`        | 选中状态的值（只有在checkbox-group或者绑定对象类型为array时有效）                       |
| `label`        | `string`                                                                               | `""`        | 选中状态的值，只有在绑定对象类型为 array 时有效。 如果没有 value， label则作为value使用 |
| `trueValue`    | `string \| number`                                                                     | `true`      | 选中时的值。                                                                            |
| `falseValue`   | `string \| number`                                                                     | `false`     | 没有选中时的值。                                                                        |
| `disabled`     | `boolean`                                                                              | `false`     | 是否禁用。                                                                              |
| `size`         | `"sm" \| "md" \| "lg"`                                                                 | `"md"`      | 尺寸大小。                                                                              |
| `color`        | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 选中色值。                                                                              |
| `class`        | `string`                                                                               | `""`        | 额外样式类。                                                                            |

::
