---
title: 按钮
description: 用于触发操作的双端按钮组件，提供颜色、变体、尺寸、加载与禁用状态。
category: 按钮
tags: [css, tailwind, button, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornButtonDemo.vue" config="RebornButtonConfig" componentId="reborn-button" :componentFiles='["RebornButton.vue", "reborn-button.config.ts"]'  :uniappFiles='["RebornButton.vue", "reborn-button.config.ts"]'}

#api

## API

| 属性名     | 类型      | 默认值    | 描述                                                                 |
| ---------- | --------- | --------- | -------------------------------------------------------------------- |
| `variant`  | `string`  | `default` | 按钮类型。可选值：`default`, `primary`, `success`, `warning`, `info`, `destructive`, `outline`, `secondary`, `ghost`, `link` |
| `size`     | `string`  | `default` | 按钮大小。可选值：`xs`, `sm`, `default`, `lg`, `xl`, `2xl`, 以及对应的 `icon-*` (如 `icon`, `icon-sm`) |
| `plain`    | `boolean` | `false`   | 是否为朴素按钮（背景透明，边框和文字带颜色）。                       |
| `circle`   | `boolean` | `false`   | 是否为圆形按钮。                                                     |
| `loading`  | `boolean` | `false`   | 是否显示加载状态。                                                   |
| `disabled` | `boolean` | `false`   | 是否禁用按钮。                                                       |
| `class`    | `string`  | `""`      | 用于自定义样式的额外 CSS 类。                                        |

## CSS Variables

组件使用以下 CSS 变量来控制高度，支持响应式变化（移动端/桌面端）。

| 变量名 | 描述 | 移动端值 (默认) | 桌面端值 (min-width: 768px) |
| :--- | :--- | :--- | :--- |
| `--button-2xl-height` | 2xl 尺寸高度 | `96px` | `48px` |
| `--button-xl-height` | xl 尺寸高度 | `86px` | `43px` |
| `--button-lg-height` | lg 尺寸高度 | `76px` | `38px` |
| `--button-base-height` | default 尺寸高度 | `64px` | `32px` |
| `--button-sm-height` | sm 尺寸高度 | `56px` | `28px` |
| `--button-xs-height` | xs 尺寸高度 | `48px` | `24px` |

::
