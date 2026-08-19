---
title: Sticky 吸顶
description: Sticky 组件用于将元素固定在页面顶部，当页面滚动时，被包裹的内容会始终保持在可视区域的顶部。常用于导航栏、标题栏等需要始终可见的内容。
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



::tip
此组件依赖页面的滚动事件来计算吸顶效果。你需要：
1. 在父组件中监听 `onPageScroll`。
2. 将 `scrollTop` 传递给组件的 `:scroll-top` 属性。

```typescript
const scrollTop = ref(0)
onPageScroll((e) => {
    scrollTop.value = e.scrollTop;
})
```
::


::ComponentViewer{demoFile="RebornStickyDemo.vue" config="RebornStickyConfig" componentId="reborn-sticky" :componentFiles='["RebornSticky.vue", "reborn-sticky.config.ts"]' :uniappFiles='["RebornSticky.vue", "reborn-sticky.config.ts"]'}
::


## API

| 属性名     | 类型      | 默认值    | 描述                                                                 |
| ---------- | --------- | --------- | -------------------------------------------------------------------- |
| `scrollTop`| `number`  | `0`       | 当前页面的滚动距离。通常通过 `onPageScroll` 传入。 |
| `offsetTop`| `number`  | `0`       | 吸顶偏移量 (px)。 |
| `zIndex`   | `number`  | `100`     | 吸顶后的层级。 |
| `isNeedNavbarHeight` | `boolean` | `true` | 是否自动叠加导航栏高度 (H5端)。 |
| `navbarHeight` | `number` | `44`    | 导航栏高度 (px)。 |

## Slots

| 名称      | 描述   |
| --------- | ------ |
| `default` | 自定义内容。Slot Props: `{ isSticky: boolean }`。 |

## UI

| 名称      | 描述   |
| --------- | ------ |
| `wrapper` | 外层占位容器，用于保持文档流占位。 |
| `content` | 实际吸顶内容容器，吸顶时变为 `fixed` 布局。 |

