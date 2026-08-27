---
title: 折叠面板
description: 用于点击触发区展开或收起内容区域的折叠组件，带高度过渡动画，双端可用。
category: 通用
tags: [css, tailwind, collapse, accordion, uniapp]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornCollapseDemo.vue" config="RebornCollapseConfig" componentId="reborn-collapse" :componentFiles='["RebornCollapse.vue", "reborn-collapse.config.ts"]' :uniappFiles='["RebornCollapse.vue", "reborn-collapse.config.ts"]'}

#api

## API

### Props

| 属性名       | 类型      | 默认值  | 描述                                     |
| ------------ | --------- | ------- | ---------------------------------------- |
| `modelValue` | `boolean` | `false` | 控制折叠面板的展开/收起状态。            |
| `customClass`| `string`  | `""`    | 根节点的自定义样式类。                   |
| `ui`         | `object`  | `{}`    | 自定义内部插槽样式的配置对象。           |

### Slots

| 插槽名    | 描述                                            | 参数                |
| --------- | ----------------------------------------------- | ------------------- |
| `default` | 触发区域的内容。                                | `{ open: boolean }` |
| `content` | 折叠展示的内容区域。                            | -                   |

### 自定义样式（ui）

`ui` 按内部结构键覆盖对应节点的类名。两端结构一致，键位相同（只是动画实现不同）：

| 键名      | 说明                                                                                                                                                                                       |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `root`    | 根元素。默认无样式类（浮层模式下叠加 `relative`），包裹「折叠区 + 触发区」；`customClass` prop 也会并到同一节点。                                                                            |
| `trigger` | 折叠区的**动画外层**（注意不是触发区）。Web 端默认 `grid transition-[grid-template-rows]` 靠栅格轨道做高度动画，UniApp 端默认 `relative overflow-hidden transition-[height]` 并由内联 `height` 驱动。改这里可调动画时长、缓动或层级。 |
| `content` | 折叠区的**内容内层**，直接包裹 `content` 插槽。Web 端默认 `overflow-hidden min-h-0` 以随栅格裁切，UniApp 端默认 `absolute top-0 left-0 w-full`。内边距、背景、圆角加在这里。                  |

触发区（default 插槽的外层 `<div @click="toggle">`）没有对应的 ui 键，其样式请直接写在插槽内容上。

```vue
<template>
  <RebornCollapse
    :ui="{
      trigger: 'duration-500',
      content: 'rounded-b-xl bg-white p-4 shadow',
    }"
  >
    <template #default="{ open }">
      <div class="p-3">{{ open ? '收起' : '展开' }}</div>
    </template>
    <template #content>折叠内容</template>
  </RebornCollapse>
</template>
```

::
