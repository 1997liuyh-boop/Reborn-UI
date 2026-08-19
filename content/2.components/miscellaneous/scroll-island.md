---
title: 滚动岛
description: 用于以灵动岛样式悬浮显示页面滚动进度并可展开附加内容的组件。
category: 杂项
tags: [css, tailwind, number-flow]
---

::ComponentViewer{demoFile="ScrollIslandDemo.vue" config="ScrollIslandConfig" componentId="scroll-island" :componentFiles='["ScrollIsland.vue"]' dependencies="@number-flow/vue"}

#api

## API

| 属性名   | 类型     | 默认值      | 描述                                |
| -------- | -------- | ----------- | ----------------------------------- |
| `class`  | `string` | `""`        | 自定义样式的额外 CSS 类。           |
| `title`  | `string` | `"Progress"`| 组件头部显示的标题。                |
| `height` | `string` | `44`        | 组件高度。                          |

#credits

- 灵感来自 [Ali Samadi](https://x.com/alisamadi__/status/1854312982559502556) 与 [Nitish Khagwal](https://x.com/nitishkmrk)
- [NumberFlow by Maxwell Barvian](https://number-flow.barvian.me/vue) 用于数字格式化与动画。

::
