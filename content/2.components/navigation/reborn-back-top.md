---
title: BackTop 返回顶部
description: 该组件一个用于长页面，滑动一定距离后，出现返回顶部按钮，方便快速返回顶部的场景
category: Navigation
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


::tip
此组件依赖页面的滚动事件来控制显示/隐藏。你需要：
1. 在父组件中监听 `onPageScroll`。
2. 将 `scrollTop` 传递给组件的 `:scroll-top` 属性。

```typescript
const scrollTop = ref(0)
onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
})
```
::


::ComponentViewer{demoFile="RebornBackTopDemo.vue" config="RebornBackTopConfig" componentId="reborn-back-top" :componentFiles='["RebornBackTop.vue", "reborn-back-top.config.ts"]' :uniapp="true"}

#api

## API

| 属性名     | 类型      | 默认值    | 描述                                                                 |
| ---------- | --------- | --------- | -------------------------------------------------------------------- |
| `scrollTop`| `number`  | `0`       | 当前页面的滚动距离。通常通过 `onPageScroll` 传入。 |
| `threshold`| `number`  | `300`     | 滚动多少距离后显示回到顶部按钮。 |
| `bottom`   | `number`  | `20`      | 底部距离 (px)。 |
| `duration` | `number`  | `300`     | 滚动回顶部的动画时长 (ms)。 |
| `isTab`    | `boolean` | `false`   | 是否是 TabBar 页面。如果是，组件会自动抬高 50px 以避开 TabBar。 |
| `safeArea` | `boolean` | `true`    | 是否适配安全区域（避让底部黑条）。 |
| `color`    | `string`  | `primary` | 按钮颜色。可选值：`primary`, `secondary`, `success`, `info`, `warning`, `error`, `neutral`。 |
| `size`     | `string`  | `md`      | 按钮大小。可选值：`sm`, `md`, `lg`。 |
| `ui`       | `object`  | `{}`      | 覆盖各个 slots 的样式。 |

## Slots

| 名称      | 描述   |
| --------- | ------ |
| `default` | 自定义内容。 |

## UI

| 名称      | 描述   |
| --------- | ------ |
| `wrapper` | 外层容器，负责定位和动画。 |
| `base`    | 按钮主体，包含背景色和圆角。 |
| `icon`    | 所有的图标或文字内容。 |
