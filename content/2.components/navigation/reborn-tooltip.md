---
title: Tooltip 文字提示
description: 常用于展示鼠标悬停时的提示信息。
category: 导航
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornTooltipDemo.vue" config="RebornTooltipConfig" componentId="reborn-tooltip" :componentFiles='["RebornTooltip.vue", "reborn-tooltip.config.ts"]' :uniappFiles='["RebornTooltip.vue", "reborn-tooltip.config.ts"]'}

#api

## API

### Props

| 属性名       | 说明               | 类型                | 默认值     |
| ------------ | ------------------ | ------------------- | ---------- |
| `content`    | 提示内容           | `string`            | -          |
| `placement`  | 出现方向与对齐方式 | `TooltipPlacement`  | `'bottom'` |
| `effect`     | 主题效果           | `'dark' \| 'light'` | `'dark'`   |
| `arrow`      | 是否显示箭头       | `boolean`           | `true`     |
| `openDelay`  | 打开延时           | `number`            | `100`      |
| `closeDelay` | 关闭延时           | `number`            | `100`      |
| `disabled`   | 是否禁用           | `boolean`           | `false`    |

### TooltipPlacement

- `top` / `top-start` / `top-end`
- `bottom` / `bottom-start` / `bottom-end`
- `left` / `left-start` / `left-end`
- `right` / `right-start` / `right-end`

### Slots

| 插槽名    | 说明                                      |
| --------- | ----------------------------------------- |
| `default` | 触发提示的元素                            |
| `content` | 自定义提示内容，优先级高于 `content` 属性 |

## 基础用法

通过 `content` 属性指定提示内容，`placement` 属性指定弹出位置。

## 主题效果

提供 `dark` 和 `light` 两种主题效果，默认使用 `dark`。

## 平台说明

- **Web**: 使用 `Teleport` 挂载到 body，支持自动计算位置。
- **UniApp**: 提供基础的定位支持，建议在复杂布局中谨慎使用。
