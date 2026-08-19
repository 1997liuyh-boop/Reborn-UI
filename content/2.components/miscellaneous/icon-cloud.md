---
title: 图标云
description: 用于以可拖拽旋转的 Canvas 3D 球面展示一组图标的展示组件。
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
