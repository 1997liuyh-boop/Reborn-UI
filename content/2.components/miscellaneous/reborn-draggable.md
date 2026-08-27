---
title: Draggable 拖拽排序
description: 用于列表项拖拽排序并同步 v-model 数据顺序的容器组件，双端可用。
category: 杂项
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornDraggableDemo.vue" config="RebornDraggableConfig" componentId="reborn-draggable" :componentFiles='["RebornDraggable.vue", "reborn-draggable.config.ts"]' :uniappFiles='["RebornDraggable.vue", "reborn-draggable.config.ts"]'}
::

# API

## Props

| 属性名       | 类型      | 默认值 | 说明                               |
| :----------- | :-------- | :----- | :--------------------------------- |
| `modelValue` | `Array`   | `[]`   | 绑定的数据列表，支持通过 `v-model` 双向绑定 |
| `disabled`   | `Boolean` | `false`| 是否禁用整体拖拽功能               |
| `className`  | `String`  | `''`   | 组件自定义类名                     |
| `columns`    | `Number`  | `1`    | **(仅UniApp)** 列数：1为单列布局，>1为网格布局 |
| `longPress`  | `Boolean` | `true` | **(仅UniApp)** 是否需要长按触发        |

## Emits

| 事件名              | 说明                     | 回调参数                   |
| :------------------ | :----------------------- | :------------------------- |
| `update:modelValue` | 绑定的数据列表发生变化时触发 | `(val: Array)` 最新数据列表 |
| `change`            | 列表项顺序改变时触发       | `(val: Array)` 最新数据列表 |
| `start`             | 拖拽开始时触发           | `(index: Number\|Object)` 拖拽元素的索引或信息 |
| `end`               | 拖拽结束时触发           | `(index: Number)` 最终落点元素索引 |

## Slots

| 插槽名 | 说明           | 作用域参数                                                                                                            |
| :----- | :------------- | :-------------------------------------------------------------------------------------------------------------------- |
| `item` | 自定义列表项内容 | `{ item: any, index: number, dragging: boolean, dragIndex: number, insertIndex: number }` |

## 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。**该组件仅 UniApp 端支持 `ui`**，Web 端请用 `className` 覆盖根节点。

| 键名   | 平台   | 说明                                                                                                                                       |
| ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `base` | UniApp | **同时并入根容器与每个列表项**两个节点（内部两个槽位共用这一个键）。根容器默认 `flex flex-col relative overflow-visible`（`columns > 1` 时改为 `flex-row flex-wrap`），列表项默认 `relative z-10`（`disabled` 时叠加 `opacity-60`）。想只改其中一个节点，请分别用 `className` 与 `item` 插槽内的自定义类名。 |

```vue
<template>
  <RebornDraggable v-model="list" :ui="{ base: 'gap-2' }">
    <template #item="{ item }">
      <view class="rounded bg-white p-3">{{ item.label }}</view>
    </template>
  </RebornDraggable>
</template>
```

## 差异说明
- **Web 端**：
  - 基于 HTML5 原生 `drag` / `drop` 事件实现，具有平滑的重新排序过渡动画。
  - 暂不支持通过属性单独配置列数（多列和网格布局通过传递 `className` 如 `grid grid-cols-2` 等自定义 CSS 样式控制）。
- **UniApp 端**：
  - 因为小程序/App的限制，基于 `touch` 与 `longpress` 手势实现拖拽，包含 `columns` 属性以控制列数。
  - 支持 `longPress` 机制。
