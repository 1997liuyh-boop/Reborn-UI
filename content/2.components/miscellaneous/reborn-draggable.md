---
title: Draggable 拖拽排序
description: 支持列表拖拽排序的容器组件。
category: Miscellaneous
navigation:
  badges:
    - label: Web
      color: primary
    - label: UniApp
      color: success
---

::ComponentViewer{demoFile="RebornDraggableDemo.vue" config="RebornDraggableConfig" componentId="reborn-draggable" :componentFiles='["RebornDraggable.vue", "reborn-draggable.config.ts"]' :uniappFiles='["RebornDraggable.vue", "reborn-draggable.config.ts"]'}

#api
## Props
`modelValue` `disabled` `className`
## Emits
`update:modelValue` `change` `start` `end`
## Slots
`item` (item, index, dragging)
## 差异说明
- Web 使用 HTML5 drag/drop；UniApp 使用 touch/longpress 手势。
::
