---
title: 容器
description: 用于将内容居中并在不同屏幕尺寸下限制最大宽度的布局组件。
category: 导航
navigation:
  badges:
    - label: WEB
      color: primary
  chip:
    label: NEW
    color: primary
---

# RebornContainer 容器

容器组件用于包裹页面内容，提供响应式的最大宽度限制以及水平居中对齐。

## 基础用法

直接包裹内容即可实现基础布局。

::ComponentViewer{demoFile="RebornContainerDemo.vue" config="RebornContainerConfig" componentId="reborn-container" :componentFiles='["RebornContainer.vue", "reborn-container.config.ts"]'}
