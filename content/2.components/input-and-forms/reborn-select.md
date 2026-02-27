---
title: 下拉选择
description: 自定义下拉选择组件，支持键盘导航和动画过渡。
category: 表单与输入
tags: [css, tailwind, select, dropdown, uniapp]
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

::ComponentViewer{demoFile="RebornSelectDemo.vue" config="RebornSelectConfig" componentId="reborn-select" :componentFiles='["RebornSelect.vue", "reborn-select.config.ts"]' :uniapp="true"}

#api

## API

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `modelValue` | `any` | `null` | 当前选中值。 |
| `options` | `SelectOption[]` | `[]` | 选项列表，每项包含 `label` 和 `value`。 |
| `placeholder` | `string` | `"请选择"` | 占位文本。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |
| `clearable` | `boolean` | `true` | 是否允许清空。 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 尺寸大小。 |
| `color` | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"` | `"primary"` | 颜色主题。 |
| `ui` | `Partial<{ wrapper, trigger, triggerText, placeholder, arrow, dropdown, option, optionActive, clearBtn }>` | `{}` | 自定义类名覆盖。 |

## SelectOption 类型

| 属性名 | 类型 | 描述 |
| --- | --- | --- |
| `label` | `string` | 显示文本。 |
| `value` | `any` | 选项值。 |
| `disabled` | `boolean` | 是否禁用该选项。 |

## Events

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:modelValue` | `any` | 选中值变化。 |
| `change` | `any` | 选中值确认变化。 |

## Slots

| 插槽名 | Props | 描述 |
| --- | --- | --- |
| `option` | `{ option, active }` | 自定义选项内容。 |

## 键盘操作

| 按键 | 功能 |
| --- | --- |
| `↑` `↓` | 上/下切换选项。 |
| `Enter` `Space` | 选中高亮项 / 打开下拉。 |
| `Escape` | 关闭下拉。 |

::
