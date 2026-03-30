---
title: 图标云
description: 基于 Canvas 的 3D 图标云组件，支持拖拽旋转与节点聚焦，适合展示技术栈、品牌矩阵或功能集合。
category: 杂项
badge: New
tags: [canvas, interactive, tailwind]
navigation:
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="IconCloudDemo.vue" config="IconCloudConfig" componentId="icon-cloud" :componentFiles='["IconCloud.vue", "index.ts"]'}

#api

## API

| 属性名   | 类型       | 默认值 | 描述 |
| -------- | ---------- | ------ | ---- |
| `class`  | `string`   | `-`    | 作用于画布容器的额外类名。 |
| `images` | `string[]` | `[]`   | 图标图片地址列表，会自动映射到球面节点。 |

#credits

- 适合用于技术栈展示、品牌集合展示和轻量交互可视化场景。

::
