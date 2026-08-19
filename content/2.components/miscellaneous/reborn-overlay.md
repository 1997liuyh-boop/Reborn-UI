---
title: Overlay 遮罩
description: 用于弹层背后的全屏或局部遮罩组件，支持点击关闭与滚动锁定。
category: 杂项
navigation:
  badges:
    - label: 通用
      color: primary
  chip:
    label: NEW
    color: primary
---

::ComponentViewer{demoFile="RebornOverlayDemo.vue" config="RebornOverlayConfig" componentId="reborn-overlay" :componentFiles='["RebornOverlay.vue", "reborn-overlay.config.ts"]' :uniappFiles='["RebornOverlay.vue", "reborn-overlay.config.ts"]'}
::

# API

## Props

| 属性名 | 类型 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- |
| `modelValue` | `Boolean` | `false` | 是否展示遮罩层，支持通过 `v-model` 双向绑定 |
| `duration` | `Number` | `300` | 动画持续时间，单位毫秒 |
| `lockScroll` | `Boolean` | `true` | 背景是否锁定滚动 |
| `zIndex` | `Number` | `10` | 遮罩层的 z-index |
| `closeOnClickOverlay` | `Boolean` | `true` | 是否允许点击遮罩层关闭 |
| `absolute` | `Boolean` | `false` | 是否绝对定位。开启后将在祖先元素(position非static)内展示，用于指定节点的部分遮罩 |
| `customClass` | `String` | `''` | 组件自定义类名 |
| `customStyle` | `String` | `''` | 组件自定义样式 |

## Emits

| 事件名 | 说明 | 回调参数 |
| :--- | :--- | :--- |
| `update:modelValue` | 遮罩层状态变化时触发 | `(val: Boolean)` |
| `close` | 关闭时触发 | - |

## 差异说明
- **Web 端**：
  - 通过注入/移除 `document.body.style.overflow = 'hidden'` 动态控制全局滚动。
- **UniApp 端**：
  - 依赖 `<page-meta>` 与组件捕获 `touchmove.stop.prevent` 阻止滚动透传。
