---
title: Affix 悬浮
description: 用于固定悬浮元素并支持拖拽、自动吸附屏幕边缘的跨端悬浮组件。
category: 导航
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornAffixDemo.vue" config="RebornAffixConfig" componentId="reborn-affix" :componentFiles='["RebornAffix.vue", "reborn-affix.config.ts"]' :uniappFiles='["RebornAffix.vue", "reborn-affix.config.ts"]'}

#api

## API

| 属性名     | 类型      | 默认值    | 描述                                                                 |
| ---------- | --------- | --------- | -------------------------------------------------------------------- |
| `zIndex`   | `number`  | `500`     | 浮动元素的层级。 |
| `size`     | `number`  | `40`      | 浮动元素的尺寸（宽/高，单位 px）。 |
| `left`     | `number`  | `10`      | 初始左边距 (px)。如果未指定 `right`，这是默认水平位置依据。 |
| `right`    | `number`  | `undefined`| 初始右边距 (px)。如果指定，优先级高于 `left`。 |
| `top`      | `number`  | `undefined`| 初始上边距 (px)。如果指定，优先级取决于内部实现 (通常结合 gap)。 |
| `bottom`   | `number`  | `10`      | 初始下边距 (px)。如果未指定 `top`，这是默认垂直位置依据。 |
| `gap`      | `number`  | `10`      | 吸附时的边距 (px)。 |
| `disabled` | `boolean` | `false`   | 是否禁用拖拽交互。 |
| `noSnapping` | `boolean` | `false` | 是否禁用自动吸附边缘。 |
| `safeArea` | `boolean` | `true`    | 是否考虑屏幕安全区域（避让刘海屏/底部黑条）。 |

## Slots

| 名称      | 描述   |
| --------- | ------ |
| `default` | 自定义内容。 |

