---
title: 面包屑
description: 用于展示当前页面层级路径并可逐级返回的面包屑导航组件，双端可用。
category: 导航
tags: [navigation, breadcrumb]
badge: New
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornBreadcrumbDemo.vue" config="RebornBreadcrumbConfig" componentId="reborn-breadcrumb" :componentFiles='["RebornBreadcrumb.vue", "RebornBreadcrumbItem.vue", "reborn-breadcrumb.config.ts"]' :uniappFiles='["RebornBreadcrumb.vue", "RebornBreadcrumbItem.vue", "reborn-breadcrumb.config.ts"]'}
::

## 简介

Breadcrumb 是双端可用的面包屑导航，由 `RebornBreadcrumb` 容器与若干 `RebornBreadcrumbItem` 条目组成。条目通过 `to` 指定跳转目标，传了 `to` 的条目呈可点击态；`separator` / `separator-icon` 统一配置分隔符，也可用每个条目的 `separator` 插槽单独自定义。

适用场景：

- 多层级页面结构中提示用户当前位置并支持返回上级。
- 后台管理、商城分类等需要层级导航的页面头部。
- 需要自定义分隔符（文本、Iconify 图标或每项独立分隔符插槽）的路径导航。

不适用场景：

- 平级页签切换场景，改用 `reborn-tabs`。
- 分页浏览列表数据，改用 `reborn-pagination`。

## 用法

### 基础用法

条目必须用 `RebornBreadcrumbItem` 包裹，`to` 指定跳转目标；末级当前页不传 `to` 即为不可点击的文本态。

```vue
<template>
  <RebornBreadcrumb>
    <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem to="/goods">商品分类</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>商品详情</RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

### 自定义分隔符

`separator` 配置文本分隔符；`separator-icon` 传入图标后覆盖文本分隔符；也可用条目的 `separator` 插槽为单项自定义。

```vue
<template>
  <RebornBreadcrumb separator-icon="i-lucide-chevron-right">
    <RebornBreadcrumbItem to="/">首页</RebornBreadcrumbItem>
    <RebornBreadcrumbItem>
      当前页
      <template #separator>
        <text>»</text>
      </template>
    </RebornBreadcrumbItem>
  </RebornBreadcrumb>
</template>
```

## API

### Breadcrumb Attributes

| 属性名           | 说明                                     | 类型                 | 默认值 |
| ---------------- | ---------------------------------------- | -------------------- | ------ |
| `separator`      | 分隔符                                   | `string`             | `/`    |
| `separator-icon` | 图标分隔符的组件或组件名                 | `string / Component` | —      |
| `customClass`    | 追加到面包屑根节点的自定义类名           | `string`             | —      |
| `ui`             | 细粒度样式覆盖对象，键 `root` 对应根节点 | `object`             | `{}`   |

### Breadcrumb Slots

| 插槽名    | 说明           | 子标签            |
| --------- | -------------- | ----------------- |
| `default` | 自定义默认内容 | `Breadcrumb Item` |

### BreadcrumbItem Attributes

| 属性名        | 说明                                                                                                                    | 类型              | 默认值              |
| ------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------- |
| `to`          | 路由跳转目标，同 vue-router 的 to 属性                                                                                  | `string / object` | —                   |
| `replace`     | 导航跳转模式。**Web:** `push`, `replace`, `blank` (新窗口)；**UniApp:** `navigate`, `redirect`, `switchTab`, `reLaunch` | `string`          | `push` / `navigate` |
| `target`      | 预留的链接打开方式属性（仅 UniApp 端声明，当前不参与跳转逻辑，打开方式由 `replace` 决定）                              | `string`          | —                   |
| `customClass` | 追加到条目链接节点的自定义类名                                                                                          | `string`          | —                   |
| `ui`          | 细粒度样式覆盖对象，可用键：`item` / `link` / `separator`                                                               | `object`          | `{}`                |

### BreadcrumbItem Slots

| 插槽名      | 说明             |
| ----------- | ---------------- |
| `default`   | 自定义默认内容   |
| `separator` | 自定义分隔符内容 |

## 注意事项

- web 与 uniapp 双端可用，但跳转模式取值不同：Web 为 `push` / `replace` / `blank`（新窗口），UniApp 为 `navigate` / `redirect` / `switchTab` / `reLaunch`。
- 条目必须使用配套的 `RebornBreadcrumbItem` 子组件包裹，跳转目标通过其 `to` 属性传入；不传 `to` 的条目不可点击。
- `separator-icon` 传入图标名后会覆盖 `separator` 文本分隔符；也可用 `separator` 插槽为单项自定义分隔符。
- `target` 仅在 UniApp 端声明且当前不参与跳转逻辑；Web 端新窗口打开请使用 `replace="blank"`。
- 末项分隔符不会自动隐藏，如需隐藏可通过最后一项的 `ui.separator` 或 `separator` 插槽处理。
