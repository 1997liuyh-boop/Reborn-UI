---
title: Waterfall 瀑布流
description: 用于多列不等高卡片布局的瀑布流组件，支持动态追加、删除、更新与清空。
category: Miscellaneous
navigation:
  badges:
    - label: UniApp
      color: success
---

::ComponentViewer{demoFile="RebornWaterfallDemo.vue" config="RebornWaterfallConfig" componentId="reborn-waterfall" :componentFiles='[]' :uniappFiles='["RebornWaterfall.vue", "reborn-waterfall.config.ts"]'}
::

## API

## Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `column` | `number` | `2` | 瀑布流列数。 |
| `gutter` | `number` | `16` | 列间距，单位 `px`。 |
| `nodeKey` | `string` | `'id'` | 数据唯一键字段名，用于更新与删除。 |
| `customClass` | `string` | `''` | 根节点自定义类名。 |
| `ui` | `Record<string, any>` | `{}` | 样式覆盖对象，可覆盖 `root` / `column` / `inner` / `item` / `virtual`。 |

## Expose

| 方法名 | 签名 | 说明 |
| :--- | :--- | :--- |
| `append` | `(data: any[]) => Promise<void>` | 追加数据并按最短列策略分配布局。 |
| `remove` | `(id: string \| number) => void` | 按 `nodeKey` 删除指定项。 |
| `update` | `(id: string \| number, data: any) => void` | 按 `nodeKey` 更新指定项。 |
| `clear` | `() => void` | 清空全部列数据并重置列结构。 |

## Slots

| 名称 | 参数 | 说明 |
| :--- | :--- | :--- |
| `item` | `{ item: any, index: number }` | 渲染瀑布流卡片内容。 |
