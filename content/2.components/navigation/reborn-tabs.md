---
title: 标签页 Tabs
description: 用于在不同的内容区域之间切换。
category: 导航
tags: [css, tailwind, tabs]
---

::ComponentViewer{demoFile="RebornTabsDemo.vue" config="RebornTabsConfig" componentId="reborn-tabs" :componentFiles='["TabsRoot.vue", "TabsList.vue", "TabsTrigger.vue", "TabsContent.vue", "reborn-tabs.config.ts"]'}

#api

## API

### TabsRoot

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `active` | `number` | `0` | 当前激活的 Tab 索引 (v-model:active)。 |
| `defaultActive` | `number` | `0` | 默认激活的 Tab 索引。 |
| `type` | `string` | `line` | Tabs 样式类型。可选值: `line`, `card`。 |
| `variant` | `string` | `primary` | 颜色变体。可选值: `primary`, `info`, `success`, `warning`, `neutral`。 |
| `size` | `string` | `md` | 尺寸。可选值: `sm`, `md`, `lg`。 |
| `orientation` | `string` | `horizontal` | 布局方向。可选值: `horizontal`, `vertical`。 |
| `sticky` | `boolean` | `false` | 是否开启吸顶布局。 |
| `shrink` | `boolean` | `false` | 是否开启收缩布局（标签向左侧收缩对齐）。 |
| `scrollspy` | `boolean` | `false` | 是否开启滚动导航模式（内容平铺展示）。 |

### TabsList

无特殊属性，作为 `TabsTrigger` 的容器使用。

### TabsTrigger

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `index` | `number` | `-` | 该触发器对应的索引。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |

### TabsContent

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `index` | `number` | `-` | 该内容区域对应的索引。 |

::
