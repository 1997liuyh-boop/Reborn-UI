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

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。该组件仅 Web 端提供，且**两个组件各有自己的 `ui`**：容器键传给 `Splitter`，面板与拖拽条的键传给 `SplitterPanel`。

**Splitter（容器）**

| 键名   | 说明                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------- |
| `root` | 根容器。默认 `relative flex w-full h-full overflow-hidden select-none`，整体尺寸、边框、圆角改这里。 |

**SplitterPanel（每个面板自行传入）**

| 键名             | 说明                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `panel`          | 单个面板的外层。默认 `relative flex shrink-0 hover:z-50`，实际宽高由 `size` 内联注入；面板背景、内边距加在这里。                            |
| `bar`            | 该面板后面的拖拽条。默认 `flex items-center justify-center shrink-0 bg-gray-200 hover:bg-primary-500 z-20`，宽度/颜色/悬浮态改这里；仅在需要显示拖拽条时渲染。 |
| `collapseButton` | 拖拽条上的折叠按钮（起始、结束两个按钮共用此键）。默认 `absolute size-5 rounded-full bg-white border shadow-sm opacity-20 group-hover:opacity-100`；定位类由布局方向与折叠状态动态追加，覆盖时注意别和 `left-*` / `top-*` 打架。 |

```vue
<template>
  <Splitter :ui="{ root: 'rounded-lg border border-gray-2' }">
    <SplitterPanel
      :size="30"
      collapsible
      :ui="{ panel: 'bg-white', bar: 'w-1 bg-gray-1', collapseButton: 'shadow-md' }"
    >
      左侧
    </SplitterPanel>
    <SplitterPanel :ui="{ panel: 'p-4' }">右侧</SplitterPanel>
  </Splitter>
</template>
```

::
