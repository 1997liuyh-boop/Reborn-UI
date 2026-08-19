---
title: RootPortal 根门户
description: 用于把子节点渲染到页面根节点、脱离当前层级关系的双端传送组件。
category: 杂项
navigation:
  badges:
    - label: UniApp
      color: success
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornRootPortalDemo.vue" config="RebornRootPortalConfig" componentId="reborn-root-portal" :componentFiles='["RebornRootPortal.vue", "reborn-root-portal.config.ts"]' :uniappFiles='["RebornRootPortal.vue", "reborn-root-portal.config.ts"]'}
::

# API

## Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `slots` | `Object` | - | 支持 `default` 插槽 |

## Slots

| 名称 | 说明 |
| :--- | :--- |
| `default` | 需要移动到根部的内容 |

## 平台兼容性

| H5 | 微信小程序 | 支付宝小程序 | App |
| :--- | :--- | :--- | :--- |
| √ (Teleport) | √ (root-portal) | √ (root-portal) | √ (RenderJS) |

## 注意事项
1. 在微信小程序和支付宝小程序中，底层使用的是原生的 `<root-portal>` 组件。
2. 在 H5 端，使用的是 Vue 3 的 `<teleport to="body">`。
3. 在 App 端，采用了 `renderjs` 动态将元素移动到 body 下，以实现类似效果。
