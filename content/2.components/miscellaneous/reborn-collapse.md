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

::
