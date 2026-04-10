---
title: 标题
description: 响应式头部组件。
category: 导航
badge: New
navigation:
  badges:
    - label: Web
      color: info
  chip:
    label: NEW
    color: primary
---

# RebornHeader 头部

头部组件用于在多个页面之间进行导航。

## 基础用法

通过 `title` 和 `to` 自动计算分页。

::ComponentViewer{demoFile="RebornHeaderDemo.vue" config="RebornHeaderConfig" componentId="reborn-header" :componentFiles='["RebornHeader.vue", "reborn-header.config.ts"]'}