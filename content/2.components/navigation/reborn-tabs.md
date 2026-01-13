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
| `modelValue` | `string \| number` | `-` | 当前激活的 Tab 值 (v-model)。 |
| `defaultValue` | `string \| number` | `-` | 默认激活的 Tab 值。 |
| `variant` | `string` | `line` | 样式变体。可选值: `line`, `solid`。 |
| `size` | `string` | `md` | 尺寸。可选值: `sm`, `md`, `lg`。 |
| `orientation` | `string` | `horizontal` | 布局方向。可选值: `horizontal`, `vertical`。 |

### TabsList

无特殊属性，作为 `TabsTrigger` 的容器使用。

### TabsTrigger

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `value` | `string \| number` | `-` | 该触发器对应的值。 |
| `disabled` | `boolean` | `false` | 是否禁用。 |

### TabsContent

| 属性名 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `value` | `string \| number` | `-` | 该内容区域对应的值。 |

::
