---
title: 基础输入框
description: 具有圆角胶囊样式与多尺寸状态的输入组件。
category: 表单与输入
tags: [css, tailwind, input]
badge: New
---

::ComponentViewer{demoFile="RebornInputDemo.vue" config="RebornInputConfig" componentId="reborn-input" :componentFiles='["RebornInput.vue", "reborn-input.config.ts"]'}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string \| number` | `""` | 输入框的绑定值。 |
| `defaultValue` | `string \| number` | `""` | 默认值（非受控）。 |
| `placeholder` | `string` | `""` | 占位文本。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `readonly` | `boolean` | `false` | 是否只读。 |
| `type` | `string` | `"text"` | 输入类型（`input` 模式）。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `as` | `"input" \| "textarea"` | `"input"` | 渲染的元素类型。 |
| `rows` | `number` | `4` | 多行输入行数。 |
| `class` | `string` | `""` | 额外样式类。 |

## CSS Variables

| 变量名 | 描述 | 移动端值 (默认) | 桌面端值 (min-width: 768px) |
| :--- | :--- | :--- | :--- |
| `--input-lg-height` | 大尺寸输入框高度 | `96px` | `48px` |
| `--input-md-height` | 中尺寸输入框高度 | `90px` | `45px` |
| `--input-sm-height` | 小尺寸输入框高度 | `80px` | `40px` |

::
