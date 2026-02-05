---
title: 开关
description: 用于控制开关状态的切换组件。
category: 表单与输入
tags: [css, tailwind, switch, uniapp]
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

::ComponentViewer{demoFile="RebornSwitchDemo.vue" config="RebornSwitchConfig" componentId="reborn-switch" :componentFiles='["RebornSwitch.vue", "reborn-switch.config.ts"]' :uniapp="true"}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `boolean` | `false` | 受控开关值。 |
| `defaultValue` | `boolean` | `false` | 非受控默认值。 |
| `label` | `string` | `""` | 开关文案。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 启用色值。 |
| `class` | `string` | `""` | 额外样式类。 |

::
