---
title: 分隔面板 Splitter
description: 用于将区域按水平或垂直方向分隔、可拖动调整各面板大小的布局组件。
category: 布局
tags: [css, tailwind, splitter, layout]
badge: New
---

::ComponentViewer{demoFile="RebornSplitterDemo.vue" config="RebornSplitterConfig" componentId="reborn-splitter" :componentFiles='["Splitter.vue", "SplitterPanel.vue", "reborn-splitter.config.ts"]'}

#api

## API

### Splitter

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `layout` | `string` | `horizontal` | 分隔面板的布局方向。可选值: `horizontal`, `vertical`。 |
| `lazy` | `boolean` | `false` | 是否使用懒加载（拖动结束后才更新面板大小）。 |

### Splitter 事件

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `resize-start` | `(index: number)` | 开始调整面板大小时触发，index 是拖拽条的索引。 |
| `resize` | `(index: number)` | 调整面板大小时触发，index 是拖拽条的索引。 |
| `resize-end` | `(index: number)` | 面板调整大小结束时触发，index 是拖拽条的索引。 |
| `collapse` | `(index: number)` | 当面板折叠时触发，index 是拖拽条的索引。 |

### SplitterPanel

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `size` | `string \| number` | `-` | 面板大小(像素或百分比)。支持 v-model:size。 |
| `min` | `string \| number` | `-` | 面板最小尺寸(像素或百分比)。 |
| `max` | `string \| number` | `-` | 面板的最大尺寸(像素或百分比)。 |
| `resizable` | `boolean` | `true` | 是否可以调整面板大小。 |
| `collapsible` | `boolean` | `false` | 面板是否可折叠。 |

### SplitterPanel 事件

| 事件名 | 参数 | 描述 |
| --- | --- | --- |
| `update:size` | `(value: string \| number)` | 当面板大小改变时触发。 |

### SplitterPanel 插槽

| 插槽名 | 描述 |
| --- | --- |
| `default` | 面板的默认内容。 |
| `bar` | 自定义拖拽条内容。 |
| `start-collapsible` | 自定义起始折叠按钮的内容。 |
| `end-collapsible` | 结束可折叠按钮的自定义内容。 |

::
