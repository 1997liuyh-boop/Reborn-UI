---
title: 取色器
description: 提供颜色选择的组件。
category: 表单与输入
navigation:
  badges:
    - label: 通用
      color: primary
---

::ComponentViewer{demoFile="RebornColorPickerDemo.vue" config="RebornColorPickerConfig" componentId="reborn-color-picker" :componentFiles='["RebornColorPicker.vue", "RebornColorPickerPanel.vue", "reborn-color-picker.config.ts", "reborn-color-picker-panel.config.ts"]' :uniappFiles='["RebornColorPicker.vue", "reborn-color-picker.config.ts"]'}

#api
## Props

| 属性名       | 类型      | 默认值 | 说明                               |
| :----------- | :-------- | :----- | :--------------------------------- |
| `modelValue` | `String`   | `'#000000'`   | 绑定的颜色值，支持通过 `v-model` 双向绑定 |
| `disabled`   | `Boolean` | `false`| 是否禁用整体取色器                 |
| `size`  | `String`  | `'md'`   | 尺寸大小，可选值为 `'sm'` `'md'` `'lg'` |
| `ui` | `Object` | `{}` | UI 配置覆盖对象 |

## Emits

| 事件名              | 说明                     | 回调参数                   |
| :------------------ | :----------------------- | :------------------------- |
| `update:modelValue` | 颜色值变化时触发          | `(val: string)` 最新颜色值 |

## 差异说明
- Web 版本支持基于 Popover 的自研色彩选取面板
- UniApp 版本为精简实现或系统输入组件
::
