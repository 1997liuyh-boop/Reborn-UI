---
title: 面包屑
description: 显示当前页面的路径，快速返回之前的任意页面。
category: 导航
tags: [navigation, breadcrumb]
badge: New
navigation:
  badges:
    - label: 通
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornBreadcrumbDemo.vue" config="RebornBreadcrumbConfig" componentId="reborn-breadcrumb" :componentFiles='["RebornBreadcrumb.vue", "RebornBreadcrumbItem.vue", "reborn-breadcrumb.config.ts"]' :uniappFiles='["RebornBreadcrumb.vue", "RebornBreadcrumbItem.vue", "reborn-breadcrumb.config.ts"]'}

#api

## API

### Breadcrumb Attributes

| 属性名           | 说明                     | 类型                 | 默认值 |
| ---------------- | ------------------------ | -------------------- | ------ |
| `separator`      | 分隔符                   | `string`             | `/`    |
| `separator-icon` | 图标分隔符的组件或组件名 | `string / Component` | —      |

### Breadcrumb Slots

| 插槽名    | 说明           | 子标签            |
| --------- | -------------- | ----------------- |
| `default` | 自定义默认内容 | `Breadcrumb Item` |

### BreadcrumbItem Attributes

| 属性名    | 说明                                                                                                                    | 类型              | 默认值              |
| --------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------- |
| `to`      | 路由跳转目标，同 vue-router 的 to 属性                                                                                  | `string / object` | —                   |
| `replace` | 导航跳转模式。**Web:** `push`, `replace`, `blank` (新窗口)；**UniApp:** `navigate`, `redirect`, `switchTab`, `reLaunch` | `string`          | `push` / `navigate` |

### BreadcrumbItem Slots

| 插槽名      | 说明             |
| ----------- | ---------------- |
| `default`   | 自定义默认内容   |
| `separator` | 自定义分隔符内容 |

::
