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

| 属性名        | 类型                                                                                                       | 默认值      | 描述           |
| ------------- | ---------------------------------------------------------------------------------------------------------- | ----------- | -------------- |
| `modelValue`  | `any`                                                                                                      | `null`      | 当前选中值。   |
| `options`     | `SelectOption[]`                                                                                           | `[]`        | 选项列表。     |
| `placeholder` | `string`                                                                                                   | `"请选择"`  | 占位文本。     |
| `disabled`    | `boolean`                                                                                                  | `false`     | 是否禁用。     |
| `clearable`   | `boolean`                                                                                                  | `true`      | 是否允许清空。 |
| `size`        | `"sm" \| "md" \| "lg"`                                                                                     | `"md"`      | 尺寸大小。     |
| `color`       | `"primary" \| "secondary" \| "success" \| "info" \| "warning" \| "error" \| "neutral"`                     | `"primary"` | 颜色主题。     |
| `class`       | `any`                                                                                                      | -           | 根节点 class。 |
| `ui`          | `Partial<{ wrapper, trigger, triggerText, placeholder, arrow, dropdown, option, optionActive, clearBtn }>` | -           | 样式覆盖。     |

## Slots

| 插槽名     | Props                                             | 描述             |
| ---------- | ------------------------------------------------- | ---------------- |
| `trigger`  | `{ toggle, isOpen, selectedOption, displayText }` | 自定义触发器。   |
| `dropdown` | `{ isOpen, options, selectOption }`               | 自定义下拉容器。 |
| `option`   | `{ option, active }`                              | 自定义选项内容。 |

::
