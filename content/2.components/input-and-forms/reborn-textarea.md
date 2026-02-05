---
title: 多行输入框
description: 具有自适应高度与多尺寸状态的多行输入组件。
category: 表单与输入
tags: [css, tailwind, textarea, uniapp]
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

::ComponentViewer{demoFile="RebornTextareaDemo.vue" config="RebornTextareaConfig" componentId="reborn-textarea" :componentFiles='["RebornTextarea.vue", "reborn-textarea.config.ts"]' :uniapp="true"}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `string` | `""` | 输入框的绑定值。 |
| `placeholder` | `string` | `""` | 占位文本。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `readonly` | `boolean` | `false` | 是否只读。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `rows` | `number` | `4` | 默认行数。 |
| `autoHeight` | `boolean` | `false` | 是否自动增高。 |
| `maxlength` | `number` | `undefined` | 最大输入长度。 |
| `showWordLimit` | `boolean` | `true` | 是否显示字数统计（需设置 maxlength）。 |
| `customClass` | `string` | `""` | 额外样式类。 |
| `ui` | `RebornTextareaUiConfig` | `{}` | UI 配置对象。 |

## RebornTextareaUiConfig

| 变量名 | 描述 | 移动端值 (默认) | 桌面端值 (min-width: 768px) |
| :--- | :--- | :--- | :--- |
| `root` | 根节点样式 | `""` | `""` |
| `inner` | 输入框内部样式 | `""` | `""` |
| `text` | 文本样式 | `""` | `""` |

::
