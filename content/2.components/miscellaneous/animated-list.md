---
title: 动画列表
description: 用于让列表项按固定延迟逐条进场的通知流列表组件。
category: 数据展示
platform: web
tags: [css, tailwind, magic-ui]
---

::ComponentViewer{demoFile="AnimatedListDemo.vue" config="AnimatedListConfig" componentId="animated-list" :componentFiles='["AnimatedList.vue", "Notification.vue"]'}
::

## 简介

AnimatedList 是仅 Web 的逐条进场列表，适合展示通知流或近期活动。

`items` 是唯一业务数据源，`delay` 控制相邻条目进场间隔；每个可见条目通过下标读取当前数据，再交给 `item` 插槽。

`class` 定义列表容器样式；业务字段展示由 `item` 插槽负责，插槽同时得到原始下标，列表缩短时越界项被移除。

### 何时使用

- 通知流需要逐条进入——用 `items` 提供通知数据。
- 不同信息密度需不同进入节奏——用 `delay` 设置毫秒间隔。
- 展示区需要固定布局边界——用 `class` 配置列表容器。

### 何时不使用

- 长数据表需要排序与分页——改用 `reborn-table`。
- 需要让用户手动拖动排序——改用 `reborn-draggable`。

## 用法

### 基础用法

把数据交给 `items`，在 `item` 插槽里渲染每一项。组件每隔 `delay` 毫秒进场一条，窗口装满 `items.length` 条后移出最旧的一条再进场下一条，循环往复。

```vue
<script setup lang="ts">
const notifications = [
  { name: "收到付款", description: "Reborn UI", time: "15 分钟前", icon: "💸", color: "#00C9A7" },
  { name: "新用户注册", description: "Reborn UI", time: "10 分钟前", icon: "👤", color: "#FFB800" },
];
</script>

<template>
  <AnimatedList :items="notifications" :delay="1500">
    <template #item="{ item }">
      <Notification v-bind="item" />
    </template>
  </AnimatedList>
</template>
```

## API
### Props

| 属性名  | 类型     | 默认值 | 描述                                                                 |
| ------- | -------- | ------ | -------------------------------------------------------------------- |
| `items` | `T[]`    | `[]`   | 数据源。窗口里每条只记录下标，渲染时读取最新的 `items`；列表变短时越界条目立即移出。 |
| `delay` | `number` | `1000` | 相邻两条进场的间隔，单位毫秒。                                       |
| `class` | `string` | -      | 追加到根节点的类名。                                                 |

### Slots

| 插槽名 | 作用域参数                   | 描述                                                   |
| ------ | ---------------------------- | ------------------------------------------------------ |
| `item` | `{ item: T; index: number }` | 渲染单条列表项，`index` 是该项在 `items` 中的下标。     |

### 来源

- 灵感来自 [Magic UI](https://magicui.design/docs/components/animated-list)。

## 注意事项

- **列表项只能通过 `items` + `item` 插槽传入**。组件不再读取默认插槽：在渲染之外调用插槽只能拿到一次性快照，父组件更新后不会跟随，写几个静态子组件时也取不到列表。
- **首条在挂载后才出现**。轮播在 `onMounted` 中启动，服务端渲染时输出空容器；定时器随组件卸载自动停止。
- **离场使用 motion-v 的 `AnimatePresence`**。最旧的一条按 `exit` 配置缩小淡出，期间仍占位，其余条目通过 `.move` 类做位移过渡。
